import { RESTAURANT_NAME } from "@/lib/brand";
import { listBills } from "@/lib/db";
import { paymentLabel, todaySales } from "@/lib/sales";
import { formatBillNumber, formatMoney } from "@/lib/seed";
import { formatIst, todayKey } from "@/lib/time";
import { daySalesWhatsAppText, billWhatsAppText, whatsappHref } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const bills = await listBills();
  const sales = todaySales(bills);
  const day = todayKey();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7efdf_0%,#f3e6cf_100%)] px-5 py-6 text-[#3f2414]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 print:mb-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              {RESTAURANT_NAME}
            </p>
            <h1 className="font-heading text-3xl font-semibold">Today&apos;s sales</h1>
            <p className="text-sm text-[#7a5a3a]">{day} · India time</p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <a className="inline-flex h-10 items-center rounded-full border border-[#e2d3b8] bg-[#fffaf2] px-4 text-sm font-semibold" href="/">
              Back to counter
            </a>
            <a
              className="inline-flex h-10 items-center rounded-full bg-[#128C7E] px-4 text-sm font-semibold text-white"
              href={whatsappHref(daySalesWhatsAppText(sales))}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp day total
            </a>
            <button
              id="print-day"
              type="button"
              className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Print
            </button>
          </div>
        </div>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Bills today" value={String(sales.count)} />
          <Stat label="Total sales" value={formatMoney(sales.total)} accent />
          <Stat label={`Cash (${sales.cashCount})`} value={formatMoney(sales.cashTotal)} />
          <Stat label={`UPI (${sales.upiCount})`} value={formatMoney(sales.upiTotal)} />
        </section>

        {sales.bills.length === 0 ? (
          <p className="rounded-2xl border border-[#ead9b8] bg-[#fffaf2] p-8 text-center text-[#7a5a3a]">
            No bills yet today. Generate bills on the counter with Cash or UPI.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#ead9b8] bg-[#fffaf2]">
            <table className="w-full text-sm">
              <thead className="bg-[#3f2414] text-[#f8ead3]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Bill</th>
                  <th className="px-4 py-3 text-left font-medium">Table</th>
                  <th className="px-4 py-3 text-left font-medium">Pay</th>
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium print:hidden">Share</th>
                </tr>
              </thead>
              <tbody>
                {sales.bills.map((bill) => (
                  <tr key={bill.id} className="border-t border-[#ead9b8]">
                    <td className="px-4 py-3 font-semibold">{formatBillNumber(bill.billNumber)}</td>
                    <td className="px-4 py-3">{bill.tableLabel}</td>
                    <td className="px-4 py-3">{paymentLabel(bill.paymentMode)}</td>
                    <td className="px-4 py-3 text-[#7a5a3a]">{formatIst(bill.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMoney(bill.total)}</td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <a className="mr-2 underline" href={`/receipt/${bill.id}`} target="_blank" rel="noreferrer">
                        Print
                      </a>
                      <a
                        className="underline text-[#128C7E]"
                        href={whatsappHref(billWhatsAppText(bill), bill.guestPhone)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.getElementById('print-day')?.addEventListener('click',()=>window.print())`,
        }}
      />
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-[#ead9b8] p-4 ${accent ? "bg-[#3f2414] text-[#f8ead3]" : "bg-[#fffaf2]"}`}>
      <p className={`text-xs font-semibold tracking-wide uppercase ${accent ? "text-[#e8b86a]" : "text-[#7a5a3a]"}`}>
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
    </div>
  );
}
