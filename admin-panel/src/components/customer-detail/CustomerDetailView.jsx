import React, { useState, useEffect } from 'react';
import './CustomerDetailView.css';

export default function CustomerDetailView({ customer, onBack }) {
  if (!customer) return null;

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState(null);

  // Revocation modal state
  const [revokeItem, setRevokeItem] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  // Fetch complete analytics suite from backend
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/customers/${customer.id}/analytics`);
      if (!res.ok) throw new Error('Failed to load telemetry analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [customer.id]);

  // Handle Send Direct Email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailMessage.trim()) {
      alert('Please fill out both subject and message body.');
      return;
    }
    try {
      setIsSendingEmail(true);
      const res = await fetch(`/api/v1/customers/${customer.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject.trim(),
          message: emailMessage.trim()
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to dispatch email');
      }
      setEmailNotice(`Email successfully queued & dispatched to ${customer.email}`);
      setEmailSubject('');
      setEmailMessage('');
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailNotice(null);
      }, 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle Product Revocation
  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!revokeReason.trim()) {
      alert('A revocation reason is required before revoking product access.');
      return;
    }
    try {
      setIsRevoking(true);
      const res = await fetch(`/api/v1/customers/${customer.id}/revoke-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchased_product_id: revokeItem.id,
          reason: revokeReason.trim()
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to revoke product');
      }
      setRevokeItem(null);
      setRevokeReason('');
      await fetchAnalytics();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRevoking(false);
    }
  };

  // Handle Restore Revoked Product
  const handleRestoreProduct = async (itemId) => {
    if (!window.confirm('Restore product access for this customer?')) return;
    try {
      const res = await fetch(`/api/v1/customers/${customer.id}/restore-purchase?item_id=${itemId}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to restore product');
      await fetchAnalytics();
    } catch (err) {
      alert(err.message);
    }
  };

  // Format seconds to readable format
  const formatSeconds = (sec) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const totalMins = Math.floor(((analytics?.total_time_spent_seconds || customer.time_spent_seconds) || 0) / 60);
  const totalSecs = ((analytics?.total_time_spent_seconds || customer.time_spent_seconds) || 0) % 60;
  const timeFormatted = `${totalMins}m ${totalSecs}s`;

  const pageDwells = analytics?.page_dwell_times || customer.page_dwell_times || {};
  const maxDwell = Math.max(1, ...Object.values(pageDwells));

  const isMember = (analytics?.plan || customer.plan) === 'pro' || customer.is_member;

  return (
    <div className="crm-detail-content">
          {/* Top Bar with Navigation and Direct Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="crm-detail-btn-back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Customers Directory
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/ Google Analytics-Style Customer Telemetry</span>
          </div>

          <button
            onClick={() => setShowEmailModal(true)}
            className="crm-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, background: '#0a0a0c', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Direct Message / Email Customer
          </button>
        </div>

        {/* Customer Header Banner */}
        <div className="crm-detail-user-card">
          {customer.profile_image ? (
          <img src={customer.profile_image} alt={customer.name} className="crm-detail-avatar-img" />
          ) : (
            <div className="crm-detail-avatar-ph">
              {(customer.name || customer.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {customer.name || customer.username || 'Anonymous User'}
                  </h2>
                  <span
                    className="badge"
                    style={{
                      background: isMember ? '#ECFDF5' : '#F4F1EA',
                      color: isMember ? '#065F46' : '#6B6861',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    {isMember ? 'Studio Member (Pro)' : 'Free Tier'}
                  </span>
                  <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>
                    Funnel Stage: {analytics?.funnel_stage || customer.funnel_stage || 'Browsing'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                  <span>Email: <strong style={{ color: 'var(--text-main)' }}>{customer.email}</strong></span>
                  <span>ID: <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>#{customer.id}</strong></span>
                  <span>Lifetime Spend: <strong style={{ color: '#10b981' }}>Rs {(analytics?.total_spent || 0).toLocaleString()}</strong></span>
                  <span>Total Orders: <strong style={{ color: 'var(--text-main)' }}>{analytics?.orders_count ?? customer.orders_count}</strong></span>
                  <span>Purchased Items: <strong style={{ color: 'var(--text-main)' }}>{analytics?.purchased_products?.length ?? customer.purchases_count}</strong></span>
                </div>
            </div>
          </div>

          {/* Real-time Telemetry Metrics Grid */}
          <div className="crm-detail-grid">
            <div className="crm-stat-card">
              <div className="crm-stat-label">Active Cart Items</div>
              <div className="crm-stat-value" style={{ color: '#2563eb' }}>{analytics?.cart_items_count ?? customer.cart_items_count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Items currently held in cart
              </div>
            </div>

            <div className="crm-stat-card">
                <div className="crm-stat-label">Live Active Route</div>
                <div className="crm-stat-value" style={{ fontSize: '1.2rem', color: '#10B981', fontFamily: 'monospace' }}>
                  /{analytics?.current_page || customer.current_page || 'home'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Storefront location right now
                </div>
              </div>

              <div className="crm-stat-card">
                <div className="crm-stat-label">Total Dwell Time</div>
                  <div className="crm-stat-value" style={{ fontSize: '1.2rem', color: '#f59e0b' }}>
                    {timeFormatted}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Accumulated browsing session duration
                  </div>
                </div>

                <div className="crm-stat-card">
                    <div className="crm-stat-label">Subscription Tier</div>
                    <div className="crm-stat-value" style={{ fontSize: '1.2rem', color: isMember ? '#8b5cf6' : 'var(--text-muted)' }}>
                      {isMember ? 'Studio Member' : 'Free Member'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {isMember ? 'Unlimited CAD Asset Access' : 'Pay-Per-Download'}
                    </div>
                  </div>
                </div>

                  {/* Two Column Layout: Option 1 (Page Dwell Times) & Option 2 (Cart Funnel Journey) */}
                  <div className="crm-detail-panels" style={{ marginBottom: '1.5rem' }}>

                    {/* OPTION 1: Per-Page Live Dwell Time Breakdown (Google Analytics Style) */}
                    <div className="crm-detail-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              1. Per-Page Live Dwell Time (Google Analytics)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live Breakdown</span>
          </div>

          {
                                Object.keys(pageDwells).length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {Object.entries(pageDwells).map(([page, sec]) => {
                                      const pct = Math.min(100, Math.round((sec / maxDwell) * 100));
                                      return (
                                        <div key={page} style={{ background: '#F8F9FA', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ECEEEF' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: 600, color: '#0A0A0C', textTransform: 'capitalize' }}>
                                              Page: /{page}
                                            </span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                                              {formatSeconds(sec)}
                                            </span>
                                          </div>
                                          {/* Visual Progress Bar */}
                                          <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #3b82f6)', borderRadius: '999px' }}></div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Telemetry dwell metrics accumulating as customer navigates storefront...
                                  </div>
                                )
                              }
        </div>

                          {/* OPTION 2: Cart Add/Remove & Funnel Telemetry */}
                          <div className="crm-detail-panel">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="9" cy="21" r="1"></circle>
                                  <circle cx="20" cy="21" r="1"></circle>
                                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                2. Cart Funnel &amp; Drop-Off Journey
                              </h3>
                              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                                Stage: {analytics?.funnel_stage || 'Browsing'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {analytics?.cart_dropoffs && analytics.cart_dropoffs.length > 0 ? (
                                analytics.cart_dropoffs.map((evt, idx) => {
                                  const isAdded = evt.action === 'added_to_cart';
                                  const isRemoved = evt.action === 'removed_from_cart';
                                  const isBilling = evt.action === 'entered_billing_page';

                                  return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: isRemoved ? '#FEF2F2' : isBilling ? '#F0FDF4' : '#EFF6FF',
                      border: `1px solid ${isRemoved ? '#FCA5A5' : isBilling ? '#86EFAC' : '#BFDBFE'}`,
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: isRemoved ? '#DC2626' : isBilling ? '#16A34A' : '#2563eb' }}>
                      {isAdded && 'Added to Cart:'}
                      {isRemoved && 'Removed from Cart:'}
                      {isBilling && 'Reached Billing Checkout:'}
                    </div>
                    <div style={{ flex: 1, color: '#334155', fontWeight: 500 }}>
                      {evt.product_title || (isBilling ? `${evt.items_count} items in cart ready for checkout` : 'Asset')}
                    </div>
                    {
                                    evt.price && (
                                      <span style={{ fontWeight: 700, color: '#0F172A' }}>Rs {evt.price}</span>
                                    )
                                  }
                  </div>
                            );
              })
                            ) : (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              No cart drop-offs logged yet. User is currently at stage: <strong>{analytics?.funnel_stage || 'Browsing'}</strong>
                            </div>
            )}
                          </div>
                        </div>

      </div>

                    {/* OPTION 3 & 4: Purchased Products Catalog Management with Revoke Button */}
                    <div className="crm-detail-panel" style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                              <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            3 &amp; 4. Purchased Products &amp; Access Revocation Control
                          </h3>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Admin can revoke any purchased asset. A mandatory revocation reason must be provided and logged.
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#8b5cf6' }}>
                          Total Purchased: {analytics?.purchased_products?.length || 0} Assets
                        </div>
                      </div>

                      {analytics?.purchased_products && analytics.purchased_products.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '0.75rem 0.5rem' }}>Asset</th>
                                <th style={{ padding: '0.75rem 0.5rem' }}>License Key</th>
                                <th style={{ padding: '0.75rem 0.5rem' }}>Purchased On</th>
                                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.purchased_products.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9', background: item.is_revoked ? '#FFF5F5' : 'transparent' }}>
                                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: '#0F172A' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      {item.image_url ? (
                                        <img src={item.image_url} alt={item.title} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                                      ) : (
                                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                                        </div>
                                      )}
                                      <div>
                                        <div>{item.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>ID: {item.product_id || item.id}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.85rem 0.5rem', fontFamily: 'monospace', color: '#2563EB', fontSize: '0.8rem' }}>
                                    {item.license_key}
                                  </td>
                                  <td style={{ padding: '0.85rem 0.5rem', color: '#64748B' }}>
                                    {new Date(item.purchased_at).toLocaleDateString()}
                                  </td>
                                  <td style={{ padding: '0.85rem 0.5rem' }}>
                                    {item.is_revoked ? (
                                      <div>
                                        <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                                          REVOKED / CANCELLED
                                        </span>
                                        <div style={{ fontSize: '0.75rem', color: '#B91C1C', marginTop: '0.2rem' }}>
                                          Reason: {item.revocation_reason}
                                        </div>
                                      </div>
                                    ) : (
                                      <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                                        ACTIVE / ACCESSIBLE
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                                    {item.is_revoked ? (
                                      <button
                                        onClick={() => handleRestoreProduct(item.id)}
                                        style={{ padding: '0.4rem 0.75rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                      >
                                        Restore Access
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setRevokeItem(item);
                                          setRevokeReason('');
                                        }}
                                        style={{ padding: '0.4rem 0.75rem', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                      >
                                        Revoke Access
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          This customer has not purchased any standalone 3D architecture assets yet.
                        </div>
                      )}
                    </div>

                    {/* MODAL: Revoke Product Access Confirmation with Mandatory Reason */}
                    {revokeItem && (
                      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
                        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                          <h3 style={{ margin: '0 0 0.5rem 0', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            Revoke Product Access
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1rem 0' }}>
                            You are revoking customer access to <strong>{revokeItem.title}</strong>. Please provide a clear explanation for this action.
                          </p>

                          <form onSubmit={handleConfirmRevoke}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.35rem' }}>
                              Revocation Reason (Mandatory):
                            </label>
                            <textarea
                              value={revokeReason}
                              onChange={(e) => setRevokeReason(e.target.value)}
                              placeholder="e.g., Refund issued, Payment dispute, License term violation, Inadvertent grant..."
                              required
                              rows={3}
                              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', marginBottom: '1rem', boxSizing: 'border-box' }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                              <button
                                type="button"
                                onClick={() => setRevokeItem(null)}
                                disabled={isRevoking}
                                style={{ padding: '0.5rem 1rem', background: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isRevoking}
                                style={{ padding: '0.5rem 1.25rem', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                              >
                                {isRevoking ? 'Revoking...' : 'Confirm Revocation'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* MODAL: Option 5 - Direct Email Sender */}
                    {showEmailModal && (
                      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
                        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', maxWidth: '540px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0A0A0C' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                              5. Send Direct Email to Customer
                            </h3>
                            <button onClick={() => setShowEmailModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}>&times;</button>
                          </div>

                            {emailNotice && (
                              <div style={{ background: '#DCFCE7', color: '#166534', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                                {emailNotice}
                              </div>
                            )}

                            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', color: '#475569' }}>
                              Recipient: <strong style={{ color: '#0F172A' }}>{customer.name || customer.username} &lt;{customer.email}&gt;</strong>
                            </div>

                                  <form onSubmit={handleSendEmail}>
                                    <div style={{ marginBottom: '1rem' }}>
                                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.35rem' }}>
                                        Email Subject:
                                      </label>
                                      <input
                                        type="text"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder="e.g. Update regarding your 3D Asset Order / Support Notice"
                                        required
                                        style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                      />
                                    </div>

                                      <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.35rem' }}>
                                          Message Body:
                                        </label>
                                        <textarea
                                          value={emailMessage}
                                          onChange={(e) => setEmailMessage(e.target.value)}
                                          placeholder="Write your direct email message here..."
                                          required
                                          rows={6}
                                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                        />
                                      </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                          <button
                                            type="button"
                                            onClick={() => setShowEmailModal(false)}
                                            disabled={isSendingEmail}
                                            style={{ padding: '0.5rem 1rem', background: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="submit"
                                            disabled={isSendingEmail}
                                            style={{ padding: '0.5rem 1.25rem', background: '#0A0A0C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                                          >
                                            {isSendingEmail ? 'Dispatching...' : 'Send Email Now'}
                                          </button>
                                        </div>
                                  </form>
                                </div>
                              </div>
      )}

                        </div>
                        );
}
