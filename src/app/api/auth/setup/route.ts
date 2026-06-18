import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { runBootstrap } from "@/lib/server/bootstrap";
import type { BusinessLine, UnitType } from "@/lib/types";

const VALID_BUSINESS_LINES: BusinessLine[] = [
  "trading",
  "construction",
  "logistics",
  "real_estate",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      organization?: {
        name?: string;
        trade_license_no?: string;
        address?: string;
        currency?: string;
        vat_trn?: string;
      };
      units?: {
        name?: string;
        unit_type?: UnitType;
        trade_license_no?: string;
        business_lines?: string[];
        branches?: { name?: string; code?: string; trade_license_no?: string; address?: string }[];
        warehouses?: { name?: string; code?: string; trade_license_no?: string; address?: string }[];
      }[];
      admin?: { full_name?: string; email?: string; password?: string };
    };

    const units = (body.units ?? []).map((unit) => ({
      name: unit.name ?? "",
      unit_type: (unit.unit_type === "shop" ? "shop" : "department") as UnitType,
      trade_license_no: unit.trade_license_no ?? "",
      business_lines: (unit.business_lines ?? []).filter((line): line is BusinessLine =>
        VALID_BUSINESS_LINES.includes(line as BusinessLine)
      ),
      branches: (unit.branches ?? []).map((b) => ({
        name: b.name ?? "",
        code: b.code ?? "",
        trade_license_no: b.trade_license_no ?? "",
        address: b.address,
      })),
      warehouses: (unit.warehouses ?? []).map((w) => ({
        name: w.name ?? "",
        code: w.code ?? "",
        trade_license_no: w.trade_license_no ?? "",
        address: w.address,
      })),
    }));

    const session = await runBootstrap({
      organization: {
        name: body.organization?.name ?? "",
        trade_license_no: body.organization?.trade_license_no ?? "",
        address: body.organization?.address,
        currency: body.organization?.currency,
        vat_trn: body.organization?.vat_trn,
      },
      units,
      admin: {
        full_name: body.admin?.full_name ?? "",
        email: body.admin?.email ?? "",
        password: body.admin?.password ?? "",
      },
    });

    const token = await createSessionToken({
      sub: session.user.id,
      email: session.user.email,
      role_id: session.user.role_id,
    });

    const response = NextResponse.json({ session });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Setup failed";
    const status = message.includes("already completed") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
