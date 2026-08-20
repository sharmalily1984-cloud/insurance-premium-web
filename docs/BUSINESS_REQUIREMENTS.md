# Insurance Premium Calculator — Business Requirements

## 1. Overview

The Insurance Premium Calculator is a client-side single-page web application that replicates and extends the logic of a spreadsheet-based insurance premium calculation tool. Users enter policy parameters (sum insured, date range, calculation method) and the application computes premiums and expenses in real time with no server round-trips.

**Key characteristics:**
- 100% client-side (no backend, no API calls, no data persistence)
- Decimal-for-decimal accuracy with the source Excel spreadsheet
- All date arithmetic in UTC to avoid timezone/DST errors
- A page refresh resets all data to blank defaults

---

## 2. Current Functionality

### 2.1 Limits (AAL / FUL)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| AAL Limit | Numeric input | No | Maximum Sum Insured allowed for direct entry |
| FUL Limit | Numeric input | No | Threshold that triggers a "new rider" message |

**Validation rules:**
- If AAL Limit is configured and any SI field exceeds it: display "Sum Insured cannot exceed the AAL Limit. The remaining amount should go in an additional rider."
- If FUL Limit is configured and any SI field exceeds it: display "Sum Insured exceeds the FUL Limit. The remaining amount must be provided through a new rider."
- AAL validation takes priority over FUL.
- When both are blank, no limit validation applies.

### 2.2 Sum Insured (DTH / TPD / IP)

Three independently editable numeric fields:

| Field | Description |
|-------|-------------|
| SI_DTH | Death benefit sum insured |
| SI_TPD | Total Permanent Disability sum insured |
| SI_IP | Income Protection sum insured |

Each field is validated independently against AAL/FUL limits.

### 2.3 Annual Premium (DTH / TPD / IP)

Read-only calculated fields:

| Field | Formula |
|-------|---------|
| AP_DTH | SI_DTH ÷ 12 |
| AP_TPD | SI_TPD ÷ 12 |
| AP_IP | SI_IP ÷ 12 |

Values recalculate immediately when the corresponding Sum Insured changes.

### 2.4 Premium Calculation Parameters

| Field | Type | Description |
|-------|------|-------------|
| Calculation Book | Dropdown | `Smooth` or `By Day` (default: By Day) |
| Year Type | Dropdown | `Leap Year` (366 days) or `Non-Leap Year` (365 days) |
| Start Date | Date input | Policy coverage start |
| End Date | Date input | Policy coverage end (must be ≥ Start) |
| Days in Year | Read-only | 366 or 365 based on Year Type |
| Days Selected | Read-only | Inclusive day count = (End − Start) + 1 |

### 2.5 Calculated Values (DTH / TPD / IP)

Each value is computed independently for DTH, TPD, and IP:

| Field | Formula |
|-------|---------|
| Annual Daily Premium | Annual Premium ÷ Days in Year |
| Monthly Premium | Annual Premium ÷ 12 |
| Calculated Premium | Sum of all month premiums in the Month Calculation Helper |
| Smooth Method | Calculated Premium when book is "Smooth", else N/A |
| By Day Method | Calculated Premium when book is "By Day", else N/A |

### 2.6 Month Calculation Helper

A table that shows month-by-month premium breakdown from Start Date to End Date.

**Columns:**
- Month # (sequential, starting at 1)
- Month Start (first day of month)
- Month End (last day of month)
- Days in Month (calendar days)
- Covered Days (overlap between [Start, End] and [Month Start, Month End])
- Month Premium — DTH (from AP_DTH)
- Month Premium — TPD (from AP_TPD)
- Month Premium — IP (from AP_IP)

**Month Premium formula per row:**
- **By Day**: `Annual Premium ÷ Days in Year × Covered Days`
- **Smooth**: `Annual Premium ÷ 12 ÷ Days in Month × Covered Days`

**Dynamic row count:** The table spans all months from Start Date to End Date (minimum 12 rows). Pagination displays 12 months per page.

### 2.7 Status

Priority-based validation status:
1. No valid Sum Insured → "⚠ Enter valid Sum Insured"
2. No Calculation Book → "⚠ Select Calculation Book"
3. No Year Type → "⚠ Select Year Type"
4. No Start Date → "⚠ Enter Start Date"
5. No End Date → "⚠ Enter End Date"
6. End < Start → "⚠ End Date < Start Date"
7. All valid → "✓ Ready"

### 2.8 Section 2 — Expense Calculation

Dynamic table with editable rows:

| Column | Description |
|--------|-------------|
| Expense Name | Free text |
| Expense Type | `Main` (100% locked) or `Dependent` (0–100% manual) |
| Amount | Editable numeric |
| %age | Locked to 100 for Main; editable 0–100 for Dependent |
| Calculated Amount | Amount × (%age ÷ 100) — read-only |

**Totals row:** Sum of Amount and sum of Calculated Amount across all rows.

---

## 3. Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| Platform | 100% client-side SPA (Vite + React + TypeScript) |
| Browser support | Modern evergreen browsers (Chrome, Firefox, Safari, Edge) |
| Deployment | GitHub Pages (gh-pages branch) |
| Persistence | None — page refresh clears all data |
| Accuracy | IEEE-754 doubles; round only for display, never mid-calculation |
| Date handling | UTC-only (`Date.UTC`) to avoid timezone/DST errors |
| Responsive | Stacks to single-column on screens < 768px |
| Accessibility | Standard HTML form controls, semantic labels, keyboard navigable |

