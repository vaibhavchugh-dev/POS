import {
  addItemAction,
  changeQtyAction,
  clearTicketAction,
  generateBillAction,
  saveMenuItemAction,
  setTableAction,
  type TicketState,
} from "@/app/actions";
import { formatBillNumber, formatMoney } from "@/lib/seed";
import type { Bill, Category, MenuItem } from "@/lib/types";
import type { ReactNode } from "react";

type MenuData = {
  categories: Category[];
  menuItems: MenuItem[];
  taxRate: number;
  nextBillNumber: number;
  backend: string;
};

const btn =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border px-2.5 text-sm font-medium";
const btnPrimary = `${btn} border-transparent bg-primary text-primary-foreground`;
const btnOutline = `${btn} border-border bg-background`;

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Spice Counter
          </h1>
          <p className="text-sm text-muted-foreground">
            Restaurant POS · next bill {formatBillNumber(menu.nextBillNumber)} ·{" "}
            {menu.backend === "sqlserver"
              ? "SQL Server"
              : "Local file (SQL Server not configured)"}
          </p>
        </div>
        <div className="flex gap-2">
          <a className={btnOutline} href="/?dialog=menu">
            Menu items
          </a>
          <a className={btnOutline} href="/?dialog=bills">
            Today&apos;s bills
          </a>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
        <section className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
          <nav className="flex gap-2 overflow-x-auto px-4 py-3">
            <a className={categoryId === "all" ? btnPrimary : btnOutline} href="/">
              All
            </a>
            {menu.categories.map((cat) => (
              <a
                key={cat.id}
                href={`/?category=${cat.id}`}
                className={categoryId === cat.id ? btnPrimary : btnOutline}
              >
                {cat.name}
              </a>
            ))}
          </nav>
          <div className="h-[calc(100vh-11rem)] overflow-y-auto px-4 pb-4">
            {visibleItems.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No items in this category. Add some from Menu items.
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
                      className="w-full rounded-xl border bg-card p-4 text-left shadow-sm hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="mb-2 font-medium leading-snug">{item.name}</div>
                      <span className="text-lg font-semibold">{formatMoney(item.price)}</span>
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="flex flex-col p-4">
          <form action={setTableAction} className="mb-3">
            <label className="mb-1 block text-sm font-medium" htmlFor="table">
              Table / guest
            </label>
            <div className="flex gap-2">
              <input
                id="table"
                name="tableLabel"
                defaultValue={ticket.tableLabel}
                placeholder="Table 4 or Walk-in"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              />
              <button type="submit" className={btnOutline}>
                Save
              </button>
            </div>
          </form>
          <h2 className="mb-2 font-heading text-lg font-semibold">Current ticket</h2>
          <div className="min-h-40 flex-1 overflow-y-auto rounded-lg border">
            {ticket.lines.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Tap a menu item to start a bill.
              </p>
            ) : (
              <ul className="divide-y">
                {ticket.lines.map((line) => (
                  <li key={line.menuItemId} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{line.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(line.unitPrice)} each
                      </div>
                    </div>
                    <form action={changeQtyAction}>
                      <input type="hidden" name="menuItemId" value={line.menuItemId} />
                      <input type="hidden" name="delta" value="-1" />
                      <button type="submit" className={btnOutline}>
                        −
                      </button>
                    </form>
                    <span className="w-6 text-center text-sm">{line.quantity}</span>
                    <form action={changeQtyAction}>
                      <input type="hidden" name="menuItemId" value={line.menuItemId} />
                      <input type="hidden" name="delta" value="1" />
                      <button type="submit" className={btnOutline}>
                        +
                      </button>
                    </form>
                    <div className="w-16 text-right text-sm font-medium">
                      {formatMoney(line.unitPrice * line.quantity)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <hr className="my-3 border-border" />
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Tax {(menu.taxRate * 100).toFixed(0)}%</dt>
              <dd>{formatMoney(taxAmount)}</dd>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <dt>Total</dt>
              <dd>{formatMoney(total)}</dd>
            </div>
          </dl>
          <div className="mt-3 flex gap-2">
            <form action={clearTicketAction} className="flex-1">
              <button
                className={`${btnOutline} w-full`}
                type="submit"
                disabled={!ticket.lines.length}
              >
                Clear
              </button>
            </form>
            <form action={generateBillAction} className="flex-1">
              <button
                className={`${btnPrimary} w-full`}
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
          <p className="text-sm">
            {receipt.tableLabel} · {new Date(receipt.createdAt).toLocaleString()}
          </p>
          {receipt.lines.map((line) => (
            <div key={line.menuItemId} className="flex justify-between text-sm">
              <span>
                {line.quantity} × {line.name}
              </span>
              <span>{formatMoney(line.lineTotal)}</span>
            </div>
          ))}
          <hr className="border-border" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(receipt.total)}</span>
          </div>
          <a className={btnPrimary} href={`/receipt/${receipt.id}`} target="_blank" rel="noreferrer">
            Print receipt
          </a>
        </Overlay>
      ) : null}

      {dialog === "bills" ? (
        <Overlay title="Bills">
          {bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bills yet. Generate one from the counter.
            </p>
          ) : (
            <ul className="space-y-3">
              {bills.map((bill) => (
                <li key={bill.id} className="rounded-lg border p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{formatBillNumber(bill.billNumber)}</span>
                    <span>{formatMoney(bill.total)}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {bill.tableLabel} · {new Date(bill.createdAt).toLocaleString()}
                  </p>
                  <a className={`${btnOutline} mt-2`} href={`/receipt/${bill.id}`} target="_blank" rel="noreferrer">
                    Print
                  </a>
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
              className="h-8 rounded-lg border border-input px-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                name="categoryId"
                className="h-8 rounded-lg border bg-background px-2 text-sm"
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
                step="0.01"
                placeholder="Price"
                required
                className="h-8 rounded-lg border border-input px-2.5 text-sm"
              />
            </div>
            <button type="submit" className={btnPrimary}>
              Add item
            </button>
          </form>
          <ul className="space-y-2">
            {menu.menuItems.map((item) => (
              <li key={item.id} className="rounded-md border px-3 py-2 text-sm">
                <div className="font-medium">{item.name}</div>
                <div className="text-muted-foreground">{formatMoney(item.price)}</div>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-background p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <a href="/" className="text-sm text-muted-foreground underline">
            Close
          </a>
        </div>
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
}
