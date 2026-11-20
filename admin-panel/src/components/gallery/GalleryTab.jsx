import React, { useState, useEffect } from 'react';
import './GalleryTab.css';

export function GalleryTab({ onSelectImage, selectable = false, filterType = 'all' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(filterType);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('product_image');
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:1002/api/v1/gallery/');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.warn('Failed to fetch gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this media item?')) return;
    try {
      const res = await fetch(`http://localhost:1002/api/v1/gallery/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      alert('Failed to delete media item.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result;
      setUploading(true);
      try {
        const res = await fetch('http://localhost:1002/api/v1/gallery/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: uploadTitle.trim() || file.name,
            url: base64Url,
            media_type: uploadType
          })
        });
        if (res.ok) {
          const newItem = await res.json();
          setItems(prev => [newItem, ...prev]);
          setUploadTitle('');
        }
      } catch (err) {
        alert('Upload failed.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filter items. IMPORTANT: When selecting for products, user_profile is ALWAYS excluded!
  const filteredItems = items.filter(item => {
    if (selectable && item.media_type === 'user_profile') {
      return false; // User profiles cannot be selected for products
    }
    if (activeFilter === 'all') return true;
    return item.media_type === activeFilter;
  });

  return (
    <div className="crm-gallery-page">
      <div className="crm-gallery-header">
        <div>
          <h2 className="crm-gallery-title">Central Media Gallery</h2>
          <p className="crm-gallery-desc">
            Central repository for all system assets: product 3D images, description renders, user avatars, and media files.
          </p>
        </div>

        {/* Upload widget in CRM */}
        <div className="crm-gallery-upload-card">
          <input
            type="text"
            placeholder="Asset title (optional)"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            className="crm-gallery-title-input"
          />
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
            className="crm-gallery-type-select"
          >
            <option value="product_image">Product Image</option>
            <option value="description_image">Description / Spec Image</option>
            <option value="video">Video Asset</option>
          </select>
          <label className="crm-gallery-upload-btn">
            {uploading ? 'Uploading...' : '+ Upload Asset'}
            <input
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="crm-gallery-filters">
        <button
          type="button"
          className={`crm-gallery-pill ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All Assets ({items.length})
        </button>
        <button
          type="button"
          className={`crm-gallery-pill ${activeFilter === 'product_image' ? 'active' : ''}`}
          onClick={() => setActiveFilter('product_image')}
        >
          Product Images ({items.filter(i => i.media_type === 'product_image').length})
        </button>
        <button
          type="button"
          className={`crm-gallery-pill ${activeFilter === 'description_image' ? 'active' : ''}`}
          onClick={() => setActiveFilter('description_image')}
        >
          Description Renders ({items.filter(i => i.media_type === 'description_image').length})
        </button>
        {!selectable && (
          <button
            type="button"
            className={`crm-gallery-pill ${activeFilter === 'user_profile' ? 'active' : ''}`}
            onClick={() => setActiveFilter('user_profile')}
          >
            User Profiles ({items.filter(i => i.media_type === 'user_profile').length})
          </button>
        )}
      </div>

      {/* Grid of media */}
      {loading ? (
        <div className="crm-gallery-loading">Loading media assets...</div>
      ) : filteredItems.length === 0 ? (
        <div className="crm-gallery-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p>No media files found in this category.</p>
        </div>
      ) : (
        <div className="crm-gallery-grid">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`crm-gallery-card ${selectable ? 'selectable' : ''}`}
              onClick={() => {
                if (selectable && onSelectImage) {
                  onSelectImage(item.url);
                } else {
                  setPreviewItem(item);
                }
              }}
            >
              <div className="crm-gallery-thumb-wrap">
                <img src={item.url} alt={item.title || 'Media'} className="crm-gallery-img" />
                <span className={`crm-gallery-badge badge-${item.media_type}`}>
                  {item.media_type === 'product_image' ? 'Product' : item.media_type === 'description_image' ? 'Spec' : item.media_type === 'user_profile' ? 'Profile' : 'Video'}
                </span>
                {!selectable && (
                  <button
                    type="button"
                    className="crm-gallery-del-btn"
                    onClick={(e) => handleDelete(item.id, e)}
                    title="Delete permanently"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="crm-gallery-card-info">
                <div className="crm-gallery-card-title">{item.title || 'Untitled Asset'}</div>
                <div className="crm-gallery-card-date">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
              {selectable && (
                <div className="crm-gallery-select-action">
                  <span>Click to Select</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {previewItem && (
        <div className="crm-gallery-modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="crm-gallery-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="crm-gallery-modal-close"
              onClick={() => setPreviewItem(null)}
            >
              ✕
            </button>
            <img src={previewItem.url} alt={previewItem.title} className="crm-gallery-modal-img" />
            <div className="crm-gallery-modal-meta">
              <h4>{previewItem.title || 'Asset Preview'}</h4>
              <p>Type: {previewItem.media_type} &bull; Uploaded on {new Date(previewItem.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryTab;
