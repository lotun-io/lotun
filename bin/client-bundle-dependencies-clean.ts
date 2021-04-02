#!/usr/bin/env ts-node-script
import fs from "fs";

const CLIENT_PACKAGE_JSON_PATH = `${process.cwd()}/packages/client/package.json`;

const pkg = require(CLIENT_PACKAGE_JSON_PATH) as {
  dependencies: Record<string, string>;
  bundledDependencies?: string[];
  bundleDependencies?: string[];
};

delete pkg.bundledDependencies;
delete pkg.bundleDependencies;

fs.writeFileSync(CLIENT_PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2));
