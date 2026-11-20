import React from 'react';
import './OrdersTab.css';

export default function OrdersTab({ orders }) {
  return (
    <div className="crm-orders-content">
      <div className="crm-banner">
        <div>
          <h2>Orders &amp; Payment Verification</h2>
          <p>Real-time gateway transactions and digital CAD license generation.</p>
        </div>
      </div>

      <div className="crm-orders-panel">
        <h3>All Customer Orders ({orders.length})</h3>
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Purchaser</th>
                <th>Asset Acquired</th>
                <th>Transaction Amount</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', color: '#2563eb' }}>{order.id}</td>
                  <td style={{ fontWeight: 600 }}>{order.customer}</td>
                  <td>{order.item}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{order.amount}</td>
                  <td>
                    <span className={`badge ${order.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No customer orders found.
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
