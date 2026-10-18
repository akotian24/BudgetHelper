import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import './AuthPanel.css';

export default function AuthPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [authMethod, setAuthMethod] = useState('magic-link');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const submitLabel = useMemo(
    () => {
      if (authMethod === 'magic-link') return 'Send magic link';
      return mode === 'signin' ? 'Sign in' : 'Create account';
    },
    [authMethod, mode],
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }
    if (authMethod === 'password' && !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }

      if (authMethod === 'magic-link') {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (otpError) throw otpError;
        setMessage('Magic link sent. Check your email and open the link on this device to sign in.');
        setPassword('');
      } else if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setMessage('Account created. If email confirmation is enabled, confirm your email before signing in.');
      }
    } catch (submitError) {
      setError(submitError.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-panel">
      <h2>{mode === 'signin' ? 'Sign in to BudgetHelper' : 'Create your BudgetHelper account'}</h2>
      <p>Use the same account on both devices so your data stays in sync.</p>
      <div className="auth-method-switch">
        <button
          type="button"
          className={authMethod === 'magic-link' ? 'active' : ''}
          onClick={() => setAuthMethod('magic-link')}
        >
          Magic link
        </button>
        <button
          type="button"
          className={authMethod === 'password' ? 'active' : ''}
          onClick={() => setAuthMethod('password')}
        >
          Password
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        {authMethod === 'password' && (
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
            />
          </label>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : submitLabel}
        </button>
      </form>

      {error && <div className="auth-error">{error}</div>}
      {message && <div className="auth-success">{message}</div>}

      <div className="auth-mode-toggle">
        {authMethod === 'password' && (
          mode === 'signin' ? (
            <button type="button" onClick={() => setMode('signup')}>
              Need an account? Create one
            </button>
          ) : (
            <button type="button" onClick={() => setMode('signin')}>
              Already have an account? Sign in
            </button>
          )
        )}
      </div>
    </div>
  );
}
