// Pure calculation engine — NO React imports.
// All date math is done as calendar dates in UTC to avoid timezone / off-by-one bugs.

export type CalculationBook = 'Smooth' | 'By Day';
export type YearType = 'Leap Year' | 'Non-Leap Year';
export type ExpenseType = 'Main' | 'Dependent';

export interface PremiumInputs {
  sumInsured: number | null;
  book: CalculationBook | '';
  yearType: YearType | '';
  startDate: string; // "YYYY-MM-DD" or ""
  endDate: string; // "YYYY-MM-DD" or ""
}

/** Annual Premium is derived: Sum Insured ÷ 12. Null when Sum Insured is missing. */
export function annualPremiumFrom(sumInsured: number | null): number | null {
  return sumInsured == null ? null : sumInsured / 12;
}

export interface MonthRow {
  monthNumber: number; // 1..12
  monthStartMs: number;
  monthEndMs: number;
  daysInMonth: number;
  coveredDays: number;
  monthPremium: number;
}

export interface PremiumResult {
  annualPremium: number | null;
  daysInYear: number | null;
  daysSelected: number | null;
  annualDailyPremium: number | null;
  monthlyPremium: number | null;
  calculatedPremium: number | string; // number, or an "Error: ..." string
  status: { text: string; kind: 'ok' | 'warn' };
  smoothMethod: number | 'N/A';
  byDayMethod: number | 'N/A';
  difference: number | 'N/A';
  months: MonthRow[];
}

const MS_PER_DAY = 86_400_000;

/** Parse "YYYY-MM-DD" into integer parts. Returns null if invalid/empty. */
export function parseYmd(value: string): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

/** UTC milliseconds for a calendar date. m is 1-based. */
export function utcMs(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d);
}

/** Inclusive-safe day difference: round((a - b) / MS_PER_DAY). */
export function dayDiff(aMs: number, bMs: number): number {
  return Math.round((aMs - bMs) / MS_PER_DAY);
}

function utcMsFromYmd(value: string): number | null {
  const p = parseYmd(value);
  return p ? utcMs(p.y, p.m, p.d) : null;
}

export function daysInYearFor(yearType: YearType | ''): number | null {
  if (yearType === 'Leap Year') return 366;
  if (yearType === 'Non-Leap Year') return 365;
  return null;
}

/**
 * Build the always-12-row month helper table. Row 0 is the month containing
 * the start date. Uses UTC date math throughout.
 */
export function buildMonths(
  inputs: PremiumInputs,
  daysInYear: number | null,
  annual: number | null,
  monthCount = 12,
): MonthRow[] {
  const rows: MonthRow[] = [];
  const start = parseYmd(inputs.startDate);
  const startMs = utcMsFromYmd(inputs.startDate);
  const endMs = utcMsFromYmd(inputs.endDate);

  for (let i = 0; i < monthCount; i++) {
    let monthStartMs = 0;
    let monthEndMs = 0;
    let daysInMonth = 0;
    let coveredDays = 0;
    let monthPremium = 0;

    if (start) {
      const totalMonths = start.m - 1 + i; // 0-based month offset
      const year = start.y + Math.floor(totalMonths / 12);
      const month0 = ((totalMonths % 12) + 12) % 12; // 0-based
      monthStartMs = Date.UTC(year, month0, 1);
      monthEndMs = Date.UTC(year, month0 + 1, 0); // day 0 of next month = last day
      daysInMonth = new Date(monthEndMs).getUTCDate();

      if (startMs !== null && endMs !== null && endMs >= startMs) {
        const noOverlap = monthStartMs > endMs || monthEndMs < startMs;
        if (!noOverlap) {
          const lo = Math.max(startMs, monthStartMs);
          const hi = Math.min(endMs, monthEndMs);
          coveredDays = dayDiff(hi, lo) + 1;
        }
      }

      if (coveredDays > 0 && annual != null && annual > 0) {
        if (inputs.book === 'By Day' && daysInYear) {
          monthPremium = (annual / daysInYear) * coveredDays;
        } else if (inputs.book === 'Smooth' && daysInMonth > 0) {
          monthPremium = (annual / 12 / daysInMonth) * coveredDays;
        }
      }
    }

    rows.push({
      monthNumber: i + 1,
      monthStartMs,
      monthEndMs,
      daysInMonth,
      coveredDays,
      monthPremium,
    });
  }

  return rows;
}

/**
 * Calculate the number of months from start to end (inclusive of both months).
 * Returns at least 12 for backward compatibility.
 */
export function monthSpan(startDate: string, endDate: string): number {
  const s = parseYmd(startDate);
  const e = parseYmd(endDate);
  if (!s || !e) return 12;
  const months = (e.y - s.y) * 12 + (e.m - s.m) + 1;
  return Math.max(months, 12);
}

