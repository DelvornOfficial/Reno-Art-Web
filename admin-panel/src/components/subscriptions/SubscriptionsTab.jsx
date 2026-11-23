import React, { useState, useEffect } from 'react';
import './SubscriptionsTab.css';

export default function SubscriptionsTab({
  tiers = [],
  onSaveTiers,
  isSaving = false,
  saveSuccess = false
}) {
  const [localTiers, setLocalTiers] = useState(() => (Array.isArray(tiers) && tiers.length > 0 ? JSON.parse(JSON.stringify(tiers)) : []));

  useEffect(() => {
    if (Array.isArray(tiers) && tiers.length > 0) {
      setLocalTiers(JSON.parse(JSON.stringify(tiers)));
    }
  }, [tiers]);

  // Handle tier field update
  const handleUpdateField = (tierIndex, field, value) => {
    setLocalTiers((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[tierIndex][field] = value;
      return copy;
    });
  };

  // Handle benefit text update
  const handleUpdateBenefit = (tierIndex, benefitIndex, value) => {
    setLocalTiers((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[tierIndex].benefits[benefitIndex] = value;
      return copy;
    });
  };

  // Add benefit row
  const handleAddBenefit = (tierIndex) => {
    setLocalTiers((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[tierIndex].benefits.push('New custom benefit or exclusive discount privilege');
      return copy;
    });
  };

  // Remove benefit row
  const handleRemoveBenefit = (tierIndex, benefitIndex) => {
    setLocalTiers((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[tierIndex].benefits = copy[tierIndex].benefits.filter((_, idx) => idx !== benefitIndex);
      return copy;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onSaveTiers) {
      onSaveTiers(localTiers);
    }
  };

  return (
    <div className="crm-subscriptions-page">
      <div className="crm-sub-header">
        <div>
          <h2>Membership Tiers &amp; Pricing Management</h2>
          <p>
            Control the 3 live subscription tiers displayed on the website. Set prices, extra shopping discount percentages, and feature benefits in real-time.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {saveSuccess && (
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              ✓ Live Changes Saved &amp; Broadcasted!
            </span>
          )}
          <button
            type="button"
            className="crm-sub-save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Updating Cloud...' : 'Save & Publish Live Tiers'}
          </button>
        </div>
      </div>

      <div className="crm-tiers-grid">
        {localTiers.map((tier, tIdx) => (
          <div key={tier.id || tIdx} className={`crm-tier-card ${tier.highlight ? 'featured' : ''}`}>
            <div className="crm-tier-card-head">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="crm-tier-tag">TIER {tIdx + 1}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!tier.highlight}
                    onChange={(e) => handleUpdateField(tIdx, 'highlight', e.target.checked)}
                  />
                  <span>Highlight (Most Popular)</span>
                </label>
              </div>

              <div className="crm-tier-input-group" style={{ marginTop: '0.75rem' }}>
                <label>Plan Name</label>
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => handleUpdateField(tIdx, 'name', e.target.value)}
                  placeholder="Plan Name"
                  className="crm-tier-text-input"
                />
              </div>

              <div className="crm-tier-input-group">
                <label>Badge Label (Optional)</label>
                <input
                  type="text"
                  value={tier.badge || ''}
                  onChange={(e) => handleUpdateField(tIdx, 'badge', e.target.value)}
                  placeholder="e.g. Most Popular, Entry, VIP"
                  className="crm-tier-text-input"
                />
              </div>
            </div>

            {/* Price & Discount Settings */}
            <div className="crm-tier-pricing-settings">
              <div className="crm-tier-input-group">
                <label>Price (₹ INR / month)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '10px', fontWeight: 700, color: '#6B6861' }}>₹</span>
                  <input
                    type="number"
                    value={tier.price}
                    onChange={(e) => handleUpdateField(tIdx, 'price', parseFloat(e.target.value) || 0)}
                    className="crm-tier-text-input"
                    style={{ paddingLeft: '24px', fontWeight: 800, fontSize: '1.1rem' }}
                  />
                </div>
              </div>

              <div className="crm-tier-input-group">
                <label>Extra Shopping Discount (%)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={tier.discount_percent}
                    onChange={(e) => handleUpdateField(tIdx, 'discount_percent', parseFloat(e.target.value) || 0)}
                    className="crm-tier-text-input"
                    style={{ paddingRight: '28px', fontWeight: 800, fontSize: '1.1rem', color: '#16A34A' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', fontWeight: 800, color: '#16A34A' }}>%</span>
                </div>
              </div>
            </div>

            <div className="crm-tier-input-group" style={{ margin: '0.75rem 0' }}>
              <label>Short Pitch / Description</label>
              <textarea
                rows={2}
                value={tier.description || ''}
                onChange={(e) => handleUpdateField(tIdx, 'description', e.target.value)}
                className="crm-tier-textarea"
                placeholder="Short tagline explaining this plan"
              />
            </div>

            {/* Benefits List */}
            <div className="crm-tier-benefits-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4B5563' }}>
                  Benefits &amp; Features ({tier.benefits?.length || 0})
                </label>
                <button
                  type="button"
                  onClick={() => handleAddBenefit(tIdx)}
                  className="crm-add-benefit-btn"
                >
                  + Add Feature
                </button>
              </div>

              <div className="crm-benefits-rows">
                {(tier.benefits || []).map((ben, bIdx) => (
                  <div key={bIdx} className="crm-benefit-item-row">
                    <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span>
                    <input
                      type="text"
                      value={ben}
                      onChange={(e) => handleUpdateBenefit(tIdx, bIdx, e.target.value)}
                      className="crm-benefit-input"
                      placeholder="Benefit description"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(tIdx, bIdx)}
                      className="crm-benefit-remove-btn"
                      title="Remove benefit"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
