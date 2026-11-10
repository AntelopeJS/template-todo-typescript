import { antelopeKnipConfig } from "@antelopejs/tooling-configs/knip";

export default Object.assign(
  antelopeKnipConfig({ ignoreDependencies: ["@types/mocha", "@types/semver"] }),
  {
    ignoreIssues: {
      "src/data-api/index.ts": ["exports"],
      "src/data-api/tasks.ts": ["exports"],
      "src/routes/index.ts": ["exports"],
    },
  },
);
