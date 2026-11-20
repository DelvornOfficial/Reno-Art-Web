import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import handLogo from '../assets/hand.svg';
import renoText from '../assets/reno-design.svg';
import VerifiedLottieBadge from '../components/common/VerifiedLottieBadge';

export function ProfilePage({
  user,
  onNavigateToHome,
  onLogout,
  onTogglePlan,
  purchasedProducts = [],
  activeTab: initialActiveTab = 'my-product'
}) {
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'my-product');
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const mockUser = user || {
    identifier: 'architect@studio.design',
    name: 'Lalu Ji',
    username: 'laluji573',
    plan: 'normal', // 'normal' | 'premium'
    joinedDate: 'November 2026'
  };

  const isPremium = mockUser.plan === 'premium';
  const displayName = mockUser.name || mockUser.username || (mockUser.identifier ? mockUser.identifier.split('@')[0] : 'Studio User');

  // Telegram-style 2-letter Initials
  const getInitials = () => {
    const parts = (displayName || '').trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (displayName || 'U').slice(0, 2).toUpperCase();
  };

  const handlePlanToggle = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      if (onTogglePlan) {
        onTogglePlan(!isPremium ? 'premium' : 'normal');
      }
      setIsUpgrading(false);
    }, 600);
  };

  const sidebarNavItems = [
    {
      id: 'my-product',
      label: 'My Product',
      badge: purchasedProducts.length,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    },
    {
      id: 'payment-setting',
      label: 'Payment Setting',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )
    },
    {
      id: 'subscription',
      label: 'Subscription',
      isVerifiedTag: isPremium,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    },
    {
      id: 'profile-setting',
      label: 'Profile Setting',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    {
      id: 'setting',
      label: 'Setting',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  return (
    <div className="reno-profile-page-wrapper">
      {/* Top Header Strip */}
      <header className="reno-profile-page-header">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToHome();
          }}
          className="reno-profile-brand"
        >
          <img src={handLogo} alt="" className="reno-profile-hand" />
          <img src={renoText} alt="RENO DESIGN" className="reno-profile-logo-text" />
        </a>

        <button
          type="button"
          className="reno-profile-back-btn"
          onClick={onNavigateToHome}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to Marketplace</span>
        </button>
      </header>

      {/* Main Profile Body with PC Desktop Sidebar & Right Content Panel */}
      <main className="reno-profile-main-container">
        <div className="reno-profile-workspace-layout">
          {/* LEFT SIDEBAR (PC Desktop Layout) */}
          <aside className="reno-profile-desktop-sidebar">
            {/* Sidebar User Mini Identity */}
            <div className="reno-sidebar-user-brief">
              <div className="reno-sidebar-avatar-small">
                <span>{getInitials()}</span>
              </div>
              <div className="reno-sidebar-user-texts">
                <span className="reno-sidebar-name">{displayName}</span>
                <span className="reno-sidebar-handle">@{mockUser.username || 'user'}</span>
              </div>
            </div>

            {/* Sidebar Navigation Options List */}
            <nav className="reno-profile-sidebar-nav" aria-label="Account Settings Navigation">
              {sidebarNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`reno-sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="reno-sidebar-item-icon">{item.icon}</span>
                    <span className="reno-sidebar-item-label">{item.label}</span>
                    {typeof item.badge === 'number' && (
                      <span className="reno-sidebar-item-badge">{item.badge}</span>
                    )}
                    {item.isVerifiedTag && (
                      <span className="reno-sidebar-verified-mini">VIP</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Quick Tier Switch / Info */}
            <div className="reno-sidebar-footer-card">
              <span className="reno-sidebar-tier-label">CURRENT STATUS</span>
              <div className="reno-sidebar-tier-val">
                {isPremium ? (
                  <span className="reno-sidebar-tier-active">★ Premium VIP</span>
                ) : (
                  <span className="reno-sidebar-tier-free">Standard User</span>
                )}
              </div>
              <button
                type="button"
                className="reno-sidebar-switch-plan-btn"
                onClick={handlePlanToggle}
                disabled={isUpgrading}
              >
                {isUpgrading ? 'Updating...' : isPremium ? 'Switch to Normal' : '★ Upgrade to VIP'}
              </button>
            </div>
          </aside>

          {/* RIGHT CONTENT WORKSPACE */}
          <div className="reno-profile-workspace-content">
            {/* Top Identity Hero Card */}
            <div className={`reno-profile-hero ${isPremium ? 'is-premium-member' : 'is-normal-member'}`}>
              <div className="reno-profile-avatar-outer-container">
                <div className="reno-profile-avatar-wrapper">
                  {/* Rotating Striped Border directly touching and framing the avatar circle */}
                  <div className="reno-profile-rotating-ring" aria-hidden="true" />

                  <div className="reno-profile-hero-avatar">
                    <span className="reno-profile-initials-text">{getInitials()}</span>
                  </div>

                  {/* Authentic Instagram Starburst Verified Tick on Avatar via Lottie */}
                  {isPremium && (
                    <div className="reno-insta-badge-circle" title="Verified Premium Member">
                      <VerifiedLottieBadge
                        size={28}
                        className="reno-lottie-verified-avatar"
                      />
                    </div>
                  )}
                </div>
              </div>

              < div className="reno-profile-hero-info">
                <div className="reno-profile-name-row">
                  <h1 className="reno-profile-title">{displayName}</h1>

                  {/* Animated Verified Pill or Badge via Lottie */}
                  {isPremium ? (
                    <div className="reno-animated-verified-badge" title="Official Verified Subscription">
                      <VerifiedLottieBadge
                        size={20}
                        className="reno-lottie-verified-pill"
                      />
                      <span className="reno-premium-tag">PREMIUM VIP</span>
                    </div>
                  ) : (
                    <span className="reno-profile-normal-chip">STANDARD MEMBER</span>
                  )}
                </div>

                {mockUser.username && <span className="reno-profile-hero-handle">@{mockUser.username}</span>}
                <span className="reno-profile-hero-email">{mockUser.identifier || mockUser.email || 'Registered Member'}</span>

                {/* Instant Tier Switcher / Demo Toggle */}
                <div className="reno-tier-action-bar">
                  <button
                    type="button"
                    className={`reno-tier-toggle-btn ${isPremium ? 'downgrade-btn' : 'upgrade-btn'}`}
                    onClick={handlePlanToggle}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? (
                      'Processing...'
                    ) : isPremium ? (
                      'Switch to Normal User'
                    ) : (
                      '★ Upgrade to Premium Subscription'
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="reno-profile-logout-hero-btn"
                onClick={() => {
                  onLogout();
                  onNavigateToHome();
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Log Out</span>
              </button>
            </div>

            {/* TAB CONTENT PANELS (Selected from PC Sidebar) */}
            <div className="reno-profile-tab-content">
              {/* 1. MY PRODUCT */}
              {activeTab === 'my-product' && (
                <div>
                  {purchasedProducts.length === 0 ? (
                    <div className="reno-profile-empty-downloads">
                      <div className="reno-profile-empty-icon-wrap">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6B6861" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 2 7 12 12 22 7 12 2" />
                          <polyline points="2 17 12 22 22 17" />
                          <polyline points="2 12 12 17 22 12" />
                        </svg>
                      </div>
                      <h3>No Purchased Products Yet</h3>
                      <p>
                        Your bought 3D tiles, CNC patterns and commercial toolpaths will appear here permanently with direct download buttons.
                      </p>
                      <button
                        type="button"
                        className="reno-profile-explore-store-btn"
                        onClick={onNavigateToHome}
                      >
                        Explore 3D Marketplace
                      </button>
                    </div>
                  ) : (
                    <div className="reno-purchased-products-grid">
                      <div className="reno-purchased-section-header">
                        <h3>My Purchased Products ({purchasedProducts.length})</h3>
                        <span className="reno-purchased-sub-note">Instant CAD Files &amp; Production Toolpaths</span>
                      </div>
                      {purchasedProducts.map((prod, idx) => (
                        <div key={`${prod.id}-${idx}`} className="reno-purchased-item-card">
                          <div className="reno-purchased-thumb" style={{ background: prod.gradient || '#111' }}>
                            <span className="reno-purchased-fmt">{prod.format || '3D CAD'}</span>
                          </div>
                          <div className="reno-purchased-details">
                            <span className="reno-purchased-cat">{prod.category}</span>
                            <h4 className="reno-purchased-name">{prod.title}</h4>
                            <span className="reno-license-verified">✓ Commercial License Unlocked</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginLeft: 'auto' }}>
                            <button
                              type="button"
                              className="reno-download-cad-btn"
                              onClick={() => alert(`Starting download for ${prod.title} (.OBJ / .STL / .DXF toolpath package)...`)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              <span>Download CAD Files</span>
                            </button>

                            {(prod.pdf_document_url || prod.document_name) && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (prod.pdf_document_url) {
                                    window.open(prod.pdf_document_url, '_blank');
                                  } else {
                                    alert(`Opening protected document: ${prod.document_name || 'Documentation'}`);
                                  }
                                }}
                                style={{
                                  background: '#F0FDF4',
                                  color: '#15803D',
                                  border: '1px solid #BBF7D0',
                                  padding: '0.5rem 0.85rem',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  justifyContent: 'center'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>View Protected Doc</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. PAYMENT SETTING */}
              {activeTab === 'payment-setting' && (
                <div className="reno-profile-tab-pane">
                  <h3>Payment Setting &amp; Cards</h3>
                  <p className="reno-pane-sub">Manage saved UPI VPAs, cards, and tax billing details.</p>
                  <div className="reno-profile-details-grid">
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Default Payout / VPA</span>
                      <strong className="reno-detail-val">architect@upi (Verified)</strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Currency Preference</span>
                      <strong className="reno-detail-val">INR (₹ Indian Rupee)</strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">GST Invoice Download</span>
                      <strong className="reno-detail-val">Auto-Generated Monthly</strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Security Encryption</span>
                      <strong className="reno-detail-val">256-Bit SSL AES Verified</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SUBSCRIPTION */}
              {activeTab === 'subscription' && (
                <div className="reno-profile-tab-pane">
                  <h3>Subscription &amp; Verification Tier</h3>
                  <p className="reno-pane-sub">Your active architectural license tier and verification privileges.</p>
                  <div className="reno-profile-details-grid">
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Membership Tier</span>
                      <strong className="reno-detail-val">
                        {isPremium ? '★ Premium Subscriber (Active)' : 'Standard User (Free)'}
                      </strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Verification Badge</span>
                      <strong className="reno-detail-val">
                        {isPremium ? 'Instagram Blue Verified Tick' : 'None (Standard)'}
                      </strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">CAD File Downloads</span>
                      <strong className="reno-detail-val">
                        {isPremium ? 'Unlimited Priority High-Speed' : 'Standard Speed Downloads'}
                      </strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Commercial License</span>
                      <strong className="reno-detail-val">
                        {isPremium ? 'Full Commercial & Production Rights' : 'Personal Study & Review'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. PROFILE SETTING */}
              {activeTab === 'profile-setting' && (
                <div className="reno-profile-tab-pane">
                  <h3>Profile Setting</h3>
                  <p className="reno-pane-sub">Update your personal and architectural firm credentials.</p>
                  <div className="reno-profile-details-grid">
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Display Name</span>
                      <strong className="reno-detail-val">{displayName}</strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Username / Handle</span>
                      <strong className="reno-detail-val">@{mockUser.username || 'user'}</strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Verified Contact Email</span>
                      <strong className="reno-detail-val">{mockUser.identifier || mockUser.email || 'architect@studio.design'}</strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Member Since</span>
                      <strong className="reno-detail-val">{mockUser.joinedDate || 'November 2026'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SETTING */}
              {activeTab === 'setting' && (
                <div className="reno-profile-tab-pane">
                  <h3>Setting</h3>
                  <p className="reno-pane-sub">System controls, file formats preferences, and cloud sync.</p>
                  <div className="reno-profile-details-grid">
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Default Toolpath Format</span>
                      <strong className="reno-detail-val">OBJ / STL / DXF (Full CAD)</strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Email Notifications</span>
                      <strong className="reno-detail-val">New 3D Tile Releases Only</strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">3D Viewport Quality</span>
                      <strong className="reno-detail-val">Ultra High Precision (WebGL 2.0)</strong>
                    </div>
                    <div className="reno-profile-detail-card">
                      <span className="reno-detail-lbl">Data Privacy</span>
                      <strong className="reno-detail-val">Encrypted Local Storage</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
