// Self-check for the calculation engine. Asserts the acceptance values.
// Run with:  npx tsx src/engine/selfCheck.ts
// It is also imported by App.tsx so results log to the browser console in dev.

import {
  calculatePremium,
  expenseTotals,
  type ExpenseRow,
  type PremiumInputs,
} from './premiumEngine';

interface CheckResult {
  passed: boolean;
  failures: string[];
  lines: string[];
}

function approx(actual: number, expected: number, tol = 1e-4): boolean {
  return Math.abs(actual - expected) <= tol;
}

export function runSelfCheck(): CheckResult {
  const failures: string[] = [];
  const lines: string[] = [];

  const assert = (label: string, ok: boolean, detail: string) => {
    lines.push(`${ok ? 'PASS' : 'FAIL'}  ${label} — ${detail}`);
    if (!ok) failures.push(`${label} (${detail})`);
  };

  // --- Section 1 acceptance ---
  // Sum Insured is now the input; Annual Premium = 84000 / 12 = 7000.
  const inputs: PremiumInputs = {
    sumInsured: 84000,
    book: 'By Day',
    yearType: 'Leap Year',
    startDate: '2025-03-13',
    endDate: '2025-05-31',
  };
  const r = calculatePremium(inputs);

  assert(
    'Annual Premium',
    r.annualPremium != null && approx(r.annualPremium, 7000, 1e-6),
    `got ${r.annualPremium}`,
  );
  assert('Days in Year', r.daysInYear === 366, `got ${r.daysInYear}`);
  assert('Days Selected', r.daysSelected === 80, `got ${r.daysSelected}`);
  assert(
    'Annual Daily Premium',
    r.annualDailyPremium != null && approx(r.annualDailyPremium, 19.1257, 5e-4),
    `got ${r.annualDailyPremium}`,
  );
  assert(
    'Monthly Premium',
    r.monthlyPremium != null && approx(r.monthlyPremium, 583.3333, 5e-4),
    `got ${r.monthlyPremium}`,
  );

  // Month premiums: index 0 = March (start month).
  const mar = r.months[0].monthPremium;
  const apr = r.months[1].monthPremium;
  const may = r.months[2].monthPremium;
  assert('Mar premium', approx(mar, 363.388, 1e-3), `got ${mar}`);
  assert('Apr premium', approx(apr, 573.7705, 1e-3), `got ${apr}`);
  assert('May premium', approx(may, 592.8962, 1e-3), `got ${may}`);
  const others = r.months.slice(3).every((m) => m.monthPremium === 0);
  assert('Other months = 0', others, `${r.months.slice(3).map((m) => m.monthPremium).join(',')}`);

  const calc = typeof r.calculatedPremium === 'number' ? r.calculatedPremium : NaN;
  assert('Calculated Premium', approx(calc, 1530.0546, 1e-3), `got ${calc}`);

  // --- Section 2 acceptance ---
  const rows: ExpenseRow[] = [
    { id: 'a', name: 'A', type: 'Main', amount: 3000, pct: 100 },
    { id: 'b', name: 'B', type: 'Dependent', amount: 581.44, pct: 15 },
    { id: 'c', name: 'C', type: 'Dependent', amount: 2250, pct: 12 },
  ];
  const totals = expenseTotals(rows);
  assert('Total Amount', approx(totals.totalAmount, 5831.44, 1e-6), `got ${totals.totalAmount}`);
  assert('Total Calculated', approx(totals.totalCalculated, 3357.216, 1e-6), `got ${totals.totalCalculated}`);

  return { passed: failures.length === 0, failures, lines };
}

// When executed directly (tsx/node), print results and set exit code.
// Access `process` via globalThis so this file also typechecks in the browser
// build (whose tsconfig does not include Node types).
const proc = (globalThis as { process?: { argv?: string[]; exit?: (n: number) => void } })
  .process;

const isDirectRun =
  proc != null &&
  Array.isArray(proc.argv) &&
  proc.argv[1] != null &&
  import.meta.url === `file://${proc.argv[1]}`;

if (isDirectRun) {
  const result = runSelfCheck();
  for (const line of result.lines) console.log(line);
  console.log(result.passed ? '\nSELF-CHECK PASSED ✓' : '\nSELF-CHECK FAILED ✗');
  proc.exit?.(result.passed ? 0 : 1);
}
