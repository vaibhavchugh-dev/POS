import { NextResponse } from "next/server";
import { createBill, listBills } from "@/lib/db";

export async function GET() {
  try {
    const bills = await listBills();
    return NextResponse.json({ bills });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load bills";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bill = await createBill({
      tableLabel: String(body.tableLabel ?? ""),
      paymentMode: body.paymentMode === "upi" ? "upi" : "cash",
      guestPhone: String(body.guestPhone ?? ""),
      lines: Array.isArray(body.lines) ? body.lines : [],
    });
    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate bill";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
