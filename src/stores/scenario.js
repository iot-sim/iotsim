import { defineStore } from "pinia";
import { LocalStorage, uid, exportFile } from "quasar";

export default defineStore("scenario", {
  state: () => ({
    list: [],
    current: {},
  }),
  getters: {
    getCurrent: (state) => state.current,
    getAll: (state) => state.list,
  },
  actions: {
    // List
    fetchAll() {
      try {
        const list = LocalStorage.getItem(`iotsim-sc-list`);
        if (list) {
          this.list = list;
        }
      } catch (e) {
        console.error(e);
      }
      return this.list;
    },
    saveAll(list) {
      try {
        LocalStorage.set(`iotsim-sc-list`, list);
        this.list = list;
      } catch (e) {
        console.error(e);
      }
    },
    exportAll() {},
    // CRUD
    fetch(id) {
      let cur;
      try {
        cur = LocalStorage.getItem(`iotsim-sc-${id}`);
        if (cur) {
          this.current = cur;
        }
      } catch (e) {
        console.error(e);
      }
      return cur;
    },
    save(s) {
      let id = s.id;
      if (!id) {
        s.id = uid();
      }
      s.lastAccess = Date.now();
      // save the scenario
      LocalStorage.set(`iotsim-sc-${s.id}`, s);
      this.current = { ...s };
      // handle list
      let list = [];
      let sForList = { id: s.id, name: s.name, lastAccess: s.lastAccess };
      if (!id) {
        // new scenario (create or duplicate)
        list = [...this.list, sForList];
      } else {
        // update scenario
        list = this.list.map((sc) => {
          if (sc.id === s.id) return sForList;
          return sc;
        });
      }
      this.saveAll(list);
      return s;
    },
    remove(id) {
      // delete the scenario
      LocalStorage.remove(`iotsim-sc-${id}`);
      // handle list
      const list = this.list.filter((sc) => sc.id !== id);
      this.saveAll(list);
    },
    duplicate(id) {
      const scenario = this.fetch(id);
      this.save({ ...scenario, id: null, name: `${scenario.name} (copy)` });
    },
    export(id) {
      const scenario = this.fetch(id);
      const datetime = new Date().toISOString().replace(/:/g, "-");
      exportFile(
        `iotsim-scenario-export-${scenario.name}-${datetime}.json`,
        JSON.stringify(scenario, null, 0)
      );
    },
  },
});
