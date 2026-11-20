import React, { useState } from 'react';
import './ProfileModal.css';

export function ProfileModal({ isOpen, onClose, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('orders');

  if (!isOpen) return null;

  const mockUser = user || {
    identifier: 'architect@studio.design',
    name: 'Senior Architect',
    username: 'architect',
    joinedDate: 'November 2026'
  };

  const displayName = mockUser.name || mockUser.username || (mockUser.identifier ? mockUser.identifier.split('@')[0] : 'Studio User');

  // Telegram-style 2-letter Initials
  const getInitials = () => {
    const parts = (displayName || '').trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (displayName || 'U').slice(0, 2).toUpperCase();
  };

  return (
    <div className="reno-profile-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="reno-profile-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="reno-profile-close"
          onClick={onClose}
          aria-label="Close profile modal"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* User Identity Header */}
        <div className="reno-profile-header">
            <div className="reno-profile-avatar-initials">
              <span>{getInitials()}</span>
            </div>
            <div className="reno-profile-meta">
              <h3 className="reno-profile-name">{displayName}</h3>
              {mockUser.username && <span className="reno-profile-handle">@{mockUser.username}</span>}
              <span className="reno-profile-email">{mockUser.identifier || mockUser.email || 'Registered Member'}</span>
              <span className="reno-profile-badge">Verified Member</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="reno-profile-tabs">
            <button
              type="button"
              className={`reno-profile-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Downloads &amp; Orders
            </button>
            <button
              type="button"
              className={`reno-profile-tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account Details
            </button>
          </div>

          {/* Content Body */}
          <div className="reno-profile-body">
            {activeTab === 'orders' ? (
              <div className="reno-profile-empty-orders">
                <div className="reno-profile-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <h4>No Digital Purchases Yet</h4>
                <p>Your purchased 3D parametric files, CNC toolpaths, and invoices will appear here ready for instant download.</p>
              </div>
            ) : (
              <div className="reno-profile-info-list">
                <div className="reno-profile-info-row">
                  <span className="reno-info-label">Account ID</span>
                  <span className="reno-info-val">RENO-VIP-8821</span>
                </div>
                <div className="reno-profile-info-row">
                  <span className="reno-info-label">License Type</span>
                  <span className="reno-info-val">Commercial Studio License</span>
                </div>
                <div className="reno-profile-info-row">
                  <span className="reno-info-label">Cloud Storage</span>
                  <span className="reno-info-val">Unlimited CAD Sync</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="reno-profile-footer">
            <button
              type="button"
              className="reno-profile-logout-btn"
              onClick={() => {
                onLogout();
                onClose();
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
        </div>
      </div>
      );
}

      export default ProfileModal;

