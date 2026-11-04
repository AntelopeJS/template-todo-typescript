import type { VerifyConfig } from "@antelopejs/tooling-configs/verify";

import { authJourneys } from "./journeys-auth.ts";
import { scaffoldJourneys } from "./journeys-scaffold.ts";
import { taskJourneys } from "./journeys-tasks.ts";
import { TEMPLATE } from "./session.ts";

const config: VerifyConfig = {
  doors: {
    data: null,
    format: {
      globs: ["src/db/**"],
      funnels: ["src/db/models/task.model.ts"],
      containments: ["tasks/tasks-crud"],
      why: "every project created from the template stores its users and tasks through these tables and models (the salted password hash, the owner and the `createdAt` and `updatedAt` dates the models set): rows a deployed project already holds are read by the next release in the same layout",
    },
    contract: {
      globs: ["package.json"],
      funnels: [],
      containments: [],
      why: "the interface ranges the module declares decide which API, auth and database implementations `ajs project modules install` resolves for every project created from the template",
    },
    outbound: null,
    exposure: {
      globs: ["src/routes/**", "src/data-api/**"],
      funnels: ["src/data-api/tasks.ts"],
      containments: [],
      why: "these controllers are the project's HTTP surface: the routes, the token checks and the ownership scoping decide who can register, read and change which rows",
    },
    publish: null,
  },
  services: {
    mongo: { image: "mongo:8.0", port: 27017, ready: ["mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"], reset: ["mongosh", "--quiet", "--eval", "db.getSiblingDB('todo').dropDatabase()"] },
  },
  template: { name: TEMPLATE, probe: { log: /Constructed modules|Started/ } },
  journeys: { ...scaffoldJourneys, ...authJourneys, ...taskJourneys },
};

export default config;
