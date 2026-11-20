import React from 'react';
import './ProductsTab.css';

export default function ProductsTab({
  products,
  categories,
  onOpenCreateProduct,
  onStartEdit,
  onRemoveProduct,
  deletingProductId = null
}) {
  return (
    <div className="crm-products-content">
      <div className="crm-products-header-banner">
        <div>
          <h2>Architectural 3D &amp; CNC Model Catalog</h2>
          <p>Deploy and edit precision CAD files, live pricing, specifications, and manufacturing formats.</p>
        </div>
        <button
          onClick={onOpenCreateProduct}
          className="crm-btn-add-product"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add New Product</span>
        </button>
      </div>

      {/* Full Width Live Products Database Table */}
      <div className="crm-products-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Live Products Database ({products.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Click Edit on any product to modify full specs in dedicated editor
          </span>
        </div>

        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Category</th>
                <th>Price / MRP</th>
                <th>Purchases</th>
                <th>Formats</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                // Category resolution: try by id or name
                const cat = categories.find((c) => String(c.id) === String(p.category_id || p.category) || c.name === (p.category_id || p.category));
                const categoryLabel = cat ? cat.name : (p.category || p.category_id || '3-D Wall');
                const mrpVal = p.original_price ?? p.mrp;
                const priceVal = p.price;
                const buyersCount = p.purchases_count || 0;

                return (
                  <tr key={p.id}>
                    <td>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.title}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                        />
                      ) : (
                        <div style={{ width: '48px', height: '48px', background: '#F4F1EA', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#6B6861', fontWeight: 700 }}>
                          CAD
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.id}</div>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 700, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                        {categoryLabel}
                      </span>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>₹{priceVal}</div>
                      {mrpVal && (
                        <div style={{ fontSize: '0.78rem', color: '#8E8A80', textDecoration: 'line-through' }}>
                          ₹{mrpVal}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#F4F1EA', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span>{buyersCount} {buyersCount === 1 ? 'buyer' : 'buyers'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.format || 'OBJ / STL / DWG'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => onStartEdit(p)}
                          className="crm-prod-btn-edit"
                          disabled={deletingProductId === p.id}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onRemoveProduct(p.id)}
                          className="crm-prod-btn-delete"
                          disabled={deletingProductId === p.id}
                          style={{
                            opacity: deletingProductId === p.id ? 0.6 : 1,
                            cursor: deletingProductId === p.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {deletingProductId === p.id ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span className="crm-btn-spinner" style={{ width: '10px', height: '10px' }} />
                              Removing...
                            </span>
                          ) : (
                            'Remove'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {
                products.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No products added yet. Click "+ Add New Product" to deploy your first model.
                    </td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
