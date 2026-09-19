import { RESTAURANT_NAME } from "./brand";
import { formatBillNumber, formatMoney } from "./seed";
import type { Bill } from "./types";
import type { DaySales } from "./sales";
import { billChargeLines } from "./charges-display";

function digits(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}

export function whatsappHref(text: string, phone = "") {
  const q = encodeURIComponent(text);
  const n = digits(phone);
  return n ? `https://wa.me/${n}?text=${q}` : `https://wa.me/?text=${q}`;
}

export function billWhatsAppText(bill: Bill) {
  const lines = bill.lines
    .map((l) => `${l.quantity} × ${l.name} — ${formatMoney(l.lineTotal)}`)
    .join("\n");
  const pay = bill.paymentMode === "upi" ? "UPI" : "Cash";
  return `${RESTAURANT_NAME}
${formatBillNumber(bill.billNumber)} · ${bill.tableLabel}
${pay}

${lines}

${billChargeLines(bill).map((row) => `${row.label} ${formatMoney(row.amount)}`).join("\n")}
Total ${formatMoney(bill.total)}

Thank you. Visit again.`;
}

export function daySalesWhatsAppText(sales: DaySales) {
  return `${RESTAURANT_NAME} — today
Bills: ${sales.count}
Cash: ${formatMoney(sales.cashTotal)}
UPI: ${formatMoney(sales.upiTotal)}
Total sales: ${formatMoney(sales.total)}`;
}
