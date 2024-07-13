<style lang="scss">
.scenario-card {
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 10px;
  width: 300px;
  height: 200px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  &:hover {
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
  }
}
</style>

<template>
  <q-page class="q-pa-lg">
    <div class="text-h5 q-mb-md">Welcome to the IoT Simulator</div>
    <p>
      This is a simple IoT simulator that allows you to create and run scenarios
      with virtual IoT devices and push data to the cloud providers. You can
      create a new scenario or import an existing one to get started.
    </p>

    <div class="q-pa-xl flex" style="justify-content: center">
      <q-btn
        icon="add"
        class="q-pa-md"
        color="primary"
        label="Create Scenario"
        @click="createScenario"
      />
      <div class="q-mx-xl q-pa-sm text-h6">OR</div>
      <q-file
        outlined
        label="Import Scenario"
        style="width: 200px"
        color="primary"
        filled
        ref="importScenario"
        v-model="importScenarioFile"
        accept=".json"
        @rejected="(err) => $q.notify('Invalid file format', `${err}`)"
      >
        <template v-slot:prepend>
          <q-icon name="upload" />
        </template>
      </q-file>
    </div>
    <q-separator class="q-mb-md" />
    <div class="text-h5 q-mb-md">Recent scenarios</div>
    <div v-if="scenarios.length > 0" class="flex q-gutter-lg q-pa-lg">
      <q-card
        v-for="scenario in scenarios.slice(0, 5)"
        :key="scenario.id"
        class="q-mb-md scenario-card"
        @click="() => $router.push(`/scenario/${scenario.id}`)"
      >
        <q-card-section>
          <q-item>
            <q-item-section>
              <q-item-label class="text-h6 ellipsis"
                >{{ scenario.name
                }}<q-tooltip>{{ scenario.name }}</q-tooltip></q-item-label
              >
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label
                >Updated <timeago :datetime="scenario.lastAccess"
              /></q-item-label>
            </q-item-section>
          </q-item>
        </q-card-section>
      </q-card>
    </div>
    <div v-else>
      <q-card class="q-mb-md">
        <q-card-section>
          <q-item>
            <q-item-section>
              <q-item-label>No scenarios found</q-item-label>
            </q-item-section>
          </q-item>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from "vue";
import { mapStores } from "pinia";
import scenarioStore from "src/stores/scenario";

export default defineComponent({
  name: "WelcomePage",
  components: {},
  computed: {
    ...mapStores(scenarioStore),
    scenarios() {
      return [...this.scenarioStore.getAll].sort(
        (a, b) => b.lastAccess - a.lastAccess
      );
    },
  },
  watch: {
    importScenarioFile: {
      handler(file) {
        if (file) {
          file.text().then((text) => {
            try {
              const scenario = JSON.parse(text);
              scenario.id = null;
              this.scenarioStore.save(scenario);
              this.importScenarioFile = null;
              this.$q.notify({
                color: "positive",
                message: "Scenario imported successfully",
                icon: "done",
              });
            } catch (e) {
              this.$q.notify({
                color: "negative",
                message: "Invalid scenario file",
                icon: "report_problem",
              });
            }
          });
        }
      },
      immediate: true,
    },
  },
  methods: {
    createScenario() {
      this.$emit("create-scenario");
    },
  },
  data() {
    return { importScenarioFile: null };
  },
});
</script>
