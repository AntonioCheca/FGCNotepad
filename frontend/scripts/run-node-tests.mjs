import {cpSync, existsSync, mkdirSync, readdirSync, rmSync} from "node:fs";
import {join} from "node:path";
import {spawnSync} from "node:child_process";

const findTestFiles = (directory, suffix) => {
  const entries = readdirSync(directory, {withFileTypes: true});
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...findTestFiles(path, suffix));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(suffix)) {
      files.push(path);
    }
  }

  return files;
};

const outputDirectory = ".node-test";

if (existsSync(outputDirectory)) {
  rmSync(outputDirectory, {recursive: true, force: true});
}

const compileResult = spawnSync(
  process.execPath,
  ["node_modules/typescript/bin/tsc", "-p", "tsconfig.node-tests.json"],
  {stdio: "inherit"}
);

if (compileResult.status !== 0) {
  process.exit(compileResult.status ?? 1);
}

const aliasRoot = join(outputDirectory, "node_modules", "@", "src");
mkdirSync(aliasRoot, {recursive: true});
cpSync(join(outputDirectory, "src"), aliasRoot, {recursive: true});

const testFiles = findTestFiles(join(outputDirectory, "src"), ".test.js");

if (testFiles.length === 0) {
  console.log("No node:test files found.");
  process.exit(0);
}

const result = spawnSync(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
