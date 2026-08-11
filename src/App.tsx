import { useEffect, useState } from 'react';
import Section1 from './components/Section1';
import Section2 from './components/Section2';
import Instructions from './components/Instructions';
import { runSelfCheck } from './engine/selfCheck';
import {
  type CalculationBook,
  type ExpenseRow,
  type YearType,
} from './engine/premiumEngine';

type Tab = 'calculator' | 'instructions';

// Row factory for the expense table (module-level counter for stable ids).
let idCounter = 0;
export function makeRow(): ExpenseRow {
  idCounter += 1;
  // Opens blank: Dependent so both Amount and %age start empty (Main would force 100).
  return { id: `row-${idCounter}`, name: '', type: 'Dependent', amount: null, pct: null };
}

// Initial-state factories — used on first mount and by Reset.
const initialBook: CalculationBook = 'By Day';
const initialYearType: YearType = 'Leap Year';

export default function App() {
  const [tab, setTab] = useState<Tab>('calculator');

  // --- All calculator + expense state lifted here so it persists across tab
  //     switches (both tabs share this parent). A full page refresh remounts
  //     App and starts blank — no localStorage/sessionStorage involved. ---
  const [sumInsuredText, setSumInsuredText] = useState('');
  const [book, setBook] = useState<CalculationBook | ''>(initialBook);
  const [yearType, setYearType] = useState<YearType | ''>(initialYearType);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState<ExpenseRow[]>(() => [makeRow()]);

  // Log the engine self-check to the browser console in dev.
  useEffect(() => {
    const result = runSelfCheck();
    for (const line of result.lines) console.log(line);
    console.log(
      result.passed
        ? 'Insurance Premium Calculator — SELF-CHECK PASSED ✓'
        : 'Insurance Premium Calculator — SELF-CHECK FAILED ✗',
    );
  }, []);

  const handleReset = () => {
    if (!window.confirm('Reset all data?')) return;
    setSumInsuredText('');
    setBook(initialBook);
    setYearType(initialYearType);
    setStartDate('');
    setEndDate('');
    setRows([makeRow()]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Insurance Premium Calculator</h1>
        <button className="btn reset-btn" type="button" onClick={handleReset}>
          Reset
        </button>
      </header>

      <div className="tabs">
        <button
          className={`tab ${tab === 'calculator' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('calculator')}
        >
          Premium Calculator
        </button>
        <button
          className={`tab ${tab === 'instructions' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('instructions')}
        >
          Instructions
        </button>
      </div>

      {tab === 'calculator' ? (
        <>
          <Section1
            sumInsuredText={sumInsuredText}
            setSumInsuredText={setSumInsuredText}
            book={book}
            setBook={setBook}
            yearType={yearType}
            setYearType={setYearType}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
          <Section2 rows={rows} setRows={setRows} />
        </>
      ) : (
        <Instructions />
      )}
    </div>
  );
}
