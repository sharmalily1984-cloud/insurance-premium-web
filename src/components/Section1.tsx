import { useMemo, useState } from 'react';
import {
  annualPremiumFrom,
  calculatePremium,
  fmt2,
  fmtDate,
  type CalculationBook,
  type PremiumInputs,
  type PremiumResult,
  type YearType,
} from '../engine/premiumEngine';

interface Section1Props {
  book: CalculationBook | '';
  setBook: (v: CalculationBook | '') => void;
  yearType: YearType | '';
  setYearType: (v: YearType | '') => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  aalLimitText: string;
  setAalLimitText: (v: string) => void;
  fulLimitText: string;
  setFulLimitText: (v: string) => void;
  siDthText: string;
  setSiDthText: (v: string) => void;
  siTpdText: string;
  setSiTpdText: (v: string) => void;
  siIpText: string;
  setSiIpText: (v: string) => void;
}

function ReadOnly({ value }: { value: string }) {
  return <input className="field calc" readOnly value={value} tabIndex={-1} />;
}

function numOrNa(value: number | 'N/A'): string {
  return value === 'N/A' ? 'N/A' : fmt2(value);
}

/** Strip commas; keep digits and a single dot; trim to at most 2 decimals. */
export function sanitizeMoney(raw: string): string {
  let s = raw.replace(/,/g, '').replace(/[^0-9.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    const intPart = s.slice(0, firstDot);
    const decPart = s.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
    s = `${intPart}.${decPart}`;
  }
  return s;
}

/** Parse a (possibly comma-formatted) money string to a number or null. */
export function parseMoney(text: string): number | null {
  const s = text.replace(/,/g, '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Validation message for a SI field against AAL/FUL limits. */
function siValidationMsg(
  siValue: number | null,
  aalLimit: number | null,
  fulLimit: number | null,
): string | null {
  if (siValue == null || siValue <= 0) return null;
  if (aalLimit != null && siValue > aalLimit) {
    return 'Sum Insured cannot exceed the AAL Limit. The remaining amount should go in an additional rider.';
  }
  if (fulLimit != null && siValue > fulLimit) {
    return 'Sum Insured exceeds the FUL Limit. The remaining amount must be provided through a new rider.';
  }
  return null;
}

/** Money input with focus/blur formatting. */
function MoneyInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const parsed = parseMoney(value);
  const display = focused
    ? value.replace(/,/g, '')
    : parsed != null
      ? fmt2(parsed)
      : '';

  return (
    <input
      id={id}
      className="field input"
      type="text"
      inputMode="decimal"
      placeholder={placeholder ?? ''}
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(sanitizeMoney(e.target.value))}
    />
  );
}

/** Helper to display a calculated premium value. */
function calcDisplay(r: PremiumResult): string {
  return typeof r.calculatedPremium === 'number'
    ? fmt2(r.calculatedPremium)
    : r.calculatedPremium;
}

export default function Section1(props: Section1Props) {
  const {
    book,
    setBook,
    yearType,
    setYearType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    aalLimitText,
    setAalLimitText,
    fulLimitText,
    setFulLimitText,
    siDthText,
    setSiDthText,
    siTpdText,
    setSiTpdText,
    siIpText,
    setSiIpText,
  } = props;

  // Parse limits
  const aalLimit = parseMoney(aalLimitText);
  const fulLimit = parseMoney(fulLimitText);

  // Parse individual SI values
  const siDth = parseMoney(siDthText);
  const siTpd = parseMoney(siTpdText);
  const siIp = parseMoney(siIpText);

  // Calculate Annual Premium for each SI field
  const apDth = annualPremiumFrom(siDth);
  const apTpd = annualPremiumFrom(siTpd);
  const apIp = annualPremiumFrom(siIp);

  // Validation messages for each SI field
  const dthMsg = siValidationMsg(siDth, aalLimit, fulLimit);
  const tpdMsg = siValidationMsg(siTpd, aalLimit, fulLimit);
  const ipMsg = siValidationMsg(siIp, aalLimit, fulLimit);

  // --- Run engine for each SI field (DTH/TPD/IP) ---
  const inputsDth: PremiumInputs = useMemo(
    () => ({ sumInsured: siDth, book, yearType, startDate, endDate }),
    [siDth, book, yearType, startDate, endDate],
  );
  const inputsTpd: PremiumInputs = useMemo(
    () => ({ sumInsured: siTpd, book, yearType, startDate, endDate }),
    [siTpd, book, yearType, startDate, endDate],
  );
  const inputsIp: PremiumInputs = useMemo(
    () => ({ sumInsured: siIp, book, yearType, startDate, endDate }),
    [siIp, book, yearType, startDate, endDate],
  );

  const rDth = useMemo(() => calculatePremium(inputsDth), [inputsDth]);
  const rTpd = useMemo(() => calculatePremium(inputsTpd), [inputsTpd]);
  const rIp = useMemo(() => calculatePremium(inputsIp), [inputsIp]);

  // Status: pick first result that has a SI entered
  const statusResult = siDth != null ? rDth : siTpd != null ? rTpd : rDth;

  return (
    <div>
      <div className="banner">Section 1 — Insurance Premium Calculation</div>
      <div className="panel">

        {/* --- Top sections in a 2×2 horizontal grid --- */}
        <div className="top-grid">
          {/* Column 1, Row 1: Limits */}
          <div className="top-card">
            <div className="card-title">Limits</div>
            <div className="compact-grid">
              <label htmlFor="aalLimit">AAL Limit</label>
              <MoneyInput id="aalLimit" value={aalLimitText} onChange={setAalLimitText} placeholder="Optional" />
              <label htmlFor="fulLimit">FUL Limit</label>
              <MoneyInput id="fulLimit" value={fulLimitText} onChange={setFulLimitText} placeholder="Optional" />
            </div>
          </div>

          {/* Column 2, Row 1: Sum Insured */}
          <div className="top-card">
            <div className="card-title">Sum Insured</div>
            <div className="compact-grid">
              <label htmlFor="siDth">SI_DTH</label>
              <MoneyInput id="siDth" value={siDthText} onChange={setSiDthText} placeholder="e.g. 120,000" />
              {dthMsg && (<><span /><div className="validation-msg">{dthMsg}</div></>)}
              <label htmlFor="siTpd">SI_TPD</label>
              <MoneyInput id="siTpd" value={siTpdText} onChange={setSiTpdText} placeholder="e.g. 60,000" />
              {tpdMsg && (<><span /><div className="validation-msg">{tpdMsg}</div></>)}
              <label htmlFor="siIp">SI_IP</label>
              <MoneyInput id="siIp" value={siIpText} onChange={setSiIpText} placeholder="e.g. 36,000" />
              {ipMsg && (<><span /><div className="validation-msg">{ipMsg}</div></>)}
            </div>
          </div>

          {/* Column 1, Row 2: Annual Premium */}
          <div className="top-card">
            <div className="card-title">Annual Premium</div>
            <div className="compact-grid">
              <label>AP_DTH</label>
              <ReadOnly value={apDth != null ? fmt2(apDth) : ''} />
              <label>AP_TPD</label>
              <ReadOnly value={apTpd != null ? fmt2(apTpd) : ''} />
              <label>AP_IP</label>
              <ReadOnly value={apIp != null ? fmt2(apIp) : ''} />
            </div>
          </div>

          {/* Column 2, Row 2: Premium Calculation */}
          <div className="top-card">
            <div className="card-title">Premium Calculation</div>
            <div className="compact-grid">
              <label htmlFor="book">Calculation Book</label>
              <select id="book" className="field input" value={book} onChange={(e) => setBook(e.target.value as CalculationBook)}>
                <option value="Smooth">Smooth</option>
                <option value="By Day">By Day</option>
              </select>
              <label htmlFor="yearType">Year Type</label>
              <select id="yearType" className="field input" value={yearType} onChange={(e) => setYearType(e.target.value as YearType)}>
                <option value="Leap Year">Leap Year</option>
                <option value="Non-Leap Year">Non-Leap Year</option>
              </select>
              <label htmlFor="start">Start Date</label>
              <input id="start" className="field input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <label htmlFor="end">End Date</label>
              <input id="end" className="field input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <label>Days in Year</label>
              <ReadOnly value={rDth.daysInYear == null ? '' : String(rDth.daysInYear)} />
              <label>Days Selected</label>
              <ReadOnly value={rDth.daysSelected == null ? '' : String(rDth.daysSelected)} />
            </div>
          </div>
        </div>

        {/* --- Calculated Values (DTH / TPD / IP) --- */}
        <div className="subhead">Calculated Values (DTH / TPD / IP)</div>
        <div className="triple-grid">
          <div className="triple-header" />
          <div className="triple-header">DTH</div>
          <div className="triple-header">TPD</div>
          <div className="triple-header">IP</div>

          <label>Annual Daily Premium</label>
          <ReadOnly value={rDth.annualDailyPremium == null ? '' : fmt2(rDth.annualDailyPremium)} />
          <ReadOnly value={rTpd.annualDailyPremium == null ? '' : fmt2(rTpd.annualDailyPremium)} />
          <ReadOnly value={rIp.annualDailyPremium == null ? '' : fmt2(rIp.annualDailyPremium)} />

          <label>Monthly Premium</label>
          <ReadOnly value={rDth.monthlyPremium == null ? '' : fmt2(rDth.monthlyPremium)} />
          <ReadOnly value={rTpd.monthlyPremium == null ? '' : fmt2(rTpd.monthlyPremium)} />
          <ReadOnly value={rIp.monthlyPremium == null ? '' : fmt2(rIp.monthlyPremium)} />

          <label>Calculated Premium</label>
          <ReadOnly value={calcDisplay(rDth)} />
          <ReadOnly value={calcDisplay(rTpd)} />
          <ReadOnly value={calcDisplay(rIp)} />

          <label>Smooth Method</label>
          <ReadOnly value={numOrNa(rDth.smoothMethod)} />
          <ReadOnly value={numOrNa(rTpd.smoothMethod)} />
          <ReadOnly value={numOrNa(rIp.smoothMethod)} />

          <label>By Day Method</label>
          <ReadOnly value={numOrNa(rDth.byDayMethod)} />
          <ReadOnly value={numOrNa(rTpd.byDayMethod)} />
          <ReadOnly value={numOrNa(rIp.byDayMethod)} />

          <label>Difference</label>
          <ReadOnly value={numOrNa(rDth.difference)} />
          <ReadOnly value={numOrNa(rTpd.difference)} />
          <ReadOnly value={numOrNa(rIp.difference)} />
        </div>

        <div className="compact-grid" style={{ marginTop: 10, maxWidth: 400 }}>
          <label>Status</label>
          <div className={`status ${statusResult.status.kind}`}>{statusResult.status.text}</div>
        </div>

        {/* --- Month Calculation Helper --- */}
        <div className="subhead">Month Calculation Helper</div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th rowSpan={2}>Month #</th>
                <th rowSpan={2}>Month Start</th>
                <th rowSpan={2}>Month End</th>
                <th rowSpan={2}>Days in Month</th>
                <th rowSpan={2}>Covered Days</th>
                <th colSpan={3}>Month Premium</th>
              </tr>
              <tr>
                <th>DTH</th>
                <th>TPD</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {rDth.months.map((m, idx) => {
                const hasDates = m.monthStartMs !== 0 || m.monthEndMs !== 0;
                return (
                  <tr key={m.monthNumber}>
                    <td>{m.monthNumber}</td>
                    <td>{hasDates ? fmtDate(m.monthStartMs) : ''}</td>
                    <td>{hasDates ? fmtDate(m.monthEndMs) : ''}</td>
                    <td>{hasDates ? m.daysInMonth : ''}</td>
                    <td>{hasDates ? m.coveredDays : ''}</td>
                    <td>{fmt2(rDth.months[idx].monthPremium)}</td>
                    <td>{fmt2(rTpd.months[idx].monthPremium)}</td>
                    <td>{fmt2(rIp.months[idx].monthPremium)}</td>
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
