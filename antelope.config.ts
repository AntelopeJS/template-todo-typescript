import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "antelopejs-module",
  modules: {
    "antelopejs-module": {
      source: {
        type: "local",
        path: ".",
        watchDir: ["src"],
        installCommand: ["npx tsc"],
        reloadCommand: ["npx tsc"],
      },
    },
    mongodb: {
      source: {
        type: "package",
        package: "@antelopejs/mongodb",
        version: "~1.8.4",
      },
      config: { url: "mongodb://localhost:27017", database: "antelopejs" },
    },
  },
});
