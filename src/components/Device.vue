<style lang="scss">
.field-title {
  font-size: 28px;
  font-weight: bold;
}
.preview-canvas {
  width: 100%;
  height: 100px;
  border: 1px solid #a8a8a8;
}
</style>
<template>
  <q-card
    class="q-ma-sm"
    bordered
    :style="{
      'border-width': '5px',
      'border-color': color,
    }"
  >
    <q-card-section>
      <div class="row items-center">
        <div class="col-sm-5">
          <q-input
            @copy.stop
            dense
            borderless
            :debounce="500"
            style="width: 400px"
            @update:model-value="(label) => updateItem({ label })"
            aria-placeholder="Label"
            v-model="label"
            class="field-title"
          >
          </q-input>
        </div>
        <div class="col-sm-7 flex justify-end">
          <q-fab
            icon="add"
            label="Output"
            color="primary"
            direction="left"
            style="margin-right: 20px"
          >
            <q-fab-action
              @click="createItemVariable"
              label="Numeric"
              icon="pin"
            />
            <q-fab-action label="Textual" icon="feed" disable />
            <!-- <q-fab-action label="Product" icon="code" disable /> -->
            <q-fab-action label="Custom" icon="code" disable />
          </q-fab>
          <q-input
            @copy.stop
            @update:model-value="
              (connectorToken) => updateItem({ connectorToken })
            "
            outlined
            style="margin-right: 10px"
            v-if="showToken"
            v-model="connectorToken"
            :label="connectorTokenLabel"
          >
            <template v-slot:after>
              <!-- Add variable button -->
            </template>
          </q-input>
          <!-- Delete item button -->
          <q-btn
            flat
            icon="delete"
            color="negative"
            @click="deleteDevice"
          ></q-btn>
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-col-gutter-sm">
      <!-- <q-fab icon="add" direction="right" label="Variable" flat>
        <q-fab-action @click="createItemVariable" label="Numeric" icon="pin" />
        <q-fab-action label="Textual" icon="feed" disable />
        <q-fab-action label="Product" icon="code" disable />
        <q-fab-action label="Custom" icon="code" disable />
      </q-fab> -->
      <div class="row q-gutter-sm" v-for="(v, i) in itemData" :key="i">
        <div class="col-sm-2">
          <q-input
            @copy.stop
            dense
            debounce="500"
            @update:model-value="(label) => updateItemVariable(i, { label })"
            v-model="v.label"
            label="Label"
          />
        </div>
        <div class="col-sm-2">
          <q-input
            @copy.stop
            dense
            debounce="500"
            :style="{ color: v.color }"
            @update:model-value="
              (connectorTopic) => updateItemVariable(i, { connectorTopic })
            "
            v-model="v.connectorTopic"
            :label="connectorTopicLabel"
          >
            <!-- add prepend slot -->
            <template v-slot:before>
              <q-icon :name="v.icon" />
            </template>
          </q-input>
        </div>
        <div class="col-sm-1">
          <q-btn
            icon="colorize"
            round
            flat
            :style="{ color: v.color }"
            class="cursor-pointer"
          >
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-color
                v-model="v.color"
                default-view="palette"
                :palette="colorPalette"
              />
            </q-popup-proxy>
          </q-btn>
        </div>
        <div class="col-sm-1">
          <q-input
            @copy.stop
            dense
            type="number"
            outlined
            @update:model-value="(min) => updateItemVariable(i, { min })"
            v-model.number="v.min"
            label="Min"
          />
        </div>
        <div class="col-sm-1">
          <q-input
            @copy.stop
            @update:model-value="(max) => updateItemVariable(i, { max })"
            dense
            type="number"
            outlined
            v-model.number="v.max"
            label="Max"
          />
        </div>
        <div class="col-sm-1">
          <q-input
            @copy.stop
            dense
            type="number"
            @update:model-value="
              (interval) => updateItemVariable(i, { interval })
            "
            outlined
            min="1"
            :model-value="Number(v.interval)"
            label="Interval"
          >
          </q-input>
        </div>
        <div class="col-sm-2">
          <q-select
            dense
            @update:model-value="(fn) => updateItemVariable(i, { fn })"
            outlined
            v-model="v.fn"
            :options="fnOptions"
            label="Function"
          />
        </div>
        <div class="col-sm-1" v-if="fn === 'Sine'">
          <q-input
            @copy.stop
            dense
            type="number"
            @update:model-value="
              (sinePeriod) => updateItemVariable(i, { sinePeriod })
            "
            outlined
            v-model.number="v.sinePeriod"
            label="Sine Period"
          >
          </q-input>
        </div>

        <div class="col-sm-1">
          <!-- Delete item button -->
          <q-btn
            flat
            dense
            icon="delete"
            @click="deleteItemVariable(i)"
          ></q-btn>
        </div>
      </div>

      <!--
      <div class="q-mt-sm">
      Preview in a canvas element, it should start from `min` and end at `max`.
      It should create a datapoint every `interval` seconds.
      - The datapoint should be a random number between `min` and `max` if the function is `Random`.
        <canvas ref="previewCanvas" class="preview-canvas" />
      </div>
      -->
      <div class="q-pa-sm" id="preview-graph"></div>
    </q-card-section>
    <q-resize-observer @resize="onResize" />
  </q-card>
