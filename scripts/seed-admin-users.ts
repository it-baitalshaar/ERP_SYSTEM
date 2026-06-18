/**
 * Seeds admin-managed users (password_hash in profiles — no Supabase Auth).
 * Requires: migrations 0001, 0002, 0003 + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: pnpm run seed:users
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD ?? "ChangeMe123!";

const users = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    email: "admin@alsaqiya.ae",
    full_name: "System Administrator",
    role_id: "role-super",
    companies: [
      "11111111-1111-4111-8111-111111111101",
      "11111111-1111-4111-8111-111111111102",
    ],
    branches: [
      "22222222-2222-4222-8222-222222222201",
      "22222222-2222-4222-8222-222222222202",
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    email: "sales@alsaqiya.ae",
    full_name: "Al Saqiya Sales",
    role_id: "role-sales",
    companies: ["11111111-1111-4111-8111-111111111101"],
    branches: ["22222222-2222-4222-8222-222222222201"],
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    email: "cashier@alsaqiya.ae",
    full_name: "Al Saqiya Cashier",
    role_id: "role-cashier",
    companies: ["11111111-1111-4111-8111-111111111101"],
    branches: ["22222222-2222-4222-8222-222222222201"],
  },
  {
    id: "33333333-3333-4333-8333-333333333304",
    email: "accountant@alsaqiya.ae",
    full_name: "Al Saqiya Accountant",
    role_id: "role-accountant",
    companies: ["11111111-1111-4111-8111-111111111101"],
    branches: ["22222222-2222-4222-8222-222222222201"],
  },
];

async function main() {
  const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const u of users) {
    const { error } = await db.from("profiles").upsert(
      {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role_id: u.role_id,
        password_hash,
        is_active: true,
      },
      { onConflict: "id" }
    );
    if (error) {
      console.warn(`Profile ${u.email}: ${error.message}`);
      continue;
    }

    await db.from("user_companies").upsert(
      u.companies.map((company_id) => ({ user_id: u.id, company_id })),
      { onConflict: "user_id,company_id" }
    );
    await db.from("user_branches").upsert(
      u.branches.map((branch_id) => ({ user_id: u.id, branch_id })),
      { onConflict: "user_id,branch_id" }
    );

    console.log(`Seeded ${u.email}`);
  }

  console.log(`\nDefault password for all seeded users: ${DEFAULT_PASSWORD}`);
}

main();
