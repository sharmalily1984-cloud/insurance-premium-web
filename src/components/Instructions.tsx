export default function Instructions() {
  return (
    <div>
      <div className="banner">Instructions...!</div>
      <div className="panel instructions">
        <h3>Section 1 — Insurance Premium Calculation</h3>

        <h4>Limits (Optional)</h4>
        <p>
          <strong>Auto Acceptance Limit (AAL)</strong> and{' '}
          <strong>Forward Underwriting Limit (FUL)</strong> are optional numeric
          fields. When configured, they validate Sum Insured entries:
        </p>
        <ul>
          <li>
            <strong>Auto Acceptance Limit (AAL)</strong> — Sum Insured cannot
            exceed this value. If exceeded, a message indicates the remaining
            amount should go in an additional rider.
          </li>
          <li>
            <strong>Forward Underwriting Limit (FUL)</strong> — If Sum Insured
            exceeds this, a message indicates the remaining amount must be
            provided through a new rider.
          </li>
        </ul>
        <p>
          AAL validation takes priority over FUL. When both fields are blank, no
          limit validation applies and all fields behave as normal.
        </p>

        <h4>Sum Insured (DTH / TPD / IP)</h4>
        <p>
          Enter values for each category independently:
        </p>
        <ul>
          <li><strong>SI_DTH</strong> — Death benefit sum insured</li>
          <li><strong>SI_TPD</strong> — Total Permanent Disability sum insured</li>
          <li><strong>SI_IP</strong> — Income Protection sum insured</li>
        </ul>
        <p>
          Each field is validated independently against the configured AAL/FUL
          limits.
        </p>

        <h4>Annual Premium (DTH / TPD / IP)</h4>
        <p>
          Calculated automatically (read-only) as Sum Insured ÷ 12:
        </p>
        <ul>
          <li>AP_DTH = SI_DTH ÷ 12</li>
          <li>AP_TPD = SI_TPD ÷ 12</li>
          <li>AP_IP = SI_IP ÷ 12</li>
        </ul>

        <h4>Premium Calculation</h4>
        <p>
          Select a <strong>Calculation Book</strong>, <strong>Year Type</strong>,
          and date range. The method determines how month premiums are computed:
        </p>
        <ul>
          <li>
            <strong>By Day</strong> = Annual Premium ÷ Days-in-Year × Covered
            Days per month.
          </li>
          <li>
            <strong>Smooth</strong> = Annual Premium ÷ 12 ÷ Days-in-Month ×
            Covered Days (monthly prorating).
          </li>
        </ul>
        <p>
          <strong>Year Type</strong> sets Days in Year to <strong>366</strong>{' '}
          (Leap) or <strong>365</strong> (Non-Leap). The number of days selected
          is inclusive of both Start and End dates.
        </p>

        <h4>Calculated Values (DTH / TPD / IP)</h4>
        <p>
          Each value is computed independently per Sum Insured category:
        </p>
        <ul>
          <li><strong>Annual Daily Premium</strong> = Annual Premium ÷ Days in Year</li>
          <li><strong>Monthly Premium</strong> = Annual Premium ÷ 12</li>
          <li><strong>Calculated Premium</strong> = sum of all month premiums from Start to End</li>
          <li><strong>Smooth Method</strong> = Calculated Premium when book is Smooth, else N/A</li>
          <li><strong>By Day Method</strong> = Calculated Premium when book is By Day, else N/A</li>
        </ul>

        <h4>Month Calculation Helper</h4>
        <p>
          The table shows all months from Start Date to End Date (minimum 12
          rows). When the range exceeds 12 months, pagination is provided with
          12 rows per page. The <strong>Month Premium</strong> column contains
          three sub-columns (DTH, TPD, IP) — each calculated from its respective
          Annual Premium.
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
