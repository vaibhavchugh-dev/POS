"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBill, upsertMenuItem } from "@/lib/db";
import type { TicketLine } from "@/lib/types";

export type TicketState = {
  tableLabel: string;
  lines: TicketLine[];
};

const COOKIE = "pos-ticket";

export async function readTicket(): Promise<TicketState> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return { tableLabel: "", lines: [] };
  try {
    const parsed = JSON.parse(raw) as TicketState;
    return {
      tableLabel: parsed.tableLabel ?? "",
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
    };
  } catch {
    return { tableLabel: "", lines: [] };
  }
}

async function writeTicket(ticket: TicketState) {
  (await cookies()).set(COOKIE, JSON.stringify(ticket), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function addItemAction(formData: FormData) {
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const name = String(formData.get("name") ?? "");
  const unitPrice = Number(formData.get("unitPrice") ?? 0);
  if (!menuItemId) return;
  const ticket = await readTicket();
  const existing = ticket.lines.find((line) => line.menuItemId === menuItemId);
  if (existing) existing.quantity += 1;
  else ticket.lines.push({ menuItemId, name, unitPrice, quantity: 1 });
  await writeTicket(ticket);
  revalidatePath("/");
}

export async function changeQtyAction(formData: FormData) {
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  const ticket = await readTicket();
  ticket.lines = ticket.lines
    .map((line) =>
      line.menuItemId === menuItemId
        ? { ...line, quantity: line.quantity + delta }
        : line,
    )
    .filter((line) => line.quantity > 0);
  await writeTicket(ticket);
  revalidatePath("/");
}

export async function setTableAction(formData: FormData) {
  const ticket = await readTicket();
  ticket.tableLabel = String(formData.get("tableLabel") ?? "");
  await writeTicket(ticket);
  revalidatePath("/");
}

export async function clearTicketAction() {
  const ticket = await readTicket();
  await writeTicket({ tableLabel: ticket.tableLabel, lines: [] });
  revalidatePath("/");
}

export async function generateBillAction(formData: FormData) {
  const ticket = await readTicket();
  if (!ticket.lines.length) {
    revalidatePath("/");
    return;
  }
  const paymentMode = String(formData.get("paymentMode") ?? "cash") === "upi" ? "upi" : "cash";
  const guestPhone = String(formData.get("guestPhone") ?? "");
  const applyDiscount = formData.get("applyDiscount") === "on";
  const discountKind = String(formData.get("discountKind") ?? "percent") === "amount" ? "amount" : "percent";
  const bill = await createBill({
    tableLabel: ticket.tableLabel,
    paymentMode,
    guestPhone,
    charges: {
      discountKind: applyDiscount ? discountKind : "none",
      discountValue: Number(formData.get("discountValue") ?? 0),
      applyGst: formData.get("applyGst") === "on",
      gstRate: Number(formData.get("gstPercent") ?? 5) / 100,
      applyService: formData.get("applyService") === "on",
      serviceRate: Number(formData.get("servicePercent") ?? 10) / 100,
    },
    lines: ticket.lines.map((line) => ({
      menuItemId: line.menuItemId,
      quantity: line.quantity,
    })),
  });
  await writeTicket({ tableLabel: "", lines: [] });
  redirect(`/?dialog=receipt&bill=${bill.id}`);
}

export async function saveMenuItemAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const id = String(formData.get("id") ?? "") || undefined;
  if (!name || !categoryId || Number.isNaN(price)) {
    redirect("/?dialog=menu");
  }
  await upsertMenuItem({
    id,
    name,
    categoryId,
    price,
    available: true,
  });
  revalidatePath("/");
  redirect("/?dialog=menu");
}
