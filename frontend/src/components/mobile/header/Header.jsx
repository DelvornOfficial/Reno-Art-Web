import React, { useState, useEffect } from 'react';
import './Header.css';
import './SidebarDrawer.css';
import handLogo from '../../../assets/hand.svg';
import renoText from '../../../assets/reno-design.svg';
import { API_BASE_URL } from '../../../services/api';

export function Header({
  activeItem = 'Home',
  onSearch = () => { },
  onOpenLogin = () => { },
  showLoginBtn = false,
  isLoggedIn = false,
  user = null,
  onOpenProfile = () => { },
  cartCount = 0,
  onOpenCart = () => { },
  onNavigateSidebar = () => { }
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [taglineText, setTaglineText] = useState('Tiles designing & 3D architectural patterns | Instant Digital');

  useEffect(() => {
    fetch(`${API_BASE_URL}/site-content/`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.announcement_tagline) {
          setTaglineText(data.announcement_tagline);
        }
      })
      .catch(() => { });
  }, []);

  const closeDrawer = () => {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsDrawerClosing(false);
    }, 240); // Matches slideDrawerOut transition duration
  };

  const handleSidebarClick = (itemId) => {
    closeDrawer();
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }
    if (onNavigateSidebar) {
      onNavigateSidebar(itemId);
    }
  };

  // User requested Sidebar options:
  // my product, payment setting, subscription, profile setting, setting
  const sidebarItems = [
    {
      id: 'my-product',
      label: 'My Purchased Products',
      badge: 'CAD',
      desc: 'Instant CAD licenses & files',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    },
    {
      id: 'subscription',
      label: 'Subscription Tier',
      desc: 'VIP membership & badge',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    },
    {
      id: 'payment-setting',
      label: 'Payment Methods',
      desc: 'UPI, VPA & billing invoices',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )
    },
    {
      id: 'profile-setting',
      label: 'My Coupons & Offers',
      desc: 'Exclusive member discounts',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      )
    },
    {
      id: 'setting',
      label: 'Studio Settings',
      desc: 'File format & CAD preferences',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  // Helper to extract Telegram-style 2-letter Initials from Name/Username/Email
  const getInitials = () => {
    if (!user) return 'U';
    const source = user.name || user.username || user.identifier || '';
    const parts = source.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return source.slice(0, 2).toUpperCase() || 'U';
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isDrawerOpen) closeDrawer();
        setIsSearchOpen(false);
      }
    };

    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="reno-mobile-header" role="banner">
      {/* Sticky Top Navigation Bar */}
      <div className="reno-mobile-bar">
        {/* Brand on Left - Click navigates to Home & reloads clean state */}
        <a
          href="/"
          className="reno-mobile-brand"
          aria-label="RENO DESIGN Home"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/';
          }}
        >
          <img
            src={handLogo}
            alt=""
            className="reno-mobile-logo-hand"
          />
          <img
            src={renoText}
            alt="RENO DESIGN"
            className="reno-mobile-logo-text"
          />
        </a>

        {/* Action Controls on Right */}
        <div className="reno-mobile-actions">
          {/* Shopping Cart Pill Trigger */}
          <button
            type="button"
            className="reno-mobile-icon-btn reno-mobile-cart-btn"
            aria-label="Open Shopping Cart"
            onClick={onOpenCart}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="reno-mobile-cart-badge">{cartCount}</span>
            )}
          </button>

          {/* Direct Phone / Studio Inquire */}
          <a
            href="tel:+919876543210"
            className="reno-mobile-icon-btn"
            aria-label="Call Studio"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>

          {/* Prominent Architectural Menu Trigger */}
          <button
            type="button"
            className="reno-mobile-menu-trigger"
            aria-label="Open Mobile Navigation Menu"
            aria-expanded={isDrawerOpen}
            onClick={() => setIsDrawerOpen(true)}
          >
            <span className="reno-menu-bar reno-menu-bar-top" />
            <span className="reno-menu-bar reno-menu-bar-mid" />
            <span className="reno-menu-bar reno-menu-bar-bot" />
          </button>
        </div>
      </div>

      {/* Expandable Glass Search Tray */}
      {isSearchOpen && (
        <form className="reno-mobile-search-tray" onSubmit={handleSearchSubmit}>
          <div className="reno-search-tray-inner">
            <svg className="reno-search-tray-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7.5"></circle>
              <line x1="21" y1="21" x2="16.5" y2="16.5"></line>
            </svg>
            <input
              type="search"
              placeholder="Search architecture & interiors..."
              className="reno-mobile-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </form>
      )}

      {/* Mobile-Only One-Line Tagline Strip - Infinite Smooth Marquee */}
      <div className="reno-mobile-tagline-container" aria-label="Announcement">
        <div className="reno-mobile-tagline-track">
          <span className="reno-mobile-tagline-text">
            {taglineText}
          </span>
          <span className="reno-mobile-tagline-text" aria-hidden="true">
            {taglineText}
          </span>
        </div>
      </div>

      {/* Slide-out Navigation Drawer */}
      {isDrawerOpen && (
        <>
          <div
            className={`reno-drawer-backdrop ${isDrawerClosing ? 'closing' : ''}`}
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <aside
            className={`reno-mobile-drawer ${isDrawerClosing ? 'closing' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
          >
            <div className="reno-drawer-header">
              <div className="reno-mobile-brand">
                <img
                  src={handLogo}
                  alt=""
                  className="reno-mobile-logo-hand"
                />
                <img
                  src={renoText}
                  alt="RENO DESIGN"
                  className="reno-mobile-logo-text"
                />
              </div>
              <button
                type="button"
                className="reno-drawer-close"
                onClick={closeDrawer}
                aria-label="Close Navigation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* User Mini Profile Brief inside Drawer */}
            {isLoggedIn && user && (
              <div className="reno-drawer-user-card" onClick={() => handleSidebarClick('profile-setting')}>
                <div className="reno-drawer-avatar">
                  <span>{getInitials()}</span>
                </div>
                <div className="reno-drawer-user-info">
                  <strong className="reno-drawer-user-name">{user.name || user.username || user.identifier?.split('@')[0] || 'Studio User'}</strong>
                  <span className="reno-drawer-user-email">{user.email || user.identifier || 'Verified Member'}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8A80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            )}

            <ul className="reno-drawer-menu">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="reno-drawer-link reno-drawer-btn"
                    onClick={() => handleSidebarClick(item.id)}
                  >
                        <div className="reno-drawer-item-icon-box">
                          {item.icon}
                        </div>
                      <div className="reno-drawer-item-content">
                        <div className="reno-drawer-item-title-row">
                          <span className="reno-drawer-item-label">{item.label}</span>
                          {item.badge && <span className="reno-drawer-item-badge">{item.badge}</span>}
                        </div>
                        {item.desc && <span className="reno-drawer-item-desc">{item.desc}</span>}
                      </div>
                      <svg className="reno-drawer-item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                  </button>
                </li>
              ))}
            </ul>

            <div className="reno-drawer-footer">
              <a
                href="/"
                className="reno-drawer-cta"
                onClick={(e) => {
                  e.preventDefault();
                  closeDrawer();
                  window.location.href = '/';
                }}
              >
                Back to 3D Marketplace
              </a>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}

export default Header;
