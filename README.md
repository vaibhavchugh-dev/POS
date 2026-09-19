# Jain Dosa House POS (desktop)

Local till for **Jain Dosa House**. Not a cloud app.

## Put it on your computer

1. Install [Node.js 20 LTS](https://nodejs.org/).
2. This project’s GitHub repo: https://github.com/vaibhavchugh-dev/POS
3. On **your** Windows PC:

```bat
git clone https://github.com/vaibhavchugh-dev/POS.git
cd POS
npm install
npm run desktop
```

Or copy the project folder onto the PC and double-click **Start Spice Counter.bat**.

A window **Jain Dosa House POS** opens on that machine. Bills are saved locally (`data\pos-store.json`) until you point `.env` at **local SQL Server**.

See `LOCAL-SETUP.txt` for the short version.

## SQL Server (same PC or shop LAN)

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