export function calculatePremium(inputs: PremiumInputs): PremiumResult {
  const daysInYear = daysInYearFor(inputs.yearType);
  const annual = annualPremiumFrom(inputs.sumInsured); // Annual Premium = Sum Insured / 12
  const startMs = utcMsFromYmd(inputs.startDate);
  const endMs = utcMsFromYmd(inputs.endDate);

  // Days selected (inclusive). Blank if a date is missing.
  let daysSelected: number | null = null;
  if (startMs !== null && endMs !== null) {
    daysSelected = dayDiff(endMs, startMs) + 1;
  }

  const annualDailyPremium =
    annual != null && annual > 0 && daysInYear ? annual / daysInYear : null;
  const monthlyPremium = annual != null && annual > 0 ? annual / 12 : null;

  const months = buildMonths(inputs, daysInYear, annual, monthSpan(inputs.startDate, inputs.endDate));

  // Status (priority order). Sum Insured is now the actual input.
  let status: PremiumResult['status'];
  if (inputs.sumInsured == null || inputs.sumInsured <= 0) {
    status = { text: '⚠ Enter valid Sum Insured', kind: 'warn' };
  } else if (inputs.book === '') {
    status = { text: '⚠ Select Calculation Book', kind: 'warn' };
  } else if (inputs.yearType === '') {
    status = { text: '⚠ Select Year Type', kind: 'warn' };
  } else if (!inputs.startDate) {
    status = { text: '⚠ Enter Start Date', kind: 'warn' };
  } else if (!inputs.endDate) {
    status = { text: '⚠ Enter End Date', kind: 'warn' };
  } else if (endMs !== null && startMs !== null && endMs < startMs) {
    status = { text: '⚠ End Date < Start Date', kind: 'warn' };
  } else {
    status = { text: '✓ Ready', kind: 'ok' };
  }

  // Calculated Premium = sum of the 12 month premiums, with error messages.
  let calculatedPremium: number | string;
  const missingCore =
    inputs.sumInsured == null ||
    inputs.sumInsured <= 0 ||
    inputs.book === '' ||
    inputs.yearType === '' ||
    !inputs.startDate ||
    !inputs.endDate;
  if (missingCore) {
    calculatedPremium = 'Error: Missing inputs';
  } else if (endMs !== null && startMs !== null && endMs < startMs) {
    calculatedPremium = 'Error: End Date before Start Date';
  } else {
    calculatedPremium = months.reduce((sum, r) => sum + r.monthPremium, 0);
  }

  // Comparison fields.
  const calcNumeric =
    typeof calculatedPremium === 'number' ? calculatedPremium : null;

  const smoothMethod: number | 'N/A' =
    inputs.book === 'Smooth' && calcNumeric != null ? calcNumeric : 'N/A';

  let byDayMethod: number | 'N/A';
  if (inputs.book === 'By Day' && calcNumeric != null) {
    byDayMethod = calcNumeric;
  } else {
    byDayMethod = 'N/A';
  }

  const difference: number | 'N/A' =
    typeof smoothMethod === 'number' && typeof byDayMethod === 'number'
      ? smoothMethod - byDayMethod
      : 'N/A';

  return {
    annualPremium: annual,
    daysInYear,
    daysSelected,
    annualDailyPremium,
    monthlyPremium,
    calculatedPremium,
    status,
    smoothMethod,
    byDayMethod,
    difference,
    months,
  };
}

// ---------- Section 2: Expenses ----------

export interface ExpenseRow {
  id: string;
  name: string;
  type: ExpenseType;
  amount: number | null;
  pct: number | null;
}

export function expenseCalculated(row: ExpenseRow): number {
  const amount = row.amount ?? 0;
  const pct = row.pct ?? 0;
  return amount * (pct / 100);
}

export function expenseTotals(rows: ExpenseRow[]): {
  totalAmount: number;
  totalCalculated: number;
} {
  let totalAmount = 0;
  let totalCalculated = 0;
  for (const r of rows) {
    totalAmount += r.amount ?? 0;
    totalCalculated += expenseCalculated(r);
  }
  return { totalAmount, totalCalculated };
}

// ---------- Formatting helpers ----------

const numberFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Thousands separator + 2 decimals, e.g. 1530.0546 -> "1,530.05". */
export function fmt2(value: number): string {
  return numberFmt.format(value);
}

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Format a UTC-millis date as dd/MMM/yyyy, e.g. "13/Mar/2025". */
export function fmtDate(ms: number): string {
  const d = new Date(ms);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTH_ABBR[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day}/${mon}/${year}`;
}
