# Project Overview

Insurance Premium Calculator — a single-page web application that replicates the logic of a spreadsheet-based insurance premium tool. Users enter policy parameters and the app calculates premiums and expenses in real time with no server round-trips.

## Tech Stack

| Layer | Choice |
|---|---|
| UI framework | React 19 (with StrictMode) |
| Language | TypeScript ~6, targeting ES2023 |
| Bundler | Vite 8 |
| JSX transform | `react-jsx` (no React import needed in components) |
| Linter | oxlint 1.75 (configured via `.oxlintrc.json`) |
| Type runner | tsx (for running `.ts` files directly, e.g. selfCheck) |
| Deploy | gh-pages 6 |

## File Structure

```
insurance-premium-web/
├── index.html                  # HTML entry — mounts #root, loads /src/main.tsx
├── vite.config.ts              # Vite config; base must stay /insurance-premium-web/
├── package.json                # Scripts: dev, build, lint, selfcheck, deploy
├── tsconfig.app.json           # Strict TS config for src/; bundler moduleResolution
├── .oxlintrc.json              # Oxlint rules (react/rules-of-hooks enforced as error)
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.tsx                # ReactDOM.createRoot entry point; imports theme.css
    ├── App.tsx                 # Root component — all calculator state lives here
    ├── theme.css               # Single global stylesheet; spreadsheet-inspired colours
    ├── components/
    │   ├── Section1.tsx        # Insurance premium calculation UI
    │   ├── Section2.tsx        # Expense calculation UI
    │   └── Instructions.tsx    # Instructions tab content
    └── engine/
        ├── premiumEngine.ts    # Pure calculation engine (no React imports)
        └── selfCheck.ts        # Acceptance-value assertions; runs in Node and browser
```

## Architecture

### State management
All mutable state is lifted to `App.tsx` and passed down as props. There is no external state library, no context, and no localStorage — a page refresh resets everything to blank defaults.

### Tab model
Two tabs rendered by `App`: `calculator` (Section1 + Section2) and `instructions`. Switching tabs preserves all calculator state because it never unmounts.

### Calculation engine (`src/engine/premiumEngine.ts`)
Pure TypeScript — no React imports. Key exports:

- `calculatePremium(inputs)` → `PremiumResult` — computes annual premium, daily premium, monthly premiums, and the 12-row month helper table.
- `annualPremiumFrom(sumInsured)` — `sumInsured / 12`.
- `buildMonths(inputs, daysInYear, annual)` — always returns exactly 12 `MonthRow` objects.
- `expenseCalculated(row)` / `expenseTotals(rows)` — Section 2 expense math.
- `fmt2(value)` — formats numbers with thousands separators and 2 decimal places.
- `fmtDate(ms)` — formats UTC milliseconds as `dd/MMM/yyyy`.

All date arithmetic uses UTC (`Date.UTC`) to avoid timezone and DST off-by-one errors.

### Calculation methods (Section 1)
- **By Day**: `annualPremium / daysInYear × coveredDays` per month.
- **Smooth**: `annualPremium / 12 / daysInMonth × coveredDays` per month (monthly prorating).

`Calculated Premium` = sum of the 12 `monthPremium` values.

### Expense rows (Section 2)
- **Main**: `%age` locked to 100%; `Calculated Amount = Amount × 1.00`.
- **Dependent**: `%age` manually entered 0–100; `Calculated Amount = Amount × (pct / 100)`.
- Rows are added/removed dynamically; totals recalculate live via `useMemo`.

## Coding Conventions

- Components are default exports; pure utilities are named exports.
- `useMemo` is used for all derived values that depend on user inputs.
- No side effects in the engine — `calculatePremium` is a pure function.
- Money input: `sanitizeMoney` strips commas and non-numeric characters; `parseMoney` converts to `number | null`.
- CSS uses custom properties defined in `:root` inside `theme.css`; no CSS modules or styled-components.
- Yellow (`--input-bg`) = user-editable fields; grey (`--calc-bg`) = calculated/read-only fields.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript compile + Vite production build → `dist/` |
| `npm run lint` | Run oxlint over the project |
| `npm run selfcheck` | Run `src/engine/selfCheck.ts` via tsx to verify canonical values |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Build then publish `dist/` to the `gh-pages` branch |

## Self-Check

`src/engine/selfCheck.ts` contains acceptance assertions for the engine. It runs automatically in the browser console (via `useEffect` in `App.tsx`) and can be run from the command line.

Canonical values (must never regress):
- Sum Insured: **84,000** → Annual Premium: **7,000**
- Calculated Premium (By Day, Leap Year, 13 Mar 2025 – 31 May 2025): **1,530.05**
- Days Selected: **80**, Days in Year: **366**
- March premium: **363.39**, April: **573.77**, May: **592.90**
