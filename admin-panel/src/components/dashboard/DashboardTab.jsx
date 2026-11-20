import React from 'react';
import './DashboardTab.css';

export default function DashboardTab({ stats, orders, onSyncPostgreSql, syncSuccess }) {
  return (
    <div className="crm-dashboard-content">
      <div className="crm-banner">
        <div>
          <h2>Architectural Catalog &amp; Revenue Metrics</h2>
          <p>Real-time analytics synced across Reno Design global endpoints.</p>
        </div>
        <button
          className="crm-button-sync"
          onClick={onSyncPostgreSql}
          style={{
            borderColor: syncSuccess ? 'rgba(16, 185, 129, 0.4)' : undefined,
            color: syncSuccess ? '#10B981' : undefined
          }}
        >
          {syncSuccess ? 'PostgreSQL Synced Live' : 'Sync Live Data'}
        </button>
      </div>

      <div className="crm-dashboard-grid">
        <div className="crm-stat-card">
          <div className="crm-stat-label">Total Revenue (PostgreSQL)</div>
          <div className="crm-stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-label">Live CNC/CAD Models</div>
          <div className="crm-stat-value">{stats.totalProducts}</div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-label">Architectural Categories</div>
          <div className="crm-stat-value">{stats.categoriesCount}</div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-label">Total Completed Orders</div>
          <div className="crm-stat-value">{stats.totalOrders}</div>
        </div>
      </div>

      <div className="crm-dashboard-panel">
        <h3>Recent Customer Orders &amp; Licenses</h3>
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Client</th>
                <th>CAD Asset</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', color: '#2563eb' }}>{order.id}</td>
                  <td style={{ fontWeight: 600 }}>{order.customer}</td>
                  <td>{order.item}</td>
                  <td style={{ fontWeight: 700, color: '#0A0A0C' }}>₹{order.amount}</td>
                  <td>
                    <span className={`badge ${order.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6B6861' }}>
                    No customer orders recorded yet.
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
