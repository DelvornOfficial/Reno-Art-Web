import React, { useState, useEffect } from 'react';
import './MyProductsPage.css';
import handLogo from '../assets/hand.svg';
import renoText from '../assets/reno-design.svg';
import { useToast } from '../context/ToastContext';

export function MyProductsPage({
  user,
  purchasedProducts = [],
  isLoading = false,
  onNavigateToHome,
  onOpenProduct
}) {
  const { showToast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedProduct]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const handleDownloadFile = async (targetUrl, productName, docOriginalName) => {
    const url = targetUrl;
    if (!url) {
      showToast(`Download package for ${productName} is being prepared.`, "info");
      return;
    }

    // Determine extension from original document name or url or fallback to zip
    let ext = 'zip';
    if (docOriginalName && docOriginalName.includes('.')) {
      ext = docOriginalName.split('.').pop().toLowerCase();
    } else if (url.startsWith('data:')) {
      const mime = url.split(';')[0].split(':')[1];
      if (mime?.includes('pdf')) ext = 'pdf';
      else if (mime?.includes('zip')) ext = 'zip';
      else if (mime?.includes('png')) ext = 'png';
      else if (mime?.includes('jpeg') || mime?.includes('jpg')) ext = 'jpg';
    } else if (url.includes('.')) {
      const parts = url.split('?')[0].split('/');
      const last = parts[parts.length - 1];
      if (last.includes('.')) {
        ext = last.split('.').pop().toLowerCase();
      }
    }

    const safeTitle = (productName || 'Product')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const finalFilename = `${safeTitle}.${ext}`;

    try {
      if (url.startsWith('data:')) {
        // Convert Base64 Data URL to Blob for clean named download
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } else {
        // Normal direct link
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('download', finalFilename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      // Fallback
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Dedicated Full Page View when a product is clicked
  if (selectedProduct) {
    return (
      <div className="reno-myproducts-page-wrapper">
        <header className="reno-myproducts-header">
          <button
            type="button"
            className="reno-myproducts-back-btn"
            onClick={() => setSelectedProduct(null)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to My Products</span>
          </button>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToHome();
            }}
            className="reno-myproducts-brand"
          >
            <img src={handLogo} alt="" className="reno-myproducts-hand" />
            <img src={renoText} alt="RENO DESIGN" className="reno-myproducts-logo-text" />
          </a>
        </header>

        <main className="reno-myproducts-container">
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(10, 10, 12, 0.08)',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(10, 10, 12, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Top Product Showcase */}
            <div style={{
              display: 'flex',
              gap: '1.25rem',
              alignItems: 'center',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid rgba(10, 10, 12, 0.08)',
              flexWrap: 'wrap'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '1rem',
                overflow: 'hidden',
                backgroundColor: '#18181B',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(10, 10, 12, 0.08)'
              }}>
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 800 }}>CAD</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(0, 149, 246, 0.12)',
                    color: '#0095F6'
                  }}>
                    {selectedProduct.category || '3D Architecture'}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D'
                  }}>
                    ✓ UNLOCKED &bull; PERMANENT LICENSE
                  </span>
                </div>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, color: '#0A0A0C' }}>
                  {selectedProduct.title}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#6B6861' }}>
                  Supported Formats: <strong>{selectedProduct.format || 'OBJ / STL / DWG'}</strong>
                </div>
              </div>
            </div>

            {/* Invoice & Purchase Details Table */}
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8E8A80', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem' }}>
                Purchase Invoice Summary
              </h3>

              <div style={{
                backgroundColor: '#FAF9F6',
                border: '1px solid rgba(10, 10, 12, 0.08)',
                borderRadius: '0.85rem',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6B6861' }}>Purchase Date:</span>
                  <strong style={{ color: '#0A0A0C' }}>{formatDate(selectedProduct.purchased_at)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6B6861' }}>Amount Spent:</span>
                  <strong style={{ color: '#10B981', fontSize: '1rem', fontWeight: 800 }}>
                    {formatCurrency(selectedProduct.price_paid || 1)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6B6861' }}>Order ID:</span>
                  <code style={{ color: '#0A0A0C', fontFamily: 'monospace', fontWeight: 700 }}>
                    {selectedProduct.order_number || `RENO-ORD-${selectedProduct.id}`}
                  </code>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6B6861' }}>Invoice Number:</span>
                  <code style={{ color: '#0095F6', fontFamily: 'monospace', fontWeight: 700 }}>
                    {selectedProduct.invoice_number || `INV-${selectedProduct.id}`}
                  </code>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6B6861' }}>Payment Mode:</span>
                  <strong style={{ color: '#0A0A0C' }}>
                    {selectedProduct.payment_method || 'UPI / Razorpay Verified'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(10, 10, 12, 0.12)' }}>
                  <span style={{ color: '#6B6861' }}>License Key:</span>
                  <code style={{ color: '#0A0A0C', fontFamily: 'monospace', fontWeight: 800, background: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(10,10,12,0.1)' }}>
                    {selectedProduct.license_key}
                  </code>
                </div>
              </div>
            </div>

            {/* Action Buttons: CAD Download & PDF Specification */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  const dlUrl = selectedProduct.file_download_url || selectedProduct.pdf_document_url || selectedProduct.download_url;
                  handleDownloadFile(dlUrl, selectedProduct.title, selectedProduct.document_name);
                }}
                style={{
                  all: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.25rem',
                  backgroundColor: '#0A0A0C',
                  color: '#FFFFFF',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(10, 10, 12, 0.15)',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Full CAD Package (STL, OBJ, DWG)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const orderNum = selectedProduct.order_number || selectedProduct.order_id || selectedProduct.id;
                  const apiBase = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                    ? 'http://localhost:1002/api/v1'
                    : (window.location.origin.includes('38.87.116.97') ? 'http://38.87.116.97/api/v1' : 'https://api.renoart.in/api/v1');
                  window.open(`${apiBase}/invoices/render/${orderNum}`, '_blank');
                }}
                style={{
                  all: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  backgroundColor: '#FAF9F6',
                  border: '1px solid rgba(10, 10, 12, 0.14)',
                  color: '#0A0A0C',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Download &amp; Print Official GST Tax Invoice</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Normal List View
  return (
    <div className="reno-myproducts-page-wrapper">
      {/* Top Header Navigation */}
      <header className="reno-myproducts-header">
        <button
          type="button"
          className="reno-myproducts-back-btn"
          onClick={onNavigateToHome}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to Marketplace</span>
        </button>

        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToHome();
          }}
          className="reno-myproducts-brand"
        >
          <img src={handLogo} alt="" className="reno-myproducts-hand" />
          <img src={renoText} alt="RENO DESIGN" className="reno-myproducts-logo-text" />
        </a>
      </header>

      {/* Main Container */}
      <main className="reno-myproducts-container">
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
            {[1, 2].map((k) => (
              <div key={k} className="studio-skeleton-card" style={{ height: '72px', width: '100%' }} />
            ))}
          </div>
        ) : purchasedProducts.length === 0 ? (
          <div className="reno-myproducts-empty">
            <div className="reno-myproducts-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8E8A80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h2>No Purchased Products Yet</h2>
            <p>
              When you purchase 3D tiles, panels or CNC relief models from our marketplace, your permanent download links and licenses will appear here automatically.
            </p>
            <button
              type="button"
              className="reno-myproducts-browse-btn"
              onClick={onNavigateToHome}
            >
              Browse 3D Catalog
            </button>
          </div>
        ) : (
          <div className="reno-myproducts-minimal-list">
            {purchasedProducts.map((prod, idx) => (
              <div
                key={`${prod.id}-${idx}`}
                className="reno-myproducts-minimal-card"
                onClick={() => setSelectedProduct(prod)}
                style={{ cursor: 'pointer' }}
              >
                <div className="reno-myproducts-minimal-thumb" style={{ background: prod.gradient || '#18181B' }}>
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.title} className="reno-myproducts-thumb-img" />
                  ) : (
                    <span className="reno-myproducts-thumb-fmt">{prod.format || '3D'}</span>
                  )}
                </div>

                <div className="reno-myproducts-minimal-info">
                  <div className="reno-myproducts-minimal-tagrow">
                    <span className="reno-myproducts-min-cat">{prod.category || '3D Model'}</span>
                    <span className="reno-myproducts-min-status">✓ Unlocked</span>
                  </div>
                  <h3 className="reno-myproducts-min-title">{prod.title}</h3>
                  <code className="reno-myproducts-min-license">{prod.license_key || `RENO-LIC-${prod.id?.toString().slice(0, 8).toUpperCase() || 'CAD'}`}</code>
                </div>

                <div className="reno-myproducts-minimal-btn-col" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="reno-myproducts-min-dl-btn"
                    onClick={() => {
                      const dlUrl = prod.file_download_url || prod.pdf_document_url || prod.download_url;
                      handleDownloadFile(dlUrl, prod.title, prod.document_name);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download CAD</span>
                  </button>

                  <button
                    type="button"
                    className="reno-myproducts-min-doc-btn"
                    onClick={() => setSelectedProduct(prod)}
                  >
                    <span>View Receipt &amp; Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyProductsPage;
