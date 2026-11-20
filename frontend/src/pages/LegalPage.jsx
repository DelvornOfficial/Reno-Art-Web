import React, { useState, useEffect } from 'react';
import './LegalPage.css';
import Footer from '../components/footer/Footer';
import { API_BASE_URL, getWebSocketUrl } from '../services/api';

export function LegalPage({ type = 'terms', onNavigateToHome }) {
  const tabs = [
    { key: 'terms', label: 'Terms of Service', href: '/terms' },
    { key: 'privacy', label: 'Privacy Policy', href: '/privacy' },
    { key: 'refund', label: 'Refund Policy', href: '/refund' },
    { key: 'license', label: 'Commercial License', href: '/license' }
  ];

  const [customLegalContent, setCustomLegalContent] = useState({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/site-content`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setCustomLegalContent(data);
        }
      })
      .catch(() => { });

    let ws = null;
    try {
      ws = new WebSocket(getWebSocketUrl());
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === 'SITE_CONTENT_UPDATED' && msg.data) {
            setCustomLegalContent(prev => ({ ...prev, ...msg.data }));
          }
        } catch { }
      };
    } catch { }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleTabClick = (tKey, href) => {
    if (tKey === type) return;
    window.history.pushState({ route: tKey }, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const contentMap = {
    terms: {
      category: 'Legal Governance',
      title: 'Terms of Service & Usage Agreement',
      effectiveDate: 'November 14, 2026',
      status: 'Active & Binding',
      summary: 'These Terms of Service govern the purchase, licensing, and manufacturing usage of all 3D elevation CAD models, laser CNC Jali vectors, and parametric mesh files purchased through RENO DESIGN Studio.',
      sections: [
        {
          num: '01',
          tag: 'Digital Asset Scope',
          title: 'Commercial Digital Assets & Deliverables',
          lead: 'RENO DESIGN supplies production-ready digital computer-aided design files in STL, OBJ, DXF, DWG, CDR, and STEP formats.',
          bulletPoints: [
            'Files are engineered for CNC stone routers, CO2/Fiber laser cutters, plasma tables, and additive 3D manufacturing.',
            'Purchasing an asset grants a non-exclusive, perpetual commercial license for physical fabrication.',
            'Digital files are delivered immediately as instant secure downloads upon successful payment gateway clearance.'
          ]
        },
        {
          num: '02',
          tag: 'Physical Production',
          title: 'Authorized Commercial Fabrication Rights',
          lead: 'You hold complete commercial authorization to manufacture and sell physical end-products made with our files.',
          bulletPoints: [
            'Sell unlimited physical stone wall tiles, wooden partition Jalis, gypsum ceiling medallions, and aluminum facade claddings.',
            'Incorporate designs into residential villas, commercial hotels, and corporate interior projects.',
            'No ongoing royalty fees or physical unit sales caps apply to manufactured goods.'
          ]
        },
        {
          num: '03',
          tag: 'Strict Restrictions',
          title: 'Zero File Reselling, Piracy & Distribution Prohibition',
          lead: 'All original 3D geometry, mathematical toolpaths, and vector source code remain the exclusive intellectual property of RENO DESIGN.',
          bulletPoints: [
            'PROHIBITED: Reselling, leasing, sub-licensing, or freely distributing the raw digital files.',
            'PROHIBITED: Uploading CAD files to file-sharing networks, Telegram groups, WhatsApp communities, or peer platforms.',
            'PROHIBITED: Packaging RENO DESIGN vectors into competing digital marketplace bundles.'
          ]
        },
        {
          num: '04',
          tag: 'Machining Protocol',
          title: 'Toolpath Simulation & Machine Calibration Liability',
          lead: 'Machining safety and final cut tolerance depend on your local CNC setup and operator calibration.',
          bulletPoints: [
            'Always simulate toolpaths in your CAM software (ArtCAM, Aspire, Fusion 360) prior to cutting physical raw stock.',
            'Verify cutter bit diameter, step-over percentages, feed rates, and Z-axis plunge clearance.',
            'RENO DESIGN is not liable for material damage resulting from incorrect machine calibration or improper cutter tooling.'
          ]
        }
      ]
    },
    privacy: {
      category: 'Data Protection & Security',
      title: 'Privacy Policy & Information Governance',
      effectiveDate: 'November 14, 2026',
      status: 'GDPR & DPDP Aligned',
      summary: 'At RENO DESIGN, your architectural IP and personal data are protected with bank-grade encryption. We collect only what is strictly required to service your account and deliver instant CAD files.',
      sections: [
        {
          num: '01',
          tag: 'Data Collection',
          title: 'Information We Collect & Why',
          lead: 'We maintain minimal data footprint strictly necessary for transactional fulfillment and account security.',
          bulletPoints: [
            'Account Credentials: Name, verified email address, and mobile number for download verification.',
            'Transaction Metadata: Payment gateway order ID, timestamps, and purchased asset identifiers.',
            'Technical Telemetry: IP addresses and device browser fingerprints used to prevent account compromise and brute-force attacks.'
          ]
        },
        {
          num: '02',
          tag: 'Financial Security',
          title: '100% Encrypted Payment Architecture',
          lead: 'Financial security is guaranteed through certified, industry-standard payment processors.',
          bulletPoints: [
            'Transactions are secured with 256-bit TLS/SSL encryption and PCI-DSS Level 1 compliance.',
            'We NEVER view, log, or store your debit/credit card numbers, CVV codes, or UPI PINs.',
            'Payment authentication is handled directly by licensed banking gateways.'
          ]
        },
        {
          num: '03',
          tag: 'Signed Delivery',
          title: 'Download Session Security & Anti-Theft Tokens',
          lead: 'To protect purchased assets from unauthorized links, downloads utilize cryptographic signed URLs.',
          bulletPoints: [
            'Download tokens expire automatically to prevent hot-linking and unauthorized file leeching.',
            'Authorized customers retain perpetual redownload access through their dedicated RENO account portal.'
          ]
        },
        {
          num: '04',
          tag: 'Ethical Pledge',
          title: 'Zero Third-Party Data Monetization',
          lead: 'We believe customer trust is non-negotiable. Your information will never be treated as a commercial commodity.',
          bulletPoints: [
            'We DO NOT sell, rent, trade, or disclose your contact details to third-party telemarketers or advertisers.',
            'Communications from RENO DESIGN are restricted strictly to order receipts, license notices, and security alerts.'
          ]
        }
      ]
    },
    refund: {
      category: 'Order Guarantee',
      title: 'Refund & Digital File Quality Policy',
      effectiveDate: 'November 14, 2026',
      status: 'Quality Replacement Guarantee',
      summary: 'Because our catalog consists of instant-delivery digital CAD assets, we enforce a fair, transparent policy backed by dedicated engineering support and defective file replacements.',
      sections: [
        {
          num: '01',
          tag: 'Digital Nature',
          title: 'Instant Download & Intangible Goods Policy',
          lead: 'Digital design files cannot be physically returned once retrieved by the client device.',
          bulletPoints: [
            'Standard consumer change-of-mind refunds are not applicable once a CAD download link has been triggered.',
            'Please verify pattern dimensions, file formats (STL, DXF, DWG), and software compatibility prior to checkout.'
          ]
        },
        {
          num: '02',
          tag: 'Quality Replacement',
          title: '24-Hour Mesh Defect Resolution Guarantee',
          lead: 'Every file sold on RENO DESIGN is backed by a watertight geometry guarantee.',
          bulletPoints: [
            'If a purchased 3D mesh contains non-manifold edges, inverted normals, or sliced CAD paths that prevent machining, report it to our engineering desk.',
            'Our CAD specialists will repair and provide a validated replacement file within 24 business hours free of charge.'
          ]
        },
        {
          num: '03',
          tag: '100% Cash Refund',
          title: 'Accidental Duplicate Orders & Gateway Overcharges',
          lead: 'Technical errors or double debits are resolved with immediate full refunds.',
          bulletPoints: [
            'If you accidentally purchase the exact same file twice within 48 hours, the duplicate order is refunded 100%.',
            'Payment gateway double-deductions are reversed immediately back to your original source account within 3–5 working days.'
          ]
        },
        {
          num: '04',
          tag: 'Free Support',
          title: 'CAD Format Compatibility Assistance',
          lead: 'Encountering issues opening DXF or CDR files in older AutoCAD or CorelDraw versions? We help you convert them.',
          bulletPoints: [
            'Reach our CAD support team at contact@renodesign.in with your order number.',
            'We provide free legacy format downgrades (e.g., AutoCAD 2004 DXF, CorelDraw X7 CDR) to ensure seamless tooling.'
          ]
        }
      ]
    },
    license: {
      category: 'Fabrication Rights',
      title: 'Commercial Manufacturing License',
      effectiveDate: 'November 14, 2026',
      status: 'Perpetual Commercial Grant',
      summary: 'A clear breakdown of exactly what you can and cannot do with files downloaded from RENO DESIGN Studio.',
      sections: [
        {
          num: '01',
          tag: 'Allowed Production',
          title: 'Physical Products You Can Manufacture & Sell',
          lead: 'Full commercial freedom to produce physical artifacts using CNC routing, waterjet, laser, or 3D printing.',
          bulletPoints: [
            'Exterior wall elevation tiles and decorative stone claddings.',
            'CNC cut MDF/PVC/WPC partition Jalis, screen doors, and decorative room dividers.',
            'Custom architectural ceiling panels, moldings, and parametric furniture elements.',
            'Physical scale models, bronze/metal casting patterns, and vacuum forming molds.'
          ]
        },
        {
          num: '02',
          tag: 'Digital Usage',
          title: 'Architectural Renders & Visualizations',
          lead: 'Usage rights for digital architectural marketing materials.',
          bulletPoints: [
            'Allowed: Using 3D models in architectural renderings, 3D floor plans, walk-through videos, and client presentations.',
            'Allowed: Including models in portfolio displays showcasing completed architectural projects.'
          ]
        },
        {
          num: '03',
          tag: 'Restricted Activities',
          title: 'Actions Requiring Explicit Studio Authorization',
          lead: 'Prohibitions designed to protect the integrity of the design catalog.',
          bulletPoints: [
            'Never redistribute, re-sell, or share the raw 3D mesh (STL/OBJ) or 2D vector file (DXF/CDR).',
            'Do not incorporate raw 3D digital files into downloadable open-source repositories or video game asset packs.'
          ]
        }
      ]
    }
  };

  const rawCustom = customLegalContent[`legal_${type}`];
  let customParsed = null;
  if (rawCustom && rawCustom.trim()) {
    try {
      customParsed = JSON.parse(rawCustom);
    } catch {
      // Plain text fallback
      customParsed = {
        category: 'Legal Governance',
        title: tabs.find(t => t.key === type)?.label || 'Policy Document',
        effectiveDate: 'Live Updated',
        status: 'Active & Binding',
        summary: rawCustom.slice(0, 160) + '...',
        sections: [
          {
            num: '01',
            tag: 'Policy Details',
            title: tabs.find(t => t.key === type)?.label || 'Overview',
            lead: rawCustom,
            bulletPoints: []
          }
        ]
      };
    }
  }

  const currentDoc = customParsed || contentMap[type] || contentMap.terms;

  return (
    <div className="reno-legal-page">
      <main className="reno-legal-container">
        {/* Top Control Bar: Back button + Live Document Switcher */}
        <div className="reno-legal-nav-bar">
          <button type="button" className="reno-legal-back-btn" onClick={onNavigateToHome}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to Store</span>
          </button>

          {/* Document Switching Pills */}
          <div className="reno-legal-tabs-scroll">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`reno-legal-tab-btn ${type === tab.key ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key, tab.href)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Document Header with Category & Status Chips */}
        <header className="reno-legal-hero">
          <div className="reno-legal-meta-row">
            <span className="reno-legal-category-chip">{currentDoc.category}</span>
            <span className="reno-legal-status-chip">
              <span className="reno-status-pulse" />
              {currentDoc.status}
            </span>
          </div>

          <h1 className="reno-legal-title">{currentDoc.title}</h1>

          <div className="reno-legal-date-bar">
            <span>Effective: <strong>{currentDoc.effectiveDate}</strong></span>
            <span className="reno-meta-sep">&bull;</span>
            <span>RENO DESIGN Studio Standard Protocol</span>
          </div>

          <div className="reno-legal-summary-box">
            <div className="reno-summary-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <p className="reno-summary-text">{currentDoc.summary}</p>
          </div>
        </header>

        {/* Structured Sections with Highlight Badges & Clear Bullet Lists */}
        <div className="reno-legal-sections-stack">
          {currentDoc.sections.map((sec, idx) => (
            <article key={idx} className="reno-legal-clause-card">
              <div className="reno-clause-header">
                <span className="reno-clause-number">{sec.num}</span>
                <div className="reno-clause-title-wrap">
                  <span className="reno-clause-tag">{sec.tag}</span>
                  <h2 className="reno-clause-title">{sec.title}</h2>
                </div>
              </div>

              <div className="reno-clause-body">
                <p className="reno-clause-lead">{sec.lead}</p>
                <ul className="reno-clause-points">
                  {sec.bulletPoints.map((point, pIdx) => (
                    <li key={pIdx} className="reno-point-item">
                      <svg className="reno-point-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        {/* Need Help / Support Callout */}
        <div className="reno-legal-help-card">
          <div className="reno-help-content">
            <h3 className="reno-help-title">Need custom licensing or file assistance?</h3>
            <p className="reno-help-desc">
              Our CAD engineering and architectural studio desk is available 7 days a week for toolpath queries, custom mesh adjustments, and format conversion.
            </p>
          </div>
          <a href="mailto:contact@renodesign.in" className="reno-help-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>Contact Support Desk</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default LegalPage;
