import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

export async function addSupplierBalance(
  db: Db,
  supplierId: string,
  amount: number
): Promise<void> {
  const { data } = await db.from("suppliers").select("outstanding_balance").eq("id", supplierId).single();
  const current = Number(data?.outstanding_balance ?? 0);
  await db
    .from("suppliers")
    .update({ outstanding_balance: Math.round((current + amount) * 100) / 100 })
    .eq("id", supplierId);
}

export async function applySupplierPayment(
  db: Db,
  supplierId: string,
  amount: number
): Promise<void> {
  const { data } = await db.from("suppliers").select("outstanding_balance").eq("id", supplierId).single();
  const current = Number(data?.outstanding_balance ?? 0);
  const next = Math.max(0, Math.round((current - amount) * 100) / 100);
  await db.from("suppliers").update({ outstanding_balance: next }).eq("id", supplierId);
}
