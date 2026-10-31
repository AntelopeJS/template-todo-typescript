import { readFileSync } from "node:fs";
import { join } from "node:path";

import { exists, fileHas, type Journey } from "@antelopejs/tooling-configs/verify";

import { MODULE, parseJsonText, pick, same, scaffolded, withModules } from "./session.ts";

const FILES = [
  "src/index.ts",
  "src/db/tables/user.table.ts",
  "src/db/tables/task.table.ts",
  "src/db/models/user.model.ts",
  "src/db/models/task.model.ts",
  "src/routes/auth.ts",
  "src/data-api/tasks.ts",
  "test/example.test.ts",
  "test/task-ownership.test.ts",
  "antelope.config.ts",
  "antelope.test.ts",
  "package.json",
  "tsconfig.json",
];

const SCRIPTS = ["dev", "test", "checks", "typecheck", "lint", "format", "knip"];

const scaffoldFiles: Journey = {
  title: "the scaffolded project has every file the README's tree promises, the module's manifest and scripts, and a project config that loads the module",
  entryPoint: "`ajs project init my-todo --template \"Todo App Typescript\"`, as the README says",
  async run(context) {
    const project = await scaffolded(context);
    context.expect(context.tree("created files", project).folder, FILES.map((file) => exists(join(project, file))));
    const manifest = parseJsonText(readFileSync(join(project, "package.json"), "utf8"));
    const scripts = pick(manifest, "scripts");
    context.expect(context.tree("manifest", project).folder, [
      same("the module is named as the README says", pick(manifest, "name"), MODULE),
      same("the documented scripts exist", SCRIPTS.filter((name) => pick(scripts, name) === undefined), []),
      same("the interfaces the README lists are the dependencies", Object.keys(pick(manifest, "dependencies") ?? {}).sort(), [
        "@antelopejs/interface-api",
        "@antelopejs/interface-auth",
        "@antelopejs/interface-core",
        "@antelopejs/interface-data-api",
        "@antelopejs/interface-database",
        "@antelopejs/interface-database-decorators",
      ]),
      fileHas(join(project, "antelope.config.ts"), /"antelopejs-module"/),
    ]);
  },
};

const scaffoldModules: Journey = {
  title: "`ajs project modules install` adds the API, auth-jwt and MongoDB modules to the project config with the defaults the README names",
  entryPoint: "`ajs project modules install --yes` in a scaffolded project, against the public interfaces repository",
  async run(context) {
    const project = await scaffolded(context);
    await withModules(context, project);
    const config = join(project, "antelope.config.ts");
    context.expect(context.tree("project after the install", project).folder, [
      fileHas(config, /"@antelopejs\/api"/),
      fileHas(config, /"@antelopejs\/auth-jwt"/),
      fileHas(config, /"@antelopejs\/mongodb"/),
      fileHas(config, /port: 8080/),
      fileHas(config, /mongodb:\/\/localhost:27017/),
      fileHas(config, /secret: "your-secret-key"/),
    ]);
  },
};

export const scaffoldJourneys = { "scaffold-files": scaffoldFiles, "scaffold-modules": scaffoldModules };
