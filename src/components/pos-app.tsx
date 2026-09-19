"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatBillNumber, formatMoney } from "@/lib/seed";
import type { Bill, Category, MenuItem, TicketLine } from "@/lib/types";

type MenuResponse = {
  categories: Category[];
  menuItems: MenuItem[];
  taxRate: number;
  nextBillNumber: number;
  backend: string;
};

export function PosApp({ initialMenu }: { initialMenu: MenuResponse }) {
  const [menu, setMenu] = useState<MenuResponse | null>(initialMenu);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState("all");
  const [ticket, setTicket] = useState<TicketLine[]>([]);
  const [tableLabel, setTableLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [billsOpen, setBillsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [billsError, setBillsError] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    id: "",
    name: "",
    categoryId: initialMenu.categories[0]?.id ?? "",
    price: "",
    available: true,
  });

  async function loadMenu() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load menu");
      setMenu(data);
      if (!itemForm.categoryId && data.categories[0]) {
        setItemForm((prev) => ({ ...prev, categoryId: data.categories[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load menu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleItems = useMemo(() => {
    if (!menu) return [];
    return menu.menuItems.filter(
      (item) => categoryId === "all" || item.categoryId === categoryId,
    );
  }, [menu, categoryId]);

  const taxRate = menu?.taxRate ?? 0.1;
  const subtotal = ticket.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  function addItem(item: MenuItem) {
    if (!item.available) return;
    setTicket((current) => {
      const existing = current.find((line) => line.menuItemId === item.id);
      if (existing) {
        return current.map((line) =>
          line.menuItemId === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...current,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
        },
      ];
    });
  }

  function changeQty(id: string, delta: number) {
    setTicket((current) =>
      current
        .map((line) =>
          line.menuItemId === id
            ? { ...line, quantity: line.quantity + delta }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function generateBill() {
    if (!ticket.length) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableLabel,
          lines: ticket.map((line) => ({
            menuItemId: line.menuItemId,
            quantity: line.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate bill");
      setLastBill(data);
      setTicket([]);
      setTableLabel("");
      await loadMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate bill");
    } finally {
      setSubmitting(false);
    }
  }

  async function openBills() {
    setBillsOpen(true);
    setBillsError(null);
    try {
      const res = await fetch("/api/bills");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load bills");
      setBills(data.bills);
    } catch (err) {
      setBillsError(err instanceof Error ? err.message : "Could not load bills");
    }
  }

  async function saveMenuItem() {
    if (!itemForm.name || !itemForm.categoryId || !itemForm.price) return;
    const res = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: itemForm.id || undefined,
        name: itemForm.name,
        categoryId: itemForm.categoryId,
        price: Number(itemForm.price),
        available: itemForm.available,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save item");
      return;
    }
    setItemForm({
      id: "",
      name: "",
      categoryId: menu?.categories[0]?.id ?? "",
      price: "",
      available: true,
    });
    await loadMenu();
  }

  function printBill(bill: Bill) {
    const win = window.open("", "print");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${formatBillNumber(bill.billNumber)}</title>
          <style>
            body { font-family: ui-monospace, monospace; padding: 24px; }
            h1 { font-size: 18px; margin: 0 0 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td { padding: 4px 0; }
            .right { text-align: right; }
            hr { border: none; border-top: 1px dashed #333; }
          </style>
        </head>
        <body>
          <h1>Spice Counter</h1>
          <div>${formatBillNumber(bill.billNumber)}</div>
          <div>${bill.tableLabel}</div>
          <div>${new Date(bill.createdAt).toLocaleString()}</div>
          <hr />
          <table>
            ${bill.lines
              .map(
                (line) =>
                  `<tr><td>${line.quantity} × ${line.name}</td><td class="right">${formatMoney(line.lineTotal)}</td></tr>`,
              )
              .join("")}
          </table>
          <hr />
          <table>
            <tr><td>Subtotal</td><td class="right">${formatMoney(bill.subtotal)}</td></tr>
            <tr><td>Tax ${(bill.taxRate * 100).toFixed(0)}%</td><td class="right">${formatMoney(bill.taxAmount)}</td></tr>
            <tr><td><strong>Total</strong></td><td class="right"><strong>${formatMoney(bill.total)}</strong></td></tr>
          </table>
          <p>Thank you. Please come again.</p>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Spice Counter
          </h1>
          <p className="text-sm text-muted-foreground">
            Restaurant POS · next bill {formatBillNumber(menu?.nextBillNumber ?? 1)} ·{" "}
            {menu?.backend === "sqlserver" ? "SQL Server" : "Local file (SQL Server not configured)"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMenuOpen(true)}>
            Menu items
          </Button>
          <Button variant="outline" onClick={() => void openBills()}>
            Today&apos;s bills
          </Button>
        </div>
      </header>

      {error ? (
        <div className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
        <section className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            <Button
              size="sm"
              variant={categoryId === "all" ? "default" : "outline"}
              onClick={() => setCategoryId("all")}
            >
              All
            </Button>
            {menu?.categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={categoryId === cat.id ? "default" : "outline"}
                onClick={() => setCategoryId(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
          <ScrollArea className="h-[calc(100vh-11rem)] px-4 pb-4">
            {loading ? (
              <p className="py-12 text-center text-muted-foreground">Loading menu…</p>
            ) : visibleItems.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No items in this category. Add some from Menu items.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {visibleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!item.available}
                    onClick={() => addItem(item)}
                    className="rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="font-medium leading-snug">{item.name}</span>
                      {!item.available ? <Badge variant="secondary">Off</Badge> : null}
                    </div>
                    <span className="text-lg font-semibold">{formatMoney(item.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </section>

        <aside className="flex flex-col p-4">
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium" htmlFor="table">
              Table / guest
            </label>
            <Input
              id="table"
              placeholder="Table 4 or Walk-in"
              value={tableLabel}
              onChange={(e) => setTableLabel(e.target.value)}
            />
          </div>
          <h2 className="mb-2 font-heading text-lg font-semibold">Current ticket</h2>
          <ScrollArea className="min-h-40 flex-1 rounded-lg border">
            {ticket.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Tap a menu item to start a bill.
              </p>
            ) : (
              <ul className="divide-y">
                {ticket.map((line) => (
                  <li key={line.menuItemId} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{line.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(line.unitPrice)} each
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => changeQty(line.menuItemId, -1)}>
                        −
                      </Button>
                      <span className="w-6 text-center text-sm">{line.quantity}</span>
                      <Button size="sm" variant="outline" onClick={() => changeQty(line.menuItemId, 1)}>
                        +
                      </Button>
                    </div>
                    <div className="w-16 text-right text-sm font-medium">
                      {formatMoney(line.unitPrice * line.quantity)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
          <Separator className="my-3" />
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Tax {(taxRate * 100).toFixed(0)}%</dt>
              <dd>{formatMoney(taxAmount)}</dd>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <dt>Total</dt>
              <dd>{formatMoney(total)}</dd>
            </div>
          </dl>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" className="flex-1" disabled={!ticket.length} onClick={() => setTicket([])}>
              Clear
            </Button>
            <Button className="flex-1" disabled={!ticket.length || submitting} onClick={() => void generateBill()}>
              {submitting ? "Saving…" : "Generate bill"}
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={Boolean(lastBill)} onOpenChange={(open) => !open && setLastBill(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lastBill ? formatBillNumber(lastBill.billNumber) : "Bill"}
            </DialogTitle>
          </DialogHeader>
          {lastBill ? (
            <div className="space-y-2 text-sm">
              <p>
                {lastBill.tableLabel} · {new Date(lastBill.createdAt).toLocaleString()}
              </p>
              {lastBill.lines.map((line) => (
                <div key={line.menuItemId} className="flex justify-between">
                  <span>
                    {line.quantity} × {line.name}
                  </span>
                  <span>{formatMoney(line.lineTotal)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatMoney(lastBill.total)}</span>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLastBill(null)}>
              Close
            </Button>
            {lastBill ? (
              <Button onClick={() => printBill(lastBill)}>Print receipt</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={billsOpen} onOpenChange={setBillsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bills</DialogTitle>
          </DialogHeader>
          {billsError ? <p className="text-sm text-destructive">{billsError}</p> : null}
          {bills.length === 0 && !billsError ? (
            <p className="text-sm text-muted-foreground">No bills yet. Generate one from the counter.</p>
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
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => printBill(bill)}>
                    Print
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Menu items</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Input
              placeholder="Item name"
              value={itemForm.name}
              onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={itemForm.categoryId}
                onValueChange={(value) => {
                  if (value) setItemForm((f) => ({ ...f, categoryId: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {menu?.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                value={itemForm.price}
                onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <Button onClick={() => void saveMenuItem()}>
              {itemForm.id ? "Update item" : "Add item"}
            </Button>
          </div>
          <ul className="space-y-2">
            {menu?.menuItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground">{formatMoney(item.price)}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setItemForm({
                      id: item.id,
                      name: item.name,
                      categoryId: item.categoryId,
                      price: String(item.price),
                      available: item.available,
                    })
                  }
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
