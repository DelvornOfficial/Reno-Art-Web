import React, { useState } from 'react';
import './Login.css';

export function Login({ onLoginSuccess }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamically resolve API URL matching current host (localhost vs Network IP vs production)
  const getApiUrl = () => {
    if (typeof window === 'undefined') return 'http://localhost:1002/api/v1/auth/admin/login';
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:1002/api/v1/auth/admin/login';
    }
    if (host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) {
      return `http://${host}:1002/api/v1/auth/admin/login`;
    }
    return 'https://api.renoart.in/api/v1/auth/admin/login';
  };

  const API_URL = getApiUrl();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username_or_email: usernameOrEmail.trim(),
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed. Please check your credentials.');
      }

      // Store JWT Securely
      localStorage.setItem('reno_crm_token', data.access_token);
      localStorage.setItem('reno_crm_admin', JSON.stringify(data.user));

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="crm-login-wrapper">
      <div className="crm-login-card">
        {/* Brand Header */}
        <div className="crm-login-brand">
          <img src="/hand.svg" alt="" className="crm-login-hand" />
          <img src="/reno-design.svg" alt="RENO DESIGN" className="crm-login-text" />
          <span className="crm-login-badge">STUDIO CRM</span>
        </div>

        <div className="crm-login-header">
          <h2>Administrator Portal</h2>
          <p>Strict access control. Authorized personnel only.</p>
        </div>

        {errorMessage && (
          <div className="crm-login-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="crm-login-form">
          <div className="crm-input-group">
            <label htmlFor="crm-username">Admin Username</label>
            <input
              id="crm-username"
              type="text"
              required
              autoComplete="username"
              placeholder="Enter your admin username"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="crm-input-group">
            <label htmlFor="crm-password">Master Password</label>
            <input
              id="crm-password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="crm-login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter CRM'}
          </button>
        </form>

        <div className="crm-login-footer">
          <div className="crm-security-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Bcrypt Hashed • Rate-Limited • Anti-SQLi Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
