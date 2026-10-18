# BudgetHelper

BudgetHelper is a React app for tracking credit-card or bank spending against:

- a **total monthly budget**
- **per-category budgets**

It helps answer: **am I going above or below budget?**

## Tech stack

- React + Vite
- PapaParse (CSV parsing)
- Recharts (charts)
- Supabase (optional cloud backend: Auth + Postgres)

## What was built

### 1) CSV Upload

- Upload a bank or credit-card CSV file
- Supports common export formats (Chase, Amex, BoA, Wells Fargo, Citi, Capital One, Discover)
- Parses and normalizes rows into a transaction model:
  - `id`
  - `date`
  - `description`
  - `amount`
  - `category`
- Keeps expense transactions for budget tracking

### 2) Budget Setup

- Set **total monthly budget**
- Set optional **per-category budgets**

### 3) Dashboard

- Total spent
- Transactions count
- Average transaction amount
- Remaining amount / over-budget amount
- Category spending vs budget chart
- Status indicators:
  - Green = on track (< 80%)
  - Yellow = near limit (80–100%)
  - Red = over budget (>= 100%)

### 4) Transactions

- Search transactions
- Filter by category
- Sort by date, description, or amount
- Manually adjust category per transaction

## App flow

1. User exports CSV from their bank/credit-card portal.
2. User uploads CSV into the app.
3. Parser maps different bank column names into one standard transaction shape.
4. App auto-categorizes transactions using merchant keywords.
5. User sets total and category budgets.
6. Dashboard calculates and displays budget status.
7. User can re-categorize transactions in the Transactions tab.
8. Dashboard updates immediately with the revised categories.

## Key files

- `src/App.jsx` — Top-level app state, tab navigation, screen wiring
- `src/utils/csvParser.js` — CSV parsing, normalization, category inference, category totals
- `src/components/CSVUpload.jsx` — Upload UI and parse trigger
- `src/components/BudgetSetup.jsx` — Budget form
- `src/components/Dashboard.jsx` — Summary cards and charts
- `src/components/TransactionList.jsx` — Search/filter/sort table and category edits

## Run the app

```bash
npm install
npm run dev
```

## Supabase setup (Phase 1)

If you want cloud sync across devices/accounts:

1. Create a Supabase project.
2. Copy [.env.example](./.env.example) to `.env`.
3. Fill:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. In Supabase SQL editor, run [schema.sql](./supabase/schema.sql).
5. Start the app and sign in with email/password.

If env vars are missing, the app runs in local-only mode (no cloud sync).

### Cloud behavior in current phase

- Transactions and budgets are loaded from Supabase after sign-in.
- Uploading a new CSV replaces your existing saved transactions for that user (same behavior as replacing local state in-app).
- Updating transaction category syncs to Supabase.
- Saving budget creates a new budget snapshot row.

## Build for production

```bash
npm run build
```

## Notes for future Flutter migration

The CSV route remains a good choice for Flutter. Keep these parts portable:

- a standard transaction model
- bank-specific CSV mapping logic
- budget calculation logic separated from UI

This makes a future Dart/Flutter port straightforward.
