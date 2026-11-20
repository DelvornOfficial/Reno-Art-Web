import React, { useState, useEffect } from 'react';
import './FooterContentTab.css';
import { API_BASE_URL } from '../../services/api';
import { DEFAULT_LEGAL_DOCS } from '../../data/defaultLegalDocs';

const DEFAULT_FOOTER_SETTINGS = {
  footer_tagline: 'Precision 3D elevation tiles, laser CNC Jali vectors, and parametric facade models engineered for architecture & manufacturing.',
  footer_phone: '+919876543210',
  footer_email: 'contact@renodesign.in',
  footer_show_phone: 'true',
  footer_show_email: 'true',
  footer_show_catalog: 'true',
  footer_show_cad: 'true',
  footer_catalog_items: '3D Elevation Tiles, CNC Jali Patterns, Acoustic Wall Panels, Parametric Facades, Ceiling Medallions',
  footer_cad_items: 'STL / OBJ (3D Printing), DXF / DWG (AutoCAD), CDR (CorelDraw Laser), STEP / IGES (CNC)',
  legal_terms: '',
  legal_privacy: '',
  legal_refund: '',
  legal_license: ''
};

export default function FooterContentTab() {
  const [formData, setFormData] = useState(DEFAULT_FOOTER_SETTINGS);
  const [activeSubTab, setActiveSubTab] = useState('footer'); // 'footer' | 'legal'
  const [activePolicyTab, setActivePolicyTab] = useState('terms'); // 'terms' | 'privacy' | 'refund' | 'license'
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // Structured editing state for active legal doc
  const [docModel, setDocModel] = useState(DEFAULT_LEGAL_DOCS.terms);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
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
      console.warn('Using default footer settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync docModel when activePolicyTab changes or formData loads
  useEffect(() => {
    const raw = formData[`legal_${activePolicyTab}`];
    if (raw && typeof raw === 'string' && raw.trim()) {
      try {
        setDocModel(JSON.parse(raw));
        return;
      } catch (e) {
        console.warn('Could not parse server doc JSON:', e);
      }
    } else if (raw && typeof raw === 'object') {
      setDocModel(raw);
      return;
    }
    // Fallback only if server hasn't sent anything yet
    setDocModel(DEFAULT_LEGAL_DOCS[activePolicyTab] || DEFAULT_LEGAL_DOCS.terms);
  }, [activePolicyTab, formData]);

  // Sync docModel when activePolicyTab changes or formData loads
  useEffect(() => {
    const raw = formData[`legal_${activePolicyTab}`];
      if (raw && typeof raw === 'string' && raw.trim()) {
        try {
          setDocModel(JSON.parse(raw));
          return;
        } catch (e) {
          console.warn('Could not parse server doc JSON:', e);
        }
      } else if (raw && typeof raw === 'object') {
        setDocModel(raw);
        return;
      }
      // Fallback only if server hasn't sent anything yet
      setDocModel(DEFAULT_LEGAL_DOCS[activePolicyTab] || DEFAULT_LEGAL_DOCS.terms);
    }, [activePolicyTab, formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] === 'true' ? 'false' : 'true'
    }));
  };

  // Handler for updating docModel fields
  const handleDocFieldChange = (field, value) => {
    setDocModel(prev => ({ ...prev, [field]: value }));
  };

  // Handler for section field changes
  const handleSectionChange = (index, field, value) => {
    setDocModel(prev => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], [field]: value };
      return { ...prev, sections: nextSections };
    });
  };

  // Handler for section bullet points (line-by-line)
  const handleSectionBulletsChange = (index, textValue) => {
    const lines = textValue.split('\n');
    setDocModel(prev => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], bulletPoints: lines };
      return { ...prev, sections: nextSections };
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setNotice(null);

    // If currently saving legal tab, serialize docModel into formData
    let payload = { ...formData };
    if (activeSubTab === 'legal') {
      const serialized = JSON.stringify(docModel, null, 2);
      payload[`legal_${activePolicyTab}`] = serialized;
      setFormData(prev => ({ ...prev, [`legal_${activePolicyTab}`]: serialized }));
    }

    try {
      const res = await fetch(`${API_BASE_URL}/site-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${res.status})`);
      }

      setNotice({
        type: 'success',
        title: 'Changes Published Successfully!',
        message: activeSubTab === 'legal'
          ? `${activePolicyTab.toUpperCase()} legal policy clauses have been updated live on the storefront.`
          : 'Footer description, phone, email, and columns updated live on storefront.'
      });

      setTimeout(() => {
        setNotice(prev => (prev?.type === 'success' ? null : prev));
      }, 5000);

    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Failed to Save Changes',
        message: err.message || 'Unable to update settings. Please check connection and try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset current document to exact factory default
  const handleResetToDefault = () => {
    const defaultDoc = DEFAULT_LEGAL_DOCS[activePolicyTab];
    if (defaultDoc) {
      setDocModel(defaultDoc);
      setFormData(prev => ({
        ...prev,
        [`legal_${activePolicyTab}`]: JSON.stringify(defaultDoc, null, 2)
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="crm-tab-container">
        <div className="crm-tab-header">
          <div>
            <h1 className="crm-tab-title">Footer &amp; Legal Policies</h1>
            <p className="crm-tab-subtitle">Manage storefront footer columns, contacts, and legal documentation.</p>
          </div>
        </div>
        <div className="crm-footer-loading-box">
          <div className="crm-footer-spinner"></div>
          <p>Synchronizing settings from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-tab-container">
      {/* Top Header */}
      <div className="crm-tab-header">
        <div>
          <h1 className="crm-tab-title">Footer &amp; Legal Policy Manager</h1>
          <p className="crm-tab-subtitle">
            Configure live footer tagline, phone, email, catalog links, CAD formats, and customize your Privacy &amp; Terms legal pages.
          </p>
        </div>
        <div className="crm-footer-subnav-pills">
          <button
            type="button"
            className={`crm-footer-pill ${activeSubTab === 'footer' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('footer')}
          >
            Storefront Footer
          </button>
          <button
            type="button"
            className={`crm-footer-pill ${activeSubTab === 'legal' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('legal')}
          >
            Legal &amp; Privacy Pages
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div className={`crm-status-toast-banner ${notice.type}`}>
          <div className="crm-toast-left">
            <div className="crm-toast-icon">
              {notice.type === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          <button type="button" onClick={() => setNotice(null)} className="crm-toast-close" title="Dismiss">&times;</button>
        </div>
      )}

      {/* SUB-TAB 1: STOREFRONT FOOTER */}
      {activeSubTab === 'footer' && (
        <form onSubmit={handleSave} className="crm-footer-editor-wrapper">
          {/* Section 1: Tagline & Contact Buttons */}
          <div className="crm-footer-card">
            <div className="crm-card-title-row">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <h3>1. Footer Description &amp; Contact Links</h3>
            </div>
            <p className="crm-field-desc">
              Control the tagline paragraph below the logo, along with Call Studio and Email Support pills.
            </p>

            <div className="crm-footer-form-group">
              <label className="crm-footer-label">Footer Tagline Paragraph</label>
              <textarea
                className="crm-footer-textarea crm-input-footer-tagline"
                rows={3}
                value={formData.footer_tagline}
                onChange={(e) => handleChange('footer_tagline', e.target.value)}
                placeholder="Precision 3D elevation tiles, laser CNC Jali vectors..."
                required
              />
            </div>

            <div className="crm-footer-grid-2">
              <div className="crm-footer-form-group">
                <div className="crm-toggle-label-row">
                  <label className="crm-footer-label">Studio Phone Number</label>
                  <label className="crm-switch-toggle">
                    <input
                      type="checkbox"
                      checked={formData.footer_show_phone === 'true'}
                      onChange={() => handleToggle('footer_show_phone')}
                    />
                    <span className="crm-switch-slider"></span>
                    <span className="crm-switch-text">{formData.footer_show_phone === 'true' ? 'Visible' : 'Hidden'}</span>
                  </label>
                </div>
                <input
                  type="text"
                  className="crm-footer-input"
                  value={formData.footer_phone}
                  onChange={(e) => handleChange('footer_phone', e.target.value)}
                  placeholder="+919876543210"
                />
              </div>

              <div className="crm-footer-form-group">
                <div className="crm-toggle-label-row">
                  <label className="crm-footer-label">Support Email Address</label>
                  <label className="crm-switch-toggle">
                    <input
                      type="checkbox"
                      checked={formData.footer_show_email === 'true'}
                      onChange={() => handleToggle('footer_show_email')}
                    />
                    <span className="crm-switch-slider"></span>
                    <span className="crm-switch-text">{formData.footer_show_email === 'true' ? 'Visible' : 'Hidden'}</span>
                  </label>
                </div>
                <input
                  type="email"
                  className="crm-footer-input"
                  value={formData.footer_email}
                  onChange={(e) => handleChange('footer_email', e.target.value)}
                  placeholder="contact@renodesign.in"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Catalog Navigation Column */}
          <div className="crm-footer-card">
            <div className="crm-card-title-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                <h3>2. Catalog Column Links</h3>
              </div>
              <label className="crm-switch-toggle">
                <input
                  type="checkbox"
                  checked={formData.footer_show_catalog === 'true'}
                  onChange={() => handleToggle('footer_show_catalog')}
                />
                <span className="crm-switch-slider"></span>
                <span className="crm-switch-text">{formData.footer_show_catalog === 'true' ? 'Column Active' : 'Column Removed'}</span>
              </label>
            </div>
            <p className="crm-field-desc">
              List the category items displayed in the Catalog footer column. You can remove, add, or customize anytime.
            </p>

            <div className="crm-footer-form-group">
              <textarea
                className="crm-footer-textarea"
                rows={3}
                disabled={formData.footer_show_catalog === 'false'}
                value={formData.footer_catalog_items}
                onChange={(e) => handleChange('footer_catalog_items', e.target.value)}
                placeholder="3D Elevation Tiles, CNC Jali Patterns, Acoustic Wall Panels..."
              />
              <span className="crm-footer-hint">Separate items with commas or newlines. Turn toggle OFF to hide the entire Catalog column.</span>
            </div>
          </div>

          {/* Section 3: CAD Formats Column */}
          <div className="crm-footer-card">
            <div className="crm-card-title-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <h3>3. CAD Formats Column Links</h3>
              </div>
              <label className="crm-switch-toggle">
                <input
                  type="checkbox"
                  checked={formData.footer_show_cad === 'true'}
                  onChange={() => handleToggle('footer_show_cad')}
                />
                <span className="crm-switch-slider"></span>
                <span className="crm-switch-text">{formData.footer_show_cad === 'true' ? 'Column Active' : 'Column Removed'}</span>
              </label>
            </div>
            <p className="crm-field-desc">
              List the CAD file formats shown in the footer. You can keep single formats, add new ones, or remove the whole column completely.
            </p>

            <div className="crm-footer-form-group">
              <textarea
                className="crm-footer-textarea"
                rows={3}
                disabled={formData.footer_show_cad === 'false'}
                value={formData.footer_cad_items}
                onChange={(e) => handleChange('footer_cad_items', e.target.value)}
                placeholder="STL / OBJ (3D Printing), DXF / DWG (AutoCAD), CDR (CorelDraw Laser)..."
              />
              <span className="crm-footer-hint">Tip: Enter only single items (e.g. 'STL / OBJ (3D Printing)') or toggle OFF to remove CAD Formats completely.</span>
            </div>
          </div>

          <div className="crm-publish-bar">
            <button type="submit" disabled={isSaving} className="crm-btn-publish-live">
              {isSaving ? (
                <>
                  <div className="crm-btn-spinner"></div>
                  <span>Publishing Changes...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Publish Footer Live</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: EXACT LEGAL & PRIVACY POLICIES */}
      {activeSubTab === 'legal' && (
        <div className="crm-footer-editor-wrapper">
          <div className="crm-footer-card">
            <div className="crm-card-title-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <h3>Policy Document Selector</h3>
              </div>
              <button
                type="button"
                className="crm-btn-reset-default"
                onClick={handleResetToDefault}
                title="Reset this policy to default studio copy"
              >
                Reset to Original Studio Text
              </button>
            </div>
            <p className="crm-field-desc">
              All 4 documents are loaded below in their exact structured layout (Headlines, Effective Dates, Status Badge, and Clauses 01 to 04 with Bullet Points). You can edit any sentence directly.
            </p>

            {/* Document Tabs */}
            <div className="crm-policy-selector-row">
              {[
                { id: 'terms', label: 'Terms of Service' },
                { id: 'privacy', label: 'Privacy Policy' },
                { id: 'refund', label: 'Refund Policy' },
                { id: 'license', label: 'Commercial License (Fabrication Rights)' }
              ].map(doc => (
                <button
                  key={doc.id}
                  type="button"
                  className={`crm-policy-btn ${activePolicyTab === doc.id ? 'active' : ''}`}
                  onClick={() => setActivePolicyTab(doc.id)}
                >
                  {doc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Document Header Metadata Editor */}
          <div className="crm-footer-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
              Header &amp; Overview for: <span style={{ color: '#2563EB' }}>{docModel.title}</span>
            </h3>

            <div className="crm-footer-grid-2">
              <div className="crm-footer-form-group">
                <label className="crm-footer-label">Category Badge Text</label>
                <input
                  type="text"
                  className="crm-footer-input"
                  value={docModel.category || ''}
                  onChange={(e) => handleDocFieldChange('category', e.target.value)}
                  placeholder="e.g. Legal Governance / Fabrication Rights"
                />
              </div>

              <div className="crm-footer-grid-2" style={{ gap: '0.75rem' }}>
                <div className="crm-footer-form-group">
                  <label className="crm-footer-label">Status Chip</label>
                  <input
                    type="text"
                    className="crm-footer-input"
                    value={docModel.status || ''}
                    onChange={(e) => handleDocFieldChange('status', e.target.value)}
                    placeholder="e.g. Active & Binding"
                  />
                </div>
                <div className="crm-footer-form-group">
                  <label className="crm-footer-label">Effective Date</label>
                  <input
                    type="text"
                    className="crm-footer-input"
                    value={docModel.effectiveDate || ''}
                    onChange={(e) => handleDocFieldChange('effectiveDate', e.target.value)}
                    placeholder="e.g. November 14, 2026"
                  />
                </div>
              </div>
            </div>

            <div className="crm-footer-form-group">
              <label className="crm-footer-label">Document Main Heading (H1)</label>
              <input
                type="text"
                className="crm-footer-input"
                style={{ fontWeight: 700 }}
                value={docModel.title || ''}
                onChange={(e) => handleDocFieldChange('title', e.target.value)}
                placeholder="Document Title"
              />
            </div>

            <div className="crm-footer-form-group">
              <label className="crm-footer-label">Executive Summary Box</label>
              <textarea
                className="crm-footer-textarea"
                rows={3}
                value={docModel.summary || ''}
                onChange={(e) => handleDocFieldChange('summary', e.target.value)}
                placeholder="Executive summary of this policy agreement..."
              />
            </div>
          </div>

          {/* Structured Clauses Stack */}
          {docModel.sections?.map((sec, idx) => (
            <div key={idx} className="crm-footer-card">
              <div className="crm-clause-card-top">
                <span className="crm-clause-num-badge">Clause {sec.num}</span>
                <input
                  type="text"
                  className="crm-clause-tag-input"
                  value={sec.tag || ''}
                  onChange={(e) => handleSectionChange(idx, 'tag', e.target.value)}
                  placeholder="Tag name (e.g. Digital Asset Scope)"
                />
              </div>

              <div className="crm-footer-form-group">
                <label className="crm-footer-label">Clause Title</label>
                <input
                  type="text"
                  className="crm-footer-input"
                  style={{ fontWeight: 700 }}
                  value={sec.title || ''}
                  onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                  placeholder="Clause Title"
                />
              </div>

              <div className="crm-footer-form-group">
                <label className="crm-footer-label">Lead Explanation Paragraph</label>
                <textarea
                  className="crm-footer-textarea"
                  rows={2}
                  value={sec.lead || ''}
                  onChange={(e) => handleSectionChange(idx, 'lead', e.target.value)}
                  placeholder="Short introductory statement..."
                />
              </div>

              <div className="crm-footer-form-group">
                <label className="crm-footer-label">Bullet Points (Each on a new line)</label>
                <textarea
                  className="crm-footer-textarea"
                  rows={4}
                  value={(sec.bulletPoints || []).join('\n')}
                  onChange={(e) => handleSectionBulletsChange(idx, e.target.value)}
                  placeholder="Bullet point 1&#10;Bullet point 2&#10;Bullet point 3"
                />
                <span className="crm-footer-hint">Press Enter to add new bullet points under this clause.</span>
              </div>
            </div>
          ))}

          {/* Action Bar */}
          <div className="crm-publish-bar">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="crm-btn-publish-live"
            >
              {isSaving ? (
                <>
                  <div className="crm-btn-spinner"></div>
                  <span>Publishing Changes...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Publish {activePolicyTab.toUpperCase()} Live</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
