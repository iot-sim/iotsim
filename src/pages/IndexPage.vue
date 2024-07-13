<style lang="scss"></style>

<template>
  <q-page class="q-pa-xs q-pa-md">
    <div class="flex row">
      <div class="col-xs-5 col-sm-3" style="flex-grow: 1">
        <q-chip style="font-size: 1rem"
          ><span class="ellipsis">{{ name }}</span
          ><q-tooltip>{{ name }}</q-tooltip></q-chip
        >
      </div>
      <q-tabs
        align="justify"
        content-class="justify-center"
        style="flex-grow: 1"
        no-caps
        inline-label
        narrow-indicator
        class="col-xs-auto col-sm-6"
      >
        <q-route-tab
          style="max-width: 130px"
          label="Playground"
          :to="`/scenario/${id}`"
          icon="science"
        />
        <q-route-tab
          style="max-width: 130px"
          label="Results"
          disable
          :to="`/scenario/${id}/results`"
          icon="query_stats"
        />
      </q-tabs>
      <div class="col-sm-3 text-right" style="flex-grow: 1">
        <q-btn-dropdown
          flat
          no-caps
          color="primary"
          label="Menu"
          rounded
          dense
          class="q-py-sm q-pl-md"
        >
          <q-list>
            <q-item clickable v-close-popup @click="editScenario">
              <q-item-section avatar>
                <q-icon name="edit_note" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Edit Scenario</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="exportScenario">
              <q-item-section avatar>
                <q-icon name="download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Export Scenario</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="$refs.importScenario.pickFiles"
            >
              <q-item-section avatar>
                <q-icon name="upload" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Import Scenario</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="deleteScenario">
              <q-item-section avatar>
                <q-icon color="negative" name="delete" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Delete Scenario</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <!-- <q-btn flat icon="edit_note" @click="editScenario"
          ><q-tooltip>Edit Scenario</q-tooltip></q-btn
        >
        <q-btn flat icon="download" @click="exportScenario"
          ><q-tooltip>Export Scenario</q-tooltip></q-btn
        >
        <q-btn flat icon="delete" @click="deleteScenario"
          ><q-tooltip>Delete scenario</q-tooltip></q-btn
        > -->
      </div>
    </div>
    <router-view />

    <q-file
      ref="importScenario"
      v-model="importScenarioFile"
      accept=".json"
      style="visibility: hidden"
      @rejected="(err) => $q.notify('Invalid file format', `${err}`)"
    />
  </q-page>
</template>

<script>
import { defineComponent, ref } from "vue";
import { mapStores } from "pinia";
import scenarioStore from "src/stores/scenario";
import runtimeStore from "src/stores/runtime";

export default defineComponent({
  name: "IndexPage",
  components: {},
  computed: {
    ...mapStores(runtimeStore, scenarioStore),
    id() {
      return this.$route.params.id;
    },
    current() {
      return this.scenarioStore.getAll?.find((sc) => sc.id === this.id);
    },
    name() {
      return this.current?.name;
    },
  },
  mounted() {},
  unmounted() {},
  methods: {
    editScenario() {
      this.$emit("edit-scenario", this.id);
    },
    deleteScenario() {
      this.$emit("delete-scenario", this.id);
    },
    exportScenario() {
      this.scenarioStore.export(this.id);
    },
  },
  watch: {
    importScenarioFile: {
      handler(file) {
        if (file) {
          file.text().then((text) => {
            try {
              const scenario = JSON.parse(text);
              this.scenarioStore.save(scenario);
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
  data() {
    return {
      importScenarioFile: null,
    };
  },
});
</script>
