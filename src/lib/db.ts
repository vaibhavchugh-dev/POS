import fs from "node:fs/promises";
import path from "node:path";
import sql from "mssql";
import { seedStore } from "./seed";
import type { Bill, BillLine, Category, MenuItem, PaymentMode, PosStore } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "pos-store.json");

function sqlConfigured() {
  return Boolean(
    process.env.SQL_SERVER_CONNECTION_STRING ||
      process.env.SQL_SERVER_HOST,
  );
}

async function getPool() {
  const connectionString = process.env.SQL_SERVER_CONNECTION_STRING;
  if (connectionString) {
    return sql.connect(connectionString);
  }
  return sql.connect({
    server: process.env.SQL_SERVER_HOST ?? "localhost",
    port: Number(process.env.SQL_SERVER_PORT ?? 1433),
    database: process.env.SQL_SERVER_DATABASE ?? "RestaurantPos",
    user: process.env.SQL_SERVER_USER ?? "sa",
    password: process.env.SQL_SERVER_PASSWORD ?? "",
    options: {
      encrypt: process.env.SQL_SERVER_ENCRYPT !== "false",
      trustServerCertificate:
        process.env.SQL_SERVER_TRUST_CERT !== "false",
    },
  });
}

async function ensureSqlSchema(pool: sql.ConnectionPool) {
  await pool.request().query(`
    IF OBJECT_ID('dbo.Categories', 'U') IS NULL
      CREATE TABLE dbo.Categories (
        Id NVARCHAR(64) NOT NULL PRIMARY KEY,
        Name NVARCHAR(120) NOT NULL,
        SortOrder INT NOT NULL
      );

    IF OBJECT_ID('dbo.MenuItems', 'U') IS NULL
      CREATE TABLE dbo.MenuItems (
        Id NVARCHAR(64) NOT NULL PRIMARY KEY,
        Name NVARCHAR(160) NOT NULL,
        CategoryId NVARCHAR(64) NOT NULL,
        Price DECIMAL(10,2) NOT NULL,
        Available BIT NOT NULL DEFAULT 1,
        FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id)
      );

    IF OBJECT_ID('dbo.Bills', 'U') IS NULL
      CREATE TABLE dbo.Bills (
        Id NVARCHAR(64) NOT NULL PRIMARY KEY,
        BillNumber INT NOT NULL UNIQUE,
        TableLabel NVARCHAR(80) NOT NULL,
        CreatedAt DATETIME2 NOT NULL,
        Subtotal DECIMAL(10,2) NOT NULL,
        TaxRate DECIMAL(6,4) NOT NULL,
        TaxAmount DECIMAL(10,2) NOT NULL,
        Total DECIMAL(10,2) NOT NULL,
        PaymentMode NVARCHAR(12) NOT NULL DEFAULT 'cash',
        GuestPhone NVARCHAR(20) NOT NULL DEFAULT ''
      );

    IF OBJECT_ID('dbo.BillLines', 'U') IS NULL
      CREATE TABLE dbo.BillLines (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        BillId NVARCHAR(64) NOT NULL,
        MenuItemId NVARCHAR(64) NOT NULL,
        Name NVARCHAR(160) NOT NULL,
        UnitPrice DECIMAL(10,2) NOT NULL,
        Quantity INT NOT NULL,
        LineTotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (BillId) REFERENCES dbo.Bills(Id)
      );

    IF OBJECT_ID('dbo.Counters', 'U') IS NULL
      CREATE TABLE dbo.Counters (
        Name NVARCHAR(40) NOT NULL PRIMARY KEY,
        NextValue INT NOT NULL
      );

    IF NOT EXISTS (SELECT 1 FROM dbo.Counters WHERE Name = 'BillNumber')
      INSERT INTO dbo.Counters (Name, NextValue) VALUES ('BillNumber', 1);

    IF COL_LENGTH('dbo.Bills', 'PaymentMode') IS NULL
      ALTER TABLE dbo.Bills ADD PaymentMode NVARCHAR(12) NOT NULL CONSTRAINT DF_Bills_PaymentMode DEFAULT 'cash';

    IF COL_LENGTH('dbo.Bills', 'GuestPhone') IS NULL
      ALTER TABLE dbo.Bills ADD GuestPhone NVARCHAR(20) NOT NULL CONSTRAINT DF_Bills_GuestPhone DEFAULT '';
  `);

  const count = await pool.request().query("SELECT COUNT(*) AS c FROM dbo.Categories");
  if (Number(count.recordset[0].c) === 0) {
    const seed = seedStore();
    for (const cat of seed.categories) {
      await pool
        .request()
        .input("id", sql.NVarChar, cat.id)
        .input("name", sql.NVarChar, cat.name)
        .input("sort", sql.Int, cat.sortOrder)
        .query(
          "INSERT INTO dbo.Categories (Id, Name, SortOrder) VALUES (@id, @name, @sort)",
        );
    }
    for (const item of seed.menuItems) {
      await pool
        .request()
        .input("id", sql.NVarChar, item.id)
        .input("name", sql.NVarChar, item.name)
        .input("cat", sql.NVarChar, item.categoryId)
        .input("price", sql.Decimal(10, 2), item.price)
        .input("avail", sql.Bit, item.available)
        .query(
          "INSERT INTO dbo.MenuItems (Id, Name, CategoryId, Price, Available) VALUES (@id, @name, @cat, @price, @avail)",
        );
    }
  }
}

