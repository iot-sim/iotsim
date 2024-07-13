<template>
  <q-card class="q-pa-lg" style="width: 500px; max-width: 80vw">
    <q-card-section>
      <div class="text-h4">{{ id ? "Edit" : "Create" }} Scenario</div>
    </q-card-section>
    <q-form @submit="save">
      <q-card-section class="q-pa-sm">
        <q-input
          @copy.stop
          v-model="scenarioName"
          label="Name"
          outlined
          required
          class="q-mb-md"
        />
        <q-input
          @copy.stop
          v-model="scenarioDuration"
          type="number"
          label="Duration (sec)"
          outlined
          required
          class="q-mb-md"
        />
      </q-card-section>
      <q-card-section class="q-pa-sm">
        <q-select
          v-model="scenarioConnector"
          :options="supportedConnectors"
          label="Connector"
          outlined
          required
          class="q-mb-md"
        />
        <q-input
          @copy.stop
          v-if="scenarioConnector === 'MQTT'"
          v-model="scenarioMqttServer"
          label="MQTT Server (over WS or WSS)"
          placeholder="ws://test.mosquitto.org:8080"
          outlined
          class="q-mb-md"
        />
        <q-expansion-item
          v-if="scenarioConnector === 'MQTT'"
          icon="vpn_key"
          label="Authentication (optional)"
        >
          <q-input
            @copy.stop
            v-if="scenarioConnector === 'MQTT'"
            v-model="scenarioMqttUsername"
            label="Username"
            outlined
            class="q-mb-md"
          />
          <q-input
            @copy.stop
            v-if="scenarioConnector === 'MQTT'"
            v-model="scenarioMqttPassword"
            label="Password"
            outlined
            class="q-mb-md"
          />
        </q-expansion-item>
        <q-input
          @copy.stop
          v-if="scenarioConnector === 'ThingsBoard'"
          v-model="scenarioThingsBoardServer"
          label="ThingsBoard Endpoint"
          placeholder="http://thingsboard.cloud"
          outlined
          class="q-mb-md"
        />
      </q-card-section>
      <q-card-actions class="justify-between">
        <q-btn flat label="Cancel" type="button" v-close-popup />
        <q-btn flat label="Save" type="submit" color="primary" v-close-popup />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script>
import { defineComponent, ref } from "vue";
import { mapStores } from "pinia";
import scenarioStore from "src/stores/scenario";
export default defineComponent({
  name: "ScenarioForm",
  props: {
    id: {
      type: String,
      required: false,
    },
  },
  computed: {
    ...mapStores(scenarioStore),
  },
  mounted() {
    if (this.id) {
      // Load the scenario
      this.scenario = this.scenarioStore.fetch(this.id);
      if (this.scenario) {
        this.scenarioName = this.scenario.name;
        this.scenarioDuration = this.scenario.duration;
        this.scenarioConnector = this.scenario.connector;
        this.scenarioMqttServer =
          this.scenario.mqttServer ?? this.scenarioMqttServer;
        this.scenarioMqttUsername = this.scenario.mqttUsername;
        this.scenarioMqttPassword = this.scenario.mqttPassword;
        this.scenarioThingsBoardServer =
          this.scenario.thingsBoardServer ?? this.scenarioThingsBoardServer;
      }
    }
  },
  data() {
    return {
      scenario: null,
      scenarioName: "",
      scenarioDuration: 600,
      scenarioConnector: "MQTT",
      scenarioMqttServer: "mqtt://test.mosquitto.org:1883",
      scenarioMqttUsername: "",
      scenarioMqttPassword: "",
      scenarioThingsBoardServer: "https://thingsboard.cloud",
      supportedConnectors: [
        "MQTT",
        "Blynk",
        "ThingsBoard",
        "ThingSpeak",
        "ArduinoCloud",
      ],
    };
  },
  methods: {
    save() {
      const scenario = {
        ...this.scenario,
        name: this.scenarioName,
        duration: this.scenarioDuration,
        connector: this.scenarioConnector,
        mqttServer: this.scenarioMqttServer,
        mqttUsername: this.scenarioMqttUsername,
        mqttPassword: this.scenarioMqttPassword,
        thingsBoardServer: this.scenarioThingsBoardServer,
      };
      this.scenarioStore.save(scenario);
      console.log("Scenario saved", scenario);
      this.$emit("updated");
    },
  },
});
</script>
