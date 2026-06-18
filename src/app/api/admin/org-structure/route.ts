import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  buildUnitBackup,
  createBranch,
  createUnit,
  createWarehouse,
  deleteDepartment,
  loadOrgStructure,
} from "@/lib/server/org-structure";
import { buildSessionForUserId, isAdminRole } from "@/lib/server/users";
import type { BusinessLine, UnitType } from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

const VALID_BUSINESS_LINES: BusinessLine[] = [
  "trading",
  "construction",
  "logistics",
  "real_estate",
];

async function requireAdmin() {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    throw new Error("Forbidden");
  }
  return token;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const backupUnitId = searchParams.get("backupUnitId");

    const db = createAdminClientOrNull();
    if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    if (backupUnitId) {
      const backup = await buildUnitBackup(db, backupUnitId);
      return NextResponse.json(backup);
    }

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const structure = await loadOrgStructure(db, organizationId);
    return NextResponse.json(structure);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const token = await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    const resource = String(body.resource ?? "");

    const db = createAdminClientOrNull();
    if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    if (resource === "unit") {
      const organization_id = String(body.organization_id ?? "");
      const name = String(body.name ?? "").trim();
      const trade_license_no = String(body.trade_license_no ?? "").trim();
      const unit_type = (body.unit_type === "shop" ? "shop" : "department") as UnitType;
      const business_lines = (body.business_lines as string[] | undefined)?.filter(
        (line): line is BusinessLine => VALID_BUSINESS_LINES.includes(line as BusinessLine)
      );

      if (!organization_id || !name || !trade_license_no) {
        return NextResponse.json(
          { error: "Organization, name, and trade license are required" },
          { status: 400 }
        );
      }

      await createUnit(db, token.sub, {
        organization_id,
        name,
        unit_type,
        trade_license_no,
        business_lines,
        address: body.address ? String(body.address) : undefined,
        currency: body.currency ? String(body.currency) : undefined,
        vat_trn: body.vat_trn ? String(body.vat_trn) : undefined,
        fiscal_year_start: body.fiscal_year_start
          ? String(body.fiscal_year_start)
          : undefined,
      });
    } else if (resource === "branch") {
      const company_id = String(body.company_id ?? "");
      const name = String(body.name ?? "").trim();
      const code = String(body.code ?? "").trim();
      const trade_license_no = String(body.trade_license_no ?? "").trim();

      if (!company_id || !name || !code || !trade_license_no) {
        return NextResponse.json(
          { error: "Department, name, code, and trade license are required" },
          { status: 400 }
        );
      }

      await createBranch(db, token.sub, {
        company_id,
        name,
        code,
        trade_license_no,
        address: body.address ? String(body.address) : undefined,
        is_head_office: Boolean(body.is_head_office),
      });
    } else if (resource === "warehouse") {
      const company_id = String(body.company_id ?? "");
      const name = String(body.name ?? "").trim();
      const code = String(body.code ?? "").trim();
      const trade_license_no = String(body.trade_license_no ?? "").trim();

      if (!company_id || !name || !code || !trade_license_no) {
        return NextResponse.json(
          { error: "Department, name, code, and trade license are required" },
          { status: 400 }
        );
      }

      await createWarehouse(db, token.sub, {
        company_id,
        name,
        code,
        trade_license_no,
        address: body.address ? String(body.address) : undefined,
      });
    } else {
      return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }

    const organizationId =
      resource === "unit"
        ? String(body.organization_id)
        : await resolveOrgIdFromCompany(db, String(body.company_id));

    const structure = await loadOrgStructure(db, organizationId);
    const session = await buildSessionForUserId(token.sub);

    return NextResponse.json({ ...structure, session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    const resource = String(body.resource ?? "");

    const db = createAdminClientOrNull();
    if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    if (resource === "organization") {
      const id = String(body.id ?? "");
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.trade_license_no !== undefined) {
        updates.trade_license_no = String(body.trade_license_no).trim();
      }
      if (body.address !== undefined) updates.address = String(body.address).trim();
      if (body.vat_trn !== undefined) updates.vat_trn = String(body.vat_trn).trim();

      const { error } = await db.from("organizations").update(updates).eq("id", id);
      if (error) throw new Error(error.message);

      const structure = await loadOrgStructure(db, id);
      return NextResponse.json(structure);
    }

    if (resource === "unit") {
      const id = String(body.id ?? "");
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.trade_license_no !== undefined) {
        updates.trade_license_no = String(body.trade_license_no).trim();
      }
      if (body.address !== undefined) updates.address = String(body.address).trim();
      if (body.currency !== undefined) updates.currency = String(body.currency).trim();
      if (body.vat_trn !== undefined) updates.vat_trn = String(body.vat_trn).trim();
      if (body.fiscal_year_start !== undefined) {
        updates.fiscal_year_start = String(body.fiscal_year_start).trim();
      }
      if (body.unit_type !== undefined) {
        updates.unit_type = body.unit_type === "shop" ? "shop" : "department";
      }
      if (body.business_lines !== undefined) {
        const lines = (body.business_lines as string[]).filter((line): line is BusinessLine =>
          VALID_BUSINESS_LINES.includes(line as BusinessLine)
        );
        updates.business_lines = lines.length ? lines : ["trading"];
      }

      const { data: unit } = await db
        .from("companies")
        .select("organization_id")
        .eq("id", id)
        .single();

      const { error } = await db.from("companies").update(updates).eq("id", id);
      if (error) throw new Error(error.message);

      const structure = await loadOrgStructure(db, unit!.organization_id);
      return NextResponse.json(structure);
    }

    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    const unit_id = String(body.unit_id ?? "");
    const confirm_name = String(body.confirm_name ?? "");
    const transfer_to_unit_id = body.transfer_to_unit_id
      ? String(body.transfer_to_unit_id)
      : undefined;

    if (!unit_id || !confirm_name) {
      return NextResponse.json(
        { error: "Department id and confirmation name are required" },
        { status: 400 }
      );
    }

    const db = createAdminClientOrNull();
    if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { backup, organization_id } = await deleteDepartment(db, token.sub, {
      unit_id,
      confirm_name,
      transfer_to_unit_id,
    });

    const structure = await loadOrgStructure(db, organization_id);
    const session = await buildSessionForUserId(token.sub);

    return NextResponse.json({ ...structure, session, backup });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

async function resolveOrgIdFromCompany(
  db: NonNullable<ReturnType<typeof createAdminClientOrNull>>,
  companyId: string
) {
  const { data } = await db
    .from("companies")
    .select("organization_id")
    .eq("id", companyId)
    .single();
  if (!data?.organization_id) throw new Error("Department not found");
  return data.organization_id;
}
