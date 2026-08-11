import { useEffect, useState } from 'react';
import Section1 from './components/Section1';
import Section2 from './components/Section2';
import Instructions from './components/Instructions';
import { runSelfCheck } from './engine/selfCheck';

type Tab = 'calculator' | 'instructions';

export default function App() {
  const [tab, setTab] = useState<Tab>('calculator');

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

  return (
    <div className="app">
      <h1 className="app-title">Insurance Premium Calculator</h1>

      <div className="tabs">
        <button
          className={`tab ${tab === 'calculator' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('calculator')}
        >
          Calculator
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
          <Section1 />
          <Section2 />
        </>
      ) : (
        <Instructions />
      )}
    </div>
  );
}