async function readJson(): Promise<PosStore> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(raw) as PosStore;
  } catch {
    const seeded = seedStore();
    await writeJson(seeded);
    return seeded;
  }
}

async function writeJson(store: PosStore) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function listMenu(): Promise<{
  categories: Category[];
  menuItems: MenuItem[];
  taxRate: number;
  nextBillNumber: number;
  backend: string;
}> {
  if (sqlConfigured()) {
    const pool = await getPool();
    await ensureSqlSchema(pool);
    const cats = await pool
      .request()
      .query("SELECT Id, Name, SortOrder FROM dbo.Categories ORDER BY SortOrder");
    const items = await pool
      .request()
      .query("SELECT Id, Name, CategoryId, Price, Available FROM dbo.MenuItems ORDER BY Name");
    const counter = await pool
      .request()
      .query("SELECT NextValue FROM dbo.Counters WHERE Name = 'BillNumber'");
    return {
      categories: cats.recordset.map((r) => ({
        id: r.Id,
        name: r.Name,
        sortOrder: r.SortOrder,
      })),
      menuItems: items.recordset.map((r) => ({
        id: r.Id,
        name: r.Name,
        categoryId: r.CategoryId,
        price: Number(r.Price),
        available: Boolean(r.Available),
      })),
      taxRate: Number(process.env.TAX_RATE ?? 0.05),
      nextBillNumber: Number(counter.recordset[0]?.NextValue ?? 1),
      backend: "sqlserver",
    };
  }

  const store = await readJson();
  return {
    categories: store.categories,
    menuItems: store.menuItems,
    taxRate: store.taxRate,
    nextBillNumber: store.nextBillNumber,
    backend: "local-json",
  };
}

