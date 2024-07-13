<template>
  <q-layout view="hHh lpr lFr">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title class="text-center">
          <q-btn type="a" no-caps flat to="/"
            ><span style="font-size: 1.3rem">IoT Simulator</span></q-btn
          >
        </q-toolbar-title>
        <q-img src="/logo.png" style="height: auto; width: 40px" />
      </q-toolbar>
    </q-header>
    <q-drawer
      v-model="leftDrawerOpen"
      side="left"
      :width="280"
      bordered
      class="grid"
    >
      <!-- drawer content -->
      <div style="z-index: 99; background: white">
        <!-- Create scenario button -->
        <div class="text-center q-pt-lg">
          <q-btn
            color="primary"
            outline
            rounded
            label="New Scenario"
            icon="add"
            @click="createScenario"
          />
        </div>
        <!-- Search component -->
        <q-input
          @copy.stop
          v-model="search"
          debounce="300"
          placeholder="Search..."
          class="q-mx-md"
          clearable
        ></q-input>
      </div>
      <q-scroll-area style="height: 80vh; overflow: auto" @click="warnIfAcive">
        <div v-for="{ id, name } in filteredScenarios" :key="id">
          <essential-link
            :title="name"
            :link="`/scenario/${id}`"
            :disabled="
              runtimeStore.isActive && $route.path !== `/scenario/${id}`
            "
          >
            <q-menu touch-position context-menu style="width: 200px">
              <q-list>
                <q-item>
                  <q-item-section>{{ name }}</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  clickable
                  v-close-popup
                  @click="() => warnIfAcive() && openScenario({ id })"
                >
                  <q-item-section side>
                    <q-icon name="open_in_new" />
                  </q-item-section>
                  <q-item-section>Open in new tab</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="() => warnIfAcive() && editScenario({ id })"
                >
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="() => warnIfAcive() && duplicateScenario({ id })"
                >
                  <q-item-section side>
                    <q-icon name="content_copy" />
                  </q-item-section>
                  <q-item-section>Duplicate</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  clickable
                  v-close-popup
                  class="text-red"
                  @click="() => warnIfAcive() && deleteScenario({ id })"
                >
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </essential-link>
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view
        @create-scenario="createScenario"
        @edit-scenario="editScenario"
        @delete-scenario="deleteScenario"
      />
    </q-page-container>
  </q-layout>

  <!-- Dialog for creating/updating a scenario -->
  <q-dialog v-model="createScenarioDialog" persistent>
    <scenario-form :id="scenarioId" @updated="scenarioStore.fetchAll" />
  </q-dialog>
</template>
<style lang="scss"></style>
<script>
import { ref } from "vue";
import EssentialLink from "src/components/EssentialLink.vue";
import { mapStores } from "pinia";
import runtimeStore from "src/stores/runtime";
import scenarioStore from "src/stores/scenario";
import ScenarioForm from "src/components/ScenarioForm.vue";
import { openURL } from "quasar";

export default {
  setup() {
    const leftDrawerOpen = ref(false);
    const createScenarioDialog = ref(false);
    const search = ref("");
    const scenarioId = ref("");
    return {
      createScenarioDialog,
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
      search,
      scenarioId,
    };
  },
  mounted() {
    this.scenarioStore.fetchAll();
  },
  methods: {
    duplicateScenario(s) {
      this.scenarioStore.duplicate(s.id);
    },
    openScenario(s) {
      const url = `${window.location.origin}/scenario/${s.id}`;
      openURL(url);
      // this.$router.push(`/scenario/${s.id}`);
    },
    editScenario(s) {
      this.scenarioId = s?.id || this.$route.params.id;
      this.createScenarioDialog = true;
    },
    deleteScenario(s) {
      const id = s?.id || this.$route.params.id;
      const scenario = this.scenarios.find((sc) => sc.id === id);
      // create a warning dialog before deleting
      this.$q
        .dialog({
          title: `Delete "${scenario?.name}"`,
          message: `Are you sure you want to delete this?`,
          cancel: {
            label: "Cancel",
            flat: true,
          },
          ok: {
            icon: "delete",
            label: "Delete",
            flat: true,
            color: "negative",
          },
          persistent: false,
        })
        .onOk(() => {
          this.scenarioStore.remove(id);
          if (id === this.$route.params.id) this.$router.push("/");
        });
    },
    createScenario() {
      if (!this.runtimeStore.isActive) {
        this.scenarioId = null;
        this.createScenarioDialog = true;
      } else this.warnIfAcive();
    },
    warnIfAcive() {
      if (this.runtimeStore.isActive) {
        this.$q.notify({
          message: "You have an active scenario, please stop it first",
          color: "negative",
          position: "top",
          icon: "report_problem",
        });
        return false;
      }
      return true;
    },
  },
  components: { EssentialLink, ScenarioForm },
  computed: {
    ...mapStores(runtimeStore, scenarioStore),
    scenarios() {
      return this.scenarioStore.getAll;
    },
    filteredScenarios() {
      return this.scenarios?.filter((s) =>
        typeof s?.name === "string" && typeof this.search === "string"
          ? s.name.toLowerCase().includes(this.search.toLowerCase())
          : true
      );
    },
  },
};
</script>
