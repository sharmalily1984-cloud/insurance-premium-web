import { useMemo, useState } from 'react';
import {
  expenseCalculated,
  expenseTotals,
  fmt2,
  type ExpenseRow,
  type ExpenseType,
} from '../engine/premiumEngine';

let idCounter = 0;
function newRow(): ExpenseRow {
  idCounter += 1;
  // Opens blank: Dependent so both Amount and %age start empty (Main would force 100).
  return { id: `row-${idCounter}`, name: '', type: 'Dependent', amount: null, pct: null };
}

function parseNum(text: string): number | null {
  const t = text.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function Section2() {
  const [rows, setRows] = useState<ExpenseRow[]>(() => [newRow()]);

  const totals = useMemo(() => expenseTotals(rows), [rows]);

  const update = (id: string, patch: Partial<ExpenseRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // Enforce: Main => pct locked to 100.
        if (next.type === 'Main') next.pct = 100;
        return next;
      }),
    );
  };

  const onTypeChange = (id: string, type: ExpenseType) => {
    // When switching to Main, force 100; when switching to Dependent, clear to blank.
    if (type === 'Main') {
      update(id, { type, pct: 100 });
    } else {
      update(id, { type, pct: null });
    }
  };

  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  return (
    <div>
      <div className="banner">Section 2 — Expense Calculation</div>
      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="text">Expense Name</th>
                <th>Expense Type</th>
                <th>Amount</th>
                <th>%age</th>
                <th>Calculated Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isMain = r.type === 'Main';
                return (
                  <tr key={r.id}>
                    <td className="text">
                      <input
                        className="cell-input text"
                        type="text"
                        value={r.name}
                        placeholder="Expense name"
                        onChange={(e) => update(r.id, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="cell-input"
                        value={r.type}
                        onChange={(e) =>
                          onTypeChange(r.id, e.target.value as ExpenseType)
                        }
                      >
                        <option value="Main">Main</option>
                        <option value="Dependent">Dependent</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="cell-input"
                        type="number"
                        min={0}
                        step="any"
                        value={r.amount ?? ''}
                        placeholder="0"
                        onChange={(e) =>
                          update(r.id, { amount: parseNum(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className={`cell-input${isMain ? ' locked' : ''}`}
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        readOnly={isMain}
                        value={r.pct ?? ''}
                        placeholder={isMain ? '100' : '0'}
                        onChange={(e) => {
                          if (isMain) return;
                          let v = parseNum(e.target.value);
                          if (v != null) v = Math.max(0, Math.min(100, v));
                          update(r.id, { pct: v });
                        }}
                      />
                    </td>
                    <td className="cell-calc">{fmt2(expenseCalculated(r))}</td>
                    <td>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => removeRow(r.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td className="text">Total</td>
                <td></td>
                <td>{fmt2(totals.totalAmount)}</td>
                <td></td>
                <td>{fmt2(totals.totalCalculated)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="btn-row">
          <button className="btn" type="button" onClick={addRow}>
            Add Row
          </button>
        </div>

        <p className="note">
          For 'Main' type, %age must be 100%. For 'Dependent' type, enter 0%–100%
          manually.
        </p>
      </div>
    </div>
  );
}
