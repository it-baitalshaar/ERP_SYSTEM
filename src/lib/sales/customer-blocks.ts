export const PARTIAL_SALES_DELIVERY_FLAG = "feat_partial_sales_delivery";
export const CUSTOMER_PRODUCT_BLOCKS_FLAG = "feat_customer_product_blocks";

export function buildBlockReminderMessage(input: {
  customerName: string;
  itemName: string;
  qty: number;
  blockedUntil: string;
  companyName?: string;
}): string {
  const until = new Date(input.blockedUntil).toLocaleString("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const lines = [
    input.companyName ?? "Bait Al Shaar",
    `Reminder: product reservation`,
    `Customer: ${input.customerName}`,
    `Item: ${input.itemName}`,
    `Qty held: ${input.qty}`,
    `Valid until: ${until}`,
    "",
    "Please arrange payment or pickup before the hold expires.",
  ];
  return lines.join("\n");
}

export function isBlockActive(blockedUntil: string, status: string): boolean {
  if (status !== "active") return false;
  return new Date(blockedUntil).getTime() > Date.now();
}
