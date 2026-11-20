import React, { useState, useEffect } from 'react';
import './SiteContentTab.css';
import { API_BASE_URL } from '../../services/api';

const DEFAULT_CONTENT = {
  announcement_tagline: 'Tiles designing & 3D architectural patterns | Instant Digital',
  hero_pill: 'Verified Production CNC & 3D Print Files',
  hero_title: 'Architectural 3D & CNC Design Marketplace',
  hero_description: 'Instant digital downloads for CNC stone routing, 3D printing, laser Jali cutting, and interior wall panels. Production-ready files in STL, OBJ, DXF, and DWG.',
  stat_1_val: '500+',
  stat_1_lbl: 'Digital Assets',
  stat_2_val: '100%',
  stat_2_lbl: 'CNC Toolpath Ready',
  stat_3_val: 'Instant',
  stat_3_lbl: 'Secure Delivery'
};

export default function SiteContentTab() {
  const [formData, setFormData] = useState(DEFAULT_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Explicit notification states
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', title: string, message: string }

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/site-content`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          setFormData(prev => ({ ...prev, ...data }));
        }
      }
    } catch (err) {
      console.warn('Using default content settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch(`${API_BASE_URL}/site-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${res.status})`);
      }

      // Success notification (Clean Professional Green)
      setNotice({
        type: 'success',
        title: 'Changes Published Successfully!',
        message: 'Storefront announcement tagline, hero header, and key metrics have been updated.'
      });

      // Auto dismiss success notice after 5 seconds
      setTimeout(() => {
        setNotice(prev => (prev?.type === 'success' ? null : prev));
      }, 5000);

    } catch (err) {
      // Failure notification (Clean Professional Red)
      setNotice({
        type: 'error',
        title: 'Failed to Publish Changes',
        message: err.message || 'Unable to connect to the backend server. Please verify your connection and try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="crm-tab-container">
        <div className="crm-tab-header">
          <div>
            <h1 className="crm-tab-title">Hero Banner &amp; Announcements</h1>
            <p className="crm-tab-subtitle">
              Control the live announcement tagline, hero headline, subtitle, and badges displayed on the Reno Design storefront.
            </p>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="crm-content-loading-box">
          <div className="crm-content-spinner"></div>
          <span className="crm-content-loading-text">Synchronizing content settings from database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-tab-container">
      {/* Header */}
      <div className="crm-tab-header">
        <div>
          <h1 className="crm-tab-title">Hero Banner &amp; Announcements</h1>
          <p className="crm-tab-subtitle">
            Control the live announcement tagline, hero headline, subtitle, and badges displayed on the Reno Design storefront.
          </p>
        </div>
      </div>

      {/* Dynamic Status Notification Banner: Green for Success, Red for Error */}
      {notice && (
        <div className={`crm-status-toast-banner ${notice.type}`}>
          <div className="crm-toast-left">
            <div className="crm-toast-icon">
              {notice.type === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </div>
            <div>
              <h4 className="crm-toast-title">{notice.title}</h4>
              <p className="crm-toast-desc">{notice.message}</p>
            </div>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="crm-toast-close" title="Dismiss">
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="crm-content-editor-wrapper">
        {/* Card 1: Announcement Ticker */}
        <div className="crm-content-card">
          <div className="crm-card-title-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            <h3>1. Top Tagline Announcement (Mobile Marquee)</h3>
          </div>
          <p className="crm-field-desc">
            This ticker appears at the very top of the mobile storefront header.
          </p>

          <div className="crm-content-form-group">
            <label className="crm-content-label">Announcement Tagline Text</label>
            <input
              type="text"
              className="crm-content-input crm-input-tagline"
              value={formData.announcement_tagline}
              onChange={(e) => handleChange('announcement_tagline', e.target.value)}
              placeholder="e.g. Tiles designing & 3D architectural patterns | Instant Digital"
              required
            />
          </div>
        </div>

        {/* Card 2: Hero Headline & Description */}
        <div className="crm-content-card">
          <div className="crm-card-title-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <h3>2. Storefront Hero Headline &amp; Pill Badge</h3>
          </div>
          <p className="crm-field-desc">
            The primary centerpiece heading seen by all visitors on desktop and mobile.
          </p>

          <div className="crm-content-form-group">
            <label className="crm-content-label">Small Pill Badge Text (Above Title)</label>
            <input
              type="text"
              className="crm-content-input crm-input-hero-pill"
              value={formData.hero_pill}
              onChange={(e) => handleChange('hero_pill', e.target.value)}
              placeholder="e.g. Verified Production CNC & 3D Print Files"
              required
            />
          </div>

          <div className="crm-content-form-group">
            <label className="crm-content-label">Hero Main Title</label>
            <input
              type="text"
              className="crm-content-input crm-input-hero-title"
              value={formData.hero_title}
              onChange={(e) => handleChange('hero_title', e.target.value)}
              placeholder="e.g. Architectural 3D & CNC Design Marketplace"
              required
            />
            <span className="crm-content-hint">
              Note: Uses the exact storefront headline font ('Space Grotesk').
            </span>
          </div>

          <div className="crm-content-form-group">
            <label className="crm-content-label">Hero Description Paragraph</label>
            <textarea
              className="crm-content-textarea crm-input-hero-desc"
              rows={4}
              value={formData.hero_description}
              onChange={(e) => handleChange('hero_description', e.target.value)}
              placeholder="Instant digital downloads for CNC stone routing, 3D printing, laser Jali cutting..."
              required
            />
          </div>
        </div>

        {/* Card 3: Trust Metrics */}
        <div className="crm-content-card">
          <div className="crm-card-title-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <h3>3. Trust Metric Badges (Below Description)</h3>
          </div>
          <p className="crm-field-desc">
            The 3 statistical key selling points shown under the hero description.
          </p>

          <div className="crm-stats-grid">
            <div className="crm-stat-box">
              <span className="crm-stat-box-title">Badge 1</span>
              <div className="crm-stat-field">
                <label>Value</label>
                <input
                  type="text"
                  className="crm-input-stat-val"
                  value={formData.stat_1_val}
                  onChange={(e) => handleChange('stat_1_val', e.target.value)}
                  placeholder="500+"
                />
              </div>
              <div className="crm-stat-field">
                <label>Label</label>
                <input
                  type="text"
                  className="crm-input-stat-lbl"
                  value={formData.stat_1_lbl}
                  onChange={(e) => handleChange('stat_1_lbl', e.target.value)}
                  placeholder="Digital Assets"
                />
              </div>
            </div>

            <div className="crm-stat-box">
              <span className="crm-stat-box-title">Badge 2</span>
              <div className="crm-stat-field">
                <label>Value</label>
                <input
                  type="text"
                  className="crm-input-stat-val"
                  value={formData.stat_2_val}
                  onChange={(e) => handleChange('stat_2_val', e.target.value)}
                  placeholder="100%"
                />
              </div>
              <div className="crm-stat-field">
                <label>Label</label>
                <input
                  type="text"
                  className="crm-input-stat-lbl"
                  value={formData.stat_2_lbl}
                  onChange={(e) => handleChange('stat_2_lbl', e.target.value)}
                  placeholder="CNC Toolpath Ready"
                />
              </div>
            </div>

            <div className="crm-stat-box">
              <span className="crm-stat-box-title">Badge 3</span>
              <div className="crm-stat-field">
                <label>Value</label>
                <input
                  type="text"
                  className="crm-input-stat-val"
                  value={formData.stat_3_val}
                  onChange={(e) => handleChange('stat_3_val', e.target.value)}
                  placeholder="Instant"
                />
              </div>
              <div className="crm-stat-field">
                <label>Label</label>
                <input
                  type="text"
                  className="crm-input-stat-lbl"
                  value={formData.stat_3_lbl}
                  onChange={(e) => handleChange('stat_3_lbl', e.target.value)}
                  placeholder="Secure Delivery"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="crm-publish-bar">
          <button
            type="submit"
            disabled={isSaving}
            className="crm-btn-publish-live"
          >
            {isSaving ? (
              <>
                <div className="crm-btn-spinner"></div>
                <span>Publishing Live Changes...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Publish to Storefront Live</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
