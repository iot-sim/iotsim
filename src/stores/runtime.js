import { defineStore } from "pinia";

export default defineStore("runtime", {
  state: () => ({
    active: false,
  }),
  getters: {
    isActive: (state) => !!state.active,
  },
  actions: {
    start() {
      this.active = true;
    },
    stop() {
      this.active = false;
    },
  },
});
