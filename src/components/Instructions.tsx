export default function Instructions() {
  return (
    <div>
      <div className="banner">Instruction Guide</div>
      <div className="panel instructions">
        <h3>Section 1 — Insurance Premium Calculation</h3>
        <p>
          Enter a positive <strong>Sum Insured</strong>. The{' '}
          <strong>Annual Premium</strong> is calculated automatically as Sum
          Insured ÷ 12. The calculation method depends on the{' '}
          <strong>Calculation Book</strong>:
        </p>
        <ul>
          <li>
            <strong>By Day</strong> = Annual ÷ Days-in-Year × Covered Days.
          </li>
          <li>
            <strong>Smooth</strong> = monthly prorating (monthly premium spread
            across the days of each month).
          </li>
        </ul>
        <p>
          <strong>Year Type</strong> sets Days in Year to <strong>366</strong>{' '}
          (Leap) or <strong>365</strong> (Non-Leap). Enter <strong>Start</strong>{' '}
          and <strong>End</strong> dates; the number of days selected is inclusive
          of both ends. The Calculated Premium is the sum of the twelve monthly
          values in the Month Calculation Helper.
        </p>

        <h3>Section 2 — Expense Calculation</h3>
        <p>
          <strong>Main</strong> is always 100% (the %age cell is locked).{' '}
          <strong>Dependent</strong> accepts a manual 0%–100% value. Calculated
          Amount = Amount × (%age ÷ 100). Use <strong>Add Row</strong> and{' '}
          <strong>Remove</strong> to change the list; totals recompute live.
        </p>

        <h3>Legend</h3>
        <div className="legend">
          <span>
            <span className="swatch input" />
            Yellow = input
          </span>
          <span>
            <span className="swatch calc" />
            Grey = calculated
          </span>
        </div>
      </div>
    </div>
  );
}
