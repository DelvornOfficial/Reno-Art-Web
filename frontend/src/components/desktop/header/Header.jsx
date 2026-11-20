import React, { useState } from 'react';
import './Header.css';
import handLogo from '../../../assets/hand.svg';
import renoText from '../../../assets/reno-design.svg';

export function Header({
  activeItem = 'Home',
  onSearch = () => { },
  onOpenLogin = () => { },
  showLoginBtn = false,
  isLoggedIn = false,
  user = null,
  onOpenProfile = () => { },
  cartCount = 0,
  onOpenCart = () => { }
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Interior', href: '#interior' },
    { label: 'Renovations', href: '#renovations' },
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'Contact', href: '#contact' }
  ];

  // Telegram-style Initials (e.g., Shivam Kumar -> SK)
  const getInitials = () => {
    if (!user) return 'U';
    const source = user.name || user.username || user.identifier || '';
    const parts = source.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return source.slice(0, 2).toUpperCase() || 'U';
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="reno-desktop-header" role="banner">
      <div className="reno-nav-container">
        {/* Brand Logo: Hand on left, RENO DESIGN on right aligned */}
        <a
          href="/"
          className="reno-brand"
          aria-label="RENO DESIGN Studio"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/';
          }}
        >
          <img
            src={handLogo}
            alt=""
            className="reno-brand-hand"
          />
          <img
            src={renoText}
            alt="RENO DESIGN"
            className="reno-brand-text"
          />
        </a>

        {/* Controls & CTA */}
        <div className="reno-actions">
          {/* Saved Bookmark Button */}
          <button type="button" className="reno-icon-btn" aria-label="Saved Projects">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          {/* Shopping Cart Pill */}
          <button
            type="button"
            className="reno-desktop-cart-btn"
            onClick={onOpenCart}
            aria-label="Open Cart"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="reno-cart-pill-count">{cartCount}</span>
            )}
          </button>

          {/* Luxury Chrome Black Consultation CTA */}
          <a href="#contact" className="reno-cta-btn">
            Book Consultation
          </a>

          {/* Edge User Profile / Login Button */}
          {isLoggedIn ? (
            <button
              type="button"
              className="reno-header-avatar-circle"
              onClick={onOpenProfile}
              aria-label="View My Profile"
              title={user?.name || user?.username || 'My Account'}
            >
              <span className="reno-desktop-initials">{getInitials()}</span>
              {user?.plan === 'premium' && (
                <span className="reno-header-verified-dot" title="Verified Premium" />
              )}
            </button>
          ) : (
            <button
              type="button"
              className="reno-header-login-btn"
              onClick={onOpenLogin}
              aria-label="Open Account Login"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