---

## 4. Acceptance Criteria (Canonical Test Values)

These values must never regress:

```
Sum Insured:       84,000
Annual Premium:    7,000 (= 84,000 ÷ 12)
Calculation Book:  By Day
Year Type:         Leap Year
Start Date:        2025-03-13
End Date:          2025-05-31
Days in Year:      366
Days Selected:     80
Calculated Premium: 1,530.05

Month premiums:
  March: 363.39
  April: 573.77
  May:   592.90
  All others: 0.00

Expense test:
  Main 3,000 @100%, Dependent 581.44 @15%, Dependent 2,250 @12%
  → Total Amount: 5,831.44
  → Total Calculated: 3,357.22
```

---

## 5. UI Layout Summary

```
┌──────────────────────────────────────────────────────┐
│  Insurance Premium Calculator              [Reset]   │
├──────────────────────────────────────────────────────┤
│  [Premium Calculator]  [Instructions]                │
├─────────────────────────┬────────────────────────────┤
│  Limits                 │  Sum Insured               │
│  ├ AAL Limit            │  ├ SI_DTH                  │
│  └ FUL Limit            │  ├ SI_TPD                  │
│                         │  └ SI_IP                   │
├─────────────────────────┼────────────────────────────┤
│  Annual Premium         │  Premium Calculation       │
│  ├ AP_DTH               │  ├ Calculation Book        │
│  ├ AP_TPD               │  ├ Year Type               │
│  └ AP_IP                │  ├ Start / End Date        │
│  (auto from SI ÷ 12)   │  ├ Days in Year            │
│                         │  └ Days Selected           │
├─────────────────────────┴────────────────────────────┤
│  Calculated Values (DTH / TPD / IP)                  │
│  ├ Annual Daily Premium                              │
│  ├ Monthly Premium                                   │
│  ├ Calculated Premium                                │
│  ├ Smooth Method                                     │
│  └ By Day Method                                     │
├──────────────────────────────────────────────────────┤
│  Month Calculation Helper (paginated, 12/page)       │
│  [Month#] [Start] [End] [Days] [Covered] [DTH][TPD] │
│                                           [IP]       │
│  [< Previous]  Page X / Y  [Next >]                  │
├──────────────────────────────────────────────────────┤
│  Section 2 — Expense Calculation                     │
│  [Name] [Type] [Amount] [%age] [Calculated]          │
│  [+ Add Row]  [Remove]                               │
│  ─────────────────── Total ──────────────────────    │
└──────────────────────────────────────────────────────┘
```

---

## 6. Colour Palette

| Element | Colour | Hex |
|---------|--------|-----|
| Section header banner | Blue background, white text | #4472C4 / #FFFFFF |
| Editable input fields | Pale yellow | #FFFFC0 |
| Calculated/read-only fields | Light grey | #E8E8E8 |
| Table header / total rows | Grey background, dark text | #D6DCE5 / #666666 |

---

## 7. Formatting Rules

- **Numbers**: Thousands separator + 2 decimal places (`Intl.NumberFormat`)
- **Dates** (in month table): `dd/MMM/yyyy` (e.g. `13/Mar/2025`)
- **Percentages**: Whole number with `%` label

---

## 8. Enhancement Backlog

### 8.1 Multi-Policy Support
Allow users to calculate premiums for multiple policies side by side, with a summary/comparison view.

### 8.2 Export to PDF / Excel
Add the ability to export the completed calculation (including the month table and expense breakdown) as a downloadable PDF or Excel file.

### 8.3 Auto-detect Leap Year
Automatically determine Year Type based on the year in the Start Date, removing the manual dropdown.

### 8.4 Rider Calculation Module
When Sum Insured exceeds AAL or FUL limits, provide a dedicated section to configure and calculate the additional rider premium.

### 8.5 Currency & Locale Settings
Allow the user to choose a currency symbol and number formatting locale (e.g. Indian numbering system: 1,00,000).

### 8.6 Data Persistence (Optional)
Add optional localStorage/sessionStorage to preserve entered data across browser refreshes, with an explicit "Clear Saved Data" action.

### 8.7 Print-Friendly Layout
Create a print stylesheet that renders the full calculator output (all pages of the month table, expenses) in a clean print-ready format.

### 8.8 Unit Test Suite
Add a comprehensive automated test suite (e.g. Vitest) covering edge cases: year boundaries, single-day ranges, 31 Dec to 1 Jan spans, empty inputs, maximum values, etc.

### 8.9 Accessibility Audit
Conduct a full WCAG 2.1 AA compliance review and implement improvements: ARIA labels, focus management, screen reader announcements on live-calculated fields.

### 8.10 Mobile-First Responsive Redesign
Optimise the compact 2×2 card layout for smaller touch devices with larger tap targets and collapsible sections.

### 8.11 API Integration Layer
For enterprise deployments, add an optional backend API integration to fetch policy parameters, validate against master data, and submit completed calculations.

### 8.12 Multi-Language Support (i18n)
Internationalise all user-facing text to support multiple languages with a locale switcher.

---

## 9. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025 | — | Initial business requirements document |

---

*End of document.*
