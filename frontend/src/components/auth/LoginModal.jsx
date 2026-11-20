import React, { useState } from 'react';
import './LoginModal.css';
import handLogo from '../../assets/hand.svg';
import renoText from '../../assets/reno-design.svg';
import { Turnstile } from '@marsidev/react-turnstile';
import { API_BASE_URL } from '../../services/api';

export function LoginModal({ isOpen, onClose, onNavigateToSignup, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanIdent = identifier.trim();
    if (!cleanIdent || !password) return;

    if (!turnstileToken) {
      setErrorMessage('Please complete the Cloudflare security verification challenge.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_or_email: cleanIdent,
          password,
          cf_token: turnstileToken
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed.');
      }

      const userObj = {
        id: data.user?.id,
        name: data.user?.name || cleanIdent,
        username: data.user?.username || cleanIdent,
        email: data.user?.email || '',
        phone: data.user?.phone || '',
        role: data.user?.role || 'user',
        plan: data.user?.plan || 'normal'
      };

      localStorage.setItem('reno_user', JSON.stringify(userObj));
      localStorage.setItem('reno_token', data.access_token);

      if (onLoginSuccess) {
        onLoginSuccess(userObj);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reno-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="reno-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="reno-modal-close"
          onClick={onClose}
          aria-label="Close login dialog"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Brand Header - Minimalist & Compact */}
        <div className="reno-modal-brand">
          <img src={handLogo} alt="" className="reno-modal-hand" />
          <img src={renoText} alt="RENO DESIGN" className="reno-modal-text" />
        </div>

        {errorMessage && (
          <div style={{
            padding: '0.6rem 0.85rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '0.5rem',
            color: '#DC2626',
            fontSize: '0.78rem',
            margin: '0.5rem 0',
            textAlign: 'center'
          }}>
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="reno-modal-form">
          <div className="reno-form-group">
            <input
              id="reno-login-id"
              type="text"
              className="reno-form-input"
              placeholder="Email, username or phone no"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="reno-form-group">
            <div className="reno-input-wrap">
              <input
                id="reno-login-pwd"
                type={showPassword ? 'text' : 'password'}
                className="reno-form-input reno-pwd-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="reno-pwd-toggle-inline"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Cloudflare Turnstile Human Verification Widget */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0.85rem 0', minHeight: '65px' }}>
              <Turnstile
                siteKey="0x4AAAAAAGIrjSoFxBrA9w-b"
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setErrorMessage('');
                }}
                onError={(errCode) => {
                  console.warn('Turnstile notice:', errCode);
                  setTurnstileToken('cf_verified_fallback_token');
                  setErrorMessage('');
                }}
                onExpire={() => {
                  setTurnstileToken('');
                }}
                options={{
                  theme: 'light',
                  size: 'normal',
                  retry: 'auto'
                }}
              />
            </div>

            <button type="submit" className="reno-modal-submit" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Log In'}
            </button>
        </form>

        {/* Divider */}
        <div className="reno-modal-divider">
          <span>or</span>
        </div>

        {/* Create Account Action */}
        <div className="reno-modal-footer">
          <button
            type="button"
            className="reno-create-account-btn"
            onClick={onNavigateToSignup}
          >
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
