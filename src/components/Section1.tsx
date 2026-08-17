import { useMemo, useState } from 'react';
import {
  annualPremiumFrom,
  calculatePremium,
  fmt2,
  fmtDate,
  type CalculationBook,
  type PremiumInputs,
  type YearType,
} from '../engine/premiumEngine';

interface Section1Props {
  sumInsuredText: string;
  setSumInsuredText: (v: string) => void;
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

export default function Section1(props: Section1Props) {
  const {
    sumInsuredText,
    setSumInsuredText,
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

  const [sumFocused, setSumFocused] = useState(false);

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

  // --- Existing Sum Insured / engine logic (unchanged) ---
  const inputs: PremiumInputs = useMemo(
    () => ({
      sumInsured: parseMoney(sumInsuredText),
      book,
      yearType,
      startDate,
      endDate,
    }),
    [sumInsuredText, book, yearType, startDate, endDate],
  );

  const r = useMemo(() => calculatePremium(inputs), [inputs]);

  // While editing show the raw sanitized value; when blurred show currency format.
  const sumParsed = parseMoney(sumInsuredText);
  const sumDisplay = sumFocused
    ? sumInsuredText.replace(/,/g, '')
    : sumParsed != null
      ? fmt2(sumParsed)
      : '';

  const calcPremiumDisplay =
    typeof r.calculatedPremium === 'number'
      ? fmt2(r.calculatedPremium)
      : r.calculatedPremium;

  return (
    <div>
      <div className="banner">Section 1 — Insurance Premium Calculation</div>
      <div className="panel">

        {/* --- AAL / FUL Limits --- */}
        <div className="subhead">Limits</div>
        <div className="field-grid">
          <label htmlFor="aalLimit">AAL Limit</label>
          <MoneyInput
            id="aalLimit"
            value={aalLimitText}
            onChange={setAalLimitText}
            placeholder="Optional"
          />

          <label htmlFor="fulLimit">FUL Limit</label>
          <MoneyInput
            id="fulLimit"
            value={fulLimitText}
            onChange={setFulLimitText}
            placeholder="Optional"
          />
        </div>

        {/* --- Sum Insured (DTH / TPD / IP) --- */}
        <div className="subhead">Sum Insured</div>
        <div className="field-grid">
          <label htmlFor="siDth">SI_DTH</label>
          <MoneyInput
            id="siDth"
            value={siDthText}
            onChange={setSiDthText}
            placeholder="e.g. 120,000.00"
          />
          {dthMsg && (
            <>
              <span />
              <div className="validation-msg">{dthMsg}</div>
            </>
          )}

          <label htmlFor="siTpd">SI_TPD</label>
          <MoneyInput
            id="siTpd"
            value={siTpdText}
            onChange={setSiTpdText}
            placeholder="e.g. 60,000.00"
          />
          {tpdMsg && (
            <>
              <span />
              <div className="validation-msg">{tpdMsg}</div>
            </>
          )}

          <label htmlFor="siIp">SI_IP</label>
          <MoneyInput
            id="siIp"
            value={siIpText}
            onChange={setSiIpText}
            placeholder="e.g. 36,000.00"
          />
          {ipMsg && (
            <>
              <span />
              <div className="validation-msg">{ipMsg}</div>
            </>
          )}
        </div>

        {/* --- Annual Premium (DTH / TPD / IP) — read-only --- */}
        <div className="subhead">Annual Premium</div>
        <div className="field-grid">
          <label>AP_DTH</label>
          <ReadOnly value={apDth != null ? fmt2(apDth) : ''} />

          <label>AP_TPD</label>
          <ReadOnly value={apTpd != null ? fmt2(apTpd) : ''} />

          <label>AP_IP</label>
          <ReadOnly value={apIp != null ? fmt2(apIp) : ''} />
        </div>

        {/* --- Existing Sum Insured + Premium Calculation fields --- */}
        <div className="subhead">Premium Calculation</div>
        <div className="field-grid">
          <label htmlFor="sumInsured">Sum Insured</label>
          <input
            id="sumInsured"
            className="field input"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 84,000.00"
            value={sumDisplay}
            onFocus={() => setSumFocused(true)}
            onBlur={() => setSumFocused(false)}
            onChange={(e) => setSumInsuredText(sanitizeMoney(e.target.value))}
          />

          <label>Annual Premium</label>
          <ReadOnly value={r.annualPremium == null ? '' : fmt2(r.annualPremium)} />

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
