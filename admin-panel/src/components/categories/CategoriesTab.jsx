import React from 'react';
import './CategoriesTab.css';

export default function CategoriesTab({
  categories,
  newCatName,
  setNewCatName,
  onCreateCategory,
  onRemoveCategory
}) {
  return (
    <div className="crm-categories-content">
      <div className="crm-banner">
        <div>
          <h2>Architectural Taxonomy Management</h2>
          <p>Define and categorize 3D files for routing, search discovery, and frontend filters.</p>
        </div>
      </div>

      <div className="crm-categories-layout">
        {/* Create Category Panel */}
        <div className="crm-categories-panel">
          <h3>Add New Category</h3>
          <form onSubmit={onCreateCategory}>
            <div className="crm-cat-form-group">
              <label className="crm-cat-label">Category Name *</label>
              <input
                type="text"
                required
                className="crm-cat-input"
                placeholder="e.g. 3-D Wall, CNC Jali, Mandir"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
            </div>

            <button type="submit" className="crm-cat-btn-create" style={{ width: '100%', marginTop: '0.5rem' }}>
              Create Category
            </button>
          </form>
        </div>

        {/* Existing Categories Table */}
        <div className="crm-categories-panel">
          <h3>Existing Categories ({categories.length})</h3>
          <div className="crm-table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Category ID</th>
                  <th>Category Name</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', color: '#2563eb' }}>{c.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => onRemoveCategory(c.id)}
                        className="crm-cat-btn-delete"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No categories added yet.
                      </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
