# Product: Insurance Premium Calculator

## What this is
A client-side web app (Vite + React + TypeScript, no backend) that calculates an insurance
premium for a chosen date range, plus an expense-allocation table. It was reverse-engineered
from an Excel spreadsheet and must stay **decimal-for-decimal accurate** with that spreadsheet
(and with a sibling Java/Swing desktop version). All money math uses IEEE-754 doubles; round
only for display, never mid-calculation.

## Canonical acceptance value (must never regress)
Sum Insured `84000` → Annual Premium `7000` (= 84000 ÷ 12), Calculation Book `By Day`,
Year Type `Leap Year`, Start `2025-03-13`, End `2025-05-31`
→ Days in Year `366`, Number of Days Selected `80`, Calculated Premium **`1530.05`**.
Month premiums for Mar/Apr/May ≈ `363.39 / 573.77 / 592.90`, all other months `0`.
Expense sample rows (Main 3000 @100%, Dependent 581.44 @15%, Dependent 2250 @12%)
→ Total Amount `5831.44`, Total Calculated `3357.22`.
The self-check (`npm run selfcheck`) asserts these; keep it green.

## User interface
Two tabs (React state, no router): **Calculator** and **Instructions**.
State is lifted to a parent so switching tabs does NOT lose entered data; a full browser
refresh starts blank. No localStorage/sessionStorage. A **Reset** button (top-right) clears
all fields back to defaults after a confirmation prompt.

### Colour palette (matches the spreadsheet — keep exact)
- Section header banner: background `#4472C4`, white bold text.
- Input fields (editable): pale-yellow `#FFFFC0`.
- Calculated / read-only fields: light-grey `#E8E8E8`, rendered non-editable.
- Table header / total rows: background `#D6DCE5`, grey `#666666` text.

### Formatting
- Numbers: thousands separator + 2 decimals via `Intl.NumberFormat` (e.g. `1,530.05`).
- Dates in the 12-month helper table: `dd/MMM/yyyy` (e.g. `13/Mar/2025`).
- Percentages: whole number with a `%` label.

## Section 1 — Premium calculation

### Inputs (editable, yellow)
- **Sum Insured** — numeric, up to 2 decimal places. This is the real user input.
- **Annual Premium** — READ-ONLY (grey), computed as `Sum Insured ÷ 12`. Not user-editable.
- **Calculation Book** — dropdown: `Smooth`, `By Day` (default `By Day`).
- **Year Type** — dropdown: `Leap Year`, `Non-Leap Year` (default `Leap Year`).
- **Start Date**, **End Date** — native date inputs; End must be ≥ Start.

### Outputs (read-only, grey; recompute live)
- **Days in Year** = 366 if Leap Year else 365.
- **Number of Days Selected** = inclusive days = (End − Start) + 1.
- **Annual Daily Premium** = Annual Premium ÷ Days in Year.
- **Monthly Premium** = Annual Premium ÷ 12.
- **Calculated Premium** = sum of the 12 "Month Premium" rows in the helper table (NOT a
  single formula). Shows an error string if inputs are missing or End < Start.
- **Status** priority chain: Sum Insured empty/≤0 → `⚠ Enter valid Sum Insured`; then
  Calculation Book, Year Type, Start Date, End Date missing; then End < Start
  → `⚠ End Date < Start Date`; else `✓ Ready` (green).
- **Comparison fields**: Smooth Method = Calculated Premium if book is Smooth else `N/A`;
  By Day Method = Calculated Premium if book is By Day else `Annual Daily Premium × Days
  Selected`; Difference = (Smooth − By Day) if both numeric else `N/A`.

### 12-month helper table (read-only, always 12 rows)
Row 1 = the month containing the Start Date. For month i (0..11):
- Month Start = first day of (start month + i), with year rollover.
- Month End = last calendar day of that month; Days in Month = its day count.
- Covered Days = 0 if Month Start > End OR Month End < Start; else
  min(End, Month End) − max(Start, Month Start) + 1.
- Month Premium = 0 if Covered Days = 0; else By Day: (Annual ÷ Days in Year) × Covered Days;
  Smooth: (Annual ÷ 12) ÷ Days in Month × Covered Days.

## Section 2 — Expense calculation (editable, dynamic rows)
Columns: Expense Name (text), Expense Type (`Main`/`Dependent`), Amount (numeric, yellow),
%age (whole percent, yellow), Calculated Amount (read-only grey = Amount × %age ÷ 100).
- Opens with one blank row (no seeded data). Add Row / Remove Row buttons.
- Rule: Type `Main` forces %age to 100 and locks that cell; `Dependent` allows 0–100.
  New rows default to `Dependent` so both Amount and %age start genuinely blank.
- Bold, non-editable **Total row** styled `#D6DCE5` with Total Amount (sum of Amount) and
  Total Calculated (sum of Calculated Amount); blank amount/%age counts as 0; empty → 0.00.

## Critical invariants (do not break)
- All date math is UTC-only (`Date.UTC`, day diff via `Math.round(Δms / 86400000)`) to avoid
  timezone/off-by-one bugs. Never use local-time `new Date("...")` parsing for calculations.
- The pure calculation engine lives in `src/engine/` with NO React imports, so it stays
  testable. `selfCheck` asserts the acceptance values above.
- Keep the app 100% client-side — no backend, no API calls, no data persistence.
