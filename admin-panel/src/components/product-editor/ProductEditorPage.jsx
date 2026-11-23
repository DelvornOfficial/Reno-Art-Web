import React, { useRef, useState, useEffect } from 'react';
import './ProductEditorPage.css';
import { API_BASE_URL } from '../../services/api';

export default function ProductEditorPage({
  editingProductId,
  productForm,
  setProductForm,
  categories,
  onSubmitProduct,
  onCancel,
  isSubmittingProduct = false
}) {
  const fileInputRef = useRef(null);
  const multiProductInputRef = useRef(null);
  const descImagesInputRef = useRef(null);
  const docFileInputRef = useRef(null);

  const [productImageUrlInput, setProductImageUrlInput] = useState('');
  const [descImageUrlInput, setDescImageUrlInput] = useState('');
  const [docUrlInput, setDocUrlInput] = useState(productForm.pdf_document_url || '');

  // Gallery Picker Modal State
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [gallerySelectTarget, setGallerySelectTarget] = useState('product_images'); // 'product_images' or 'description_images'

  // Normalize product_images array
  const currentProductImages = productForm.product_images || (productForm.image_url ? [productForm.image_url] : []);
  const currentDescImages = productForm.description_images || productForm.gallery_images || [];

  // Sync to backend gallery automatically
  const saveToGalleryTable = async (title, url, mediaType) => {
    try {
        await fetch(`${API_BASE_URL}/gallery/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            url,
            media_type: mediaType
          })
        });
      } catch (e) {
        // quiet fail
      }
    };

    // 1. Multiple Product Images (OBJ / CAD 3D Renders)
    const handleMultipleProductUpload = (e) => {
      const files = Array.from(e.target.files);
      if (!files || files.length === 0) return;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const url = uploadEvent.target.result;
          setProductForm((prev) => {
            const list = [...(prev.product_images || (prev.image_url ? [prev.image_url] : [])), url];
            return {
              ...prev,
              product_images: list,
              image_url: prev.image_url || url
            };
          });
          saveToGalleryTable(`${productForm.title || 'Product'} - 3D Angle`, url, 'product_image');
        };
        reader.readAsDataURL(file);
      });
    };

    const handleAddProductImageUrl = () => {
      if (!productImageUrlInput.trim()) return;
      const url = productImageUrlInput.trim();
      setProductForm((prev) => {
        const list = [...(prev.product_images || (prev.image_url ? [prev.image_url] : [])), url];
        return {
          ...prev,
          product_images: list,
          image_url: prev.image_url || url
        };
      });
      saveToGalleryTable(`${productForm.title || 'Product'} - 3D View`, url, 'product_image');
      setProductImageUrlInput('');
    };

    const handleRemoveProductImage = (index) => {
      setProductForm((prev) => {
        const list = (prev.product_images || []).filter((_, idx) => idx !== index);
        return {
          ...prev,
          product_images: list,
          image_url: list.length > 0 ? list[0] : ''
        };
      });
    };

    // 2. Multiple Description / Spec Images (Strictly separated from product images)
    const handleMultipleDescUpload = (e) => {
      const files = Array.from(e.target.files);
      if (!files || files.length === 0) return;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const url = uploadEvent.target.result;
          setProductForm((prev) => ({
            ...prev,
            description_images: [...(prev.description_images || prev.gallery_images || []), url],
            gallery_images: [...(prev.gallery_images || []), url]
          }));
          saveToGalleryTable(`${productForm.title || 'Product'} - Spec Sheet`, url, 'description_image');
        };
        reader.readAsDataURL(file);
      });
    };

    const handleAddDescImageUrl = () => {
      if (!descImageUrlInput.trim()) return;
      const url = descImageUrlInput.trim();
      setProductForm((prev) => ({
        ...prev,
        description_images: [...(prev.description_images || prev.gallery_images || []), url],
        gallery_images: [...(prev.gallery_images || []), url]
      }));
      saveToGalleryTable(`${productForm.title || 'Product'} - Detail Render`, url, 'description_image');
      setDescImageUrlInput('');
    };

    const handleRemoveDescImage = (index) => {
      setProductForm((prev) => {
        const list = (prev.description_images || prev.gallery_images || []).filter((_, idx) => idx !== index);
        return {
          ...prev,
          description_images: list,
          gallery_images: list
        };
      });
    };

    // 3. Document / PDF / Docs Upload & Link Attachment
    const handleDocFileUpload = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target.result;
        setProductForm((prev) => ({
          ...prev,
          pdf_document_url: dataUrl,
          document_name: file.name
        }));
        setDocUrlInput(file.name);
      };
      reader.readAsDataURL(file);
    };

    const handleApplyDocUrl = () => {
      if (!docUrlInput.trim()) return;
      const url = docUrlInput.trim();
      const inferredName = url.split('/').pop().split('?')[0] || 'Technical_Documentation.pdf';
      setProductForm((prev) => ({
        ...prev,
        pdf_document_url: url,
        document_name: prev.document_name || inferredName
      }));
    };

    const handleRemoveDocument = () => {
      setProductForm((prev) => ({
        ...prev,
        pdf_document_url: '',
        document_name: ''
      }));
      setDocUrlInput('');
      if (docFileInputRef.current) docFileInputRef.current.value = '';
    };

    // Handle selection from Media Gallery modal
    const handleSelectFromGallery = (selectedUrl) => {
      if (gallerySelectTarget === 'product_images') {
        setProductForm((prev) => {
          const list = [...(prev.product_images || (prev.image_url ? [prev.image_url] : [])), selectedUrl];
          return {
            ...prev,
            product_images: list,
            image_url: prev.image_url || selectedUrl
          };
        });
      } else {
        setProductForm((prev) => ({
          ...prev,
          description_images: [...(prev.description_images || prev.gallery_images || []), selectedUrl],
          gallery_images: [...(prev.gallery_images || []), selectedUrl]
        }));
      }
      setGalleryModalOpen(false);
    };

    // Ensure custom_specs is an array
    const specs = productForm.custom_specs && productForm.custom_specs.length > 0
      ? productForm.custom_specs
      : [
        { key: 'Included Formats', value: productForm.format || 'OBJ / STL / DWG' },
        { key: 'Mesh Topology', value: productForm.mesh_topology || 'Closed Manifold / Slicer Optimized' },
        { key: 'Machine Compatibility', value: productForm.machine_compatibility || '3-Axis CNC Router, 5-Axis Stone Mill, 3D Printer, Fiber Laser' },
        { key: 'Supported CAM', value: productForm.supported_cam || 'ArtCAM, Vectric Aspire, Fusion 360, RhinoCAM, AutoCAD' },
        { key: 'Commercial License', value: productForm.commercial_license || 'Unlimited Physical Fabrication – Royalty-Free' }
      ];

    const handleSpecChange = (index, field, newValue) => {
      const updated = [...specs];
      updated[index] = { ...updated[index], [field]: newValue };

      const syncObj = { custom_specs: updated };
      if (index === 0 && field === 'value') syncObj.format = newValue;
      if (index === 1 && field === 'value') syncObj.mesh_topology = newValue;
      if (index === 2 && field === 'value') syncObj.machine_compatibility = newValue;
      if (index === 3 && field === 'value') syncObj.supported_cam = newValue;
      if (index === 4 && field === 'value') syncObj.commercial_license = newValue;

      setProductForm((prev) => ({ ...prev, ...syncObj }));
    };

    const handleAddSpecRow = () => {
      const updated = [...specs, { key: 'Custom Specification', value: 'Specification Details' }];
      setProductForm((prev) => ({ ...prev, custom_specs: updated }));
    };

    const handleRemoveSpecRow = (index) => {
      const updated = specs.filter((_, i) => i !== index);
      setProductForm((prev) => ({ ...prev, custom_specs: updated }));
    };

    return (
      <div className="crm-product-editor-page">
        <div className="crm-editor-container">
          {/* Header Bar */}
          <div className="crm-editor-header">
            <div>
              <h1 className="crm-editor-title">
                {editingProductId ? 'Edit Product Details' : 'Create New CAD Product'}
              </h1>
              <p className="crm-editor-subtitle">
                Configure manufacturing toolpaths, pricing, CAD geometry, and live product specifications.
              </p>
            </div>
            <div className="crm-editor-header-actions">
              <button
                type="button"
                className="crm-btn-cancel"
                onClick={onCancel}
                disabled={isSubmittingProduct}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="crm-product-editor-form"
                className="crm-btn-save"
                disabled={isSubmittingProduct}
              >
                {isSubmittingProduct ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="crm-btn-spinner" />
                    Saving Product...
                  </span>
                ) : (
                  editingProductId ? 'Update & Deploy Product' : 'Publish Product to Storefront'
                )}
              </button>
            </div>
          </div>

          {/* Main Editor Form */}
          <form
            id="crm-product-editor-form"
            className="crm-editor-form-card"
            onSubmit={onSubmitProduct}
          >
            {/* Row 1: Title & Category */}
            <div className="crm-editor-grid-2">
              <div className="crm-editor-form-group">
                <label className="crm-editor-label">Product Title / Model Name *</label>
                <input
                  type="text"
                  required
                  className="crm-editor-input"
                  placeholder="e.g. Neo-Classical Corbel CNC Model"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                />
              </div>

              <div className="crm-editor-form-group">
                <label className="crm-editor-label">Category (Choose from added categories) *</label>
                <select
                  required
                  className="crm-editor-select"
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: MRP & Selling Price */}
            <div className="crm-editor-grid-2">
              <div className="crm-editor-form-group">
                <label className="crm-editor-label">Product MRP (₹ Original Price)</label>
                <input
                  type="number"
                  className="crm-editor-input"
                  placeholder="2499"
                  value={productForm.mrp}
                  onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                />
              </div>

              <div className="crm-editor-form-group">
                <label className="crm-editor-label">Product Price (₹ Selling Price) *</label>
                <input
                  type="number"
                  required
                  className="crm-editor-input"
                  placeholder="1299"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Description */}
            <div className="crm-editor-form-group">
              <label className="crm-editor-label">Product Description</label>
              <textarea
                rows="3"
                className="crm-editor-textarea"
                placeholder="Detailed description of geometry, dimensions, material density, and finish specifications..."
                value={productForm.short_description}
                onChange={(e) => setProductForm({ ...productForm, short_description: e.target.value })}
              />
            </div>

            {/* SECTION A: Product Images (Multiple 3D Angles for Stage/Carousel) */}
            <div className="crm-editor-form-group" style={{ marginTop: '1.5rem', background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <label className="crm-editor-label" style={{ margin: 0 }}>
                    Product Images (Top Stage &amp; Multi-angle Views)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0.2rem 0 0 0' }}>
                    These images display in the 3D model carousel stage. Multiple angles allowed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGallerySelectTarget('product_images');
                    setGalleryModalOpen(true);
                  }}
                  style={{
                    background: '#F3F4F6',
                    color: '#111827',
                    border: '1px solid #D1D5DB',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Select from Media Gallery
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={multiProductInputRef}
                  onChange={handleMultipleProductUpload}
                  style={{
                    width: '100%',
                    background: '#F9FAFB',
                    border: '1px dashed #D1D5DB',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="crm-editor-input"
                    placeholder="Or paste image URL and click Add"
                    value={productImageUrlInput}
                    onChange={(e) => setProductImageUrlInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddProductImageUrl}
                    style={{
                      background: '#111827',
                      color: '#fff',
                      border: 'none',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Add View
                  </button>
                </div>

                {/* Product Images Thumbnails Grid */}
                {currentProductImages.length > 0 && (
                  <div className="crm-gallery-preview-grid" style={{ marginTop: '0.5rem' }}>
                    {currentProductImages.map((imgSrc, idx) => (
                      <div key={idx} className="crm-gallery-preview-item" style={{ position: 'relative' }}>
                        <img src={imgSrc} alt={`Angle ${idx + 1}`} />
                        <span style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '4px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#FFF',
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          {idx === 0 ? 'Cover' : `Angle ${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProductImage(idx)}
                          className="crm-gallery-remove-btn"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION B: Description Images (Strictly Reference Renders & Detail Views) */}
            <div className="crm-editor-form-group" style={{ marginTop: '1.5rem', background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <label className="crm-editor-label" style={{ margin: 0 }}>
                    Description Images (Architectural Specs &amp; Reference Renders)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0.2rem 0 0 0' }}>
                    These images display strictly in the Architectural Specification description block. Clicking them will NOT replace the main product image.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGallerySelectTarget('description_images');
                    setGalleryModalOpen(true);
                  }}
                  style={{
                    background: '#F3F4F6',
                    color: '#111827',
                    border: '1px solid #D1D5DB',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Select from Media Gallery
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={descImagesInputRef}
                  onChange={handleMultipleDescUpload}
                  style={{
                    width: '100%',
                    background: '#F9FAFB',
                    border: '1px dashed #D1D5DB',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="crm-editor-input"
                    placeholder="Or paste description render URL and click Add"
                    value={descImageUrlInput}
                    onChange={(e) => setDescImageUrlInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddDescImageUrl}
                    style={{
                      background: '#111827',
                      color: '#fff',
                      border: 'none',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Add Spec Render
                  </button>
                </div>

                {/* Description Images Thumbnails Grid */}
                {currentDescImages.length > 0 && (
                  <div className="crm-gallery-preview-grid" style={{ marginTop: '0.5rem' }}>
                    {currentDescImages.map((imgSrc, idx) => (
                      <div key={idx} className="crm-gallery-preview-item" style={{ position: 'relative' }}>
                        <img src={imgSrc} alt={`Spec ${idx + 1}`} />
                        <button
                          type="button"
                          onClick={() => handleRemoveDescImage(idx)}
                          className="crm-gallery-remove-btn"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION C: Protected Documentation, PDF & Technical Sheets */}
            <div className="crm-editor-form-group" style={{ marginTop: '1.5rem', background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <div>
                <label className="crm-editor-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Protected Document / PDF / Docs (Exclusive for Buyers)
                </label>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0.2rem 0 0 0' }}>
                  Attach PDF or DOCX documentation. Only customers who purchased this model can access or view this document.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                {/* Option A: Local Storage File Upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip,.txt"
                    ref={docFileInputRef}
                    onChange={handleDocFileUpload}
                    style={{
                      flex: 1,
                      background: '#F9FAFB',
                      border: '1px dashed #D1D5DB',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                {/* Option B: Direct URL / Cloud Link */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="crm-editor-input"
                    placeholder="Or paste direct PDF / Document link (Drive / CDN / R2)"
                    value={docUrlInput}
                    onChange={(e) => setDocUrlInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleApplyDocUrl}
                    style={{
                      background: '#111827',
                      color: '#fff',
                      border: 'none',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Attach Link
                  </button>
                </div>

                {/* Active Attached Document Badge */}
                {productForm.pdf_document_url && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    marginTop: '0.25rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>📄</span>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
                          {productForm.document_name || 'Protected Document Attached'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#15803D' }}>
                          Ready for verified buyers upon checkout
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDocument}
                      style={{
                        background: '#FEE2E2',
                        color: '#DC2626',
                        border: 'none',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Remove File
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION D: Live File & Toolpath Specs */}
            <div className="crm-editor-specs-section" style={{ marginTop: '1.5rem' }}>
              <div className="crm-specs-header">
                <div>
                  <label className="crm-editor-label" style={{ marginBottom: 0 }}>
                    File &amp; Toolpath Specs (Live Storefront Synchronization)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>
                    Edit labels and values. Both left and right fields are editable and will be directly shown on the storefront.
                  </p>
                </div>
                <button
                  type="button"
                  className="crm-btn-add-spec"
                  onClick={handleAddSpecRow}
                >
                  + Add Spec Field
                </button>
              </div>

              <div className="crm-specs-list">
                {specs.map((row, idx) => (
                  <div key={idx} className="crm-spec-item-row">
                    <div className="crm-spec-col-key">
                      <input
                        type="text"
                        className="crm-spec-key-input"
                        value={row.key}
                        placeholder="e.g. Machine Compatibility"
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                      />
                    </div>
                    <div className="crm-spec-col-val">
                      <input
                        type="text"
                        className="crm-spec-val-input"
                        value={row.value}
                        placeholder="e.g. 3-Axis CNC Router, Slicer..."
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="crm-spec-del-btn"
                      onClick={() => handleRemoveSpecRow(idx)}
                      title="Delete specification row"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Media Gallery Selector Modal */}
          {galleryModalOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
              }}
              onClick={() => setGalleryModalOpen(false)}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  maxWidth: '900px',
                  width: '100%',
                  maxHeight: '85vh',
                  overflowY: 'auto',
                  padding: '1.5rem',
                  position: 'relative',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                      Select Media Asset for {gallerySelectTarget === 'product_images' ? 'Product Views' : 'Description Specifications'}
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                      User profiles are automatically hidden from product selections.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGalleryModalOpen(false)}
                    style={{
                      background: '#F3F4F6',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      fontWeight: 800
                    }}
                  >
                    ✕
                  </button>
                </div>

                <GalleryTab
                  selectable={true}
                  onSelectImage={handleSelectFromGallery}
                  filterType={gallerySelectTarget === 'product_images' ? 'product_image' : 'description_image'}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
