import { useState } from 'react';
import { ALL_CATEGORIES } from '../utils/csvParser';
import './BudgetSetup.css';

export default function BudgetSetup({ budgets, onSave }) {
  const [totalLimit, setTotalLimit] = useState(budgets.total ?? '');
  const [categoryLimits, setCategoryLimits] = useState(
    () => Object.fromEntries(ALL_CATEGORIES.map(c => [c, budgets[c] ?? '']))
  );

  function handleCategoryChange(cat, val) {
    setCategoryLimits(prev => ({ ...prev, [cat]: val }));
  }

  function handleSave() {
    const parsed = { total: parseFloat(totalLimit) || 0 };
    for (const [cat, val] of Object.entries(categoryLimits)) {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) parsed[cat] = n;
    }
    onSave(parsed);
  }

  return (
    <div className="budget-setup">
      <h2>Set Your Budget</h2>

      <div className="budget-section">
        <h3>Total Monthly Limit</h3>
        <div className="input-row">
          <span className="currency">$</span>
          <input
            type="number"
            placeholder="e.g. 3000"
            value={totalLimit}
            onChange={e => setTotalLimit(e.target.value)}
            min="0"
          />
          <span className="unit">/ month</span>
        </div>
      </div>

      <div className="budget-section">
        <h3>Per-Category Limits <span className="optional">(optional)</span></h3>
        <div className="category-grid">
          {ALL_CATEGORIES.map(cat => (
            <div key={cat} className="category-input-row">
              <label>{cat}</label>
              <div className="input-row">
                <span className="currency">$</span>
                <input
                  type="number"
                  placeholder="No limit"
                  value={categoryLimits[cat]}
                  onChange={e => handleCategoryChange(cat, e.target.value)}
                  min="0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="save-btn" onClick={handleSave}>
        Save Budget →
      </button>
    </div>
  );
}
