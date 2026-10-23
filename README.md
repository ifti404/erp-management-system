# Gamma ERP

A web-based small-business ERP built with Java Spring Boot, MySQL, and Next.js.

Gamma ERP is designed as a practical ERP solution for managing products, inventory, suppliers, customers, purchases, sales, and payments in one system.

Manage day-to-day sales, purchasing, stock, partner accounts, payments, and review history from one workspace.

---

## Features

### Dashboard

- Total products
- Total inventory units
- Low-stock products
- Out-of-stock products
- Customer balances due
- Supplier balances due
- Overdue accounts needing follow-up
- Recent sales orders
- Recent purchase orders
- Low-stock product overview
- Recent operational activity

### Product Management

- Create products
- Edit products
- Delete products
- SKU management
- Product pricing
- Reorder levels
- Product categories
- Product suppliers
- Product status management
- Create categories directly while adding a product

### Inventory Management

- Automatic inventory creation for new products
- Stock increase when purchase quantities are received
- Automatic stock deduction after sales
- Automatic stock restoration when sales items are deleted
- Stock changes recorded in a movement history
- Stock history includes time, actor, reason, reference, quantity change, and resulting balance
- Low-stock detection
- Out-of-stock detection
- Protection against negative inventory

### Customer Management

- Create customers
- Edit customers
- Delete customers
- Customer information management

### Supplier Management

- Create suppliers
- Edit suppliers
- Delete suppliers
- Supplier information management

### Administration

- Create staff accounts and assign roles
- Activate or deactivate accounts
- Reset staff passwords without exposing saved password hashes
- Protect the last active administrator account from lockout
- Create, rename, and delete non-admin roles
- Protect the built-in ADMIN role from accidental changes
- Manage product categories from a dedicated screen

### Purchase Management

- Create purchase orders
- Edit purchase orders
- Purchase order status
- Add purchase items
- Edit purchase items
- Delete purchase items
- Automatic subtotal calculation
- Automatic purchase order total calculation
- Partial and full receiving with ordered, received, and remaining quantities

### Sales Management

- Create sales orders
- Edit sales orders
- Sales order status
- Add sales items
- Edit sales items
- Delete sales items
- Automatic subtotal calculation
- Automatic sales order total calculation
- Automatic inventory deduction

### Payment Management

- Record sales payments
- Record purchase payments
- Edit payments
- Delete payments
- Payment status
- Payment method
- Payment notes
- Payments linked to the appropriate sales or purchase order
- Due dates and overdue balances highlighted for follow-up
- Outstanding balances grouped into due-date aging ranges
- Printable sales invoices, purchase orders, payment receipts, and return notes
- Customer and supplier statements with date filters, running balances, and CSV export

### Audit and business records

- Admin-only audit history for successful create, update, delete, receive, and stock actions across core records
- Filter audit entries by date, record type, and user; export visible history to CSV
- Audit entries are written with business changes in the same database transaction
- Admin-editable business name, address, phone, email, tax number, and currency label for printed records

### Data Integrity

- Primary and foreign key relationships
- Backend validation
- Required-field validation
- Quantity validation
- Price validation
- Inventory protection
- Relationship protection when deleting records
- Transactional inventory updates

---

## Tech Stack

### Backend

- Java 21
- Spring Boot 4.1.1
- Spring Data JPA
- Hibernate
- Maven
- REST API
- Bean Validation

### Database

- MySQL 8.x
- MySQL Workbench

### Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Development Tools

- IntelliJ IDEA
- Visual Studio Code
- Git
- GitHub
- MySQL Workbench

---

## System Architecture

The application follows a simple client-server architecture.

```text
┌───────────────────────────────┐
│          Next.js              │
│        Frontend UI            │
│     React + TypeScript        │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│        Spring Boot            │
│          Backend              │
│                               │
│ Controller → Service → JPA    │
└───────────────┬───────────────┘
                │
                │ JDBC / Hibernate
                ▼
┌───────────────────────────────┐
│            MySQL              │
│          erp_db               │
└───────────────────────────────┘
```

## Local setup and database safety

The backend reads database settings from environment variables and uses
`spring.jpa.hibernate.ddl-auto=validate`. It will not create, alter, or reset
tables on startup. Configure `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` before
starting Spring Boot. `erp/.env.example` shows the expected variable names; do
not commit real credentials.

For an existing database, make a backup and review/run
`erp/database/migrations/V1__sales_returns_and_purchase_receiving.sql` once
against `erp_db` before starting the updated backend. It adds only the fields
and stock history table required by the current workflows. Existing purchase lines
are marked received because the previous application added their full
quantities to stock when the line was created; the migration does not change
inventory counts. Review the script and take a database backup first.

Before starting the backend after this update, also run
`erp/database/migrations/V2__remembered_sessions.sql` once in MySQL Workbench.
It creates only a new table for remembered-device tokens; it does not change
existing ERP records. Keep `spring.jpa.hibernate.ddl-auto=validate` unchanged.

