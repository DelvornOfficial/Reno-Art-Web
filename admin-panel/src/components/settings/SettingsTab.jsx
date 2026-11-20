import React from 'react';
import './SettingsTab.css';
import { API_BASE_URL } from '../../services/api';

export default function SettingsTab({ adminUser }) {
  return (
    <div className="crm-settings-content">
      <div className="crm-banner">
        <div>
          <h2>Platform Configuration &amp; Endpoints</h2>
          <p>System runtime settings, WebSocket connectivity, and database routing.</p>
        </div>
      </div>

      <div className="crm-settings-grid">
        <div className="crm-settings-panel">
          <h3>Active Administrator Session</h3>
          <div className="crm-settings-list">
            <div>
              Username: <strong style={{ color: 'var(--text-main)' }}>{adminUser?.username || 'admin'}</strong>
            </div>
            <div>
              Role: <strong style={{ color: '#10B981' }}>Super Admin (Reno Design Studio)</strong>
            </div>
            <div>
              Access Scope: <strong style={{ color: 'var(--text-main)' }}>PostgreSQL Full Read/Write &amp; Realtime Broadcast</strong>
            </div>
          </div>
        </div>

        <div className="crm-settings-panel">
          <h3>Database &amp; API Status</h3>
          <div className="crm-settings-list">
            <div>
              API Base URL: <code style={{ color: '#2563eb' }}>{API_BASE_URL}</code>
            </div>
            <div>
              PostgreSQL Service: <strong style={{ color: '#10B981' }}>Connected (localhost:5432/renodesign_db)</strong>
            </div>
            <div>
              WebSocket State: <strong style={{ color: '#10B981' }}>Broadcasting Realtime Live</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
