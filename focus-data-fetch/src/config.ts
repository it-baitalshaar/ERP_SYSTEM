import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnvFile(filename: string) {
  const path = resolve(ROOT, filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");

function env(key: string, fallback = ""): string {
  return process.env[key]?.trim() ?? fallback;
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key]?.toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes";
}

export const config = {
  sql: {
    server: env("FOCUS_SQL_SERVER", "host.docker.internal"),
    port: envInt("FOCUS_SQL_PORT", 1433),
    instance: env("FOCUS_SQL_INSTANCE"),
    user: env("FOCUS_SQL_USER"),
    password: env("FOCUS_SQL_PASSWORD"),
    encrypt: envBool("FOCUS_SQL_ENCRYPT", false),
    trustServerCertificate: envBool("FOCUS_SQL_TRUST_CERT", true),
  },
  databases: env("FOCUS_DATABASES")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  includeEmployeeDb: envBool("FOCUS_INCLUDE_EMPLOYEE_DB", false),
  minRows: envInt("FOCUS_MIN_ROWS", 1),
  batchSize: envInt("FOCUS_BATCH_SIZE", 200),
  supabase: {
    url: env("NEXT_PUBLIC_SUPABASE_URL"),
    serviceKey: env("SUPABASE_SERVICE_ROLE_KEY"),
  },
};

export function assertConfig(mode: "explore" | "sync") {
  if (!config.sql.user || !config.sql.password) {
    throw new Error("Set FOCUS_SQL_USER and FOCUS_SQL_PASSWORD in .env");
  }
  if (!config.supabase.url || !config.supabase.serviceKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  }
  if (mode === "sync" && config.databases.length === 0 && !config.includeEmployeeDb) {
    throw new Error(
      "Set FOCUS_DATABASES (comma-separated) or FOCUS_INCLUDE_EMPLOYEE_DB=true in .env"
    );
  }
}

export function resolveDatabaseList(allDatabases: boolean, discovered: string[]): string[] {
  const focusDbs = discovered.filter((name) => /^Focus/i.test(name));
  const list = allDatabases
    ? focusDbs
    : [...config.databases, ...(config.includeEmployeeDb ? ["employeeDB"] : [])];
  return [...new Set(list)];
}
