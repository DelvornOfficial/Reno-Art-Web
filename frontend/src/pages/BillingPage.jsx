import React, { useState, useEffect } from 'react';
import './BillingPage.css';
import { useCurrency } from '../context/CurrencyContext';
import handLogo from '../assets/hand.svg';
import renoText from '../assets/reno-design.svg';
import VerifiedLottieBadge from '../components/common/VerifiedLottieBadge';
import { API_BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  UpiLogo,
  GPayLogo,
  PhonePeLogo,
  PaytmLogo,
  VisaLogo,
  MastercardLogo,
  RupayLogo,
  BankShieldIcon,
  QrCodeIcon,
  ShieldLockIcon
} from '../components/common/PaymentIcons';

const AVAILABLE_COUPONS = {
  RENO10: { code: 'RENO10', discount: 10, type: 'percent', label: '10% Launch Studio Discount', desc: 'Welcome bonus (One-time use)' },
  ARCH50: { code: 'ARCH50', discount: 50, type: 'fixed', label: '₹50 Flat Architect Credit', desc: 'Architect welcome credit (One-time use)' },
  VIP20: { code: 'VIP20', discount: 20, type: 'percent', label: '20% Premium Member Exclusive', desc: 'VIP subscriber special discount' }
};

// Helper: Get used coupons for user
const getUsedCouponsList = (userEmail) => {
  try {
    const key = userEmail ? `reno_used_coupons_${userEmail.trim().toLowerCase()}` : 'reno_used_coupons_guest';
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// Helper: Mark coupon used
const markCouponAsUsed = (userEmail, couponCode) => {
  try {
    const key = userEmail ? `reno_used_coupons_${userEmail.trim().toLowerCase()}` : 'reno_used_coupons_guest';
    const list = getUsedCouponsList(userEmail);
    if (!list.includes(couponCode)) {
      list.push(couponCode);
      localStorage.setItem(key, JSON.stringify(list));
    }
  } catch { }
};

export function BillingPage({
  cartItems = [],
  allCartItems = [],
  user = null,
  onNavigateToHome = () => { },
  onNavigateToProfile = () => { },
  onCompletePurchase = () => { },
  onSelectCheckoutItem = () => { }
}) {
  const { formatPrice } = useCurrency();
  const { showToast } = useToast();

  // Current Step: 'billing' | 'payment_method' | 'processing' | 'success' | 'failed'
  const [step, setStep] = useState(() => {
    try {
      return sessionStorage.getItem('reno_billing_step') || 'billing';
    } catch {
      return 'billing';
    }
  });

  const changeStep = (newStep) => {
    setStep(newStep);
    try {
      sessio

    } catch (e) {
      // Ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Billing form state - prefilled from user account, verified payment profile, or stored data
  const [formData, setFormData] = useState(() => {
    let saved = {};
    const userKey = user?.id ? `reno_verified_billing_${user.id}` : (user?.email ? `reno_verified_billing_${user.email}` : null);

    try {
      // 1. Priority: Previous successful payment profile for this logged-in account
      if (userKey) {
        const verifiedProfile = localStorage.getItem(userKey);
        if (verifiedProfile) {
          saved = JSON.parse(verifiedProfile);
        }
      }
      // 2. Fallback: Last active session draft
      if (!saved.fullName && !saved.email) {
        const stored = localStorage.getItem('reno_billing_form_data');
        if (stored) saved = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore
    }

    return {
      fullName: saved.fullName || user?.name || user?.username || '',
      email: saved.email || user?.email || user?.identifier || '',
      phone: saved.phone || user?.phone || '',
      studioName: saved.studioName || '',
      address: saved.address || ''
    };
  });

  // Save to localStorage immediately on every input change (Data Loss Protection)
  const updateFormField = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        localStorage.setItem('reno_billing_form_data', JSON.stringify(updated));
      } catch (e) {
        // Ignore
      }
      return updated;
    });
  };

  // Permanently save successful payment profile tied to user ID / email
  const persistVerifiedBillingDetails = (dataToSave) => {
    try {
      const userKey = user?.id ? `reno_verified_billing_${user.id}` : (user?.email ? `reno_verified_billing_${user.email}` : null);
      if (userKey) {
        localStorage.setItem(userKey, JSON.stringify(dataToSave));
      }
      localStorage.setItem('reno_billing_form_data', JSON.stringify(dataToSave));
    } catch (e) {
      // Ignore
    }
  };

  // Keep prefilled data in sync if user changes and no saved data
  useEffect(() => {
    if (user) {
      const userKey = user?.id ? `reno_verified_billing_${user.id}` : (user?.email ? `reno_verified_billing_${user.email}` : null);
      let verifiedSaved = null;
      if (userKey) {
        try {
          const stored = localStorage.getItem(userKey);
          if (stored) verifiedSaved = JSON.parse(stored);
        } catch (e) {
          // Ignore
        }
      }

      setFormData(prev => {
        const next = {
          fullName: verifiedSaved?.fullName || prev.fullName || user.name || user.username || '',
          email: verifiedSaved?.email || prev.email || user.email || user.identifier || '',
          phone: verifiedSaved?.phone || prev.phone || user.phone || '',
          studioName: verifiedSaved?.studioName || prev.studioName || '',
          address: verifiedSaved?.address || prev.address || ''
        };
        try {
          localStorage.setItem('reno_billing_form_data', JSON.stringify(next));
        } catch (e) {
          // Ignore
        }
        return next;
      });
    }
  }, [user]);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Billing form editing state (collapsible compact pill on mobile)
  const [isEditingBilling, setIsEditingBilling] = useState(() => {
    // If name and phone exist, collapse by default so user sees clean summary
    return !(formData?.fullName && formData?.phone);
  });

  // Selected payment method: 'upi_apps' | 'qr'
  const [selectedMethod, setSelectedMethod] = useState('upi_apps');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');

  // On-demand QR Code State
  const [isQrGenerated, setIsQrGenerated] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrError, setQrError] = useState('');

  // Payment Processing State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [remainingTime, setRemainingTime] = useState(60); // 60 seconds countdown

  // Calculate pricing (GST removed as requested)
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 0), 0);

  // Check if active VIP subscriber for automatic shopping discount
  let vipDiscountPercent = 0;
  try {
    const userRaw = localStorage.getItem('reno_user');
    if (userRaw) {
      const u = JSON.parse(userRaw);
      if (u.plan === 'premium') {
        vipDiscountPercent = 20; // 20% default VIP shopping rebate
      }
    }
  } catch { }

  const vipDiscountAmount = vipDiscountPercent > 0 ? Math.round((subtotal * vipDiscountPercent) / 100) : 0;

  let discountAmount = vipDiscountAmount;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discountAmount += Math.round((subtotal * appliedCoupon.discount) / 100);
    } else {
      discountAmount += Math.min(appliedCoupon.discount, subtotal);
    }
  }

  // Exact payable amount without GST
  const finalTotal = Math.max(1, subtotal - discountAmount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    const code = couponInput.trim().toUpperCase();

    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const userEmail = formData?.email || user?.email || '';
    const usedList = getUsedCouponsList(userEmail);

    if (usedList.includes(code)) {
      setCouponError(`Coupon "${code}" has already been used once for this account.`);
      return;
    }

    if (AVAILABLE_COUPONS[code]) {
      setAppliedCoupon(AVAILABLE_COUPONS[code]);
      setCouponSuccess(`Coupon "${code}" applied successfully!`);
    } else {
      setCouponError('Invalid or expired coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponSuccess('');
    setCouponError('');
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showToast('Please enter your full name.', 'warning');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Please enter your email address for CAD file delivery.', 'warning');
      return;
    }
    if (!formData.phone.trim()) {
      showToast('Please enter your mobile number.', 'warning');
      return;
    }
    setStep('payment_method');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch Direct UPI Intent or Official Secured Checkout
  const handleLaunchPayment = async () => {
    setPaymentError('');
    setIsProcessingPayment(true);

    try {
      // 1. Direct standard official Razorpay Modal checkout
      const res = await fetch(`${API_BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          items: cartItems.map(item => ({
            id: item.id,
            price: item.price,
            title: item.title
          })),
          coupon_code: appliedCoupon ? appliedCoupon.code : null
        })
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.detail || 'Failed to initialize payment gateway.');
      }

      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Payment gateway service connecting. Please check your internet connection.');
      }

      const options = {
        key: orderData.key_id,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || 'INR',
        name: 'RENO DESIGN',
        description: `Studio Digital CAD License (${cartItems.length} items)`,
        image: '/hand.svg',
        order_id: orderData.razorpay_order_id.startsWith('order_mock_') ? undefined : orderData.razorpay_order_id,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
          method: 'upi'
        },
        theme: {
          color: '#0A0A0C'
        },
        handler: async function (response) {
          try {
            setStep('processing');
            const verifyRes = await fetch(`${API_BASE_URL}/orders/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_number: orderData.order_number,
                razorpay_order_id: response.razorpay_order_id || orderData.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || 'verified'
              })
            });

            if (verifyRes.ok) {
              persistVerifiedBillingDetails(formData);
              setCompletedOrder({
                orderNumber: orderData.order_number,
                amount: orderData.amount,
                items: cartItems
              });
              changeStep('success');
              if (onCompletePurchase) {
                onCompletePurchase(cartItems, orderData.amount);
              }
            } else {
              setPaymentError('Payment verification failed. If amount was deducted, our team will unlock your license.');
              changeStep('failed');
            }
          } catch (err) {
            console.error('Payment verification error', err);
            setStep('failed');
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (response) {
        setPaymentError(response.error.description || 'Payment was declined by bank partner.');
        setIsProcessingPayment(false);
        setStep('failed');
      });
      rzpInstance.open();
      setIsProcessingPayment(false);
    } catch (err) {
      console.error('Payment invocation error:', err);
      setPaymentError(err.message || 'Payment initiation failed.');
      setIsProcessingPayment(false);
    }
  };

  // Generate On-Demand Dynamic UPI QR Code (Only when tapped)
  const handleGenerateQr = async () => {
    setQrError('');
    setQrLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/orders/create-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          items: cartItems.map(item => ({
            id: item.id,
            price: item.price,
            title: item.title
          })),
          coupon_code: appliedCoupon ? appliedCoupon.code : null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Could not generate dynamic QR code.');
      }

      setQrData(data);
      setIsQrGenerated(true);
    } catch (err) {
      setQrError(err.message || 'Failed to generate QR code.');
    } finally {
      setQrLoading(false);
    }
  };

  // Poll for QR Code or Direct UPI Payment Completion
  useEffect(() => {
    let pollTimer = null;
    let countdownTimer = null;

    if (step === 'processing') {
      countdownTimer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (isQrGenerated && qrData?.order_number && (step === 'payment_method' || step === 'processing')) {
      let pollCount = 0;
      const maxPolls = 20; // 20 * 3s = 60s max before auto expiration

      pollTimer = setInterval(async () => {
        pollCount += 1;
        try {
          const res = await fetch(`${API_BASE_URL}/orders/check-qr-status/${qrData.order_number}`);
          if (res.ok) {
            const statusData = await res.json();
            if (statusData.status === 'PAID') {
              clearInterval(pollTimer);
              if (countdownTimer) clearInterval(countdownTimer);
              persistVerifiedBillingDetails(formData);
              setCompletedOrder({
                orderNumber: qrData.order_number,
                amount: qrData.amount,
                items: cartItems
              });
              changeStep('success');
              if (onCompletePurchase) {
                onCompletePurchase(cartItems, qrData.amount);
              }
              return;
            } else if (statusData.status === 'FAILED' || statusData.status === 'CANCELLED') {
              clearInterval(pollTimer);
              if (countdownTimer) clearInterval(countdownTimer);
              setPaymentError('Payment was declined or cancelled by bank partner.');
              changeStep('failed');
              return;
            }
          }
        } catch (e) {
          // Ignore polling errors
        }

        // If in processing step and 60 seconds expire without payment confirmation, auto-expire
        if (step === 'processing' && pollCount >= maxPolls) {
          clearInterval(pollTimer);
          if (countdownTimer) clearInterval(countdownTimer);
          setPaymentError('Payment session expired (Bank technical issue or transaction not authorized). If amount was not deducted, please try again.');
          changeStep('failed');
        }
      }, 3000);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [isQrGenerated, qrData, step, cartItems, onCompletePurchase]);

  return (
    <div className="reno-billing-page">
      {/* Top Studio Header */}
      <header className="reno-billing-header">
        <a href="/" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }} className="reno-billing-brand">
          <img src={handLogo} alt="" className="reno-billing-hand" />
          <img src={renoText} alt="RENO DESIGN" className="reno-billing-logo-text" />
        </a>

        {/* Step Indicator */}
        <div className="reno-checkout-steps-badge">
          <span className={`reno-step-dot ${step === 'billing' ? 'active' : 'done'}`}>1. Billing Details</span>
          <span className="reno-step-arrow">→</span>
          <span className={`reno-step-dot ${step === 'payment_method' || step === 'processing' ? 'active' : step === 'success' ? 'done' : ''}`}>2. Payment &amp; Security</span>
          <span className="reno-step-arrow">→</span>
          <span className={`reno-step-dot ${step === 'success' ? 'active' : ''}`}>3. Instant CAD Delivery</span>
        </div>

        <button type="button" className="reno-billing-cancel-btn" onClick={onNavigateToHome}>
          Cancel &amp; Exit
        </button>
      </header>

      <main className="reno-billing-main-container">
        {/* ================= STEP 1: BILLING DETAILS & COUPON ================= */}
        {step === 'billing' && (
          <div className={`reno-billing-layout ${!isEditingBilling && formData.fullName ? 'reno-billing-centered-layout' : ''}`}>
            {/* If data exists and not explicitly editing, show pill at the top full width on desktop & mobile */}
            {!isEditingBilling && formData.fullName && (
              <div className="reno-billing-saved-pill-card reno-billing-top-pill">
                <div className="reno-saved-pill-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="reno-saved-pill-meta">
                  <div className="reno-saved-pill-title-row">
                    <strong className="reno-saved-pill-name">{formData.fullName}</strong>
                    <span className="reno-saved-pill-verified">Verified</span>
                  </div>
                  <div className="reno-saved-pill-details">
                    <span>{formData.email}</span>
                    <span>&bull;</span>
                    <span>{formData.phone}</span>
                  </div>
                  {formData.address && (
                    <div className="reno-saved-pill-addr">{formData.address}</div>
                  )}
                </div>

                <button
                  type="button"
                  className="reno-saved-pill-edit-btn"
                  onClick={() => setIsEditingBilling(true)}
                  title="Edit details"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Edit</span>
                </button>
              </div>
            )}

            {/* If explicitly editing or no data yet, show billing form card */}
            {(isEditingBilling || !formData.fullName) && (
              <section className="reno-billing-card reno-billing-form-card">
                <div>
                  <div className="reno-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h2>Billing &amp; Delivery Information</h2>
                      <p>Digital CAD licenses and download links will be delivered to this verified account.</p>
                    </div>
                    {formData.fullName && (
                      <button
                        type="button"
                        onClick={() => setIsEditingBilling(false)}
                        style={{
                          background: '#FAF9F6',
                          border: '1px solid rgba(10,10,12,0.12)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Done
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleProceedToPayment} className="reno-billing-form">
                    <div className="reno-form-row">
                      <div className="reno-form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => updateFormField('fullName', e.target.value)}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="reno-form-group">
                        <label>Email Address (For CAD delivery) *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => updateFormField('email', e.target.value)}
                          placeholder="architect@studio.design"
                        />
                      </div>
                    </div>

                    <div className="reno-form-row">
                      <div className="reno-form-group">
                        <label>Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => updateFormField('phone', e.target.value)}
                          placeholder="+91 98765 43210"
                        />
                        {!formData.phone && (
                          <span style={{ fontSize: '0.7rem', color: '#DC2626', marginTop: '2px' }}>
                            Required for payment updates &amp; gateway verification
                          </span>
                        )}
                      </div>
                      <div className="reno-form-group">
                        <label>Studio / Office Name (Optional)</label>
                        <input
                          type="text"
                          value={formData.studioName}
                          onChange={(e) => updateFormField('studioName', e.target.value)}
                          placeholder="e.g. Reno Architecture Studio"
                        />
                      </div>
                    </div>

                    <div className="reno-form-row">
                      <div className="reno-form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Billing Address (Optional)</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => updateFormField('address', e.target.value)}
                          placeholder="Street, Studio or City"
                        />
                      </div>
                    </div>

                    <div className="reno-billing-form-actions-desktop">
                      <button type="submit" className="reno-billing-continue-btn">
                        <span>Save &amp; Continue</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            )}

            {/* Right: Order Summary & Item Selector */}
            <aside className="reno-billing-card reno-billing-summary-card">
              <div className="reno-card-header">
                <h3>Order Summary</h3>
                <span className="reno-item-count">{cartItems.length} {cartItems.length === 1 ? 'Design' : 'Designs'}</span>
              </div>

              {/* Multi-item Checkout mode selector */}
              {allCartItems && allCartItems.length > 1 && (
                <div className="reno-checkout-mode-switch">
                  <button
                    type="button"
                    className={`reno-mode-pill ${cartItems.length === allCartItems.length ? 'active' : ''}`}
                    onClick={() => onSelectCheckoutItem(null)}
                  >
                    Pay All Items ({allCartItems.length})
                  </button>
                  <span className="reno-mode-or">or select single item below:</span>
                </div>
              )}

              {/* Items Mini List */}
              <div className="reno-summary-items-list">
                {cartItems.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="reno-summary-item-row">
                    <div className="reno-summary-item-thumb">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="reno-summary-item-img"
                        />
                      ) : (
                        <div className="reno-summary-cube-placeholder">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="reno-summary-item-meta">
                      <span className="reno-item-name">{item.title}</span>
                      <span className="reno-item-category">
                        {isNaN(Number(item.category)) ? (item.category || 'CAD Model') : '3D Architectural Model'}
                      </span>
                      {allCartItems && allCartItems.length > 1 && (
                        <button
                          type="button"
                          className="reno-summary-single-btn"
                          onClick={() => onSelectCheckoutItem(item)}
                        >
                          Checkout Only This
                        </button>
                      )}
                    </div>
                    <span className="reno-item-price">{formatPrice(item.price).formatted}</span>
                  </div>
                ))}
              </div>

              {/* Promo Coupon Section */}
              <div className="reno-promo-coupon-section">
                <form onSubmit={handleApplyCoupon} className="reno-coupon-form">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. RENO10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    disabled={Boolean(appliedCoupon)}
                    className="reno-coupon-input"
                  />
                  {appliedCoupon ? (
                    <button type="button" onClick={handleRemoveCoupon} className="reno-remove-coupon-btn">
                      Remove
                    </button>
                  ) : (
                    <button type="submit" className="reno-apply-coupon-btn">
                      Apply
                    </button>
                  )}
                </form>

                {couponError && <p className="reno-coupon-msg error">{couponError}</p>}
                {couponSuccess && <p className="reno-coupon-msg success">{couponSuccess}</p>}

                {/* Quick Hint Chips */}
                {!appliedCoupon && (
                  <div className="reno-quick-coupon-hints">
                    <span onClick={() => { setCouponInput('RENO10'); }}>Code: <strong>RENO10</strong> (10% OFF)</span>
                    <span onClick={() => { setCouponInput('ARCH50'); }}>Code: <strong>ARCH50</strong> (₹50 OFF)</span>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown Table (Zero GST) */}
              <div className="reno-pricing-table">
                <div className="reno-price-row">
                  <span>Subtotal</span>
                  <strong>{formatPrice(subtotal).formatted}</strong>
                </div>

                {appliedCoupon && (
                  <div className="reno-price-row discount-row">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <strong className="reno-discount-val">- {formatPrice(discountAmount).formatted}</strong>
                  </div>
                )}

                <div className="reno-price-row total-row">
                  <span>Total Payable</span>
                  <strong className="reno-grand-total">{formatPrice(finalTotal).formatted}</strong>
                </div>
              </div>

              {/* Bottom Primary Action Button */}
              <div className="reno-summary-bottom-action">
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="reno-billing-continue-btn full-width"
                >
                  <span>Continue to Payment Method</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </aside>
          </div>
        )
        }

        {/* ================= STEP 2: PROFESSIONAL PAYMENT METHOD SELECTION ================= */}
        {
          step === 'payment_method' && (
            <div className="reno-payment-step-layout">
              <div className="reno-billing-card reno-payment-method-card">
                <button
                  type="button"
                  className="reno-back-to-billing-btn"
                  onClick={() => setStep('billing')}
                >
                  ← Back to Billing Details
                </button>

                <div className="reno-card-header">
                  <h2>Select Payment Method</h2>
                  <p>256-Bit Encrypted Bank Grade Security. Digital CAD toolpaths unlocked instantly upon approval.</p>
                </div>

                {paymentError && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '0.625rem',
                    color: '#DC2626',
                    fontSize: '0.8125rem',
                    marginBottom: '1rem'
                  }}>
                    {paymentError}
                  </div>
                )
                }

                {/* Payment Methods Grid with Official Brand Badges */}
                <div className="reno-payment-methods-grid">

                  {/* 1. UPI Apps (PhonePe, GPay, Paytm) */}
                  <div
                    className={`reno-payment-opt-card ${selectedMethod === 'upi_apps' ? 'selected' : ''}`}
                    onClick={() => setSelectedMethod('upi_apps')}
                  >
                    <div className="reno-opt-header">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={selectedMethod === 'upi_apps'}
                        onChange={() => setSelectedMethod('upi_apps')}
                      />
                      <div className="reno-opt-title-col">
                        <div className="reno-opt-title-row">
                          <strong>Instant UPI</strong>
                          <div className="reno-brand-badges">
                            <GPayLogo height={16} />
                            <PhonePeLogo height={18} />
                            <PaytmLogo height={14} />
                            <UpiLogo height={16} />
                          </div>
                        </div>
                        <span>Google Pay, PhonePe, Paytm, BHIM &amp; Any UPI App (Zero Fee)</span>
                      </div>
                    </div>
                    {selectedMethod === 'upi_apps' && (
                      <div className="reno-upi-expanded-fields" onClick={(e) => e.stopPropagation()}>
                        <div className="reno-upi-apps-selector">
                          <button
                            type="button"
                            className={`reno-upi-app-chip ${selectedUpiApp === 'gpay' ? 'active' : ''}`}
                            onClick={() => setSelectedUpiApp('gpay')}
                          >
                            <GPayLogo height={16} />
                          </button>
                          <button
                            type="button"
                            className={`reno-upi-app-chip ${selectedUpiApp === 'phonepe' ? 'active' : ''}`}
                            onClick={() => setSelectedUpiApp('phonepe')}
                          >
                            <PhonePeLogo height={18} />
                            <span>PhonePe</span>
                          </button>
                          <button
                            type="button"
                            className={`reno-upi-app-chip ${selectedUpiApp === 'paytm' ? 'active' : ''}`}
                            onClick={() => setSelectedUpiApp('paytm')}
                          >
                            <PaytmLogo height={13} />
                          </button>
                          <button
                            type="button"
                            className={`reno-upi-app-chip ${selectedUpiApp === 'bhim' ? 'active' : ''}`}
                            onClick={() => setSelectedUpiApp('bhim')}
                          >
                            <UpiLogo height={14} />
                            <span>Other UPI</span>
                          </button>
                        </div>
                        <span className="reno-method-subnote">
                          Device me installed payment apps (GPay, PhonePe, Paytm, BHIM) se 1-tap direct payment authorize hoga.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2. On-Demand Dynamic QR Code */}
                  <div
                    className={`reno-payment-opt-card ${selectedMethod === 'qr' ? 'selected' : ''}`}
                    onClick={() => setSelectedMethod('qr')}
                  >
                    <div className="reno-opt-header">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={selectedMethod === 'qr'}
                        onChange={() => setSelectedMethod('qr')}
                      />
                      <div className="reno-opt-title-col">
                        <div className="reno-opt-title-row">
                          <strong>Scan UPI QR Code</strong>
                          <div className="reno-brand-badges">
                            <QrCodeIcon size={18} />
                          </div>
                        </div>
                        <span>Scan &amp; Pay using any camera or UPI app</span>
                      </div>
                    </div>

                    {selectedMethod === 'qr' && (
                      <div className="reno-upi-expanded-fields" onClick={(e) => e.stopPropagation()}>
                        {!isQrGenerated ? (
                          <div className="reno-qr-generate-gate">
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: '#6B6861' }}>
                              To protect against expired codes, dynamic QR is created on-demand.
                            </p>
                            <button
                              type="button"
                              className="reno-generate-qr-btn"
                              onClick={handleGenerateQr}
                              disabled={qrLoading}
                            >
                              {qrLoading ? 'Generating Secure QR...' : 'Show QR Code'}
                            </button>
                            {qrError && (
                              <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '6px' }}>{qrError}</span>
                            )}
                          </div>
                        ) : (
                          <div className="reno-live-qr-display">
                            <div className="reno-qr-box">
                              <img
                                src={qrData.qr_image_url}
                                alt="Dynamic UPI QR"
                                className="reno-live-qr-img"
                              />
                            </div>
                            <div className="reno-qr-meta">
                              <span className="reno-qr-pulse-badge">Waiting for Scan &amp; Pay...</span>
                              <span className="reno-qr-amount">Amount: <strong>{formatPrice(finalTotal).formatted}</strong></span>
                              <span className="reno-qr-instruction">
                                Scan this QR with any UPI App (GPay, PhonePe, Paytm). Your CAD files will automatically unlock.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons to Pay */}
                {
                  selectedMethod !== 'qr' && (
                    <div className="reno-pay-trigger-actions">
                      <button
                        type="button"
                        className="reno-confirm-pay-btn"
                        onClick={handleLaunchPayment}
                        disabled={isProcessingPayment}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        <span>
                          {isProcessingPayment
                            ? 'Initiating Secure Payment...'
                            : `Complete Payment • ${formatPrice(finalTotal).formatted}`}
                        </span>
                      </button>
                      <div className="reno-security-trust-strip">
                        <ShieldLockIcon size={14} className="reno-trust-lock-icon" />
                        <span>256-Bit SSL Encrypted</span>
                        <span>•</span>
                        <span>PCI-DSS Compliant</span>
                        <span>•</span>
                        <span>Instant Digital Access</span>
                      </div>
                    </div>
                  )
                }
              </div >
            </div >
          )
        }

        {/* ================= STEP 3: PROCESSING / WAITING FOR CONFIRMATION ================= */}
        {
          step === 'processing' && (
            <div className="reno-billing-card reno-status-card reno-processing-card" style={{ maxWidth: '540px', margin: '0 auto', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div className="reno-payment-radar-spinner">
                <div className="reno-radar-ring" />
                <div className="reno-radar-center" />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '1rem 0 0.5rem' }}>Waiting for Payment...</h2>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                color: '#92400E',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '600',
                margin: '0.5rem 0 1rem'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Expires in: <strong>{remainingTime}s</strong></span>
              </div>

              <p className="reno-status-desc" style={{ fontSize: '0.875rem', color: '#52525B', margin: '0 0 1rem', lineHeight: '1.5' }}>
                Please approve the transaction in your UPI app. If payment is declined, bank fails, or time runs out, this session will automatically expire.
              </p>

              <div className="reno-payment-amount-badge" style={{ marginBottom: '1.5rem' }}>
                Amount: <strong>{formatPrice(finalTotal).formatted}</strong>
              </div>

              {/* HIGHLIGHTED ACTION BUTTONS */}
              <div style={{
                background: '#FAFAFA',
                border: '1.5px solid #E4E4E7',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentError('Transaction cancelled or declined by user.');
                    changeStep('failed');
                  }}
                  style={{
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>Cancel / Didn't Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('payment_method');
                  }}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #D4D4D8',
                    color: '#18181B',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Change Payment Method / Retry
                </button>
              </div>
            </div>
          )
        }

        {/* ================= STEP 4: SUCCESS / PAYMENT RECEIVED ================= */}
        {
          step === 'success' && (
            <div className="reno-billing-card reno-status-card reno-success-card">
              <div className="reno-success-icon-wrap">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>

              <div className="reno-success-badge-row">
                <span className="reno-received-tag">✓ PAYMENT RECEIVED</span>
                <VerifiedLottieBadge size={22} />
              </div>

              <h2>Payment Successful!</h2>
              <p className="reno-status-desc">
                Order <strong>#{completedOrder?.orderNumber || 'RENO-COMPLETE'}</strong> verified successfully.
                Your 3D CAD models, CNC toolpaths, and commercial license certificates are unlocked in your account.
              </p>

              <div className="reno-success-summary-card">
                <div className="reno-success-detail-row">
                  <span>Amount Paid</span>
                  <strong>{formatPrice(completedOrder?.amount || finalTotal).formatted}</strong>
                </div>
                <div className="reno-success-detail-row">
                  <span>Licensed To</span>
                  <strong>{formData.fullName} ({formData.email})</strong>
                </div>
                <div className="reno-success-detail-row">
                  <span>Files Unlocked</span>
                  <strong>{cartItems.length} Products (.OBJ, .STL, .DXF)</strong>
                </div>
              </div>

              {/* DIRECT NAVIGATION BUTTONS: VIEW PRODUCTS & OFFICIAL GST TAX INVOICE */}
              <div className="reno-success-actions-block">
                <button
                  type="button"
                  className="reno-view-purchased-btn"
                  onClick={() => {
                    const orderNum = completedOrder?.orderNumber;
                    if (orderNum) {
                      window.open(`${API_BASE_URL}/invoices/render/${orderNum}`, '_blank');
                    } else {
                      window.open(`${API_BASE_URL}/invoices/render/RENO-20261119-E5360B`, '_blank');
                    }
                  }}
                  style={{
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: '1.5px solid #0F172A',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>Download &amp; Print Official GST Tax Invoice</span>
                </button>

                <button
                  type="button"
                  className="reno-view-purchased-btn"
                  onClick={onNavigateToProfile}
                  style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span>View Purchased Products in My Library</span>
                </button>

                <button
                  type="button"
                  className="reno-return-home-link"
                  onClick={onNavigateToHome}
                >
                  Return to 3D Marketplace
                </button>
              </div>
            </div>
          )
        }

        {/* ================= STEP 5: FAILED / DECLINED ================= */}
        {
          step === 'failed' && (
            <div className="reno-billing-card reno-status-card reno-failed-card">
              <div className="reno-failed-icon-wrap">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>

              <span className="reno-declined-tag">✕ TRANSACTION DECLINED</span>
              <h2>Payment Could Not Be Completed</h2>
              <p className="reno-status-desc">
                {paymentError || 'Your banking partner or payment app declined the transaction. No amount has been deducted.'}
              </p>

              <div className="reno-failed-actions">
                <button
                  type="button"
                  className="reno-retry-pay-btn"
                  onClick={() => setStep('payment_method')}
                >
                  Retry Payment
                </button>
                <button
                  type="button"
                  className="reno-return-home-link"
                  onClick={onNavigateToHome}
                >
                  Cancel &amp; Return to Store
                </button>
              </div>
            </div>
          )
        }
      </main >
    </div >
  );
}

export default BillingPage;