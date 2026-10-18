import { useEffect, useMemo, useState } from 'react';
import CSVUpload from './components/CSVUpload';
import BudgetSetup from './components/BudgetSetup';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AuthPanel from './components/AuthPanel';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import {
  fetchLatestBudget,
  fetchTransactions,
  replaceTransactions,
  saveBudget,
  updateTransactionCategory,
} from './services/supabaseData';
import './App.css';

const TABS = ['Dashboard', 'Transactions', 'Budget'];

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [tab, setTab] = useState('Dashboard');
  const [fileName, setFileName] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [dataLoading, setDataLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const hasData = transactions.length > 0;
  const isOnlineMode = isSupabaseConfigured;

  const userLabel = useMemo(() => {
    if (!user?.email) return '';
    return user.email;
  }, [user]);

  useEffect(() => {
    if (!isOnlineMode || !supabase) {
      setAuthLoading(false);
      return;
    }

    let isActive = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isActive) return;
      if (error) {
        setErrorMessage(`Failed to check session: ${error.message}`);
      }
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setErrorMessage('');
      setStatusMessage('');
    });

    return () => {
      isActive = false;
      listener.subscription.unsubscribe();
    };
  }, [isOnlineMode]);

  useEffect(() => {
    if (!isOnlineMode || !user) return;

    let isActive = true;
    setDataLoading(true);
    setErrorMessage('');

    Promise.all([fetchTransactions(user.id), fetchLatestBudget(user.id)])
      .then(([loadedTransactions, loadedBudget]) => {
        if (!isActive) return;
        setTransactions(loadedTransactions);
        setBudgets(loadedBudget);
        setFileName('');
      })
      .catch(loadError => {
        if (!isActive) return;
        setErrorMessage(loadError.message || 'Failed to load your data.');
      })
      .finally(() => {
        if (!isActive) return;
        setDataLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isOnlineMode, user]);

  async function handleTransactions(txs, name) {
    setErrorMessage('');
    setStatusMessage('');
    setTransactions(txs);
    setFileName(name);
    setShowUpload(false);
    setTab('Dashboard');

    if (isOnlineMode && user) {
      try {
        await replaceTransactions(user.id, txs);
        const refreshed = await fetchTransactions(user.id);
        setTransactions(refreshed);
        setStatusMessage('Transactions synced to Supabase.');
      } catch (saveError) {
        setErrorMessage(saveError.message || 'Failed to sync transactions.');
      }
    }
  }

  async function handleCategoryChange(id, newCategory) {
    setErrorMessage('');
    setStatusMessage('');
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, category: newCategory } : t)
    );

    if (isOnlineMode && user) {
      try {
        await updateTransactionCategory(id, newCategory);
        setStatusMessage('Transaction category synced.');
      } catch (updateError) {
        setErrorMessage(updateError.message || 'Failed to sync category update.');
      }
    }
  }

  async function handleBudgetSave(newBudgets) {
    setErrorMessage('');
    setStatusMessage('');
    setBudgets(newBudgets);
    setTab('Dashboard');

    if (isOnlineMode && user) {
      try {
        await saveBudget(user.id, newBudgets);
        setStatusMessage('Budget synced to Supabase.');
      } catch (saveError) {
        setErrorMessage(saveError.message || 'Failed to sync budget.');
      }
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    setErrorMessage('');
    setStatusMessage('');
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(`Failed to sign out: ${error.message}`);
      return;
    }
    setTransactions([]);
    setBudgets({});
    setFileName('');
    setShowUpload(false);
    setStatusMessage('Signed out.');
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">💰</span>
          <h1>BudgetHelper</h1>
          {fileName && <span className="file-chip">{fileName}</span>}
        </div>
        <div className="header-right">
          {isOnlineMode && userLabel && (
            <span className="user-chip" title={userLabel}>
              {userLabel}
            </span>
          )}
          {isOnlineMode && user && (
            <button className="secondary-btn" onClick={handleSignOut}>
              Sign out
            </button>
          )}
          {hasData && (
            <button className="upload-btn" onClick={() => setShowUpload(p => !p)}>
              {showUpload ? '✕ Cancel' : '↑ Upload New CSV'}
            </button>
          )}
        </div>
      </header>

      {!isOnlineMode && (
        <div className="status-banner banner-info">
          Running in local mode. Add Supabase environment keys to enable cloud sync.
        </div>
      )}
      {statusMessage && <div className="status-banner banner-success">{statusMessage}</div>}
      {errorMessage && <div className="status-banner banner-error">{errorMessage}</div>}

      {isOnlineMode && authLoading && (
        <div className="auth-loading">Checking session…</div>
      )}

      {isOnlineMode && !authLoading && !user && (
        <div className="upload-section">
          <AuthPanel />
        </div>
      )}

      {isOnlineMode && user && dataLoading && (
        <div className="auth-loading">Loading your data…</div>
      )}

      {(!isOnlineMode || (user && !dataLoading)) && (!hasData || showUpload) && (
        <div className="upload-section">
          <div className="upload-hero">
            <h2>{hasData ? 'Upload a New CSV' : 'Welcome to BudgetHelper'}</h2>
            {!hasData && <p>Upload your bank or credit card CSV to start tracking your spending.</p>}
          </div>
          <CSVUpload onTransactions={handleTransactions} />
        </div>
      )}

      {(!isOnlineMode || (user && !dataLoading)) && hasData && !showUpload && (
        <>
          <nav className="tab-bar">
            {TABS.map(t => (
              <button
                key={t}
                className={"tab-btn" + (tab === t ? ' active' : '')}
                onClick={() => setTab(t)}
              >
                {t === 'Dashboard' && '📊 '}
                {t === 'Transactions' && '📋 '}
                {t === 'Budget' && '🎯 '}
                {t}
              </button>
            ))}
          </nav>

          <main className="app-main">
            {tab === 'Dashboard' && (
              <Dashboard transactions={transactions} budgets={budgets} />
            )}
            {tab === 'Transactions' && (
              <TransactionList
                transactions={transactions}
                onCategoryChange={handleCategoryChange}
              />
            )}
            {tab === 'Budget' && (
              <BudgetSetup budgets={budgets} onSave={handleBudgetSave} />
            )}
          </main>
        </>
      )}
    </div>
  );
}
