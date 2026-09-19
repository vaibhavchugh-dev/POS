import type { Bill, PaymentMode } from "./types";
import { isSameIstDay } from "./time";

export type DaySales = {
  count: number;
  total: number;
  cashTotal: number;
  cashCount: number;
  upiTotal: number;
  upiCount: number;
  bills: Bill[];
};

export function paymentLabel(mode: PaymentMode | undefined) {
  return mode === "upi" ? "UPI" : "Cash";
}

export function todaySales(bills: Bill[]): DaySales {
  const today = bills.filter((b) => isSameIstDay(b.createdAt));
  const cash = today.filter((b) => (b.paymentMode ?? "cash") === "cash");
  const upi = today.filter((b) => b.paymentMode === "upi");
  const sum = (list: Bill[]) => list.reduce((n, b) => n + b.total, 0);
  return {
    count: today.length,
    total: sum(today),
    cashTotal: sum(cash),
    cashCount: cash.length,
    upiTotal: sum(upi),
    upiCount: upi.length,
    bills: today.sort((a, b) => b.billNumber - a.billNumber),
  };
}