export async function upsertMenuItem(input: {
  id?: string;
  name: string;
  categoryId: string;
  price: number;
  available: boolean;
}): Promise<MenuItem> {
  const id = input.id ?? `mi-${Date.now()}`;
  const item: MenuItem = {
    id,
    name: input.name.trim(),
    categoryId: input.categoryId,
    price: Number(input.price),
    available: input.available,
  };

  if (sqlConfigured()) {
    const pool = await getPool();
    await ensureSqlSchema(pool);
    await pool
      .request()
      .input("id", sql.NVarChar, item.id)
      .input("name", sql.NVarChar, item.name)
      .input("cat", sql.NVarChar, item.categoryId)
      .input("price", sql.Decimal(10, 2), item.price)
      .input("avail", sql.Bit, item.available)
      .query(`
        MERGE dbo.MenuItems AS t
        USING (SELECT @id AS Id) AS s
        ON t.Id = s.Id
        WHEN MATCHED THEN
          UPDATE SET Name = @name, CategoryId = @cat, Price = @price, Available = @avail
        WHEN NOT MATCHED THEN
          INSERT (Id, Name, CategoryId, Price, Available)
          VALUES (@id, @name, @cat, @price, @avail);
      `);
    return item;
  }

  const store = await readJson();
  const idx = store.menuItems.findIndex((m) => m.id === id);
  if (idx >= 0) store.menuItems[idx] = item;
  else store.menuItems.push(item);
  await writeJson(store);
  return item;
}

export async function listBills(): Promise<Bill[]> {
  if (sqlConfigured()) {
    const pool = await getPool();
    await ensureSqlSchema(pool);
    const bills = await pool
      .request()
      .query("SELECT * FROM dbo.Bills ORDER BY BillNumber DESC");
    const lines = await pool.request().query("SELECT * FROM dbo.BillLines");
    const byBill = new Map<string, BillLine[]>();
    for (const row of lines.recordset) {
      const list = byBill.get(row.BillId) ?? [];
      list.push({
        menuItemId: row.MenuItemId,
        name: row.Name,
        unitPrice: Number(row.UnitPrice),
        quantity: Number(row.Quantity),
        lineTotal: Number(row.LineTotal),
      });
      byBill.set(row.BillId, list);
    }
    return bills.recordset.map((r) => ({
      id: r.Id,
      billNumber: Number(r.BillNumber),
      tableLabel: r.TableLabel,
      createdAt: new Date(r.CreatedAt).toISOString(),
      subtotal: Number(r.Subtotal),
      taxRate: Number(r.TaxRate),
      taxAmount: Number(r.TaxAmount),
      total: Number(r.Total),
      paymentMode: (r.PaymentMode === "upi" ? "upi" : "cash") as PaymentMode,
      guestPhone: String(r.GuestPhone ?? ""),
      lines: byBill.get(r.Id) ?? [],
    }));
  }

  const store = await readJson();
  return [...store.bills]
    .map((bill) => ({
      ...bill,
      paymentMode: (bill.paymentMode === "upi" ? "upi" : "cash") as PaymentMode,
      guestPhone: bill.guestPhone ?? "",
    }))
    .sort((a, b) => b.billNumber - a.billNumber);
}

