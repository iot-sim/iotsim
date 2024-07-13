<style lang="scss">
.q-slider__marker-labels-container {
  display: none;
}
.flash {
  animation: pulse 0.5s infinite alternate;
}
@keyframes pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.7;
  }
}
.grid-stack {
  // background-color: lighten($primary, 50%);
  &-runtime {
    background: $grey-3;
    position: absolute;
    height: 100%;
    border-right: 1px dotted $grey;
  }
}
.grid-stack-item {
  &:hover {
    border: 1px solid $secondary;
  }
  &.selected {
    border: 2px solid $primary;
    .grid-stack-item-content > .drag-handle {
      display: block;
    }
  }
}
.grid-stack-item-content {
  border-radius: 2px;
  background-color: #18bc9c;
  display: flex;
  justify-content: center;
  overflow-y: hidden !important;
  align-items: center;
  .drag-handle {
    display: none;
  }
  &:hover {
    .drag-handle {
      display: block;
    }
  }
}
</style>

<template>
  <div class="q-py-md" @click="() => (selected = null)">
    <div class="flex row justify-between">
      <div>
        <q-btn
          label="Add Device"
          :disable="!!runtimeInterval"
          color="primary"
          @click="addNewWidget"
          icon="add"
        />
      </div>
      <div class="flex items-center"></div>
      <div class="flex items-center q-gutter-xs">
        <q-badge outline color="primary" label="Timer: ">
          <span style="padding: 0.3rem; font-size: 1rem"
            >{{ formattedRuntime }} / {{ formattedTotalTime }}</span
          ></q-badge
        >
        <q-btn
          round
          flat
          :class="runtimeInterval ? 'flash' : ''"
          color="accent"
          @click="toggleRuntime"
          :icon="runtimeInterval ? 'pause_circle' : 'play_circle'"
        />
        <q-btn flat color="grey" round icon="replay" @click="resetRuntime" />
      </div>
    </div>
    <div class="flex row">
      <div class="col-12">
        <q-slider
          :marker-labels="runtimeLabels"
          :model-value="runtimeSeconds"
          @update:model-value="updateRuntimeSeconds"
          :disable="!!runtimeInterval"
          :min="0"
          :max="maxRuntime"
        />
      </div>
    </div>
    <div class="flex row">
      <div class="col-12">
        <div class="grid-stack">
          <div
            class="grid-stack-runtime"
            v-if="items.length"
            :style="{ width: `${(runtimeSeconds * 100) / maxRuntime}%` }"
          ></div>
          <div
            v-for="(w, i) in items"
            class="grid-stack-item"
            :class="{
              selected: w.id === selected?.id,
            }"
            @click.stop="selectWidget(w, i)"
            :gs-x="w.x"
            :gs-y="w.y"
            :gs-w="w.w"
            :gs-h="w.h"
            :gs-id="w.id"
            :id="w.id"
            :key="w.id"
          >
            <div
              class="grid-stack-item-content"
              :style="{ backgroundColor: w?.data?.color }"
            >
              <q-menu touch-position context-menu>
                <q-list dense style="min-width: 100px">
                  <q-item>
                    <q-item-section>
                      <pre>{{ w }}</pre>
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="removeWidget(w, i)">
                    <q-item-section>Delete </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
              {{ w?.data?.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-for="item in items" :key="`${id}${item.id}`">
      <Device
        :item="item"
        :runtime-seconds="runtimeSeconds"
        @update="updateWidget"
        v-if="item.id === selected?.id"
        @click.stop
        @delete="removeWidget"
      />
    </div>
  </div>
</template>

<script>
import Device from "src/components/Device.vue";
import { defineComponent } from "vue";
import "gridstack/dist/gridstack.min.css";
import { GridStack } from "gridstack";
import { formatTimer } from "src/utils/time.utils";
import { mapStores } from "pinia";
import runtimeStore from "src/stores/runtime";
import scenarioStore from "src/stores/scenario";
import { randomColor } from "src/utils/color.utils";
import { debounce } from "quasar";

let grid;

export default defineComponent({
  name: "TestRunner",
  components: { Device },
  created() {
    this.updateWorkerConfig = debounce(this.updateWorkerConfig, 500);
  },
  mounted() {
    this.postMessageToWorker({ action: "status" });
    grid = GridStack.init({
      alwaysShowResizeHandle: true,
      // handle: ".card-header", // this will add 'ui-draggable-handle' style to header
      margin: 1,
      float: true,
      cellHeight: "45px",
      minRow: 1,
      resizable: {
        handles: "w,e",
      },
    });
    grid.on("dragstop", function (event, element) {
      const node = element.gridstackNode;
      this.info = `you just dragged node #${node.id} to ${node.x},${node.y} – good job!`;
    });
    grid.on("change", this.onChange);

    // add copy and paste event listeners for items
    window.addEventListener("copy", this.copyItem);
    window.addEventListener("paste", this.pasteItem);
    window.addEventListener("keydown", this.keyListener);

    // runtime worker event listener
    this.$runtimeWorker?.addEventListener("message", this.eventFromWorker);

    // Load scenario
    this.loadScenario(this.id);
  },
  unmounted() {
    window.removeEventListener("copy", this.copyItem);
    window.removeEventListener("paste", this.pasteItem);
    window.removeEventListener("keydown", this.keyListener);
    this.$runtimeWorker?.removeEventListener("message", this.eventFromWorker);
    grid.destroy();
  },
  updated() {
    if (this.scenario?.id !== this.id) {
      this.loadScenario(this.id);
    }
  },
  methods: {
    updateWorkerConfig() {
      this.postMessageToWorker({
        action: "update",
        data: {
          maxRuntime: this.maxRuntime,
          runtimeSeconds: this.runtimeSeconds,
          scenario: this.scenario,
        },
      });
    },
    eventFromWorker(event) {
      const { action, data } = JSON.parse(event.data);
      switch (action) {
        case "tick":
          this.runtimeSeconds = data.runtimeSeconds;
          this.runtimeInterval = !!data.active;
          break;
        case "status":
          this.runtimeInterval = !!data.active;
          this.runtimeSeconds = data.runtimeSeconds;
          break;
        default:
          break;
      }
      // console.log("Event from Worker", event);
    },
    postMessageToWorker(msg) {
      this.$runtimeWorker?.postMessage(JSON.stringify(msg));
    },
    updateRuntimeSeconds(value) {
      this.runtimeSeconds = value;
      this.updateWorkerConfig();
    },
    keyListener(e) {
      if (e.key === "Delete") {
        if (this.selected) this.removeWidget(this.selected);
      }
    },
    copyItem(e) {
      if (this.selected) {
        e.clipboardData.setData("text/plain", JSON.stringify(this.selected));
        e.preventDefault();
      }
    },
    pasteItem(e) {
      const data = e.clipboardData.getData("text");
      if (data) {
        try {
          const item = JSON.parse(data);
          this.addNewWidget(item, true);
        } catch (error) {
          console.error(error);
        }
      }
    },
    lockGrid(state) {
      grid.setStatic(state ?? true);
    },
    loadScenario(id) {
      if (this.items?.length > 0) {
        // cleanup grid first
        for (const widget of this.items) {
          grid.removeWidget(`#${widget.id}`, false);
        }
        this.items = [];
      }
      this.scenario = this.scenarioStore.fetch(id);
      this.scenario?.devices?.forEach((item) => {
        this.addNewWidget(item, true);
      });
      // console.log("Loaded: ", this.scenario?.name);
    },
    resetRuntime() {
      this.postMessageToWorker({
        action: "reset",
      });
    },
    toggleRuntime() {
      if (this.items.length === 0) {
        this.$q.notify({
          message: "You need to add at least one device",
          color: "red",
          icon: "report_problem",
        });
        return;
      }
      if (!this.runtimeInterval) {
        this.postMessageToWorker({
          action: "play",
          data: {
            scenario: this.scenario,
            devices: this.items,
          },
        });
        this.runtimeInterval = true;
        this.lockGrid(true);
      } else {
        this.postMessageToWorker({
          action: "stop",
        });
        this.runtimeInterval = false;
        this.lockGrid(false);
      }
    },
    updateWidget(item) {
      this.items = this.items.map((w) => {
        if (w.id == item.id) {
          w.data = item.data;
        }
        return w;
      });
      this.updateInfo();
    },
    selectWidget(widget, index) {
      this.selected = widget;
      // if (this.selected?.id === widget.id) {
      //   this.selected = null;
      // } else {
      //   this.selected = widget;
      // }
    },
    removeWidget(widget, index) {
      grid.removeWidget(`#${widget.id}`, false);
      this.items = this.items.filter((w) => w.id !== widget.id);
      this.updateInfo();
    },
    onChange(event, changeItems) {
      // update item position
      changeItems.forEach((item) => {
        var widget = this.items.find((w) => w.id == item.id);
        if (!widget) {
          alert("Widget not found: " + item.id);
          return;
        }
        widget.x = item.x;
        widget.y = item.y;
        widget.w = item.w;
        widget.h = item.h;
      });
      this.updateInfo();
    },
    randomColor() {
      return randomColor(this.items.map((item) => item.data.color));
    },
    updateInfo() {
      this.color =
        grid.engine.nodes.length == this.items.length ? "black" : "red";
      this.gridInfo = `Grid engine: ${grid.engine.nodes.length}, widgets: ${this.items.length}`;
      const scenario = { ...this.scenario, devices: this.items };
      this.scenarioStore.save(scenario);
      this.updateWorkerConfig();
    },
    rows() {
      return grid.engine.rows;
    },
    addNewWidget(node, imported = false) {
      const count = this.items.length + 1;
      if (count > 25) {
        this.$q.notify({
          message: "You can't add more than 25 devices",
          color: "red",
          icon: "report_problem",
        });
        return;
      }
      const isImport = node && imported;

      node = isImport
        ? node
        : {
            x: 0,
            y: this.items.length,
            w: Math.round(Math.random() * 12),
            h: 1,
            data: {
              label: `Device #${count}`,
              min: 0,
              max: 100,
              interval: 5,
              color: this.randomColor(),
              fn: "Random",
            },
          };
      const id = `widget-${count}`;
      node.id = id;
      if (isImport) {
        node.data.color = this.randomColor();
      }

      this.items.push(node);
      this.$nextTick(() => {
        grid.makeWidget(node.id);
        if (!isImport) this.updateInfo();
      });
    },
  },
  computed: {
    ...mapStores(runtimeStore, scenarioStore),

    scenarioDuration() {
      return this.scenarioStore?.getCurrent?.duration;
    },
    maxRuntime() {
      return Number(this.scenarioDuration) || 600;
    },
    formattedRuntime() {
      return formatTimer(this.runtimeSeconds, true);
    },
    formattedTotalTime() {
      return this.scenarioDuration
        ? formatTimer(this.scenarioDuration, true)
        : "-:-";
    },
    id() {
      return this.$route.params.id;
    },
  },
  watch: {
    id: function (id) {
      this.loadScenario(id);
    },
    /**
     * Clear the info text after a two second timeout. Clears previous timeout first.
     */
    info: function (newVal) {
      if (newVal.length === 0) return;
      window.clearTimeout(this.timerId);
      this.timerId = window.setTimeout(() => {
        this.info = "";
      }, 2000);
    },
  },
  data() {
    return {
      scenario: null,
      runtimeLabels: {},
      runtimeInterval: null,
      runtimeSeconds: 0,
      selected: null,
      timerId: null,
      info: "Drag me around!",
      gridInfo: "",
      color: "black",
      items: [],
    };
  },
});
</script>
