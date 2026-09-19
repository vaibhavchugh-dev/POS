# Spice Counter POS (desktop)

Windows restaurant counter app: tap menu items, build a ticket, generate a numbered bill. React + TypeScript UI in a desktop window (Electron). Data goes to **SQL Server** on the same PC or LAN, or to a local file if SQL Server is not set up yet.

This is **not** a cloud product. Install it on the counter PC and run `Start Spice Counter.bat` (Windows) or `npm run desktop`.

## Run on the restaurant PC

1. Install [Node.js 20+](https://nodejs.org/) (LTS).
2. Copy this folder onto the PC.
3. Double-click **Start Spice Counter.bat**  
   or in a terminal:

```bash
npm install
npm run desktop
```

A desktop window titled **Spice Counter POS** opens. The server only listens on `127.0.0.1` (this machine). Staff do not use a browser or a cloud URL.

First run can take a minute while packages install. Later launches are faster. Optional: `npm run build` once, then `npm run desktop` uses the production server.

## SQL Server (recommended)

On the same PC or a shop server, create database `RestaurantPos`. Copy `.env.example` to `.env` and set:

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

Or set `SQL_SERVER_CONNECTION_STRING`. On first connect the app creates tables and seeds a sample menu. You can also run `schema/sql-server.sql` yourself.

With no SQL Server settings, menu and bills are stored in `data/pos-store.json` on disk.

## Counter features

- Menu by category; add items from Menu items
- Ticket quantities, 10% tax, table/guest name
- Sequential bills (`BILL-0001`, …)
- Printable receipt page
- Bill history

## Developer notes

`npm run dev` still starts the UI server only (for coding). `npm run desktop` is what the cashier should use.
