# BudgetHelper Plan

## 1) Product Goal
Build a reliable budget app where users can:
- Save budget settings and spending data (daily/weekly) for future analysis.
- Track whether a spend is **individual** or **group/shared** so personal budget impact is accurate.

---

## 2) Core Requirements (from user)

### A. Data storage for budget + spending history
Need persistent storage for:
- Budget setup (weekly/monthly targets)
- Transactions (date, amount, category, note)
- Time period summaries (day/week/month)
- Historical data for trend analysis

### B. Individual vs group spend handling
Each transaction should support:
- `spendType`: `individual` or `group`
- For group spends: split logic (`equal`, `custom`) and `myShareAmount`
- Personal budget calculations should use `myShareAmount`, not full transaction amount

---

## 3) Suggested MVP Data Model

## users
- `id`
- `name` (optional for v1)
- `createdAt`

## budgets
- `id`
- `userId`
- `periodType` (`weekly` | `monthly`)
- `totalBudget`
- `startDate`
- `endDate` (optional if rolling budget)

## transactions
- `id`
- `userId`
- `date`
- `category`
- `amount` (total amount paid)
- `spendType` (`individual` | `group`)
- `splitType` (`none` | `equal` | `custom`)
- `groupSize` (nullable)
- `myShareAmount` (required for budget math)
- `notes` (optional)

## categories (optional in MVP, recommended)
- `id`
- `name`
- `icon/color` (optional)

---

## 4) Calculation Rules

1. **Individual spend**
   - `myShareAmount = amount`

2. **Group spend (equal split)**
   - `myShareAmount = amount / groupSize`

3. **Group spend (custom split)**
   - `myShareAmount` entered manually

4. **Budget used**
   - Sum of `myShareAmount` in selected period

5. **Budget remaining**
   - `budgetLimit - usedAmount`

---

## 5) Technical Suggestions for “making it available”

### A. Backend/DB choice
Use a hosted DB + API layer so data is not lost:
- **Good default:** Supabase (Postgres + Auth + REST)
- Alternative: Firebase
- Avoid local-only storage for production (can still keep as fallback cache)

### B. Authentication
Add account login before launch:
- Email/password or OAuth
- Ensures each user’s budget data is private and portable

### C. Reliability
- Input validation on forms (amount > 0, date required, group size >= 2)
- Server-side validation to prevent bad writes
- Basic error handling + retry UX

### D. Analytics features to add
- Weekly/monthly trend chart
- Category-wise spend breakdown
- “Over budget” alerts
- Shared-spend vs individual-spend ratio

### E. Data portability
- CSV import (already started) + CSV export
- Backup/restore option

### F. Production readiness
- Environment config (`.env`) for API keys
- Monitoring/logging for backend errors
- Privacy policy + terms page (if public launch)
- Basic rate limiting and security rules

---

## 6) Implementation Phases

### Phase 1: Foundation
- Finalize data model
- Connect frontend to hosted DB
- Implement create/read transactions
- Implement budget setup persistence

### Phase 2: Budget logic
- Add spend type selector (individual/group)
- Implement split logic and `myShareAmount`
- Update dashboard calculations to use personal share

### Phase 3: Insights
- Weekly/monthly analytics
- Category breakdown
- Budget alerts

### Phase 4: Launch hardening
- Auth, validation, error boundaries
- Export/import improvements
- Performance and mobile responsiveness

---

## 7) Immediate Next Tasks

1. Choose DB stack (Supabase recommended)
2. Add `spendType`, `splitType`, `groupSize`, `myShareAmount` fields in transaction flow
3. Refactor dashboard math to use `myShareAmount`
4. Add a simple weekly insights panel
5. Add auth before public launch
