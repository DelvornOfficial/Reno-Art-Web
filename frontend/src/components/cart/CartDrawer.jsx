import React from 'react';
import './CartDrawer.css';
import { useCurrency } from '../../context/CurrencyContext';

export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onCheckout,
  onSingleCheckout = () => { },
  isLoggedIn = false,
  onOpenLogin = () => { }
}) {
  const { formatPrice } = useCurrency();
  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((acc, item) => acc + item.price, 0);

  return (
    <>
      <div className="reno-cart-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="reno-cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping Cart">
        {/* Header */}
        <div className="reno-cart-header">
          <div className="reno-cart-title-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <h3 className="reno-cart-heading">Your Cart {isLoggedIn && `(${cartItems.length})`}</h3>
          </div>
          <button type="button" className="reno-cart-close" onClick={onClose} aria-label="Close cart">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Not Logged In State: Prompt "Login First" */}
        {!isLoggedIn ? (
          <div className="reno-cart-login-required">
            <div className="reno-cart-lock-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h4 className="reno-cart-login-title">Please Log In First</h4>
            <p className="reno-cart-login-desc">
              Log in to access your digital shopping cart, save CAD items, and proceed to download.
            </p>
            <button
              type="button"
              className="reno-cart-login-action-btn"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
            >
              Log In to Continue
            </button>
          </div>
        ) : (
          <>
            {/* Logged In: Items List */}
            <div className="reno-cart-items-body">
              {cartItems.length === 0 ? (
                <div className="reno-cart-empty">
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#A39F93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <p className="reno-cart-empty-title">Your cart is empty</p>
                  <p className="reno-cart-empty-sub">Explore our 3D tiles &amp; CNC patterns to add items.</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="reno-cart-item">
                    <div className="reno-cart-item-preview" style={{ background: item.gradient || '#1A1A1E' }}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '0.625rem'
                          }}
                        />
                      ) : (
                        <svg viewBox="0 0 100 100" className="reno-cart-wire">
                          <polygon points="10,20 50,5 90,20 90,70 50,95 10,70" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                        </svg>
                      )}
                    </div>
                    <div className="reno-cart-item-info">
                      <span className="reno-cart-item-cat">{item.category}</span>
                      <h4 className="reno-cart-item-title">{item.title}</h4>
                      <span className="reno-cart-item-fmt">{item.format}</span>
                      <div className="reno-cart-item-bottom">
                        <span className="reno-cart-item-price">{formatPrice(item.price).formatted}</span>
                        <div className="reno-cart-item-actions">
                          <button
                            type="button"
                            className="reno-cart-buy-single-btn"
                            onClick={() => onSingleCheckout(item)}
                            title="Checkout this design directly"
                          >
                            <span>Buy Only This</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="reno-cart-remove-btn"
                            onClick={() => onRemoveItem(idx)}
                            aria-label="Remove item"
                            title="Remove item"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Checkout */}
            {
              cartItems.length > 0 && (
                <div className="reno-cart-footer">
                  <div className="reno-cart-total-row">
                    <span className="reno-cart-total-label">Subtotal</span>
                    <span className="reno-cart-total-val">{formatPrice(totalAmount).formatted}</span>
                  </div>
                  <p className="reno-cart-guarantee-note">Instant digital download delivery upon checkout</p>
                  <button
                    type="button"
                    className="reno-cart-checkout-btn"
                    onClick={onCheckout}
                  >
                    Proceed to Checkout &bull; {formatPrice(totalAmount).formatted}
                  </button>
                </div>
              )
            }
          </>
        )}
      </aside>
    </>
  );
}

export default CartDrawer;
