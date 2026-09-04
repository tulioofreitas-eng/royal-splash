import { spawnSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { resolve, relative } from "node:path";
import process from "node:process";

const root = process.cwd();

function fail(message) {
  console.error(`VERIFY_PREVIEW_SAFETY=FAIL`);
  console.error(message);
  process.exit(1);
}

function run(label, command, args, options = {}) {
  console.log();
  console.log(`=== ${label} ===`);

  const result = spawnSync(command, args, {
    cwd: root,
    env: options.env ?? process.env,
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error) {
    fail(`${label}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${label}: exit=${result.status}`);
  }

  console.log(`${label.replaceAll(" ", "_").toUpperCase()}=PASS`);
}

function collectFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(absolute));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolute);
    }
  }

  return files;
}

function looksBinary(buffer) {
  const sampleLength = Math.min(buffer.length, 8192);

  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] === 0) {
      return true;
    }
  }

  return false;
}

const forbiddenAmbientEnv = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SECRET_KEYS",
  "ATLAS_INGRESS_TOKEN",
];

const leakedEnvNames = forbiddenAmbientEnv.filter(
  (name) => typeof process.env[name] === "string" && process.env[name] !== "",
);

if (leakedEnvNames.length > 0) {
  fail(
    `Privileged Production environment variables are present: ${leakedEnvNames.join(
      ", ",
    )}. Values were not inspected or printed.`,
  );
}

if (
  typeof process.env.VERCEL_ENV === "string" &&
  process.env.VERCEL_ENV !== "" &&
  process.env.VERCEL_ENV !== "preview"
) {
  fail(
    `Refusing Preview verification while VERCEL_ENV=${process.env.VERCEL_ENV}.`,
  );
}

const safetyDirectory = resolve(root, "tests/safety");

if (!existsSync(safetyDirectory)) {
  fail("tests/safety directory is missing.");
}

const safetyTests = readdirSync(safetyDirectory)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => resolve(safetyDirectory, name));

if (safetyTests.length === 0) {
  fail("No safety test files were discovered.");
}

run(
  "SAFETY TESTS",
  process.execPath,
  ["--test", ...safetyTests],
);

const astroBinary = resolve(root, "node_modules/.bin/astro");

if (!existsSync(astroBinary)) {
  fail(
    "Local Astro binary is missing. Dependency installation is not performed by this harness.",
  );
}

const previewEnv = {
  ...process.env,
  VERCEL_ENV: "preview",
};

for (const name of forbiddenAmbientEnv) {
  delete previewEnv[name];
}

run(
  "PREVIEW BUILD",
  astroBinary,
  ["build"],
  { env: previewEnv },
);

console.log();
console.log("=== PREVIEW PRODUCTION EGRESS SCAN ===");

const artifactRoots = [
  resolve(root, "dist/client"),
  resolve(root, ".vercel/output/static"),
];

const productionMarkers = [
  {
    label: "Royal Production GTM container",
    value: "GTM-TFW2WDRG",
  },
  {
    label: "Formspree Production egress",
    value: "formspree.io",
  },
  {
    label: "GHL Production embed",
    value: "link.starterfunnels.com",
  },
];

const findings = [];

for (const artifactRoot of artifactRoots) {
  if (!existsSync(artifactRoot)) {
    continue;
  }

  if (!statSync(artifactRoot).isDirectory()) {
    continue;
  }

  for (const file of collectFiles(artifactRoot)) {
    const buffer = readFileSync(file);

    if (looksBinary(buffer)) {
      continue;
    }

    const content = buffer.toString("utf8");

    for (const marker of productionMarkers) {
      if (content.includes(marker.value)) {
        findings.push({
          marker: marker.label,
          file: relative(root, file),
        });
      }
    }
  }
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(
      `FORBIDDEN_PREVIEW_ARTIFACT marker="${finding.marker}" file="${finding.file}"`,
    );
  }

  fail("Production egress marker found in Preview client/static artifacts.");
}

console.log("PREVIEW_PRODUCTION_EGRESS_SCAN=PASS");
console.log();
console.log("VERIFY_PREVIEW_SAFETY=PASS");
