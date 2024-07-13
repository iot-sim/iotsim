import MainLayout from "layouts/MainLayout.vue";
import IndexPage from "pages/IndexPage.vue";
import WelcomePage from "pages/WelcomePage.vue";
import DevicesPage from "pages/DevicesPage.vue";
import SettingsPage from "pages/SettingsPage.vue";
import ErrorNotFound from "pages/ErrorNotFound.vue";
import TestRunner from "src/components/TestRunner.vue";
import TestResults from "src/components/TestRunner.vue";

const routes = [
  {
    path: "",
    component: MainLayout,
    children: [
      { path: "", component: WelcomePage },
      {
        path: "scenario/:id",
        component: IndexPage,
        children: [
          { path: "", component: TestRunner },
          { path: "results", component: TestResults },
        ],
      },
      { path: "/templates", component: DevicesPage },
      { path: "/settings", component: SettingsPage },
    ],
  },
  {
    path: "/:catchAll(.*)*",
    component: ErrorNotFound,
  },
];

export default routes;
