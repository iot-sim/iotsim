import mqtt from "mqtt"; // import namespace "mqtt"
import axios from "axios";
import {
  random,
  sinewave,
  linearIncrease,
  linearDecrease,
  expIncrease,
  expDecrease,
  logarithmic,
  gaussian,
} from "src/utils/number.utils";
console.log("Worker: loaded");
let mqttClient = null;

self.interval = null;
self.runtimeSeconds = 0;
self.maxRuntime = 600;
self.scenario = null;

const API = axios.create({
  baseURL: "https://iotsim-api.fly.dev",
  headers: {
    "Content-Type": "application/json",
  },
});

addEventListener("message", (e) => {
  try {
    const { action, data } = JSON.parse(e.data);
    switch (action) {
      case "play":
        console.log("Worker: Playing", data);
        play(data);
        break;
      case "reset":
        console.log("Worker: Resetting", data);
        self.runtimeSeconds = 0;
        sendStatus();
        break;
      case "stop":
        console.log("Worker: Stopping");
        stop();
        break;
      case "send-data":
        sendData(data);
        break;
      case "update":
        console.log("Worker: updating", data);
        self.maxRuntime = data.scenario?.duration
          ? Number(data.scenario?.duration)
          : data.maxRuntime;
        self.runtimeSeconds = data.runtimeSeconds;
        self.scenario = data.scenario;
        break;
      case "status":
        sendStatus();
        break;
      default:
        console.error("Unknown message type", action, data);
    }
  } catch (err) {
    console.error("Error parsing message", err);
  }
});
function sendStatus() {
  postMessage(
    JSON.stringify({
      action: "status",
      data: {
        active: !!self.interval,
        runtimeSeconds: self.runtimeSeconds,
      },
    })
  );
}
function play({ scenario, devices }) {
  // initialize connectors
  if (scenario.connector === "MQTT" && scenario.mqttServer) {
    if (!mqttClient) initializeConnector("mqtt", scenario.mqttServer);
  }
  self.scenario = scenario;
  self.devices = devices;

  self.interval = setInterval(() => {
    const runtimeSeconds = ++self.runtimeSeconds;
    postMessage(
      JSON.stringify({
        action: "tick",
        data: { runtimeSeconds, active: !!self.interval },
      })
    );
    handleRequests();
  }, 1000);
}
function stop() {
  if (self.interval) {
    clearInterval(self.interval);
    self.interval = null;
    postMessage(
      JSON.stringify({
        action: "status",
        data: {
          active: !!self.interval,
          runtimeSeconds: self.runtimeSeconds,
        },
      })
    );
  }
}
function sendData(data) {
  postMessage(JSON.stringify({ action: "data", data: { data } }));
}

function initializeConnector(
  type = "mqtt",
  server = "mqtt://test.mosquitto.org",
  credentials = {}
) {
  switch (type) {
    case "mqtt":
      mqttClient = mqtt.connect(server);
      mqttClient.on("connect", () => {
        console.log("Connected to MQTT server");
      });
      return mqttClient;
    case "ArduinoCloud":
      return initializeArduinoIotConnector(server, credentials);
    default:
  }
}
async function sendArduinoIotMessage(message) {
  const client = await ArduinoIoTCloud.connect({
    deviceId: "YOUR_DEVICE_ID",
    secretKey: "YOUR_SECRET_KEY",
    onDisconnect: (message) => console.error(message),
  });

  const value = 20;
  let cloudVar = "test_value";

  client.sendProperty(cloudVar, value);
  console.log(cloudVar, ":", value);

  client.onPropertyValue(cloudVar, (value) =>
    console.log(cloudVar, ":", value)
  );
}

function handleRequests() {
  const connector = self.scenario.connector;
  self?.scenario?.devices
    ?.filter((item) => isItemActive(item))
    .forEach(async (item) => {
      const { icon, variables, label, connectorToken } = item.data;
      const percentage = calculateItemCompletion(item);
      const values = {};
      variables.forEach(
        ({ min, max, interval, sinePeriod, color, connectorTopic, fn }) => {
          if (self.runtimeSeconds % interval === 0) {
            const val = handleFn(fn, min, max, percentage / 100, sinePeriod);
            values[connectorTopic] = val;
          }
        }
      );

      // convert values to URL params, e.v v1=100&v2=200
      const valuesAsParams = Object.keys(values)
        .map((key) => `${key}=${values[key]}`)
        .join("&");

      // send data to connector
      if (Object.keys(values).length > 0) {
        switch (connector) {
          case "MQTT":
            await Promise.all(
              Object.keys(values).map((topic) =>
                mqttClient.publish(topic, `${values[topic]}`)
              )
            );
            break;
          case "ThingsBoard":
            await API.post("/api", {
              method: "POST",
              protocol: "https",
              server: self.scenario.thingsBoardServer,
              urlpath: `/api/v1/${connectorToken}/telemetry`,
              body: JSON.stringify(values),
            });
            break;
          case "ThingSpeak":
            await API.post("/api", {
              method: "GET",
              protocol: "https",
              server: "https://api.thingspeak.com",
              urlpath: `/update?api_key=${connectorToken}&${valuesAsParams}`,
              body: "",
            });

            break;
          case "Blynk":
            await API.post("/api", {
              method: "GET",
              protocol: "https",
              server: "https://blynk.cloud",
              urlpath: `/external/api/batch/update?token=${connectorToken}&${valuesAsParams}`,
              body: "",
            });
            break;
          default:
            console.log("No connector selected");
        }
        console.info(
          `Published to device:${label}[${self.scenario.connector}]`,
          values
        );
      }
    });
}
function handleFn(fn, min, max, percentage, sinePeriod) {
  switch (fn) {
    case "Random":
      return random(min, max);
    case "Linear+":
      return linearIncrease(min, max, percentage);
    case "Linear-":
      return linearDecrease(min, max, percentage);
    case "Exp+":
      return expIncrease(min, max, percentage);
    case "Exp-":
      return expDecrease(min, max, percentage);
    case "Logarithmic":
      return logarithmic(min, max, percentage);
    case "Sine":
      return sinewave(min, max, percentage, sinePeriod);
    case "Gaussian":
      return gaussian(min, max, percentage);
  }
}

function isItemActive(w) {
  const runtimeCurrentGridColumn = Math.floor(
    (self.runtimeSeconds * 12) / self.maxRuntime
  );
  return (
    runtimeCurrentGridColumn >= w.x && runtimeCurrentGridColumn < w.x + w.w
  );
}
function calculateItemCompletion(item) {
  // calculate total seconds for the item
  const startSeconds = (self.maxRuntime * item.x) / 12;
  const endSeconds = (self.maxRuntime * (item.x + item.w)) / 12;
  const totalSeconds = endSeconds - startSeconds;
  // calculate percentage of completion
  const completionPercentage =
    ((self.runtimeSeconds - startSeconds) * 100) / totalSeconds;
  return completionPercentage;
}
