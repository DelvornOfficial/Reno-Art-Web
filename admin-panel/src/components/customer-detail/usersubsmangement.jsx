import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api';

export default function UserSubsManagement({ customer, onBack, onCustomerUpdated }) {
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState('tier_2');
  const [durationDays, setDurationDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('info'); // 'success' | 'error' | 'info'
  const [customerData, setCustomerData] = useState(customer);

  // Load tiers & fresh customer details
  const loadData = async () => {
    try {
      const [tiersRes, userRes] = await Promise.all([
        fetch(`${API_BASE_URL}/subscriptions/`),
        fetch(`${API_BASE_URL}/customers/${customer.id}/analytics`)
      ]);
      if (tiersRes.ok) {
        const tiersJson = await tiersRes.json();
        if (Array.isArray(tiersJson)) setTiers(tiersJson);
      }
      if (userRes.ok) {
        const userJson = await userRes.json();
        setCustomerData(userJson);
      }
    } catch (err) {
      console.warn('Failed loading subs management data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [customer.id]);

  const handleAction = async (actionType) => {
    try {
      setLoading(true);
      setStatusMessage(null);

      let payload = { action: actionType };
      if (actionType === 'assign') {
        payload.plan = 'premium';
        payload.tier_id = selectedTier;
        payload.duration_days = parseInt(durationDays, 10) || 30;
      } else if (actionType === 'block') {
        payload.plan = 'blocked';
      } else if (actionType === 'delete') {
        payload.plan = 'normal';
      }

      const res = await fetch(`${API_BASE_URL}/customers/${customer.id}/toggle-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to update subscription status');
      }

      const updated = await res.json();
      await loadData();
      if (onCustomerUpdated) onCustomerUpdated();

      if (actionType === 'assign') {
        setStatusMessage(`Successfully assigned ${selectedTier} plan to customer for ${durationDays} days!`);
        setStatusType('success');
      } else if (actionType === 'block') {
        setStatusMessage('Subscription has been blocked and customer privileges are frozen.');
        setStatusType('error');
      } else if (actionType === 'delete') {
        setStatusMessage('Subscription was deleted. Customer returned to Standard Free tier.');
        setStatusType('info');
      }
    } catch (err) {
      setStatusMessage(err.message || 'Action failed');
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = (customerData?.plan || '').toLowerCase();
  const subTierId = customerData?.subscription_tier_id;
  const isBlocked = subTierId === 'blocked';
  const isVIP = (currentPlan === 'premium' || currentPlan === 'pro' || currentPlan.includes('premium')) && !isBlocked;

  const currentTierObj = tiers.find(t => t.id === subTierId);

  return (
    <div className="crm-detail-content" style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem' }}>
      {/* Top back navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '0.6rem 1.15rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: '#0F172A',
            cursor: 'pointer'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Customer Details
        </button>

        <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
          User ID: #{customer.id} | {customer.email}
        </span>
      </div>

      {/* Header card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
                Subscription Management
              </h2>
              <span
                style={{
                  fontSize: '0.775rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  background: isBlocked ? '#FEE2E2' : (isVIP ? '#ECFDF5' : '#F1F5F9'),
                  color: isBlocked ? '#991B1B' : (isVIP ? '#065F46' : '#475569'),
                  letterSpacing: '0.04em'
                }}
              >
                {isBlocked ? 'STATUS: BLOCKED' : (isVIP ? 'STATUS: ACTIVE VIP' : 'STATUS: FREE MEMBER')}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
              Customer: <strong style={{ color: '#0F172A' }}>{customerData.name || customerData.username || 'User'}</strong> ({customerData.email})
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Active Tier Plan</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isVIP ? '#059669' : '#0F172A' }}>
              {isVIP ? (currentTierObj ? currentTierObj.name : 'Pro Architect Tier') : (isBlocked ? 'Blocked Access' : 'Standard Free')}
            </div>
          </div>
        </div>

        {/* Status notification banner */}
        {statusMessage && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1.15rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: statusType === 'success' ? '#ECFDF5' : (statusType === 'error' ? '#FEF2F2' : '#EFF6FF'),
              color: statusType === 'success' ? '#065F46' : (statusType === 'error' ? '#991B1B' : '#1E40AF'),
              border: `1px solid ${statusType === 'success' ? '#A7F3D0' : (statusType === 'error' ? '#FECACA' : '#BFDBFE')}`
            }}
          >
            {statusMessage}
          </div>
        )}
      </div>

      {/* Main control panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Panel 1: Assign / Upgrade Plan */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
            Assign / Activate VIP Plan
          </h3>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.825rem', color: '#64748B', lineHeight: 1.5 }}>
            Select an architectural subscription tier and duration to grant instant VIP checkout discounts and CAD asset benefits.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              Subscription Tier:
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0F172A',
                background: '#F8FAFC'
              }}
            >
              {tiers.length > 0 ? (
                tiers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Rs {t.price}/month - {t.discount_percent}% Discount)
                  </option>
                ))
              ) : (
                <>
                  <option value="tier_1">Starter Studio (Rs 299/month - 10% Discount)</option>
                  <option value="tier_2">Pro Architect (Rs 699/month - 20% Discount)</option>
                  <option value="tier_3">Master VIP Studio (Rs 1,499/month - 35% Discount)</option>
                </>
              )}
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              Duration (Days):
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0F172A',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction('assign')}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
            }}
          >
            {loading ? 'Processing...' : (isVIP ? 'Renew / Update VIP Plan' : 'Assign VIP Plan to User')}
          </button>
        </div>

        {/* Panel 2: Block & Delete Controls */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              Suspend / Reset Access
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.825rem', color: '#64748B', lineHeight: 1.5 }}>
              Manage access restrictions, temporarily halt member privileges, or remove subscription completely.
            </p>

            {/* Block option */}
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#991B1B', marginBottom: '0.25rem' }}>
                Block Subscription
              </div>
              <div style={{ fontSize: '0.775rem', color: '#7F1D1D', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                Freezes account privileges instantly without deleting history. Member coupons and CAD benefits will be disabled.
              </div>
              <button
                type="button"
                disabled={loading || isBlocked}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to BLOCK subscription for ${customer.email}?`)) {
                    handleAction('block');
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #DC2626',
                  background: isBlocked ? '#E2E8F0' : '#DC2626',
                  color: isBlocked ? '#64748B' : '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: isBlocked ? 'not-allowed' : 'pointer'
                }}
              >
                {isBlocked ? 'Already Blocked' : 'Block User Subscription'}
              </button>
            </div>

            {/* Delete option */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#334155', marginBottom: '0.25rem' }}>
                Delete / Clear Subscription
              </div>
              <div style={{ fontSize: '0.775rem', color: '#64748B', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                Removes subscription tier and unassigns plan, resetting customer to normal Free Member.
              </div>
              <button
                type="button"
                disabled={loading || (!isVIP && !isBlocked)}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to DELETE subscription for ${customer.email}?`)) {
                    handleAction('delete');
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: (!isVIP && !isBlocked) ? 'not-allowed' : 'pointer'
                }}
              >
                Delete Subscription
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Subscription Information / Timestamps */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 800, color: '#334155' }}>
          Customer Telemetry Details:
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: '#64748B', display: 'block' }}>Account Email:</span>
            <strong style={{ color: '#0F172A' }}>{customerData.email}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block' }}>Active Plan Tier:</span>
            <strong style={{ color: '#0F172A' }}>{customerData.subscription_tier_id || 'None (Free)'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block' }}>Expires At:</span>
            <strong style={{ color: '#0F172A' }}>
              {customerData.subscription_expires_at ? new Date(customerData.subscription_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
