import { RESTAURANT_NAME } from "@/lib/brand";
import { listBills } from "@/lib/db";
import { formatBillNumber, formatMoney } from "@/lib/seed";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bills = await listBills();
  const bill = bills.find((b) => b.id === id);
  if (!bill) notFound();

  return (
    <main className="mx-auto max-w-sm p-6 font-mono text-sm">
      <h1 className="text-lg font-bold">{RESTAURANT_NAME}</h1>
      <p>{formatBillNumber(bill.billNumber)}</p>
      <p>{bill.tableLabel} · {bill.paymentMode === "upi" ? "UPI" : "Cash"}</p>
      <p>{new Date(bill.createdAt).toLocaleString("en-IN")}</p>
      <hr className="my-3 border-dashed" />
      {bill.lines.map((line) => (
        <div key={line.menuItemId} className="flex justify-between">
          <span>
            {line.quantity} × {line.name}
          </span>
          <span>{formatMoney(line.lineTotal)}</span>
        </div>
      ))}
      <hr className="my-3 border-dashed" />
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatMoney(bill.subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>GST {(bill.taxRate * 100).toFixed(0)}%</span>
        <span>{formatMoney(bill.taxAmount)}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>{formatMoney(bill.total)}</span>
      </div>
      <p className="mt-4">Thank you. Please come again.</p>
      <p className="mt-6 text-xs print:hidden">
        <a className="underline" href="/">
          Back to counter
        </a>
        {" · "}
        Use your browser print dialog for a paper copy.
      </p>
    </main>
  );
}
