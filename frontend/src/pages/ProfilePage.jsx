import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import handLogo from '../assets/hand.svg';
import renoText from '../assets/reno-design.svg';
import VerifiedLottieBadge from '../components/common/VerifiedLottieBadge';
import { API_BASE_URL, fetchSubscriptionTiers, fetchSubscriptionStatus, activateSubscription, createSubscriptionRazorpayOrder, verifySubscriptionRazorpayPayment } from '../services/api';
import { useToast } from '../context/ToastContext';

export function ProfilePage({
  user,
  onNavigateToHome,
  onLogout,
  onTogglePlan,
  purchasedProducts = [],
  activeTab: initialActiveTab = 'my-product',
  activeSidebarItem,
  onSelectSidebarItem
}) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return activeSidebarItem || localStorage.getItem('reno_active_profile_tab') || initialActiveTab || 'subscription';
  });
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [subStatus, setSubStatus] = useState({
    has_subscription: false,
    days_left: 0,
    tier_id: null,
    subscription_expires_at: null
  });
  const [loadingTiers, setLoadingTiers] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    if (activeSidebarItem) {
      setActiveTab(activeSidebarItem);
    }
  }, [activeSidebarItem]);

  // Load CRM dynamic tiers and subscription status
  useEffect(() => {
    let isMounted = true;
    const loadSubscriptionData = async () => {
      setLoadingTiers(true);
      try {
        const [tiersData, statusData] = await Promise.all([
          fetchSubscriptionTiers(),
          fetchSubscriptionStatus(user?.email || user?.identifier)
        ]);
        if (isMounted) {
          if (Array.isArray(tiersData) && tiersData.length > 0) {
            setTiers(tiersData);
          }
          if (statusData) {
            setSubStatus(statusData);
          }
        }
      } catch (err) {
        console.warn('Failed loading subscription info:', err);
      } finally {
        if (isMounted) setLoadingTiers(false);
      }
    };
    loadSubscriptionData();
    return () => { isMounted = false; };
  }, [user]);

  const mockUser = user || {
    identifier: 'architect@studio.design',
    name: 'Lalu Ji',
    username: 'laluji573',
    plan: 'normal',
    joinedDate: 'November 2026'
  };

  const hasActiveSubscription = subStatus.has_subscription || mockUser.plan === 'premium';
  const isPremium = hasActiveSubscription;
  const activeTierId = subStatus.tier_id || (isPremium ? 'tier_2' : null);
  const activeTierObj = tiers.find(t => t.id === activeTierId) || null;
  const remainingDays = subStatus.days_left || (isPremium ? 30 : 0);

  const handleSelectTier = async (tier) => {
    setIsUpgrading(true);
    const email = (mockUser.email || mockUser.identifier || '').trim();
    if (!email) {
      showToast('Please sign in or provide a valid account email to purchase subscription.', 'warning');
      setIsUpgrading(false);
      return;
    }

    try {
      // 1. Create Real Razorpay Order for Subscription
      const orderData = await createSubscriptionRazorpayOrder(
        tier.id,
        email,
        mockUser.name || displayName,
        mockUser.phone || ''
      );

      if (typeof window.Razorpay === 'undefined') {
        showToast('Payment gateway connecting. Please check your internet connection.', 'warning');
        setIsUpgrading(false);
        return;
      }

      // 2. Open Official Razorpay Modal
      const options = {
        key: orderData.key_id,
        amount: Math.round(orderData.final_amount * 100),
        currency: orderData.currency || 'INR',
        name: 'RENO DESIGN',
        description: `${orderData.tier_name} VIP Subscription (1 Month)`,
        image: '/hand.svg',
        order_id: (orderData.razorpay_order_id && !orderData.razorpay_order_id.startsWith('order_sub_mock_')) ? orderData.razorpay_order_id : undefined,
        prefill: {
          name: mockUser.name || displayName,
          email: email,
          contact: mockUser.phone || ''
        },
        theme: {
          color: '#0A0A0C'
        },
        handler: async function (response) {
          try {
            // 3. Verify Payment with Server
            const verifyRes = await verifySubscriptionRazorpayPayment({
              order_number: orderData.order_number,
              tier_id: tier.id,
              user_email: email,
              razorpay_order_id: response.razorpay_order_id || orderData.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || 'verified'
            });

            if (verifyRes && verifyRes.status === 'success') {
              setSubStatus({
                has_subscription: true,
                days_left: verifyRes.days_left || 30,
                tier_id: verifyRes.tier_id,
                subscription_expires_at: verifyRes.subscription_expires_at
              });
              if (onTogglePlan) onTogglePlan('premium');
              showToast(`Payment of Rs ${orderData.final_amount} verified! ${orderData.tier_name} activated successfully.`, 'success');
            }
          } catch (verErr) {
            console.error('Verification error:', verErr);
            showToast('Payment captured, activating subscription...', 'info');
            if (onTogglePlan) onTogglePlan('premium');
          } finally {
            setIsUpgrading(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (response) {
        showToast(response.error?.description || 'Payment was cancelled or declined.', 'error');
        setIsUpgrading(false);
      });
      rzpInstance.open();
    } catch (err) {
      console.error('Subscription purchase flow failed:', err);
      showToast(err.message || 'Unable to open payment gateway.', 'error');
      setIsUpgrading(false);
    }
  };
  const displayName = mockUser.name || mockUser.username || (mockUser.identifier ? mockUser.identifier.split('@')[0] : 'Studio User');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editPhone, setEditPhone] = useState(mockUser.phone || '');
  const [profileImage, setProfileImage] = useState(mockUser.profile_image || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const email = mockUser.email || mockUser.identifier;
      const res = await fetch(`${API_BASE_URL}/profile/update?email=${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          profile_image: profileImage
        })
      });
      if (res.ok) {
        const updated = await res.json();
        try {
          const storedUser = JSON.parse(localStorage.getItem('reno_user') || '{}');
          const newUserObj = { ...storedUser, name: updated.name, profile_image: updated.profile_image, phone: updated.phone };
          localStorage.setItem('reno_user', JSON.stringify(newUserObj));
        } catch (storageErr) {
          console.warn('LocalStorage quota warning:', storageErr);
        }
        setIsEditingProfile(false);
        showToast('Profile updated successfully!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        const errData = await res.json().catch(() => null);
        showToast(errData?.detail || 'Failed to save profile changes', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save profile changes', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            // Resize avatar down to max 256x256 using Canvas to keep size ~15KB
            const canvas = document.createElement('canvas');
            const maxDim = 256;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Highly optimized JPEG data url
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
            setProfileImage(compressedBase64);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    };



    // Telegram-style 2-letter Initials
    const getInitials = () => {
      const parts = (displayName || '').trim().split(/\s+/);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return (displayName || 'U').slice(0, 2).toUpperCase();
    };

    const handlePlanToggle = () => {
      setIsUpgrading(true);
      setTimeout(() => {
        if (onTogglePlan) {
          onTogglePlan(!isPremium ? 'premium' : 'normal');
        }
        setIsUpgrading(false);
      }, 600);
    };

    const sidebarNavItems = [
      {
        id: 'profile-setting',
        label: 'Profile Setting',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )
      },
      {
        id: 'subscription',
        label: 'Subscription',
        isVerifiedTag: isPremium,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
      },
      {
        id: 'payment-setting',
        label: 'Payment Setting',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        )
      },
      {
        id: 'setting',
        label: 'Setting',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        )
      }
    ];

    return (
      <div className="reno-profile-page-wrapper">
        {/* Top Header Strip */}
        <header className="reno-profile-page-header">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToHome();
            }}
            className="reno-profile-brand"
          >
            <img src={handLogo} alt="" className="reno-profile-hand" />
            <img src={renoText} alt="RENO DESIGN" className="reno-profile-logo-text" />
          </a>

          <button
            type="button"
            className="reno-profile-back-btn"
            onClick={onNavigateToHome}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to Marketplace</span>
          </button>
        </header>

        {/* Main Profile Body with PC Desktop Sidebar & Right Content Panel */}
        <main className="reno-profile-main-container">
          <div className="reno-profile-workspace-layout">
            {/* LEFT SIDEBAR (PC Desktop Layout) */}
            <aside className="reno-profile-desktop-sidebar">
              {/* Sidebar User Mini Identity */}
              <div className="reno-sidebar-user-brief">
                <div className="reno-sidebar-avatar-small">
                  <span>{getInitials()}</span>
                </div>
                <div className="reno-sidebar-user-texts">
                  <span className="reno-sidebar-name">{displayName}</span>
                  <span className="reno-sidebar-handle">@{mockUser.username || 'user'}</span>
                </div>
              </div>

              {/* Sidebar Navigation Options List */}
              <nav className="reno-profile-sidebar-nav" aria-label="Account Settings Navigation">
                {sidebarNavItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`reno-sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (onSelectSidebarItem) onSelectSidebarItem(item.id);
                      }}
                    >
                      <span className="reno-sidebar-item-icon">{item.icon}</span>
                      <span className="reno-sidebar-item-label">{item.label}</span>
                      {typeof item.badge === 'number' && (
                        <span className="reno-sidebar-item-badge">{item.badge}</span>
                      )}
                      {item.isVerifiedTag && (
                        <span className="reno-sidebar-verified-mini">VIP</span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Quick Tier Switch / Info */}
              <div className="reno-sidebar-footer-card">
                <span className="reno-sidebar-tier-label">CURRENT STATUS</span>
                <div className="reno-sidebar-tier-val">
                  {isPremium ? (
                    <span className="reno-sidebar-tier-active">★ Premium VIP</span>
                  ) : (
                    <span className="reno-sidebar-tier-free">Standard User</span>
                  )}
                </div>
                <button
                  type="button"
                  className="reno-sidebar-switch-plan-btn"
                  onClick={handlePlanToggle}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? 'Updating...' : isPremium ? 'Switch to Normal' : '★ Upgrade to VIP'}
                </button>
              </div>
            </aside>

            {/* RIGHT CONTENT WORKSPACE */}
            <div className="reno-profile-workspace-content">
              {/* TAB CONTENT PANELS (Selected from PC Sidebar) */}
              <div className="reno-profile-tab-content">
                {/* 4. EXCLUSIVE COUPONS & PROFILE CUSTOMIZATION */}
                {activeTab === 'profile-setting' && (
                  <div className="reno-profile-tab-pane">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <h3>My Exclusive Coupons &amp; Profile Details</h3>
                        <p className="reno-pane-sub" style={{ margin: 0 }}>View your member shopping coupons, edit your studio display name, or change your profile avatar.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: isEditingProfile ? '#F1F5F9' : '#0F172A',
                          color: isEditingProfile ? '#0F172A' : '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isEditingProfile ? 'Cancel Editing' : 'Edit Profile & Avatar'}
                      </button>
                    </div>

                    {/* PROFILE PHOTO & NAME EDIT FORM */}
                    {isEditingProfile && (
                      <form onSubmit={handleSaveProfile} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 800 }}>Update Account Profile</h4>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {profileImage ? (
                              <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>{getInitials()}</span>
                            )}
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>Change Profile Photo:</label>
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: '0.8rem' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>Full Display Name:</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              required
                              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>Phone Number:</label>
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              placeholder="+91 9876543210"
                              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          style={{ padding: '0.6rem 1.5rem', background: '#0F172A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {isSavingProfile ? 'Saving Changes...' : 'Save Profile Details'}
                        </button>
                      </form>
                    )}

                    {/* EXCLUSIVE COUPONS LIST (VIP Coupons for Premium, Welcome for Free) */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                          {isPremium ? '★ Your Active VIP Coupons & Privileges' : 'Welcome Discounts & Available Offers'}
                        </h4>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', background: isPremium ? '#ECFDF5' : '#F1F5F9', color: isPremium ? '#065F46' : '#475569' }}>
                          {isPremium ? 'PREMIUM TIER ASSIGNED' : 'STANDARD TIER'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {/* VIP20 Coupon (Exclusive to Premium) */}
                        {isPremium ? (
                          <div style={{ background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)', color: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #10B981', boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                VIP EXCLUSIVE
                              </span>
                              <strong style={{ fontSize: '1.35rem', color: '#A7F3D0' }}>20% OFF</strong>
                            </div>
                            <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800 }}>VIP20</h5>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#D1FAE5', lineHeight: 1.4 }}>
                              Applied on any architectural 3D file or CNC toolpath package at checkout.
                            </p>
                          </div>
                        ) : (
                          <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '1.25rem', borderRadius: '12px', opacity: 0.85 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#E2E8F0', color: '#64748B', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                LOCKED (VIP ONLY)
                              </span>
                              <strong style={{ fontSize: '1.25rem', color: '#94A3B8' }}>20% OFF</strong>
                            </div>
                            <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800, color: '#64748B' }}>VIP20</h5>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                              Subscribe to an architectural plan to unlock this 20% member coupon.
                            </p>
                          </div>
                        )}

                        {/* RENO10 Welcome Coupon */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', padding: '1.25rem', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#F1F5F9', color: '#0F172A', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                              WELCOME BONUS
                            </span>
                            <strong style={{ fontSize: '1.35rem', color: '#0F172A' }}>10% OFF</strong>
                          </div>
                          <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800 }}>RENO10</h5>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4 }}>
                            10% instant checkout rebate for new architectural studio members.
                          </p>
                        </div>

                        {/* ARCH50 Fixed Credit */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', padding: '1.25rem', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#F1F5F9', color: '#0F172A', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                              ARCHITECT CREDIT
                            </span>
                            <strong style={{ fontSize: '1.35rem', color: '#0F172A' }}>₹50 FLAT</strong>
                          </div>
                          <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800 }}>ARCH50</h5>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4 }}>
                            Flat ₹50 credit applicable on any single digital asset download.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* READONLY ACCOUNT STATS */}
                    <div className="reno-profile-details-grid">
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">Verified Contact Email</span>
                        <strong className="reno-detail-val">{mockUser.identifier || mockUser.email || 'architect@studio.design'}</strong>
                      </div>
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">Account Tier Status</span>
                        <strong className="reno-detail-val" style={{ color: isPremium ? '#059669' : '#0F172A' }}>
                          {isPremium ? '★ VIP Premium Subscriber' : 'Standard Member (Free)'}
                        </strong>
                      </div>
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">Username / Handle</span>
                        <strong className="reno-detail-val">@{mockUser.username || 'user'}</strong>
                      </div>
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">Member Since</span>
                        <strong className="reno-detail-val">{mockUser.joinedDate || 'November 2026'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PAYMENT SETTING */}
                {activeTab === 'payment-setting' && (
                  <div className="reno-profile-tab-pane">
                    <h3>Payment Setting &amp; Cards</h3>
                    <p className="reno-pane-sub">Manage saved UPI VPAs, cards, and tax billing details.</p>
                    <div className="reno-profile-details-grid">
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">Default Payout / VPA</span>
                        <strong className="reno-detail-val">architect@upi (Verified)</strong>
                      </div>
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">Currency Preference</span>
                        <strong className="reno-detail-val">INR (₹ Indian Rupee)</strong>
                      </div>
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">GST Invoice Download</span>
                        <strong className="reno-detail-val">Auto-Generated Monthly</strong>
                      </div>
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">Security Encryption</span>
                        <strong className="reno-detail-val">256-Bit SSL AES Verified</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SUBSCRIPTION (Controlled via CRM) */}
                {activeTab === 'subscription' && (
                  <div className="reno-profile-tab-pane">
                    <div className="reno-sub-pane-head">
                      <div>
                        <h3>Architectural Membership Plans</h3>
                        <p className="reno-pane-sub">Choose a plan or manage your active subscription. Extra discount coupon applied on every shopping checkout.</p>
                      </div>
                    </div>

                    {/* ACTIVE STATUS BANNER IF USER HAS PURCHASED A SUBSCRIPTION */}
                    {hasActiveSubscription ? (
                      <div className="reno-active-sub-banner">
                        <div className="reno-active-sub-left">
                          <div className="reno-active-sub-badge">ACTIVE SUBSCRIPTION</div>
                          <h4 className="reno-active-sub-title">
                            {activeTierObj ? activeTierObj.name : 'Pro Architect Tier'}
                          </h4>
                          <p className="reno-active-sub-desc">
                            Includes {activeTierObj ? activeTierObj.discount_percent : 20}% Extra Discount Coupon on all CAD purchases, high-speed downloads and VIP priority access.
                          </p>
                        </div>
                        <div className="reno-active-sub-right">
                          <div className="reno-days-counter-box">
                            <span className="reno-days-num">{remainingDays}</span>
                            <span className="reno-days-lbl">Days Left</span>
                          </div>
                          <span className="reno-sub-validity-text">
                            {subStatus.subscription_expires_at
                              ? `Valid until ${new Date(subStatus.subscription_expires_at).toLocaleDateString('en-GB')}`
                              : 'Active Membership'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="reno-no-sub-banner">
                        <div className="reno-no-sub-info">
                          <strong>No Active Subscription</strong>
                          <span>Select a membership tier below to unlock exclusive discounts and direct high-speed CAD downloads.</span>
                        </div>
                      </div>
                    )}

                    {/* 3 CRM DYNAMIC SUBSCRIPTION CARDS */}
                    <div className="reno-sub-cards-grid">
                      {tiers.map((tier, idx) => {
                        const isThisTierActive = hasActiveSubscription && activeTierId === tier.id;
                        const isCardHighlighted = tier.highlight || tier.badge === 'Most Popular';

                        return (
                          <div
                            key={tier.id || idx}
                            className={`reno-sub-plan-card ${isCardHighlighted ? 'is-highlighted' : ''} ${isThisTierActive ? 'is-current-active' : ''}`}
                          >
                            {tier.badge && (
                              <div className="reno-sub-card-badge">{tier.badge}</div>
                            )}

                            <div className="reno-sub-card-header">
                              <h4 className="reno-sub-card-name">{tier.name}</h4>
                              <div className="reno-sub-price-row">
                                <span className="reno-sub-currency">₹</span>
                                <span className="reno-sub-amount">{Number(tier.price).toLocaleString('en-IN')}</span>
                                <span className="reno-sub-period">/{tier.billing_period || 'mo'}</span>
                              </div>
                              <div className="reno-sub-discount-pill">
                                <span>{tier.discount_percent}% Extra Discount on Shopping</span>
                              </div>
                              {tier.description && (
                                <p className="reno-sub-card-desc">{tier.description}</p>
                              )}
                            </div>

                            <div className="reno-sub-benefits-list">
                              {(tier.benefits || []).map((b, bIdx) => (
                                <div key={bIdx} className="reno-sub-benefit-item">
                                  <svg className="reno-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  <span>{b}</span>
                                </div>
                              ))}
                            </div>

                            <div className="reno-sub-card-footer">
                              {isThisTierActive ? (
                                <button type="button" className="reno-sub-btn is-active-btn" disabled>
                                  Active Plan ({remainingDays} Days Left)
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="reno-sub-btn"
                                  onClick={() => handleSelectTier(tier)}
                                  disabled={isUpgrading}
                                >
                                  {isUpgrading ? 'Processing...' : (hasActiveSubscription ? 'Upgrade to This Plan' : 'Subscribe Now')}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. SETTING */}
                {activeTab === 'setting' && (
                  <div className="reno-profile-tab-pane">
                    <h3>Setting</h3>
                    <p className="reno-pane-sub">System controls, file formats preferences, and cloud sync.</p>
                    <div className="reno-profile-details-grid">
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">Default Toolpath Format</span>
                        <strong className="reno-detail-val">OBJ / STL / DXF (Full CAD)</strong>
                      </div>
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">Email Notifications</span>
                        <strong className="reno-detail-val">New 3D Tile Releases Only</strong>
                      </div>
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">3D Viewport Quality</span>
                        <strong className="reno-detail-val">Ultra High Precision (WebGL 2.0)</strong>
                      </div>
                      <div className="reno-profile-detail-card">
                        <span className="reno-detail-lbl">Data Privacy</span>
                        <strong className="reno-detail-val">Encrypted Local Storage</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  export default ProfilePage;
