import { useState, useMemo } from 'react';
import { ALL_CATEGORIES, categorize } from '../utils/csvParser';
import './TransactionList.css';

export default function TransactionList({ transactions, onCategoryChange }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  const displayed = useMemo(() => {
    let list = [...transactions];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q));
    }
    if (filterCat !== 'All') {
      list = list.filter(t => t.category === filterCat);
    }

    list.sort((a, b) => {
      if (sortBy === 'date') return sortAsc ? a.date - b.date : b.date - a.date;
      if (sortBy === 'amount') return sortAsc ? a.amount - b.amount : b.amount - a.amount;
      if (sortBy === 'description') {
        return sortAsc
          ? a.description.localeCompare(b.description)
          : b.description.localeCompare(a.description);
      }
      return 0;
    });

    return list;
  }, [transactions, search, filterCat, sortBy, sortAsc]);

  function toggleSort(col) {
    if (sortBy === col) setSortAsc(p => !p);
    else { setSortBy(col); setSortAsc(false); }
  }

  function SortIcon({ col }) {
    if (sortBy !== col) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sortAsc ? '↑' : '↓'}</span>;
  }

  return (
    <div className="tx-list">
      <div className="tx-filters">
        <input
          className="tx-search"
          placeholder="Search transactions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="tx-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="All">All categories</option>
          {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="tx-count">{displayed.length} transactions</span>
      </div>

      <div className="tx-table-wrapper">
        <table className="tx-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('date')}>Date <SortIcon col="date" /></th>
              <th onClick={() => toggleSort('description')}>Description <SortIcon col="description" /></th>
              <th>Category</th>
              <th onClick={() => toggleSort('amount')}>Amount <SortIcon col="amount" /></th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(t => (
              <tr key={t.id}>
                <td className="tx-date">{t.date.toLocaleDateString()}</td>
                <td className="tx-desc">{t.description || '—'}</td>
                <td>
                  <select
                    className="cat-select"
                    value={t.category}
                    onChange={e => onCategoryChange(t.id, e.target.value)}
                  >
                    {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td className="tx-amount">${t.amount.toFixed(2)}</td>
              </tr>
            ))}
            {!displayed.length && (
              <tr><td colSpan={4} className="tx-empty">No transactions match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
