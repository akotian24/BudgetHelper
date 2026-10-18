import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from 'recharts';
import { summarizeByCategory } from '../utils/csvParser';
import './Dashboard.css';

const COLORS = { ok: '#22c55e', warning: '#f59e0b', over: '#ef4444' };

function statusColor(spent, limit) {
  if (!limit) return COLORS.ok;
  const pct = spent / limit;
  if (pct >= 1) return COLORS.over;
  if (pct >= 0.8) return COLORS.warning;
  return COLORS.ok;
}

function StatusBadge({ spent, limit }) {
  if (!limit) return null;
  const pct = spent / limit;
  if (pct >= 1) return <span className="badge badge-over">Over budget</span>;
  if (pct >= 0.8) return <span className="badge badge-warn">Near limit</span>;
  return <span className="badge badge-ok">On track</span>;
}

function ProgressBar({ spent, limit }) {
  if (!limit) return null;
  const pct = Math.min((spent / limit) * 100, 100);
  const color = statusColor(spent, limit);
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function Dashboard({ transactions, budgets }) {
  const totals = summarizeByCategory(transactions);
  const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);
  const totalLimit = budgets.total || 0;

  // Overall card
  const overallColor = statusColor(totalSpent, totalLimit);

  // Chart data — only show categories with spending or a budget
  const chartData = Object.entries(totals)
    .filter(([cat]) => totals[cat] > 0 || budgets[cat])
    .map(([cat, spent]) => ({
      cat,
      Spent: parseFloat(spent.toFixed(2)),
      Budget: budgets[cat] || null,
    }))
    .sort((a, b) => b.Spent - a.Spent);

  return (
    <div className="dashboard">
      {/* Overall summary */}
      <div className="summary-cards">
        <div className="card card-total" style={{ borderColor: overallColor }}>
          <div className="card-label">Total Spent</div>
          <div className="card-amount">${totalSpent.toFixed(2)}</div>
          {totalLimit > 0 && (
            <>
              <ProgressBar spent={totalSpent} limit={totalLimit} />
              <div className="card-sub">
                of ${totalLimit.toFixed(2)} budget
                &nbsp;·&nbsp;
                <StatusBadge spent={totalSpent} limit={totalLimit} />
              </div>
            </>
          )}
        </div>

        <div className="card card-count">
          <div className="card-label">Transactions</div>
          <div className="card-amount">{transactions.length}</div>
        </div>

        <div className="card card-avg">
          <div className="card-label">Avg per transaction</div>
          <div className="card-amount">
            ${transactions.length ? (totalSpent / transactions.length).toFixed(2) : '0.00'}
          </div>
        </div>

        {totalLimit > 0 && (
          <div className="card card-remaining" style={{ borderColor: totalSpent > totalLimit ? COLORS.over : COLORS.ok }}>
            <div className="card-label">{totalSpent > totalLimit ? 'Over by' : 'Remaining'}</div>
            <div className="card-amount" style={{ color: totalSpent > totalLimit ? COLORS.over : COLORS.ok }}>
              ${Math.abs(totalLimit - totalSpent).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Spending vs Budget chart */}
      <div className="chart-card">
        <h3>Spending vs Budget by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
            <XAxis dataKey="cat" angle={-35} textAnchor="end" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v, name) => [`$${v}`, name]} />
            <Legend verticalAlign="top" />
            <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.cat}
                  fill={statusColor(entry.Spent, entry.Budget)}
                />
              ))}
            </Bar>
            <Bar dataKey="Budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-category breakdown */}
      <div className="category-breakdown">
        <h3>Category Breakdown</h3>
        <div className="category-cards">
          {chartData.map(({ cat, Spent }) => (
            <div key={cat} className="cat-card" style={{ borderLeftColor: statusColor(Spent, budgets[cat]) }}>
              <div className="cat-name">{cat}</div>
              <div className="cat-spent">${Spent.toFixed(2)}</div>
              {budgets[cat] && (
                <>
                  <ProgressBar spent={Spent} limit={budgets[cat]} />
                  <div className="cat-sub">
                    of ${budgets[cat].toFixed(2)}
                    &nbsp;
                    <StatusBadge spent={Spent} limit={budgets[cat]} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
