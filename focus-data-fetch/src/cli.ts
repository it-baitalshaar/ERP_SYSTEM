#!/usr/bin/env node
import { runExplore, runSync } from "./sync.js";

function printHelp() {
  console.log(`
Focus Data Fetch — copy Focus v6 SQL Server → Supabase raw staging

Usage:
  npm run explore              List databases/tables (catalog only)
  npm run explore -- --all-databases
  npm run sync                 Copy row data for databases in FOCUS_DATABASES
  npm run sync -- --all-databases

You do NOT need to write SQL queries manually. The tool discovers tables
automatically using INFORMATION_SCHEMA and sys.tables (same as SSMS).

Setup:
  1. Copy .env.example → .env and fill SQL + Supabase keys
  2. Apply migration 0014_focus_raw_staging.sql on Supabase
  3. docker compose run --rm focus-fetch npm run explore
  4. docker compose run --rm focus-fetch npm run sync
`);
}

const args = process.argv.slice(2);
const command = args[0];
const allDatabases = args.includes("--all-databases");

async function main() {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "explore") {
    await runExplore(allDatabases);
    return;
  }

  if (command === "sync") {
    await runSync(allDatabases);
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error("\n✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
