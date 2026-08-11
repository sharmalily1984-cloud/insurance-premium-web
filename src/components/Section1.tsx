import { useMemo, useState } from 'react';
import {
  calculatePremium,
  fmt2,
  fmtDate,
  type CalculationBook,
  type PremiumInputs,
  type YearType,
} from '../engine/premiumEngine';

function ReadOnly({ value }: { value: string }) {
  return <input className="field calc" readOnly value={value} tabIndex={-1} />;
}

function numOrNa(value: number | 'N/A'): string {
  return value === 'N/A' ? 'N/A' : fmt2(value);
}

export default function Section1() {
  const [annualPremiumText, setAnnualPremiumText] = useState('');
  const [book, setBook] = useState<CalculationBook | ''>('By Day');
  const [yearType, setYearType] = useState<YearType | ''>('Leap Year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const inputs: PremiumInputs = useMemo(() => {
    const trimmed = annualPremiumText.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    const annualPremium =
      parsed != null && Number.isFinite(parsed) ? parsed : null;
    return { annualPremium, book, yearType, startDate, endDate };
  }, [annualPremiumText, book, yearType, startDate, endDate]);

  const r = useMemo(() => calculatePremium(inputs), [inputs]);

  const calcPremiumDisplay =
    typeof r.calculatedPremium === 'number'
      ? fmt2(r.calculatedPremium)
      : r.calculatedPremium;

  return (
    <div>
      <div className="banner">Section 1 — Insurance Premium Calculation</div>
      <div className="panel">
        <div className="field-grid">
          <label htmlFor="annual">Annual Premium</label>
          <input
            id="annual"
            className="field input"
            type="number"
            min={0}
            step="any"
            placeholder="e.g. 7000"
            value={annualPremiumText}
            onChange={(e) => setAnnualPremiumText(e.target.value)}
          />

          <label htmlFor="book">Calculation Book</label>
          <select
            id="book"
            className="field input"
            value={book}
            onChange={(e) => setBook(e.target.value as CalculationBook)}
          >
            <option value="Smooth">Smooth</option>
            <option value="By Day">By Day</option>
          </select>

          <label htmlFor="yearType">Year Type</label>
          <select
            id="yearType"
            className="field input"
            value={yearType}
            onChange={(e) => setYearType(e.target.value as YearType)}
          >
            <option value="Leap Year">Leap Year</option>
            <option value="Non-Leap Year">Non-Leap Year</option>
          </select>

          <label htmlFor="start">Start Date</label>
          <input
            id="start"
            className="field input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label htmlFor="end">End Date</label>
          <input
            id="end"
            className="field input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <label>Days in Year</label>
          <ReadOnly value={r.daysInYear == null ? '' : String(r.daysInYear)} />

          <label>Number of Days Selected</label>
          <ReadOnly value={r.daysSelected == null ? '' : String(r.daysSelected)} />

          <label>Annual Daily Premium</label>
          <ReadOnly
            value={r.annualDailyPremium == null ? '' : fmt2(r.annualDailyPremium)}
          />

          <label>Monthly Premium</label>
          <ReadOnly value={r.monthlyPremium == null ? '' : fmt2(r.monthlyPremium)} />

          <label>Calculated Premium</label>
          <ReadOnly value={calcPremiumDisplay} />

          <label>Status</label>
          <div className={`status ${r.status.kind}`}>{r.status.text}</div>

          <label>Smooth Method</label>
          <ReadOnly value={numOrNa(r.smoothMethod)} />

          <label>By Day Method</label>
          <ReadOnly value={numOrNa(r.byDayMethod)} />

          <label>Difference</label>
          <ReadOnly value={numOrNa(r.difference)} />
        </div>

        <div className="subhead">Month Calculation Helper</div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Month #</th>
                <th>Month Start</th>
                <th>Month End</th>
                <th>Days in Month</th>
                <th>Covered Days</th>
                <th>Month Premium</th>
              </tr>
            </thead>
            <tbody>
              {r.months.map((m) => {
                const hasDates = m.monthStartMs !== 0 || m.monthEndMs !== 0;
                return (
                  <tr key={m.monthNumber}>
                    <td>{m.monthNumber}</td>
                    <td>{hasDates ? fmtDate(m.monthStartMs) : ''}</td>
                    <td>{hasDates ? fmtDate(m.monthEndMs) : ''}</td>
                    <td>{hasDates ? m.daysInMonth : ''}</td>
                    <td>{hasDates ? m.coveredDays : ''}</td>
                    <td>{fmt2(m.monthPremium)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
