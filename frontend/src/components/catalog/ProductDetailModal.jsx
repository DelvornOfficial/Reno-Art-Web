import React, { useEffect } from 'react';
import './ProductDetailModal.css';
import { useCurrency } from '../../context/CurrencyContext';

export function ProductDetailModal({ product, isOpen, onClose, onBuyNow }) {
  const { formatPrice } = useCurrency();
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const currentPrice = Number(product.price) || 0;
  const originalPrice = Number(product.original_price || product.originalPrice) || currentPrice * 1.5;
  const discountPercent = originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  return (
    <div className="reno-detail-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="reno-detail-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="reno-detail-close-btn"
          onClick={onClose}
          aria-label="Close details"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 3D Visual Preview Header */}
        <div className="reno-detail-preview" style={{ background: product.gradient || 'linear-gradient(135deg, #1A1A1E 0%, #2D2D35 100%)', position: 'relative' }}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div className="reno-detail-wireframe-wrap">
              <svg viewBox="0 0 100 100" className="reno-detail-wireframe-svg">
                <polygon points="10,20 50,5 90,20 90,70 50,95 10,70" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" />
                <line x1="10" y1="20" x2="50" y2="45" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
                <line x1="90" y1="20" x2="50" y2="45" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
                <line x1="50" y1="95" x2="50" y2="45" stroke="rgba(255,255,255,0.32)" strokeWidth="1.2" />
                <circle cx="50" cy="45" r="4.5" fill="rgba(255,255,255,0.45)" />
              </svg>
            </div>
          )}

          <div className="reno-detail-badge-strip">
            {product.badge && <span className="reno-detail-badge">{product.badge}</span>}
            <span className="reno-detail-format-pill">{product.format || 'OBJ / STL / DWG'}</span>
          </div>

          <div className="reno-detail-poly-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>{product.poly_count || product.polyCount || 'Precision CAD'}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="reno-detail-body">
          {/* Category & Rating */}
          <div className="reno-detail-meta-row">
            <span className="reno-detail-category">{product.category}</span>
            <div className="reno-detail-rating">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#0A0A0C" stroke="#0A0A0C" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{product.rating || 4.9}</span>
              <span className="reno-detail-dls">({product.downloads || 450} downloads)</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="reno-detail-title">{product.title}</h2>

          {/* Pricing Highlight */}
          <div className="reno-detail-price-box">
            <div className="reno-detail-price-stack">
              <span className="reno-detail-price">{formatPrice(currentPrice).formatted}</span>
              {originalPrice > currentPrice && (
                  <span className="reno-detail-orig-price">{formatPrice(originalPrice).formatted}</span>
              )}
              {discountPercent > 0 && (
                <span className="reno-detail-discount-pill">{discountPercent}% OFF</span>
              )}
            </div>
            <span className="reno-detail-license-tag">Includes Commercial License</span>
          </div>

          {/* Description */}
          <div className="reno-detail-section">
            <h4 className="reno-detail-sec-heading">Design Description</h4>
            <p className="reno-detail-desc">{product.description}</p>
          </div>

          {/* Specifications Grid */}
          <div className="reno-detail-specs-grid">
            <div className="reno-spec-item">
              <span className="reno-spec-label">File Formats</span>
              <strong className="reno-spec-value">{product.format}</strong>
            </div>
            <div className="reno-spec-item">
              <span className="reno-spec-label">Geometry</span>
              <strong className="reno-spec-value">100% Manifold / Watertight</strong>
            </div>
            <div className="reno-spec-item">
              <span className="reno-spec-label">Compatible CAM</span>
              <strong className="reno-spec-value">ArtCAM, Aspire, Fusion 360</strong>
            </div>
            <div className="reno-spec-item">
              <span className="reno-spec-label">Delivery</span>
              <strong className="reno-spec-value">Instant ZIP Download</strong>
            </div>
          </div>

          {/* Actions CTA */}
          <div className="reno-detail-cta-bar">
            <button
              type="button"
              className="reno-detail-buy-btn"
              onClick={() => {
                onBuyNow(product);
                onClose();
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>Instant Download &bull; {formatPrice(currentPrice).formatted}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;

