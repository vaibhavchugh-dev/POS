import {
  addItemAction,
  changeQtyAction,
  clearTicketAction,
  generateBillAction,
  saveMenuItemAction,
  setTableAction,
  type TicketState,
} from "@/app/actions";
import { RESTAURANT_NAME } from "@/lib/brand";
import { paymentLabel } from "@/lib/sales";
import { formatBillNumber, formatMoney } from "@/lib/seed";
import { billWhatsAppText, whatsappHref } from "@/lib/whatsapp";
import type { Bill, Category, MenuItem } from "@/lib/types";
import type { ReactNode } from "react";

type MenuData = {
  categories: Category[];
  menuItems: MenuItem[];
  taxRate: number;
  nextBillNumber: number;
  backend: string;
};

const chip =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-full border px-3.5 text-sm font-semibold tracking-wide";
const chipOn = `${chip} border-transparent bg-primary text-primary-foreground shadow-sm`;
const chipOff = `${chip} border-[#e2d3b8] bg-[#fffaf2] text-[#5c4024] hover:bg-[#f3e4c8]`;
const qtyBtn =
  "inline-flex size-8 items-center justify-center rounded-full border border-[#e2d3b8] bg-[#fffaf2] text-base font-semibold text-[#5c4024]";

export function PosCounter({
  menu,
  ticket,
  categoryId,
  dialog,
  bills,
  receipt,
}: {
  menu: MenuData;
  ticket: TicketState;
  categoryId: string;
  dialog: string | null;
  bills: Bill[];
  receipt: Bill | null;
}) {
  const visibleItems = menu.menuItems.filter(
    (item) => categoryId === "all" || item.categoryId === categoryId,
  );
  const subtotal = ticket.lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const taxAmount = subtotal * menu.taxRate;
  const total = subtotal + taxAmount;
  const gstPct = Math.round(menu.taxRate * 100);

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(1200px_600px_at_10%_-10%,#fbe7c6_0%,transparent_55%),linear-gradient(180deg,#f7efdf_0%,#f3e6cf_100%)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4d2b0] bg-[#3f2414] px-5 py-4 text-[#f8ead3]">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#e8b86a] uppercase">
            Counter billing
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {RESTAURANT_NAME}
          </h1>
          <p className="mt-1 text-sm text-[#e8d7bc]">
            Next {formatBillNumber(menu.nextBillNumber)} · Prices in ₹ ·{" "}
            {menu.backend === "sqlserver" ? "SQL Server" : "Saved on this PC"}
          </p>
        </div>
        <div className="flex gap-2">
          <a className="inline-flex h-9 items-center rounded-full border border-[#c9a36a] px-3.5 text-sm font-medium text-[#f8ead3] hover:bg-white/10" href="/?dialog=menu">
            Menu
          </a>
          <a className="inline-flex h-9 items-center rounded-full border border-[#c9a36a] px-3.5 text-sm font-medium text-[#f8ead3] hover:bg-white/10" href="/dashboard">
            Today&apos;s sales
          </a>
          <a className="inline-flex h-9 items-center rounded-full bg-[#e8b86a] px-3.5 text-sm font-semibold text-[#3f2414]" href="/?dialog=bills">
            Bills
          </a>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_400px]">
        <section className="flex min-h-0 flex-col">
          <nav className="flex gap-2 overflow-x-auto px-5 py-4">
            <a className={categoryId === "all" ? chipOn : chipOff} href="/">
              All
            </a>
            {menu.categories.map((cat) => (
              <a
                key={cat.id}
                href={`/?category=${cat.id}`}
                className={categoryId === cat.id ? chipOn : chipOff}
              >
                {cat.name}
              </a>
            ))}
          </nav>
          <div className="h-[calc(100vh-12rem)] overflow-y-auto px-5 pb-5">
            {visibleItems.length === 0 ? (
              <p className="py-12 text-center text-[#7a5a3a]">
                No items in this category. Add some from Menu.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {visibleItems.map((item) => (
                  <form key={item.id} action={addItemAction}>
                    <input type="hidden" name="menuItemId" value={item.id} />
                    <input type="hidden" name="name" value={item.name} />
                    <input type="hidden" name="unitPrice" value={item.price} />
                    <button
                      type="submit"
                      disabled={!item.available}
                      className="w-full rounded-2xl border border-[#ead9b8] bg-[#fffaf2] p-4 text-left shadow-[0_8px_20px_-12px_rgba(92,64,36,0.35)] transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="mb-3 min-h-10 font-medium leading-snug text-[#3f2414]">
                        {item.name}
                      </div>
                      <span className="text-lg font-semibold text-primary">
                        {formatMoney(item.price)}
                      </span>
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="m-4 flex flex-col rounded-2xl border border-[#e4d2b0] bg-[#fffaf2] p-4 shadow-[0_16px_40px_-24px_rgba(63,36,20,0.45)] lg:m-4 lg:ml-0">
          <form action={setTableAction} className="mb-4">
            <label className="mb-1 block text-xs font-semibold tracking-wide text-[#7a5a3a] uppercase" htmlFor="table">
              Table / guest
            </label>
            <div className="flex gap-2">
              <input
                id="table"
                name="tableLabel"
                defaultValue={ticket.tableLabel}
                placeholder="Table 4 or Walk-in"
                className="h-10 w-full rounded-xl border border-[#e2d3b8] bg-white px-3 text-sm"
              />
              <button type="submit" className={chipOff}>
                Save
              </button>
            </div>
          </form>
          <h2 className="mb-2 font-heading text-lg font-semibold text-[#3f2414]">KOT / ticket</h2>
          <div className="min-h-40 flex-1 overflow-y-auto rounded-xl border border-[#ead9b8] bg-[#fffdf8]">
            {ticket.lines.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#7a5a3a]">
                Tap a dosa or drink to start a bill.
              </p>
            ) : (
              <ul className="divide-y divide-[#ead9b8]">
                {ticket.lines.map((line) => (
                  <li key={line.menuItemId} className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[#3f2414]">{line.name}</div>
                      <div className="text-xs text-[#7a5a3a]">
                        {formatMoney(line.unitPrice)} each
                      </div>
                    </div>
                    <form action={changeQtyAction}>
                      <input type="hidden" name="menuItemId" value={line.menuItemId} />
                      <input type="hidden" name="delta" value="-1" />
                      <button type="submit" className={qtyBtn}>
                        −
                      </button>
                    </form>
                    <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                    <form action={changeQtyAction}>
                      <input type="hidden" name="menuItemId" value={line.menuItemId} />
                      <input type="hidden" name="delta" value="1" />
                      <button type="submit" className={qtyBtn}>
                        +
                      </button>
                    </form>
                    <div className="w-24 text-right text-sm font-semibold text-[#3f2414]">
                      {formatMoney(line.unitPrice * line.quantity)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-[#5c4024]">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#7a5a3a]">
              <span>GST {gstPct}%</span>
              <span>{formatMoney(taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-[#ead9b8] pt-2 text-xl font-semibold text-[#3f2414]">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <form action={clearTicketAction}>
              <button
                className={`${chipOff} h-10 w-full rounded-xl`}
                type="submit"
                disabled={!ticket.lines.length}
              >
                Clear ticket
              </button>
            </form>
            <form action={generateBillAction} className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="flex items-center gap-2 rounded-xl border border-[#ead9b8] bg-white px-3 py-2">
                  <input type="radio" name="paymentMode" value="cash" defaultChecked />
                  Cash
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-[#ead9b8] bg-white px-3 py-2">
                  <input type="radio" name="paymentMode" value="upi" />
                  UPI
                </label>
              </div>
              <input
                name="guestPhone"
                inputMode="numeric"
                placeholder="WhatsApp mobile (optional)"
                className="h-10 w-full rounded-xl border border-[#e2d3b8] bg-white px-3 text-sm"
              />
              <button
                className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
                type="submit"
                disabled={!ticket.lines.length}
              >
                Generate bill
              </button>
            </form>
          </div>
        </aside>
      </div>

      {dialog === "receipt" && receipt ? (
        <Overlay title={formatBillNumber(receipt.billNumber)}>
          <p className="text-sm text-[#7a5a3a]">
            {receipt.tableLabel} · {paymentLabel(receipt.paymentMode)} ·{" "}
            {new Date(receipt.createdAt).toLocaleString("en-IN")}
          </p>
          {receipt.lines.map((line) => (
            <div key={line.menuItemId} className="flex justify-between text-sm">
              <span>
                {line.quantity} × {line.name}
              </span>
              <span>{formatMoney(line.lineTotal)}</span>
            </div>
          ))}
          <hr className="border-[#ead9b8]" />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatMoney(receipt.total)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" href={`/receipt/${receipt.id}`} target="_blank" rel="noreferrer">
              Print receipt
            </a>
            <a
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#128C7E] px-4 text-sm font-semibold text-white"
              href={whatsappHref(billWhatsAppText(receipt), receipt.guestPhone)}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp bill
            </a>
          </div>
        </Overlay>
      ) : null}

      {dialog === "bills" ? (
        <Overlay title="Today's bills">
          {bills.length === 0 ? (
            <p className="text-sm text-[#7a5a3a]">No bills yet. Generate one from the counter.</p>
          ) : (
            <ul className="space-y-3">
              {bills.map((bill) => (
                <li key={bill.id} className="rounded-xl border border-[#ead9b8] bg-[#fffdf8] p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold">{formatBillNumber(bill.billNumber)}</span>
                    <span className="font-semibold text-primary">{formatMoney(bill.total)}</span>
                  </div>
                  <p className="text-[#7a5a3a]">
                    {bill.tableLabel} · {paymentLabel(bill.paymentMode)} ·{" "}
                    {new Date(bill.createdAt).toLocaleString("en-IN")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a className={chipOff} href={`/receipt/${bill.id}`} target="_blank" rel="noreferrer">
                      Print
                    </a>
                    <a
                      className={`${chipOff} border-[#128C7E] text-[#128C7E]`}
                      href={whatsappHref(billWhatsAppText(bill), bill.guestPhone)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Overlay>
      ) : null}

      {dialog === "menu" ? (
        <Overlay title="Menu items">
          <form action={saveMenuItemAction} className="grid gap-2">
            <input
              name="name"
              required
              placeholder="Item name"
              className="h-10 rounded-xl border border-[#e2d3b8] px-3 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                name="categoryId"
                className="h-10 rounded-xl border border-[#e2d3b8] bg-white px-2 text-sm"
                defaultValue={menu.categories[0]?.id}
              >
                {menu.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                name="price"
                type="number"
                min="0"
                step="1"
                placeholder="Price ₹"
                required
                className="h-10 rounded-xl border border-[#e2d3b8] px-3 text-sm"
              />
            </div>
            <button type="submit" className="h-10 rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
              Add item
            </button>
          </form>
          <ul className="space-y-2">
            {menu.menuItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-[#ead9b8] bg-[#fffdf8] px-3 py-2 text-sm">
                <div className="font-medium">{item.name}</div>
                <div className="text-primary">{formatMoney(item.price)}</div>
              </li>
            ))}
          </ul>
        </Overlay>
      ) : null}
    </div>
  );
}

function Overlay({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#3f2414]/45 p-4 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#ead9b8] bg-[#fffaf2] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold text-[#3f2414]">{title}</h2>
          <a href="/" className="text-sm font-medium text-primary underline">
            Close
          </a>
        </div>
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
}
