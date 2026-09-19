export type ChargeInput = {
  subtotal: number;
  discountKind?: "none" | "percent" | "amount";
  discountValue?: number;
  applyGst?: boolean;
  gstRate?: number;
  applyService?: boolean;
  serviceRate?: number;
};

export type ChargeResult = {
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  afterDiscount: number;
  serviceChargeRate: number;
  serviceChargeAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
};

function money(n: number) {
  return Number(n.toFixed(2));
}

export function tallyCharges(input: ChargeInput): ChargeResult {
  const subtotal = money(Math.max(0, input.subtotal));
  const kind = input.discountKind ?? "none";
  const raw = Math.max(0, Number(input.discountValue ?? 0));
  let discountPercent = 0;
  let discountAmount = 0;
  if (kind === "percent" && raw > 0) {
    discountPercent = Math.min(100, raw) / 100;
    discountAmount = money(subtotal * discountPercent);
  } else if (kind === "amount" && raw > 0) {
    discountAmount = money(Math.min(subtotal, raw));
    discountPercent = subtotal > 0 ? money(discountAmount / subtotal) : 0;
  }
  const afterDiscount = money(subtotal - discountAmount);
  const serviceChargeRate = input.applyService ? Math.max(0, Number(input.serviceRate ?? 0.1)) : 0;
  const serviceChargeAmount = money(afterDiscount * serviceChargeRate);
  const taxRate = input.applyGst ? Math.max(0, Number(input.gstRate ?? 0.05)) : 0;
  const taxAmount = money((afterDiscount + serviceChargeAmount) * taxRate);
  const total = money(afterDiscount + serviceChargeAmount + taxAmount);
  return {
    subtotal,
    discountAmount,
    discountPercent,
    afterDiscount,
    serviceChargeRate,
    serviceChargeAmount,
    taxRate,
    taxAmount,
    total,
  };
}

export function chargesFromForm(formData: FormData, subtotal: number, defaultGst: number) {
  const applyDiscount = formData.get("applyDiscount") === "on";
  const applyGst = formData.get("applyGst") === "on";
  const applyService = formData.get("applyService") === "on";
  const kind = String(formData.get("discountKind") ?? "percent") === "amount" ? "amount" : "percent";
  return tallyCharges({
    subtotal,
    discountKind: applyDiscount ? kind : "none",
    discountValue: Number(formData.get("discountValue") ?? 0),
    applyGst,
    gstRate: Number(formData.get("gstPercent") ?? defaultGst * 100) / 100,
    applyService,
    serviceRate: Number(formData.get("servicePercent") ?? 10) / 100,
  });
}