</template>

<script>
import { colors, debounce } from "quasar";
import { mapStores } from "pinia";
import runtimeStore from "src/stores/runtime";
import scenarioStore from "src/stores/scenario";
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
import { select, axisBottom, scaleLinear, axisLeft, line } from "d3";
export default {
  name: "Device",
  props: {
    item: {
      type: Object,
      required: true,
    },
    runtimeSeconds: {
      type: Number,
      required: true,
    },
  },
  created() {
    this.updateItem = debounce(this.updateItem, 300);
  },
  mounted() {
    this.createGraph();
  },
  watch: {
    runtimeSeconds() {
      this.updateGraph();
    },
    item: {
      handler() {
        this.updateGraph();
      },
      deep: true,
    },
  },
  data() {
    return {
      colorPalette: [
        "#019A9D",
        "#D9B801",
        "#E8045A",
        "#B2028A",
        "#2A0449",
        "#019A9D",
      ],
      itemData: this.item.data.variables ?? [],
      min: 0,
      max: 100,
      interval: 5,
      sinePeriod: 4,
      label: this.item.data.label,
      color: this.item.data.color,
      connectorToken: this.item.data.connectorToken,
      fn: "Random",
      previewCanvas: null,
      fnOptions: [
        "Random",
        "Linear+",
        "Linear-",
        "Exp+",
        "Exp-",
        // "Logarithmic",
        "Sine",
        "Gaussian",
      ],
      svg: null,
    };
  },
  computed: {
    ...mapStores(runtimeStore, scenarioStore),
    connector() {
      return this.scenarioStore?.getCurrent?.connector;
    },
    scenarioDuration() {
      return this.scenarioStore?.getCurrent?.duration;
    },
    maxRuntime() {
      return Number(this.scenarioDuration) || 600;
    },
    showToken() {
      return ["Blynk", "ThingsBoard", "ThingSpeak"].includes(this.connector);
    },
    connectorTopicLabel() {
      switch (this.connector) {
        case "ArduinoCloud":
          return "Variable";
        case "ThingsBoard":
          return "Telemetry Key";
        case "Blynk":
          return "Pin";
        case "ThingSpeak":
          return "Channel Field";
        case "MQTT":
        default:
          return "Topic";
      }
    },
    connectorTokenLabel() {
      let label = this.connector + " ";
      switch (this.connector) {
        case "Blynk":
          label += "Auth Token";
          break;
        case "ThingsBoard":
          label += "Device Access Token";
          break;
        case "ThingSpeak":
          label += "Channel Write API Key";
          break;
        default:
      }
      return label;
    },
    colorValue() {
      const rgb_color = colors.textToRgb(this.color);
      const hex_color = colors.rgbToHex(rgb_color);
      return hex_color;
    },
  },
  methods: {
    createItemVariable() {
      if (this.itemData.length > 7)
        return this.$q.notify({
          message: "You can only add up to 8 variables per device",
          color: "negative",
          position: "top",
          icon: "report_problem",
        });
      const topicName = `${
        this.connector === "ThingSpeak" ? "field" : "variable_"
      }${this.itemData.length + 1}`;
      this.itemData.push({
        label: `Label #${this.itemData.length + 1}`,
        min: this.min,
        max: this.max,
        icon: "pin",
        interval: this.interval,
        sinePeriod: this.sinePeriod,
        connectorTopic: topicName,
        color:
          this.colorPalette[this.itemData.length % this.colorPalette.length],
        fn: this.fnOptions[this.itemData.length % this.fnOptions.length],
        connector: this.connector,
      });
      this.updateItem({ variables: this.itemData });
    },
    deleteItemVariable(index) {
      this.itemData.splice(index, 1);
      this.updateItem({ variables: this.itemData });
    },
    updateItemVariable(index, val) {
      if ("interval" in val) {
        const value = Number(val.interval);
        if (value < 1) {
          return this.$q.notify({
            message: "Interval must be greater or equal than 1",
            color: "negative",
            position: "top",
            icon: "report_problem",
          });
        }
        val.interval = value;
      }
      this.itemData.splice(index, 1, { ...this.itemData[index], ...val });
      this.updateItem({ variables: this.itemData });
    },
    deleteDevice() {
      this.$q
        .dialog({
          title: `Delete ${this.item.data.label}`,
          message: "Are you sure you want to delete this device?",
          ok: { color: "negative", label: "Delete" },
          cancel: true,
        })
        .onOk(() => {
          this.$emit("delete", this.item);
        })
        .onCancel(() => {
          // console.log('Cancel')
        })
        .onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        });
    },
    onResize() {
      this.updateGraph();
    },
    async updateItem(val) {
      // update preview graph
      this.updateGraph();
      this.$emit("update", {
        ...this.item,
        data: { ...this.item.data, ...val },
      });
    },
    generateGraphData(interval, min, max, fn) {
      const data = [];
      const start = this.item.x * (this.maxRuntime / 12);
      const end = start + this.item.w * (this.maxRuntime / 12);
      for (let i = start; i < end; i += interval) {
        const obj = { sec: i, value: this.generateValue(i, min, max, fn) };
        if (i <= this.runtimeSeconds) {
          obj.inactive = true;
        }
        data.push(obj);
      }
      return data;
    },
    generateValue(sec, min, max, fn) {
      const percentage = sec / this.maxRuntime;
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
          return sinewave(min, max, percentage, this.sinePeriod);
        case "Gaussian":
          return gaussian(min, max, percentage);
        default:
          return random(min, max, percentage);
      }
    },
    async updateGraph() {
      // // remove the previous graph
      select("#preview-graph").selectAll("*").remove();

      // // create a new graph
      this.createGraph();
    },

    createGraph() {
      if (this.itemData.length === 0) return;
      const min = this.itemData
        .map((i) => i.min)
        .reduce((a, b) => Math.min(a, b));
      const max = this.itemData
        .map((i) => i.max)
        .reduce((a, b) => Math.max(a, b));
      const color = this.colorValue;
      const inactiveColor = "#f0f0f0";

      // set the dimensions and margins of the graph
      const margin = { top: 30, right: 80, bottom: 20, left: 30 };
      const width =
        this.$el.clientWidth -
        margin.left -
        margin.right -
        this.$el.clientWidth * 0.01;
      const height = 250 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      const svg = select("#preview-graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Add X axis --> it is number of seconds passed
      const x = scaleLinear().domain([0, this.maxRuntime]).range([0, width]);
      svg
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(axisBottom(x));
      // Add Y axis
      const y = scaleLinear().domain([min, max]).range([height, 0]);
      svg.append("g").call(axisLeft(y));

      // Iterate over each itemData and create a line for each
      this.itemData.forEach((item) => {
        const data = this.generateGraphData(
          item.interval,
          item.min,
          item.max,
          item.fn
        );

        // Add the line
        svg
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", item.color || color)
          .attr("stroke-width", 1.5)
          .attr(
            "d",
            line()
              .x((d) => x(d.sec))
              .y((d) => y(d.value))
          );
        // Add the points
        svg
          .append("g")
          .selectAll("dot")
          .data(data)
          .join("circle")
          .attr("cx", (d) => x(d.sec))
          .attr("cy", (d) => y(d.value))
          .attr("r", 3)
          .attr("fill", item.color || color)
          .attr("opacity", (d) => (d.inactive ? 0 : 1));
      });
    },
  },
};
</script>
