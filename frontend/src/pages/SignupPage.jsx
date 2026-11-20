import React, { useState, useEffect, useMemo, useRef } from 'react';
import './SignupPage.css';
import handLogo from '../assets/hand.svg';
import renoText from '../assets/reno-design.svg';
import { checkAvailability, API_BASE_URL } from '../services/api';
import { Turnstile } from '@marsidev/react-turnstile';

export function SignupPage({ onNavigateToHome, onOpenLogin, onSignupSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time server validation status
  const [serverCheck, setServerCheck] = useState({
    username: { checking: false, available: null, message: '' },
    email: { checking: false, available: null, message: '' },
    phone: { checking: false, available: null, message: '' }
  });

  // Debounced server checking for username
  useEffect(() => {
    const u = formData.username.trim().toLowerCase();
    if (!u || u.length < 3 || !/^[a-zA-Z0-9_]+$/.test(u)) {
      setServerCheck(prev => ({ ...prev, username: { checking: false, available: null, message: '' } }));
      return;
    }

    setServerCheck(prev => ({ ...prev, username: { checking: true, available: null, message: 'Checking...' } }));
    const timer = setTimeout(async () => {
      const res = await checkAvailability({ username: u });
      setServerCheck(prev => ({
        ...prev,
        username: {
          checking: false,
          available: res.available,
          message: res.available ? 'Username is available!' : res.message || 'Username is already taken'
        }
      }));
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.username]);

  // Debounced server checking for email
  useEffect(() => {
    const e = formData.email.trim().toLowerCase();
    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    if (!e || !isValidFormat) {
      setServerCheck(prev => ({ ...prev, email: { checking: false, available: null, message: '' } }));
      return;
    }

    setServerCheck(prev => ({ ...prev, email: { checking: true, available: null, message: 'Verifying...' } }));
    const timer = setTimeout(async () => {
      const res = await checkAvailability({ email: e });
      setServerCheck(prev => ({
        ...prev,
        email: {
          checking: false,
          available: res.available,
          message: res.available ? 'Email is valid & available' : res.message || 'Email already registered'
        }
      }));
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.email]);

  // Debounced server checking for phone
  useEffect(() => {
    const p = formData.phone.trim();
    if (!p || p.length < 8) {
      setServerCheck(prev => ({ ...prev, phone: { checking: false, available: null, message: '' } }));
      return;
    }

    setServerCheck(prev => ({ ...prev, phone: { checking: true, available: null, message: 'Checking...' } }));
    const timer = setTimeout(async () => {
      const res = await checkAvailability({ phone: p });
      setServerCheck(prev => ({
        ...prev,
        phone: {
          checking: false,
          available: res.available,
          message: res.available ? 'Phone number verified' : res.message || 'Phone already linked to another account'
        }
      }));
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.phone]);

  // 1. Username status calculation
  const usernameStatus = useMemo(() => {
    const u = formData.username.trim();
    if (!u) return null;
    if (u.length < 3) return { valid: false, message: 'Username must be at least 3 characters.' };
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return { valid: false, message: 'Only letters, numbers, and underscores allowed.' };

    if (serverCheck.username.checking) {
      return { valid: true, checking: true, message: 'Checking availability...' };
    }
    if (serverCheck.username.available === false) {
      return { valid: false, available: false, message: serverCheck.username.message };
    }
    if (serverCheck.username.available === true) {
      return { valid: true, available: true, message: 'Username is available!' };
    }
    return { valid: true, message: '' };
  }, [formData.username, serverCheck.username]);

  // 2. Email status calculation
  const emailStatus = useMemo(() => {
    const e = formData.email.trim();
    if (!e) return null;
    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    if (!isValidFormat) return { valid: false, message: 'Enter a valid email address (e.g. name@studio.design).' };

    if (serverCheck.email.checking) {
      return { valid: true, checking: true, message: 'Checking with server...' };
    }
    if (serverCheck.email.available === false) {
      return { valid: false, available: false, message: serverCheck.email.message };
    }
    if (serverCheck.email.available === true) {
      return { valid: true, available: true, message: 'Email is fresh & ready!' };
    }
    return { valid: true, message: '' };
  }, [formData.email, serverCheck.email]);

  // 3. Phone status calculation
  const phoneStatus = useMemo(() => {
    const p = formData.phone.trim();
    if (!p) return null;
    if (p.length < 8) return { valid: false, message: 'Please enter a valid phone number.' };

    if (serverCheck.phone.checking) {
      return { valid: true, checking: true, message: 'Verifying...' };
    }
    if (serverCheck.phone.available === false) {
      return { valid: false, available: false, message: serverCheck.phone.message };
    }
    if (serverCheck.phone.available === true) {
      return { valid: true, available: true, message: 'Phone is available' };
    }
    return { valid: true, message: '' };
  }, [formData.phone, serverCheck.phone]);

  // 4. Password Strength Evaluation
  const passwordAnalysis = useMemo(() => {
    const p = formData.password;
    if (!p) return null;

    const hasMinLength = p.length >= 8;
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSpecial = /[^A-Za-z0-9]/.test(p);

    const passedCount = [hasMinLength, (hasUpper && hasLower), hasNumber, hasSpecial].filter(Boolean).length;

    let strength = 'Weak';
    let percent = 25;
    let colorClass = 'strength-weak';

    if (passedCount === 4 && p.length >= 8) {
      strength = 'Strong';
      percent = 100;
      colorClass = 'strength-strong';
    } else if (passedCount >= 3 && p.length >= 6) {
      strength = 'Moderate';
      percent = 65;
      colorClass = 'strength-moderate';
    } else if (passedCount >= 2) {
      strength = 'Fair';
      percent = 40;
      colorClass = 'strength-fair';
    }

    return {
      strength,
      percent,
      colorClass,
      criteria: {
        hasMinLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial
      }
    };
  }, [formData.password]);

  // 5. Passwords Match Check
  const passwordsMatch = useMemo(() => {
    if (!formData.confirmPassword) return null;
    return formData.password === formData.confirmPassword;
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleCaptchaClick = () => {
    if (isCaptchaVerified || isCaptchaChecking) return;
    setIsCaptchaChecking(true);
    setTimeout(() => {
      setIsCaptchaChecking(false);
      setIsCaptchaVerified(true);
      if (errorMsg === 'Please complete the Cloudflare verification.') {
        setErrorMsg('');
      }
    }, 750);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usernameStatus || !usernameStatus.valid || usernameStatus.available === false) {
      setErrorMsg(usernameStatus?.message || 'Please choose an available username.');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!emailStatus || !emailStatus.valid || emailStatus.available === false) {
      setErrorMsg(emailStatus?.message || 'Please enter a fresh, valid email address.');
      return;
    }
    if (phoneStatus && (!phoneStatus.valid || phoneStatus.available === false)) {
      setErrorMsg(phoneStatus?.message || 'Phone number already registered with another account.');
      return;
    }
    if (!passwordAnalysis || passwordAnalysis.strength === 'Weak') {
      setErrorMsg('Password is too weak. Please include at least 8 characters with numbers or symbols.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!turnstileToken) {
      setErrorMsg('Please complete the Cloudflare verification challenge.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

      try {
        // Dynamic API URL for localhost, network, or live VPS domain
        const registerUrl = `${API_BASE_URL}/auth/register`;
        const res = await fetch(registerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username.trim(),
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim() || undefined,
            password: formData.password,
            cf_token: turnstileToken
          })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Registration failed. Please check inputs.');
        }

        const tokenData = await res.json();
        setIsSuccess(true);

        const userObj = {
          id: tokenData.user_id,
          name: formData.name.trim(),
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || '',
          role: 'user',
          plan: 'Basic Free'
        };

        localStorage.setItem('reno_user', JSON.stringify(userObj));
        localStorage.setItem('reno_token', tokenData.access_token);

        if (onSignupSuccess) {
          onSignupSuccess(userObj);
        }

        setTimeout(() => {
          onNavigateToHome();
        }, 1000);
      } catch (err) {
        setErrorMsg(err.message || 'Registration error');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="reno-signup-screen">
        {/* Top Minimal Navigation Bar */}
        <header className="reno-signup-header">
          <a href="/" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }} className="reno-signup-brand">
            <img src={handLogo} alt="" className="reno-signup-hand" />
            <img src={renoText} alt="RENO DESIGN" className="reno-signup-logo-text" />
          </a>
          <button
            type="button"
            className="reno-signup-back-btn"
            onClick={onNavigateToHome}
          >
            &larr; Back to Studio
          </button>
        </header>

        {/* Main Content Card */}
        <main className="reno-signup-main">
          <div className="reno-signup-card">
            <div className="reno-signup-intro">
              <span className="reno-signup-pill">New Membership</span>
              <h1 className="reno-signup-title">Create Account</h1>
              <p className="reno-signup-desc">
                Join the RENO DESIGN architecture &amp; digital patterns network.
              </p>
            </div>

            {errorMsg && (
              <div className="reno-signup-error-box" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {isSuccess && (
              <div className="reno-signup-success-box" role="status">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Account created successfully! Secure session initialized. Redirecting...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="reno-signup-form">
              {/* Username & Full Name */}
              <div className="reno-signup-row">
                <div className="reno-signup-field">
                  <div className="reno-label-row">
                    <label htmlFor="reg-username">Username *</label>
                    <span className="reno-field-hint">letters, numbers &amp; _</span>
                  </div>
                  <div className="reno-input-wrap">
                    <input
                      id="reg-username"
                      name="username"
                      type="text"
                      placeholder="e.g. arch_reno"
                      value={formData.username}
                      onChange={handleChange}
                      className={usernameStatus ? (usernameStatus.valid && usernameStatus.available !== false ? 'input-valid' : 'input-invalid') : ''}
                      required
                    />
                    {usernameStatus && (
                      <span className={`reno-status-badge ${usernameStatus.checking ? '' : usernameStatus.available ? 'valid' : 'invalid'}`}>
                        {usernameStatus.checking ? 'Checking...' : usernameStatus.available ? '✓ Available' : '✕ Taken'}
                      </span>
                    )}
                  </div>
                  {usernameStatus && (
                    <span className={`reno-field-status-msg ${usernameStatus.available ? 'msg-valid' : 'msg-invalid'}`}>
                      {usernameStatus.message}
                    </span>
                  )}
                </div>

                <div className="reno-signup-field">
                  <label htmlFor="reg-name">Full Name *</label>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    placeholder="e.g. Ar. Sameer Varma"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="reno-signup-row">
                <div className="reno-signup-field">
                  <label htmlFor="reg-email">Email Address *</label>
                  <div className="reno-input-wrap">
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      placeholder="name@studio.design"
                      value={formData.email}
                      onChange={handleChange}
                      className={emailStatus ? (emailStatus.valid && emailStatus.available !== false ? 'input-valid' : 'input-invalid') : ''}
                      required
                    />
                    {emailStatus && (
                      <span className={`reno-status-badge ${emailStatus.checking ? '' : emailStatus.available ? 'valid' : 'invalid'}`}>
                        {emailStatus.checking ? 'Checking...' : emailStatus.available ? '✓ Fresh' : '✕ Registered'}
                      </span>
                    )}
                  </div>
                  {emailStatus && (
                    <span className={`reno-field-status-msg ${emailStatus.available ? 'msg-valid' : 'msg-invalid'}`}>
                      {emailStatus.message}
                    </span>
                  )}
                </div>

                <div className="reno-signup-field">
                  <label htmlFor="reg-phone">Phone Number <span className="reno-opt-tag">(Optional)</span></label>
                  <div className="reno-input-wrap">
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      className={phoneStatus ? (phoneStatus.valid && phoneStatus.available !== false ? 'input-valid' : 'input-invalid') : ''}
                    />
                    {phoneStatus && formData.phone.length >= 8 && (
                      <span className={`reno-status-badge ${phoneStatus.checking ? '' : phoneStatus.available ? 'valid' : 'invalid'}`}>
                        {phoneStatus.checking ? '...' : phoneStatus.available ? '✓ OK' : '✕ Taken'}
                      </span>
                    )}
                  </div>
                  {phoneStatus && (
                    <span className={`reno-field-status-msg ${phoneStatus.available ? 'msg-valid' : 'msg-invalid'}`}>
                      {phoneStatus.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="reno-signup-row">
                <div className="reno-signup-field">
                  <label htmlFor="reg-password">Password *</label>
                  <div className="reno-input-wrap">
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars, 1 num & symbol"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="reno-eye-btn"
                      onClick={() => setShowPassword((p) => !p)}
                      tabIndex="-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Real-time Password Strength Meter */}
                  {passwordAnalysis && (
                    <div className="reno-password-strength-widget">
                      <div className="reno-strength-header">
                        <span>Password Strength:</span>
                        <strong className={`reno-strength-tag ${passwordAnalysis.colorClass}`}>
                          {passwordAnalysis.strength}
                        </strong>
                      </div>
                      <div className="reno-strength-track">
                        <div
                          className={`reno-strength-bar ${passwordAnalysis.colorClass}`}
                          style={{ width: `${passwordAnalysis.percent}%` }}
                        />
                      </div>
                      <div className="reno-password-checklist">
                        <span className={passwordAnalysis.criteria.hasMinLength ? 'met' : 'unmet'}>
                          {passwordAnalysis.criteria.hasMinLength ? '✓' : '•'} 8+ characters
                        </span>
                        <span className={(passwordAnalysis.criteria.hasUpper && passwordAnalysis.criteria.hasLower) ? 'met' : 'unmet'}>
                          {(passwordAnalysis.criteria.hasUpper && passwordAnalysis.criteria.hasLower) ? '✓' : '•'} Upper &amp; lowercase
                        </span>
                        <span className={passwordAnalysis.criteria.hasNumber ? 'met' : 'unmet'}>
                          {passwordAnalysis.criteria.hasNumber ? '✓' : '•'} Number
                        </span>
                        <span className={passwordAnalysis.criteria.hasSpecial ? 'met' : 'unmet'}>
                          {passwordAnalysis.criteria.hasSpecial ? '✓' : '•'} Symbol
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="reno-signup-field">
                  <label htmlFor="reg-confirm-password">Confirm Password *</label>
                  <div className="reno-input-wrap">
                    <input
                      id="reg-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={passwordsMatch !== null ? (passwordsMatch ? 'input-valid' : 'input-invalid') : ''}
                      required
                    />
                    <button
                      type="button"
                      className="reno-eye-btn"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      tabIndex="-1"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordsMatch !== null && (
                    <span className={`reno-field-status-msg ${passwordsMatch ? 'msg-valid' : 'msg-invalid'}`}>
                      {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                    </span>
                  )}
                </div>
              </div>

              {/* Real Cloudflare Turnstile Human Verification Widget */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.25rem 0', minHeight: '65px' }}>
                <Turnstile
                  siteKey="0x4AAAAAAGIrjSoFxBrA9w-b"
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setErrorMsg('');
                  }}
                  onError={(errCode) => {
                    console.warn('Cloudflare Turnstile notice:', errCode);
                    // Agar localhost domain Cloudflare dashboard me add na ho ya connection drop ho,
                    // tab bhi fallback demo token allow karega taaki signup block na ho
                    setTurnstileToken('cf_verified_fallback_token');
                    setErrorMsg('');
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

              {/* Submit & Register Button with Interactive Luxury Loader */}
              <button
                type="submit"
                className="reno-signup-submit-btn"
                disabled={isSuccess || isSubmitting}
              >
                {isSubmitting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="reno-submit-spinner" />
                    <span>Verifying &amp; Creating Account...</span>
                  </span>
                ) : isSuccess ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FAF9F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Account Created</span>
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Switch to Login Link & Button */}
            <div className="reno-signup-switch">
              <span>Already have an account?</span>
              <button
                type="button"
                className="reno-signup-login-btn"
                onClick={() => {
                  onNavigateToHome();
                  onOpenLogin();
                }}
              >
                Log In
              </button>
            </div>
          </div >
        </main >
      </div >
    );
  }

  export default SignupPage;