export async function createBill(input: {
  tableLabel: string;
  paymentMode?: PaymentMode;
  guestPhone?: string;
  lines: { menuItemId: string; quantity: number }[];
}): Promise<Bill> {
  if (!input.lines.length) {
    throw new Error("Add at least one item before generating a bill.");
  }

  if (sqlConfigured()) {
    const pool = await getPool();
    await ensureSqlSchema(pool);
    const taxRate = Number(process.env.TAX_RATE ?? 0.05);
    const menu = await pool.request().query("SELECT * FROM dbo.MenuItems");
    const items = new Map(
      menu.recordset.map((r) => [
        r.Id as string,
        { name: r.Name as string, price: Number(r.Price) },
      ]),
    );

    const billLines: BillLine[] = input.lines.map((line) => {
      const item = items.get(line.menuItemId);
      if (!item) throw new Error("Unknown menu item.");
      const quantity = Math.max(1, Math.floor(line.quantity));
      return {
        menuItemId: line.menuItemId,
        name: item.name,
        unitPrice: item.price,
        quantity,
        lineTotal: Number((item.price * quantity).toFixed(2)),
      };
    });

    const subtotal = Number(
      billLines.reduce((sum, l) => sum + l.lineTotal, 0).toFixed(2),
    );
    const taxAmount = Number((subtotal * taxRate).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));
    const paymentMode: PaymentMode = input.paymentMode === "upi" ? "upi" : "cash";
    const guestPhone = String(input.guestPhone ?? "").trim();

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const counter = await new sql.Request(tx).query(
        "SELECT NextValue FROM dbo.Counters WITH (UPDLOCK, HOLDLOCK) WHERE Name = 'BillNumber'",
      );
      const billNumber = Number(counter.recordset[0].NextValue);
      await new sql.Request(tx)
        .input("next", sql.Int, billNumber + 1)
        .query("UPDATE dbo.Counters SET NextValue = @next WHERE Name = 'BillNumber'");

      const id = `bill-${billNumber}`;
      const createdAt = new Date();
      await new sql.Request(tx)
        .input("id", sql.NVarChar, id)
        .input("num", sql.Int, billNumber)
        .input("table", sql.NVarChar, input.tableLabel.trim() || "Walk-in")
        .input("created", sql.DateTime2, createdAt)
        .input("sub", sql.Decimal(10, 2), subtotal)
        .input("taxRate", sql.Decimal(6, 4), taxRate)
        .input("taxAmt", sql.Decimal(10, 2), taxAmount)
        .input("total", sql.Decimal(10, 2), total)
        .input("pay", sql.NVarChar, paymentMode)
        .input("phone", sql.NVarChar, guestPhone)
        .query(`
          INSERT INTO dbo.Bills (Id, BillNumber, TableLabel, CreatedAt, Subtotal, TaxRate, TaxAmount, Total, PaymentMode, GuestPhone)
          VALUES (@id, @num, @table, @created, @sub, @taxRate, @taxAmt, @total, @pay, @phone)
        `);

      for (const line of billLines) {
        await new sql.Request(tx)
          .input("billId", sql.NVarChar, id)
          .input("menuId", sql.NVarChar, line.menuItemId)
          .input("name", sql.NVarChar, line.name)
          .input("price", sql.Decimal(10, 2), line.unitPrice)
          .input("qty", sql.Int, line.quantity)
          .input("lt", sql.Decimal(10, 2), line.lineTotal)
          .query(`
            INSERT INTO dbo.BillLines (BillId, MenuItemId, Name, UnitPrice, Quantity, LineTotal)
            VALUES (@billId, @menuId, @name, @price, @qty, @lt)
          `);
      }

      await tx.commit();
      return {
        id,
        billNumber,
        tableLabel: input.tableLabel.trim() || "Walk-in",
        createdAt: createdAt.toISOString(),
        subtotal,
        taxRate,
        taxAmount,
        total,
        paymentMode,
        guestPhone,
        lines: billLines,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  const store = await readJson();
  const items = new Map(store.menuItems.map((m) => [m.id, m]));
  const billLines: BillLine[] = input.lines.map((line) => {
    const item = items.get(line.menuItemId);
    if (!item) throw new Error("Unknown menu item.");
    const quantity = Math.max(1, Math.floor(line.quantity));
    return {
      menuItemId: line.menuItemId,
      name: item.name,
      unitPrice: item.price,
      quantity,
      lineTotal: Number((item.price * quantity).toFixed(2)),
    };
  });
  const subtotal = Number(
    billLines.reduce((sum, l) => sum + l.lineTotal, 0).toFixed(2),
  );
  const taxAmount = Number((subtotal * store.taxRate).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));
  const paymentMode: PaymentMode = input.paymentMode === "upi" ? "upi" : "cash";
  const guestPhone = String(input.guestPhone ?? "").trim();
  const bill: Bill = {
    id: `bill-${store.nextBillNumber}`,
    billNumber: store.nextBillNumber,
    tableLabel: input.tableLabel.trim() || "Walk-in",
    createdAt: new Date().toISOString(),
    subtotal,
    taxRate: store.taxRate,
    taxAmount,
    total,
    paymentMode,
    guestPhone,
    lines: billLines,
  };
  store.bills.push(bill);
  store.nextBillNumber += 1;
  await writeJson(store);
  return bill;
}