Run `erp/database/migrations/V3__audit_finance_documents.sql` once as well. It
creates the audit-history and company-settings tables and adds nullable due-date
and movement-actor columns. The script checks for those columns before adding
them and seeds company settings only when the settings row is absent. Do not run
V1 or V2 again if they were already applied. In MySQL Workbench, select the
`erp_db` schema, open the V3 file, and execute it; then restart the backend.

For item-level returns, run
`erp/database/migrations/V4__sales_returns.sql` once after V3 and before starting
the updated backend. It creates return header and item tables only; it does not
change existing orders or stock. Back up the database before applying schema
changes. Returnable orders must have the `DELIVERED` status. Restocked returned
units are recorded as inventory movements; refunds are recorded as linked
`REFUNDED` payment entries when marked complete. The store-credit option is
not offered; historic store-credit records remain readable but are not
redeemable against future orders.

### Return accounting update

Before starting the updated backend, run
`erp/database/migrations/V5__return_accounting.sql` once after V4. It adds a
separate returned-item value column and copies each existing return's prior
amount into it. It preserves existing return records and inventory. Back up
`erp_db` first; do not run V5 a second time. Return value reduces the customer's
order balance; only the part that exceeds the remaining unpaid balance is due
as a cash refund. Refund payments are created from the return record and are
not editable as ordinary payments. Redeemable store credit is not included.

The sign-in and sign-up forms now send a CSRF token with browser write requests.
Use the supplied local browser at `http://localhost:3000` for development.

### Sign-in

The API requires a user account. To create the first administrator, set
`ERP_BOOTSTRAP_USERNAME` and `ERP_BOOTSTRAP_PASSWORD` before starting the backend.
At startup it creates that account only if the username does not already exist.
The password is stored as a one-way hash. Keep it private and out of source
control. Existing bcrypt hashes are accepted. `/api/users` and `/api/roles` are
restricted to users with the `ADMIN` role. Other API routes require sign-in.
By default, sign-in lasts for the browser session and expires on the server
after 12 hours. The optional “Remember this device” checkbox keeps that browser
signed in for up to 30 days using a random, revocable HttpOnly cookie; the
password is not saved in that cookie.
“Sign out everywhere” revokes all of that user’s active and remembered sessions.
The sign-in screen accepts either username or email. Public sign-up records a
username, phone, email, and password hash; new accounts stay inactive until an
administrator reviews the contact details and activates them under Staff
accounts. New registrations receive the non-admin STAFF role. Email ownership
is not verified automatically, so the administrator should confirm contact
details before activating an account.
For local HTTP use, `AUTH_COOKIE_SECURE` defaults to `false`. For a hosted
deployment, use HTTPS and activate the production profile. The production
profile requires explicit database settings and `CORS_ALLOWED_ORIGINS`; it also
marks the browser cookies Secure. Do not expose the development server directly
to the public internet.

From PowerShell, start the backend and frontend in separate terminals:

```powershell
cd "C:\path\to\Business ERP\erp"
$env:DB_URL = "jdbc:mysql://localhost:3306/erp_db"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-mysql-password"
$env:ERP_BOOTSTRAP_USERNAME = "admin"
$env:ERP_BOOTSTRAP_PASSWORD = "choose-a-long-private-password"
.\mvnw.cmd spring-boot:run
```

For a hosted backend, set `SPRING_PROFILES_ACTIVE=prod` and supply `DB_URL`,
`DB_USERNAME`, `DB_PASSWORD`, and `CORS_ALLOWED_ORIGINS` through the hosting
provider's secret settings before starting the jar. The CORS value must be the
exact HTTPS frontend origin (no path).

```powershell
cd "C:\path\to\Business ERP\erp-frontend"
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `erp-frontend/.env.local` if the backend API is
running at a different address; the example is in `erp-frontend/.env.example`.

Run backend tests with `.\mvnw.cmd test` from `erp`. Tests use a temporary
in-memory database and do not touch MySQL. Run frontend checks with
`npm run lint` and `npx tsc --noEmit` from `erp-frontend`.

The unauthenticated readiness URL `GET /api/health` checks that the API can
reach its database and returns `UP` only when both are available. Before using
real business data, test a database backup restore on a separate database and
confirm that the restored application starts cleanly. Keep daily backups away
from the computer running MySQL.

## Current scope and limitations

Current workflows include product/customer/supplier/category management,
inventory and stock history, partial purchase receiving, sales orders with
delivery charges and cancellation stock handling, payments, remembered-device
sign-in, a dashboard, date-filtered reports, customer/supplier statements,
printable records, and admin audit history. Audit history begins when V3 is
installed; earlier activity is not reconstructed. Stock history is limited to
the latest 200 movements and audit history to the latest 500 matches. Return
accounting reduces customer balances and records cash refunds, but it does not
create redeemable store credit. Company currency
is a display label and does not convert amounts. Accounting journals, tax
calculations, multiple warehouses, fine-grained permissions within non-admin
roles, and statutory financial statements are not included. Reports and
statements are operational views, not accounting records.
