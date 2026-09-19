# Spice Counter POS

Restaurant counter POS: tap menu items onto a ticket, then generate a numbered bill.

## Run locally

```bash
npm install
npm run dev -- --port 43123
```

Open [http://localhost:43123](http://localhost:43123).

Without SQL Server, the app stores menu and bills in `data/pos-store.json` so you can try it immediately.

## SQL Server

Create a database (for example `RestaurantPos`) and set:

```
SQL_SERVER_HOST=localhost
SQL_SERVER_PORT=1433
SQL_SERVER_DATABASE=RestaurantPos
SQL_SERVER_USER=sa
SQL_SERVER_PASSWORD=your-password
SQL_SERVER_ENCRYPT=true
SQL_SERVER_TRUST_CERT=true
TAX_RATE=0.1
```

You can also set `SQL_SERVER_CONNECTION_STRING` instead of the host/user fields.

On first connect the app creates `Categories`, `MenuItems`, `Bills`, `BillLines`, and `Counters`, then seeds a sample Indian restaurant menu.

`schema/sql-server.sql` is the same schema for manual setup if you prefer.

## What it does

- Menu by category with add/edit
- Ticket with quantities, 10% tax, table/guest label
- Sequential bill numbers (`BILL-0001`, …) stored in SQL Server or the local file
- Printable receipt after a bill is generated
- Bill history

This is a full-screen web POS (React + TypeScript). Run it in a browser on a counter PC, or wrap it later with Electron if you need a native window.
