import { formatMoney } from "./seed";
import type { Bill } from "./types";

export function billChargeLines(bill: Bill) {
  const rows: { label: string; amount: number }[] = [
    { label: "Subtotal", amount: bill.subtotal },
  ];
  if ((bill.discountAmount ?? 0) > 0) {
    const pct = bill.discountPercent ? ` (${Math.round(bill.discountPercent * 100)}%)` : "";
    rows.push({ label: `Discount${pct}`, amount: -bill.discountAmount });
  }
  if ((bill.serviceChargeAmount ?? 0) > 0) {
    rows.push({
      label: `Service charge (${Math.round((bill.serviceChargeRate ?? 0) * 100)}%)`,
      amount: bill.serviceChargeAmount,
    });
  }
  if ((bill.taxAmount ?? 0) > 0) {
    rows.push({
      label: `GST (${Math.round((bill.taxRate ?? 0) * 100)}%)`,
      amount: bill.taxAmount,
    });
  }
  return rows;
}

export function formatChargeLine(label: string, amount: number) {
  return `${label} ${formatMoney(amount)}`;
}
