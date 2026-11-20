import React, { useState, useEffect, useRef, useMemo } from 'react';
import './ProductCatalog.css';
import { useCurrency } from '../../context/CurrencyContext';
import { fetchLiveProducts, fetchLiveCategories, getWebSocketUrl } from '../../services/api';

export const PRODUCT_CATEGORIES = [
  'All Designs'
];

const ITEMS_PER_PAGE = 50; // Total 50 items per page
const BATCH_SIZE = 10;     // Lazy load in chunks of 10 as user scrolls

export function ProductCatalog({
  onAddToCart = () => { },
  onQuickView = () => { },
  cartProductIds = [],
  purchasedProductIds = []
}) {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All Designs']);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Designs');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOption, setSortOption] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cartItems, setCartItems] = useState({});

  const sentinelRef = useRef(null);

  // Load products & categories live from PostgreSQL & Listen to Realtime WebSocket
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const [prodData, catData] = await Promise.all([
        fetchLiveProducts('', true),    // forceFresh live data from PostgreSQL
        fetchLiveCategories(true)       // forceFresh live data from PostgreSQL
      ]);
      if (isMounted) {
        setProducts(prodData || []);
        if (catData && catData.length > 0) {
          setCategories(['All Designs', ...catData.map(c => c.name)]);
        } else {
          setCategories(['All Designs']);
        }
        setIsLoading(false);
      }
    }
    loadData();

    // Setup Realtime WebSocket listener (Zero reload)
    let ws;
    try {
      ws = new WebSocket(getWebSocketUrl());
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'PRODUCT_CREATED' && msg.product) {
            setProducts((prev) => [msg.product, ...prev.filter(p => p.id !== msg.product.id)]);
          } else if (msg.event === 'PRODUCT_DELETED' && msg.product_id) {
            setProducts((prev) => prev.filter(p => p.id !== msg.product_id));
          } else if (msg.event === 'CATEGORY_CREATED' && msg.category) {
            setCategories((prev) => [...prev, msg.category.name]);
          } else if (msg.event === 'CATEGORY_DELETED' && msg.name) {
            setCategories((prev) => prev.filter(c => c !== msg.name));
          }
        } catch (e) {
          console.warn("WebSocket parse error:", e);
        }
      };
    } catch (e) {
      console.warn("WebSocket connection error:", e);
    }

    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, []);

  // 1. Filter and sort whole catalog
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCat = activeCategory === 'All Designs' || prod.category === activeCategory;
      const matchesSearch = (prod.title || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (prod.format || '').toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    }).sort((a, b) => {
      if (sortOption === 'price-low') return a.price - b.price;
      if (sortOption === 'price-high') return b.price - a.price;
      if (sortOption === 'rating') return (b.rating || 4.8) - (a.rating || 4.8);
      return (b.downloads || 0) - (a.downloads || 0); // default popular
    });
  }, [products, activeCategory, searchFilter, sortOption]);

  // 2. Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Reset to page 1 and visible count when category/search changes
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(BATCH_SIZE);
  }, [activeCategory, searchFilter, sortOption]);

  // When page changes, reset visible batch for that page
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [currentPage]);

  // 3. Current page items slice (max 50)
  const pageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // 4. Visible slice on screen (scroll-loaded)
  const displayedItems = useMemo(() => {
    return pageItems.slice(0, visibleCount);
  }, [pageItems, visibleCount]);

  // 5. Infinite scroll observer
  useEffect(() => {
    if (visibleCount >= pageItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, pageItems.length));
            setIsLoadingMore(false);
          }, 250);
        }
      },
      { rootMargin: '180px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, pageItems.length]);

  const handleBuy = (prod, e) => {
    e.stopPropagation();
    onAddToCart(prod);
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    setCurrentPage(p);
    const catalogElem = document.getElementById('marketplace');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="reno-catalog-section" id="marketplace">
      {/* Hero / Store Banner */}
      <div className="reno-hero-banner">
        <div className="reno-hero-content">
          <div className="reno-hero-pill">
            <span className="reno-pill-dot" /> Verified Production CNC &amp; 3D Print Files
          </div>
          <h1 className="reno-hero-title">
            Architectural 3D &amp; CNC <br className="reno-desktop-br" />
            <span className="reno-hero-highlight">Design Marketplace</span>
          </h1>
          <p className="reno-hero-desc">
            Instant digital downloads for CNC stone routing, 3D printing, laser Jali cutting, and interior wall panels. Production-ready files in STL, OBJ, DXF, and DWG.
          </p>

          <div className="reno-hero-stats">
            <div className="reno-stat-item">
              <span className="reno-stat-val">500+</span>
              <span className="reno-stat-lbl">Digital Assets</span>
            </div>
            <div className="reno-stat-divider" />
            <div className="reno-stat-item">
              <span className="reno-stat-val">100%</span>
              <span className="reno-stat-lbl">CNC Toolpath Ready</span>
            </div>
            <div className="reno-stat-divider" />
            <div className="reno-stat-item">
              <span className="reno-stat-val">Instant</span>
              <span className="reno-stat-lbl">Secure Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Category Controls */}
      <div className="reno-catalog-controls">
        <div className="reno-cat-scroll">
          {
            categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`reno-cat-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))
          }
        </div>

        <div className="reno-controls-row">
          <div className="reno-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by pattern name or format (e.g. STL, DXF)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="reno-search-input"
            />
          </div>

          <div className="reno-sort-select-wrap">
            <label htmlFor="reno-sort" className="reno-sort-label">Sort:</label>
            <select
              id="reno-sort"
              className="reno-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Top Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Progress Bar - Real Elegant Line (Zero Emoji) */}
      {isLoading ? (
        <div className="reno-catalog-loader-container">
          <div className="reno-catalog-linear-track">
            <div className="reno-catalog-linear-bar" />
          </div>
          <span className="reno-catalog-loader-text">Synchronizing Architectural Catalog...</span>
        </div>
      ) : (
        <>
          {/* Product Count Header */}
          <div className="reno-count-bar">
            <span className="reno-count-label">
              Showing <strong>{displayedItems.length}</strong> of <strong>{pageItems.length}</strong> on Page {currentPage} ({totalItems} Total Designs)
            </span>
          </div>

          {/* Product Grid */}
          <div className="reno-product-grid">
            {displayedItems.length === 0 ? (
              <div className="reno-no-results">
                <p>No designs found matching your search. Try adjusting categories or keywords.</p>
              </div>
            ) : (
              displayedItems.map((prod) => {
                const isAdded = cartProductIds.includes(prod.id);
                return (
                  <article key={prod.id} className="reno-card" onClick={() => onQuickView(prod)}>
                    {/* Visual Thumbnail Preview Container */}
                    <div className="reno-card-media" style={{ background: prod.gradient || 'linear-gradient(135deg, #1A1A1E 0%, #2D2D35 100%)' }}>
                      {prod.image_url && (
                        <img
                          src={prod.image_url}
                          alt={prod.title}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      <div className="reno-badge-row">
                        {prod.badge && <span className="reno-badge-tag">{prod.badge}</span>}
                        <span className="reno-badge-format">{prod.format}</span>
                      </div>

                      {/* Wireframe Architectural Pattern Visualizer Mock if no image */}
                      {!prod.image_url && (
                        <div className="reno-card-wireframe">
                          <svg viewBox="0 0 100 100" className="reno-wireframe-svg" preserveAspectRatio="none">
                            <polygon points="10,20 50,5 90,20 90,70 50,95 10,70" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
                            <line x1="10" y1="20" x2="50" y2="45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <line x1="90" y1="20" x2="50" y2="45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <line x1="50" y1="95" x2="50" y2="45" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                            <circle cx="50" cy="45" r="4" fill="rgba(255,255,255,0.3)" />
                          </svg>
                        </div>
                      )}

                      <span className="reno-poly-chip">{prod.poly_count || prod.polyCount || 'CAD Polys'}</span>
                    </div>

                    {/* Card Content & Details */}
                    <div className="reno-card-body">
                      <div className="reno-card-meta">
                        <span className="reno-card-category">{prod.category}</span>
                        <span className="reno-card-rating">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#0A0A0C" stroke="#0A0A0C" strokeWidth="1">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          {prod.rating || 4.9} <span className="reno-card-dls">({prod.downloads || 450})</span>
                        </span>
                      </div>

                      <h3 className="reno-card-title">{prod.title}</h3>
                      <p className="reno-card-desc">{prod.description}</p>

                      {/* Pricing & Buy Action */}
                      <div className="reno-card-footer">
                        <div className="reno-price-box">
                          <span className="reno-price">{formatPrice(prod.price).formatted}</span>
                          {(prod.original_price || prod.originalPrice) && (
                            <span className="reno-orig-price">
                              {formatPrice(prod.original_price || prod.originalPrice).formatted}
                            </span>
                          )}
                        </div>

                        {purchasedProductIds.includes(prod.id) ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#F0FDF4',
                            border: '1px solid #86EFAC',
                            color: '#15803D',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Already Bought</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={`reno-buy-btn ${isAdded ? 'added' : ''}`}
                            onClick={(e) => handleBuy(prod, e)}
                          >
                            {isAdded ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Added</span>
                              </>
                            ) : (
                              'Buy Now'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Scroll Loading Trigger Sentinel */}
      {!isLoading && visibleCount < pageItems.length && (
        <div ref={sentinelRef} className="reno-load-sentinel">
          {isLoadingMore ? (
            <div className="reno-loading-spinner-wrap">
              <span className="reno-spinner" />
              <span>Loading more designs...</span>
            </div>
          ) : (
            <div className="reno-scroll-hint">Scroll down to load more designs</div>
          )}
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && totalPages > 1 && (
        <nav className="reno-pagination-nav" aria-label="Catalog pages">
          <div className="reno-page-info">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            <span className="reno-page-total-count">({totalItems} Total Files &bull; 50/page)</span>
          </div>

          <div className="reno-pagination-buttons">
            <button
              type="button"
              className="reno-page-btn reno-page-prev"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              aria-label="Previous page"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Prev</span>
            </button>

            <div className="reno-page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`reno-page-num ${currentPage === p ? 'active' : ''}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="reno-page-btn reno-page-next"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              aria-label="Next page"
            >
              <span>Next</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}

export default ProductCatalog;
