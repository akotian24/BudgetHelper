import { useRef, useState } from 'react';
import { parseCSV } from '../utils/csvParser';
import './CSVUpload.css';

export default function CSVUpload({ onTransactions }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) {
      setError('Please upload a .csv file.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const transactions = await parseCSV(file);
      if (!transactions.length) {
        setError('No expense transactions found. Make sure the CSV has date, description, and amount columns.');
      } else {
        onTransactions(transactions, file.name);
      }
    } catch (e) {
      setError(e.message || 'Failed to parse file.');
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="upload-wrapper">
      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
      >
        <div className="drop-icon">📂</div>
        {loading ? (
          <p className="drop-text">Parsing transactions…</p>
        ) : (
          <>
            <p className="drop-text">Drag &amp; drop your bank CSV here</p>
            <p className="drop-sub">or click to browse</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {error && <p className="upload-error">{error}</p>}

      <div className="bank-hints">
        <p>Works with CSV exports from:</p>
        <div className="bank-tags">
          {['Chase', 'Amex', 'Bank of America', 'Wells Fargo', 'Citi', 'Capital One', 'Discover'].map(b => (
            <span key={b} className="bank-tag">{b}</span>
          ))}
        </div>
        <p className="hint-text">
          In your bank website → Activity / Statements → Download / Export → Choose CSV
        </p>
      </div>
    </div>
  );
}
