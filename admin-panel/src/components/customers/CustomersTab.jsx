import React from 'react';
import './CustomersTab.css';

export default function CustomersTab({ customers, onSelectCustomer }) {
  return (
    <div className="crm-customers-content">
      <div className="crm-banner">
        <div>
          <h2>Customer Directory &amp; Realtime Telemetry</h2>
          <p>Inspect registered architects, active shopping carts, browsing dwell times, and studio memberships.</p>
        </div>
      </div>

      <div className="crm-customers-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Registered Users ({customers.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Click any customer row to inspect session telemetry in a dedicated view
          </span>
        </div>

        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name / Email</th>
                <th>Membership</th>
                <th>Cart Status</th>
                <th>Current Page</th>
                <th>Time on Site</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => {
                const totalMins = Math.floor((cust.time_spent_seconds || 0) / 60);
                const totalSecs = (cust.time_spent_seconds || 0) % 60;
                const timeFormatted = `${totalMins}m ${totalSecs}s`;

                return (
                  <tr
                    key={cust.id}
                    className="crm-customers-row"
                    onClick={() => onSelectCustomer(cust)}
                  >
                    <td>
                      {cust.profile_image ? (
                        <img
                          src={cust.profile_image}
                          alt={cust.name}
                          className="crm-customer-avatar"
                        />
                      ) : (
                        <div className="crm-customer-avatar-fallback">
                          {(cust.name || cust.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cust.name || 'Anonymous Architect'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cust.email}</div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: cust.is_member ? '#ECFDF5' : '#F4F1EA',
                          color: cust.is_member ? '#065F46' : '#6B6861',
                          border: `1px solid ${cust.is_member ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 104, 97, 0.2)'}`
                        }}
                      >
                        {cust.is_member ? 'Studio Member' : 'Standard'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: cust.cart_items_count > 0 ? '#2563eb' : 'var(--text-muted)' }}>
                        {cust.cart_items_count} item{cust.cart_items_count === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {cust.current_page || 'home'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{timeFormatted}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCustomer(cust);
                        }}
                        className="crm-cust-btn-view"
                      >
                        View Details &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No customer sessions registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
