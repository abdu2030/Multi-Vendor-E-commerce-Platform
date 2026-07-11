#!/usr/bin/env node

const { spawnSync } = require("child_process");
const { existsSync, readFileSync } = require("fs");
const path = require("path");

const apiRoot = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const envFileArg = readOption("--env-path") ?? ".env.production";
const shouldCheckStatus = args.includes("--status");
const shouldSeedAdmin = args.includes("--seed-admin");
const envFile = path.resolve(apiRoot, envFileArg);

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const envFromFile = loadEnvFile(envFile);
const runtimeEnv = { ...process.env, ...envFromFile, NODE_ENV: envFromFile.NODE_ENV ?? process.env.NODE_ENV ?? "production" };

validateProductionDatabaseEnv(runtimeEnv, envFile);

const schemaPath = path.join(apiRoot, "prisma", "schema.prisma");
const prismaCli = path.resolve(apiRoot, "..", "..", "node_modules", "prisma", "build", "index.js");
const command = shouldCheckStatus ? ["migrate", "status"] : ["migrate", "deploy"];

console.log(`${shouldCheckStatus ? "Checking" : "Deploying"} Prisma migrations against ${maskDatabaseUrl(runtimeEnv.DATABASE_URL)}`);
run(process.execPath, [prismaCli, ...command, "--schema", schemaPath], runtimeEnv);

if (!shouldCheckStatus && shouldSeedAdmin) {
  validateAdminSeedEnv(runtimeEnv);
  console.log("Seeding production admin user and starter categories.");
  run(process.execPath, [path.join(apiRoot, "prisma", "seed.js")], runtimeEnv);
}

function readOption(name) {
  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }

  return value;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return env;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = unquote(trimmed.slice(separatorIndex + 1).trim());

      if (key) {
        env[key] = value;
      }

      return env;
    }, {});
}

function validateProductionDatabaseEnv(env, filePath) {
  if (env.NODE_ENV !== "production") {
    throw new Error(`NODE_ENV must be production before running production migrations. Loaded ${env.NODE_ENV}.`);
  }

  if (!env.DATABASE_URL) {
    throw new Error(`DATABASE_URL is required. Set it in ${filePath} or the deployment environment.`);
  }

  const normalizedDatabaseUrl = env.DATABASE_URL.toLowerCase();

  if (!normalizedDatabaseUrl.startsWith("postgresql://") && !normalizedDatabaseUrl.startsWith("postgres://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
  }

  if (!normalizedDatabaseUrl.includes("sslmode=require")) {
    throw new Error("DATABASE_URL must include sslmode=require for production migrations.");
  }

  if (containsPlaceholder(normalizedDatabaseUrl)) {
    throw new Error("DATABASE_URL still contains placeholder values. Use the real production database connection string.");
  }
}

function validateAdminSeedEnv(env) {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required when --seed-admin is used.");
  }

  if (containsPlaceholder(`${env.ADMIN_EMAIL} ${env.ADMIN_PASSWORD}`.toLowerCase())) {
    throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD still contains placeholder values.");
  }
}

function containsPlaceholder(value) {
  return ["example.com", "user:password@host", "replace_with_", "your_", "change_this_password"].some((fragment) =>
    value.includes(fragment)
  );
}

function maskDatabaseUrl(value) {
  try {
    const url = new URL(value);
    url.username = url.username ? "***" : "";
    url.password = url.password ? "***" : "";
    return url.toString();
  } catch {
    return "configured DATABASE_URL";
  }
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

function run(command, commandArgs, env) {
  const result = spawnSync(command, commandArgs, {
    cwd: apiRoot,
    env,
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function printHelp() {
  console.log(`Usage: node scripts/deploy-production-db.js [options]

Options:
  --env-path <path>  Env file path relative to apps/api. Defaults to .env.production.
  --status           Run prisma migrate status instead of prisma migrate deploy.
  --seed-admin       After deploying migrations, run prisma/seed.js.
  --help             Show this help.
`);
}
