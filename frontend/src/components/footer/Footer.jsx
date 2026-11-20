import React, { useState, useEffect } from 'react';
import './Footer.css';
import handLogo from '../../assets/hand.svg';
import renoText from '../../assets/reno-design.svg';
import { API_BASE_URL, getWebSocketUrl } from '../../services/api';

const DEFAULT_FOOTER = {
  footer_tagline: 'Precision 3D elevation tiles, laser CNC Jali vectors, and parametric facade models engineered for architecture & manufacturing.',
  footer_phone: '+919876543210',
  footer_email: 'contact@renodesign.in',
  footer_show_phone: 'true',
  footer_show_email: 'true',
  footer_show_catalog: 'true',
  footer_show_cad: 'true',
  footer_catalog_items: '3D Elevation Tiles, CNC Jali Patterns, Acoustic Wall Panels, Parametric Facades, Ceiling Medallions',
  footer_cad_items: 'STL / OBJ (3D Printing), DXF / DWG (AutoCAD), CDR (CorelDraw Laser), STEP / IGES (CNC)'
};

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [openSection, setOpenSection] = useState(null);
  const [footerData, setFooterData] = useState(DEFAULT_FOOTER);

  useEffect(() => {
    fetch(`${API_BASE_URL}/site-content`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setFooterData(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => { });

    let ws = null;
    try {
      ws = new WebSocket(getWebSocketUrl());
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'SITE_CONTENT_UPDATED' && msg.data) {
            setFooterData(prev => ({ ...prev, ...msg.data }));
          }
        } catch { }
      };
    } catch { }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const toggleSection = (section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

      const showCatalog = footerData.footer_show_catalog !== 'false';
      const showCad = footerData.footer_show_cad !== 'false';
      const showPhone = footerData.footer_show_phone !== 'false' && Boolean(footerData.footer_phone?.trim());
      const showEmail = footerData.footer_show_email !== 'false' && Boolean(footerData.footer_email?.trim());

      // Split comma or newline separated strings
      const catalogList = (footerData.footer_catalog_items || '')
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(label => ({ label, href: '#marketplace' }));

      const cadList = (footerData.footer_cad_items || '')
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(label => ({ label, href: '#marketplace' }));

      const sections = [];
      if(showCatalog && catalogList.length > 0) {
      sections.push({
        id: 'catalog',
        title: 'Catalog',
          links: catalogList
        });
    }

  if (showCad && cadList.length > 0) {
    sections.push({
      id: 'cad',
      title: 'CAD Formats',
    links: cadList
  });
}

sections.push({
  id: 'legal',
  title: 'Legal & Policy',
  links: [
    { label: 'Commercial License', href: '/license' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Refund Policy', href: '/refund' }
  ]
});

return (
  <footer className="reno-footer" role="contentinfo">
    <div className="reno-footer-inner">
      {/* Top Brand Box */}
      <div className="reno-footer-brand-section">
        <div className="reno-footer-brand">
          <img src={handLogo} alt="" className="reno-footer-logo-hand" />
          <img src={renoText} alt="RENO DESIGN" className="reno-footer-logo-text" />
        </div>
        <p className="reno-footer-tagline">
          {footerData.footer_tagline || DEFAULT_FOOTER.footer_tagline}
        </p>

        <div className="reno-footer-contact-row">
          {showPhone && (
            <a href={`tel:${footerData.footer_phone}`} className="reno-footer-pill-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Call Studio</span>
            </a>
          )}
          {showEmail && (
            <a href={`mailto:${footerData.footer_email}`} className="reno-footer-pill-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>Email Support</span>
            </a>
          )}
        </div>
      </div>

      {/* Collapsible Accordion Navigation (Mobile) / Elegant Columns (Desktop) */}
      <div className="reno-footer-accordion-group">
        {sections.map((sec) => {
          const isOpen = openSection === sec.id;
          return (
            <div key={sec.id} className={`reno-footer-accordion-item ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="reno-footer-accordion-btn"
                onClick={() => toggleSection(sec.id)}
                aria-expanded={isOpen}
              >
                <span className="reno-footer-sec-title">{sec.title}</span>
                <svg
                  className="reno-footer-chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div className="reno-footer-accordion-content">
                <ul className="reno-footer-nav-list">
                  {sec.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="reno-footer-nav-link"
                        onClick={(e) => {
                          if (link.href.startsWith('/')) {
                            e.preventDefault();
                            const route = link.href.replace('/', '');
                            window.history.pushState({ route }, '', link.href);
                            window.dispatchEvent(new PopStateEvent('popstate'));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Bar: Clean, Centered, Professional */}
      <div className="reno-footer-bottom-bar">
        <div className="reno-footer-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Instant Digital Download &bull; Verified Production Files</span>
        </div>
        <p className="reno-footer-copyright">
          &copy; {currentYear} Delvorn Core. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);
}

export default Footer;
