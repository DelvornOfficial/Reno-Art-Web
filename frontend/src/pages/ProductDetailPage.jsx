import React, { useState, useEffect } from 'react';
import './ProductDetailPage.css';
import { useCurrency } from '../context/CurrencyContext';
import {
  fetchProductReviews,
  checkReviewEligibility,
  submitProductReview,
  updateProductReview,
  getWebSocketUrl
} from '../services/api';
import { useToast } from '../context/ToastContext';

export function ProductDetailPage({
  product,
  isLoadingProduct = false,
  user,
  onNavigateToHome,
  onOpenLogin,
  onAddToCart,
  onBuyNow,
  cartProductIds = [],
  isPurchased = false
}) {
  const { showToast } = useToast();
  const { formatPrice } = useCurrency();

  // Review states
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [eligibility, setEligibility] = useState({ eligible: false, has_purchased: false });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewMsg, setReviewMsg] = useState('');
  const [activePreviewImage, setActivePreviewImage] = useState(product?.image_url || null);

  const [selectedDescriptionImage, setSelectedDescriptionImage] = useState(null);

  // Extract separate product model images (used strictly for 3D stage and thumbnail strip)
  const productImages = React.useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.product_images) && product.product_images.length > 0) {
      return product.product_images;
    }
    return product.image_url ? [product.image_url] : [];
  }, [product]);

  // Extract separate description images (used strictly for Architectural Specification)
  const descriptionImages = React.useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.description_images) && product.description_images.length > 0) {
      return product.description_images;
    }
    // Fallback for legacy database records
    if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
      return product.gallery_images;
    }
    return [];
  }, [product]);

  useEffect(() => {
    if (productImages.length > 0) {
      setActivePreviewImage(productImages[0]);
    } else {
      setActivePreviewImage(product?.image_url || null);
    }
  }, [product?.id, productImages]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  // Load verified reviews & check purchaser eligibility
  useEffect(() => {
    if (!product) return;
    let isMounted = true;

    async function loadReviewsAndEligibility() {
      setIsLoadingReviews(true);
      const revs = await fetchProductReviews(product.id, user ? user.id : null);
      if (isMounted) {
        setReviews(revs || []);
        setIsLoadingReviews(false);
      }

      if (user && user.id) {
        const elig = await checkReviewEligibility(product.id, user.id);
        if (isMounted) {
          setEligibility(elig);
          if (elig.already_reviewed && elig.existing_review) {
            setEditingReviewId(elig.existing_review.id);
            setReviewRating(elig.existing_review.rating);
            setReviewComment(elig.existing_review.comment);
          }
        }
      } else {
        if (isMounted) {
          setEligibility({ eligible: false, has_purchased: false });
        }
      }
    }

    loadReviewsAndEligibility();

    // Listen to WebSocket for real-time review additions
    let ws;
    try {
      ws = new WebSocket(getWebSocketUrl());
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'REVIEW_ADDED' && msg.review && msg.review.product_id === product.id) {
            setReviews(prev => [msg.review, ...prev.filter(r => r.id !== msg.review.id)]);
          } else if (msg.event === 'REVIEW_UPDATED' && msg.review && msg.review.product_id === product.id) {
            setReviews(prev => prev.map(r => r.id === msg.review.id ? { ...r, ...msg.review } : r));
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, [product, user]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast("Please enter your review comments.", "warning");
      return;
    }
    if (!user || !user.id) {
      onOpenLogin && onOpenLogin();
      return;
    }

    setIsSubmittingReview(true);
    setReviewMsg('');
    try {
      if (editingReviewId) {
        // Update review (within 24 hours lock window)
        const updated = await updateProductReview(editingReviewId, user.id, {
          rating: reviewRating,
          comment: reviewComment.trim()
        });
        setReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
        setReviewMsg('Review successfully updated! (Editable within 24h of purchase)');
      } else {
        // Create review (verified purchaser)
        const created = await submitProductReview(product.id, user.id, {
          rating: reviewRating,
          comment: reviewComment.trim()
        });
        setReviews(prev => [created, ...prev]);
        setEditingReviewId(created.id);
        setEligibility(prev => ({ ...prev, already_reviewed: true, can_edit: true, hours_left_to_edit: 24.0 }));
        setReviewMsg('Thank you! Your verified purchase review has been published.');
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="reno-product-page" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(10, 10, 12, 0.1)',
            borderTopColor: '#0A0A0C',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1.5rem auto'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1A1A1E', margin: 0 }}>
            Loading Architectural Model &amp; Specifications...
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#8E8A80', marginTop: '0.5rem' }}>
            Fetching verified CAD geometries from cloud database
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="reno-product-page">
        <main className="reno-page-not-found">
          <h2>Product Not Found</h2>
          <p>The requested architectural design file could not be located.</p>
          <button type="button" className="reno-back-to-store-btn" onClick={onNavigateToHome}>
            Back to Marketplace
          </button>
        </main>
      </div>
    );
  }

  const isAlreadyInCart = cartProductIds.includes(product.id);

  const currentPrice = Number(product.price) || 0;
  const originalPrice = Number(product.original_price || product.originalPrice) || currentPrice * 1.5;
  const discountPercent = originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  return (
    <div className="reno-product-page">
      <main className="reno-product-main">
        {/* Navigation Breadcrumb */}
        <div className="reno-product-nav-row">
          <button type="button" className="reno-back-to-store-btn" onClick={onNavigateToHome}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to Marketplace</span>
          </button>

          <span className="reno-breadcrumb-path">
            Catalog &gt; {product.category} &gt; <strong>{product.title}</strong>
          </span>
        </div>

        {/* 2-Column Product Layout */}
        <div className="reno-product-showcase">
          {/* Left Column: 3D Preview Stage & Gallery Carousel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="reno-product-stage" style={{ background: product.gradient || 'linear-gradient(135deg, #1A1A1E 0%, #2D2D35 100%)' }}>
              {(activePreviewImage || product.image_url) ? (
                <img
                  src={activePreviewImage || product.image_url}
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
                <div className="reno-stage-mesh-wrap">
                  <svg viewBox="0 0 100 100" className="reno-stage-svg">
                    <polygon points="10,20 50,5 90,20 90,70 50,95 10,70" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
                    <line x1="10" y1="20" x2="50" y2="45" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                    <line x1="90" y1="20" x2="50" y2="45" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                    <line x1="50" y1="95" x2="50" y2="45" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <circle cx="50" cy="45" r="4.5" fill="rgba(255,255,255,0.4)" />
                  </svg>
                </div>
              )}

              <div className="reno-stage-badges">
                {product.badge && <span className="reno-badge-pill">{product.badge}</span>}
                <span className="reno-format-badge">{product.format || 'OBJ / STL / DWG'}</span>
              </div>

              <div className="reno-stage-bottom-info">
                <span className="reno-poly-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  {product.poly_count || product.polyCount || 'Precision CAD'}
                </span>
                <span className="reno-manifold-cert">100% Watertight Mesh</span>
              </div>
            </div>

            {/* Thumbnail Strip for Multi-view Product Images */}
            {productImages.length > 1 && (
              <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {
                  productImages.map((pImg, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setActivePreviewImage(pImg)}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        width: '68px',
                        height: '68px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: (activePreviewImage === pImg || (!activePreviewImage && pIdx === 0))
                          ? '2px solid #0A0A0C'
                          : '1px solid rgba(10, 10, 12, 0.12)',
                        background: '#FFFFFF',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      <img src={pImg} alt={`View ${pIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Right Column: Details, Pricing & Purchase Action */}
          <div className="reno-product-details-col">
            <div className="reno-meta-strip">
              <span className="reno-cat-tag">{product.category}</span>
              <div className="reno-rating-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#0A0A0C" stroke="#0A0A0C" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{product.rating || 4.9}</span>
                <span className="reno-dls-count">({product.downloads || 450} downloads)</span>
              </div>
            </div>

            <h1 className="reno-product-h1">{product.title}</h1>

            {/* Price Box */}
            <div className="reno-product-price-card">
              <div className="reno-price-row">
                <span className="reno-main-price">{formatPrice(currentPrice).formatted}</span>
                {originalPrice > currentPrice && (
                  <span className="reno-strike-price">{formatPrice(originalPrice).formatted}</span>
                )}
                {discountPercent > 0 && (
                  <span className="reno-save-pill">Save {discountPercent}%</span>
                )}
              </div>
              <p className="reno-tax-note">Taxes included &bull; Instant digital asset delivery via secure download link</p>
            </div>

            {/* CTA Buttons: Add to Cart + Buy Now OR Already Purchased Badge */}
            <div className="reno-product-actions">
              {(isPurchased || eligibility.has_purchased) ? (
                <div style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #86EFAC',
                  borderRadius: '12px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <div>
                      <div style={{ fontWeight: 800, color: '#15803D', fontSize: '0.92rem' }}>
                        You already bought this product
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '0.15rem' }}>
                        Permanent license &amp; files unlocked in your account
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.location) window.location.href = '/my-products';
                    }}
                    style={{
                      background: '#15803D',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 4px rgba(21, 128, 61, 0.2)'
                    }}
                  >
                    View in My Products &rarr;
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="reno-buy-now-btn"
                    onClick={() => onBuyNow ? onBuyNow(product) : onAddToCart && onAddToCart(product)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Buy Now &bull; {formatPrice(product.price).formatted}</span>
                  </button>

                  <button
                    type="button"
                    className={`reno-add-to-cart-btn ${isAlreadyInCart ? 'added' : ''}`}
                    onClick={() => onAddToCart && onAddToCart(product)}
                  >
                    {isAlreadyInCart ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Already in Cart</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Description Block */}
            <div className="reno-product-section-block">
              <h3 className="reno-section-title">Architectural Specification</h3>
              <p className="reno-product-description-text">{product.description}</p>

              {/* Product Gallery / Description Images Showcase (Strictly Independent from Product 3D Stage) */}
              {
                descriptionImages.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8E8A80', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
                      Reference Renders &amp; Detail Views
                    </div>
                    {/* Single column stack: Ek line me strictly ek hi description image full width */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {descriptionImages.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedDescriptionImage(img)}
                          title="Click to view full preview"
                          style={{
                            width: '100%',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid rgba(10, 10, 12, 0.12)',
                            cursor: 'pointer',
                            background: '#F4F1EA',
                            position: 'relative',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                          }}
                        >
                          <img
                            src={img}
                            alt={`Detail ${idx + 1}`}
                            style={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: '480px',
                              objectFit: 'contain',
                              display: 'block',
                              background: '#FAF9F6'
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.18)',
                              opacity: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              color: '#FFFFFF',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              transition: 'opacity 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              <line x1="11" y1="8" x2="11" y2="14" />
                              <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                            <span>Click to Zoom &amp; Inspect Specification</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Technical Specifications Specs (Live from PostgreSQL & Admin Edit) */}
            <div className="reno-product-specs-box">
              <h3 className="reno-section-title">File &amp; Toolpath Specs</h3>
              <div className="reno-specs-list">
                {product.custom_specs && product.custom_specs.length > 0 ? (
                  product.custom_specs.map((spec, idx) => (
                    <div key={idx} className="reno-spec-row">
                      <span className="reno-spec-name">{spec.key}</span>
                      <span className="reno-spec-val">
                        {idx === 0 ? <strong>{spec.value}</strong> : spec.value}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="reno-spec-row">
                      <span className="reno-spec-name">Included Formats</span>
                      <span className="reno-spec-val"><strong>{product.format || 'OBJ / STL / DWG'}</strong></span>
                    </div>
                    <div className="reno-spec-row">
                      <span className="reno-spec-name">Mesh Topology</span>
                      <span className="reno-spec-val">{product.mesh_topology || 'Closed Manifold / Slicer Optimized'}</span>
                    </div>
                    <div className="reno-spec-row">
                      <span className="reno-spec-name">Machine Compatibility</span>
                      <span className="reno-spec-val">{product.machine_compatibility || '3-Axis CNC Router, 5-Axis Stone Mill, 3D Printer, Fiber Laser'}</span>
                    </div>
                    <div className="reno-spec-row">
                      <span className="reno-spec-name">Supported CAM</span>
                      <span className="reno-spec-val">{product.supported_cam || 'ArtCAM, Vectric Aspire, Fusion 360, RhinoCAM, AutoCAD'}</span>
                    </div>
                    <div className="reno-spec-row">
                      <span className="reno-spec-name">Commercial License</span>
                      <span className="reno-spec-val">{product.commercial_license || 'Unlimited Physical Fabrication – Royalty-Free'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Genuine Verified Customer Reviews Section (Bottom of Page) */}
        <section className="reno-reviews-section" style={{ marginTop: '3.5rem', borderTop: '1px solid rgba(10, 10, 12, 0.1)', paddingTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Customer Reviews</h2>
              <p style={{ color: '#6B6861', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                Only verified customers who purchased this design file can post reviews. (Zero fake reviews)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                ★ {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0'}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#6B6861' }}>({reviews.length} Verified Reviews)</span>
            </div>
          </div>

          {/* Verified Buyer Review Form (Only for Users who purchased the product) */}
          {eligibility.has_purchased ? (
            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAE8E2', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                  {editingReviewId ? 'Edit Your Review' : 'Write a Verified Buyer Review'}
                </h4>
                {eligibility.already_reviewed && (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: 4,
                    background: eligibility.can_edit ? '#ECFDF5' : '#FEE2E2',
                    color: eligibility.can_edit ? '#059669' : '#DC2626'
                  }}>
                    {eligibility.can_edit ? `Editable (Locks in ~${eligibility.hours_left_to_edit || 24}h)` : 'Review Locked (24h Expired)'}
                  </span>
                )}
              </div>

              {eligibility.already_reviewed && !eligibility.can_edit ? (
                <div style={{ padding: '0.75rem 1rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: '0.85rem', color: '#4B5563' }}>
                  Review period locked: Reviews can only be edited within 24 hours of purchase. Your review is permanently verified.
                </div>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Star Rating (1 to 5 Stars Only):
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          style={{
                            all: 'unset',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            color: star <= reviewRating ? '#0A0A0C' : '#D1D5DB',
                            transition: 'transform 0.1s'
                          }}
                        >
                          ★
                        </button>
                      ))}
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, marginLeft: '0.5rem' }}>{reviewRating} Stars</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Review Feedback (Text Only - No Images / No Videos):
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Share your experience cutting this CAD file on CNC or 3D printing..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {reviewMsg && (
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
                      {reviewMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      padding: '0.65rem 1.5rem',
                      background: '#0A0A0C',
                      color: '#FAF9F6',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    {isSubmittingReview ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div style={{ background: '#FAF9F6', padding: '1.25rem', borderRadius: '10px', border: '1px dashed rgba(10,10,12,0.15)', marginBottom: '2rem', fontSize: '0.85rem', color: '#6B6861' }}>
              {user ? (
                <span>Only customers who have purchased this CAD file are permitted to submit reviews. Purchase this item to share fabrication feedback.</span>
              ) : (
                <span>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, color: '#0A0A0C', textDecoration: 'underline' }}
                  >
                    Log in
                  </button>{' '}
                  with the account you used to purchase this file to post or edit a review.
                </span>
              )}
            </div>
          )}

          {/* List of Reviews */}
          {isLoadingReviews ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6B6861' }}>Loading verified reviews...</div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6B6861', fontSize: '0.875rem' }}>
              No customer reviews yet. Verified purchasers will share their production feedback here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #EAE8E2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0A0A0C', color: '#FAF9F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                        {(r.user_name || 'C')[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.user_name}</span>
                      <span style={{ fontSize: '0.7rem', color: '#059669', background: '#ECFDF5', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>
                        ✓ Verified Purchase
                      </span>
                    </div>
                    <div style={{ fontSize: '0.95rem', letterSpacing: '1px' }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                  </div>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#2B2A27', lineHeight: 1.5 }}>
                    {r.comment}
                  </p>
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                    Posted on {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal Lightbox for Full-Resolution Description Image Preview */}
      {
        selectedDescriptionImage && (
          <div
            onClick={() => setSelectedDescriptionImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(10, 10, 12, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedDescriptionImage(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                ✕
              </button>
              <img
                src={selectedDescriptionImage}
                alt="Architectural Spec Detail"
                style={{
                  maxWidth: '85vw',
                  maxHeight: '82vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  display: 'block'
                }}
              />
              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem', color: '#6B6861', fontWeight: 600 }}>
                Architectural Reference Render &amp; Technical Detail View
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default ProductDetailPage;

