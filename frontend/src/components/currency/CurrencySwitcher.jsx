import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import './CurrencySwitcher.css';

export function CurrencySwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { currency, changeCurrency, CURRENCY_CONFIG } = useCurrency();
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code) => {
    changeCurrency(code);
    setIsOpen(false);
  };

  return (
    <div className="reno-currency-dock" ref={dropdownRef}>
      {/* Floating Side Tab Button - Matches RENO Milk White & Chrome Black aesthetic */}
      <button
        type="button"
        className={`reno-currency-tab-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Change Currency"
        aria-expanded={isOpen}
      >
        <span className="reno-tab-code">{currency}</span>
        <svg
          className="reno-tab-chevron"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points={isOpen ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
        </svg>
      </button>

      {/* Flyout Currency Modal / Selector Panel */}
      {isOpen && (
        <div className="reno-currency-popup" role="dialog" aria-modal="false" aria-label="Currency Selector">
          <div className="reno-currency-header">
            <span>SELECT YOUR CURRENCY</span>
            <button
              type="button"
              className="reno-currency-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close currency menu"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="reno-currency-options-list">
            {Object.values(CURRENCY_CONFIG).map((item) => {
              const isSelected = item.code === currency;
              return (
                <button
                  key={item.code}
                  type="button"
                  className={`reno-currency-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(item.code)}
                >
                  <span className="reno-curr-code">{item.code}</span>
                  <span className="reno-curr-name">{item.name}</span>
                  <span className="reno-curr-sym">{item.symbol}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrencySwitcher;
