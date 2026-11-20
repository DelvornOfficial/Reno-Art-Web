import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './pages/Login';
import Sidebar from './components/sidebar/Sidebar';
import DashboardTab from './components/dashboard/DashboardTab';
import CategoriesTab from './components/categories/CategoriesTab';
import ProductsTab from './components/products/ProductsTab';
import ProductEditorPage from './components/product-editor/ProductEditorPage';
import OrdersTab from './components/orders/OrdersTab';
import CustomersTab from './components/customers/CustomersTab';
import CustomerDetailView from './components/customer-detail/CustomerDetailView';
import GalleryTab from './components/gallery/GalleryTab';
import SettingsTab from './components/settings/SettingsTab';
import { API_BASE_URL, getWebSocketUrl } from './services/api';

export default function App() {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem('reno_admin_session') || localStorage.getItem('reno_crm_admin');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      const stored = localStorage.getItem('reno_crm_active_tab');
      return hash || stored || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isProductEditorOpen, setIsProductEditorOpen] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Core Data States
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Category creation form
  const [newCatName, setNewCatName] = useState('');

  // Product creation / edit form
  const [editingProductId, setEditingProductId] = useState(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const initialProductForm = {
    title: '',
    category_id: '',
    mrp: '',
    price: '',
    format: 'OBJ / STL / DWG',
    mesh_topology: 'Closed Manifold / Slicer Optimized',
    machine_compatibility: '3-Axis CNC Router, 5-Axis Stone Mill, 3D Printer, Fiber Laser',
    supported_cam: 'ArtCAM, Vectric Aspire, Fusion 360, RhinoCAM, AutoCAD',
    commercial_license: 'Unlimited Physical Fabrication • Royalty-Free',
    image_url: '',
    short_description: '',
    pdf_document_url: '',
    document_name: ''
  };
  const [productForm, setProductForm] = useState(initialProductForm);

  const handleLoginSuccess = (userData) => {
    setAdminUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('reno_admin_session');
    localStorage.removeItem('reno_crm_admin');
    setAdminUser(null);
  };

  // Fetch PostgreSQL live data
  const loadPostgreSqlData = async () => {
    try {
      const [catsRes, prodsRes, ordersRes, custsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories/`),
        fetch(`${API_BASE_URL}/products/`),
        fetch(`${API_BASE_URL}/orders/`),
        fetch(`${API_BASE_URL}/customers/`)
      ]);

      if (catsRes.ok) setCategories(await catsRes.json());
      if (prodsRes.ok) setProducts(await prodsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (custsRes.ok) setCustomers(await custsRes.json());

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    } catch (err) {
      console.error('Failed fetching data from PostgreSQL:', err);
    }
  };

  useEffect(() => {
    if (adminUser) {
      loadPostgreSqlData();
    }
  }, [adminUser]);

  // WebSocket Live Subscription
  useEffect(() => {
    if (!adminUser) return;
    const ws = new WebSocket(getWebSocketUrl());

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PRODUCT_CREATED') {
          setProducts((prev) => [data.payload, ...prev]);
        } else if (data.type === 'PRODUCT_UPDATED') {
          setProducts((prev) => prev.map((p) => (p.id === data.payload.id ? data.payload : p)));
        } else if (data.type === 'PRODUCT_DELETED') {
          setProducts((prev) => prev.filter((p) => p.id !== data.payload.id));
        } else if (data.type === 'CATEGORY_CREATED') {
          setCategories((prev) => [...prev, data.payload]);
        } else if (data.type === 'CATEGORY_DELETED') {
          setCategories((prev) => prev.filter((c) => c.id !== data.payload.id));
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    return () => ws.close();
  }, [adminUser]);

  // Category Actions
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          icon: 'default'
        })
      });

      if (res.ok) {
        const created = await res.json();
        setCategories((prev) => [...prev, created]);
        setNewCatName('');
      }
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  const handleRemoveCategory = async (catId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${catId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== catId));
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  // Product Actions: Open Add Page
  const handleOpenCreateProduct = () => {
    setEditingProductId(null);
    setProductForm(initialProductForm);
    setIsProductEditorOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Product Actions: Open Edit Page
  const handleStartEditProduct = (prod) => {
    setEditingProductId(prod.id);
    setProductForm({
      title: prod.title || '',
      category_id: prod.category || prod.category_id || '',
      mrp: (prod.original_price ?? prod.mrp) ? String(prod.original_price ?? prod.mrp) : '',
      price: prod.price ? String(prod.price) : '',
      format: prod.format || 'OBJ / STL / DWG',
      mesh_topology: prod.mesh_topology || 'Closed Manifold / Slicer Optimized',
      machine_compatibility: prod.machine_compatibility || '3-Axis CNC Router, 5-Axis Stone Mill, 3D Printer, Fiber Laser',
      supported_cam: prod.supported_cam || 'ArtCAM, Vectric Aspire, Fusion 360, RhinoCAM, AutoCAD',
      commercial_license: prod.commercial_license || 'Unlimited Physical Fabrication – Royalty-Free',
      custom_specs: prod.custom_specs && prod.custom_specs.length > 0 ? prod.custom_specs : [
        { key: 'Included Formats', value: prod.format || 'OBJ / STL / DWG' },
        { key: 'Mesh Topology', value: prod.mesh_topology || 'Closed Manifold / Slicer Optimized' },
        { key: 'Machine Compatibility', value: prod.machine_compatibility || '3-Axis CNC Router, 5-Axis Stone Mill, 3D Printer, Fiber Laser' },
        { key: 'Supported CAM', value: prod.supported_cam || 'ArtCAM, Vectric Aspire, Fusion 360, RhinoCAM, AutoCAD' },
        { key: 'Commercial License', value: prod.commercial_license || 'Unlimited Physical Fabrication – Royalty-Free' }
      ],
      image_url: prod.image_url || '',
      product_images: prod.product_images || (prod.image_url ? [prod.image_url] : []),
      description_images: prod.description_images || [],
      gallery_images: prod.gallery_images || [],
      short_description: prod.description || prod.short_description || '',
      pdf_document_url: prod.pdf_document_url || '',
      document_name: prod.document_name || ''
    });
    setIsProductEditorOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelProductEditor = () => {
    setIsProductEditorOpen(false);
    setEditingProductId(null);
    setProductForm(initialProductForm);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!productForm.title || !productForm.category_id || !productForm.price) return;
    if (isSubmittingProduct) return;

    setIsSubmittingProduct(true);
    const chosenCat = productForm.category_id;
    const mrpNumber = productForm.mrp ? parseFloat(productForm.mrp) : null;
    const priceNumber = parseFloat(productForm.price);

    const payload = {
      title: productForm.title,
      category: chosenCat,
      category_id: chosenCat,
      mrp: mrpNumber,
      original_price: mrpNumber,
      price: priceNumber,
      format: productForm.format,
      mesh_topology: productForm.mesh_topology,
      machine_compatibility: productForm.machine_compatibility,
      supported_cam: productForm.supported_cam,
      commercial_license: productForm.commercial_license,
      custom_specs: productForm.custom_specs || [],
      image_url: productForm.image_url,
      gallery_images: productForm.gallery_images || [],
      description: productForm.short_description,
      short_description: productForm.short_description,
      pdf_document_url: productForm.pdf_document_url || '',
      document_name: productForm.document_name || ''
    };

    try {
      if (editingProductId) {
        const res = await fetch(`${API_BASE_URL}/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          handleCancelProductEditor();
        }
      } else {
        const newId = `reno-${Date.now().toString(36)}`;
        const res = await fetch(`${API_BASE_URL}/products/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: newId, ...payload })
        });
        if (res.ok) {
          const created = await res.json();
          setProducts((prev) => [created, ...prev]);
          handleCancelProductEditor();
        }
      }
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleRemoveProduct = async (prodId) => {
    if (deletingProductId) return;
    setDeletingProductId(prodId);
    try {
      const res = await fetch(`${API_BASE_URL}/products/${prodId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== prodId));
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    } finally {
      setDeletingProductId(null);
    }
  };

  // Total metrics
  const totalRevenue = orders
    .filter((o) => o.status === 'Completed')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const stats = {
    totalRevenue,
    totalProducts: products.length,
    categoriesCount: categories.length,
    totalOrders: orders.length
  };

  if (!adminUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="crm-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedCustomer(null);
          setIsProductEditorOpen(false);
          setActiveTab(tab);
          try {
            localStorage.setItem('reno_crm_active_tab', tab);
            window.location.hash = tab;
          } catch (e) {
            // quiet
          }
        }}
        categoriesCount={categories.length}
        productsCount={products.length}
        ordersCount={orders.length}
        customersCount={customers.length}
        adminUser={adminUser}
        onLogout={handleLogout}
        onSelectCustomerTab={() => setSelectedCustomer(null)}
      />

      <main className="crm-main">
        <header className="crm-header">
          <div>
            <h1 className="crm-title">
              {activeTab === 'customers' && selectedCustomer
                ? `Customer / ${selectedCustomer.name || selectedCustomer.email}`
                : activeTab === 'products' && isProductEditorOpen
                  ? editingProductId ? 'Edit Product' : 'New Product'
                  : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="crm-subtitle">Reno Design Administrative Cloud Platform</p>
          </div>
          <div className="crm-user-profile">
            <div className="crm-user-avatar">
              {(adminUser.username || adminUser.name || 'AD').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                {adminUser.username || adminUser.name || 'Studio Admin'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin</div>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={stats}
            orders={orders}
            onSyncPostgreSql={loadPostgreSqlData}
            syncSuccess={syncSuccess}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            newCatName={newCatName}
            setNewCatName={setNewCatName}
            onCreateCategory={handleCreateCategory}
            onRemoveCategory={handleRemoveCategory}
          />
        )}

        {activeTab === 'products' && (
          isProductEditorOpen ? (
            <ProductEditorPage
              editingProductId={editingProductId}
              productForm={productForm}
              setProductForm={setProductForm}
              categories={categories}
              onSubmitProduct={handleSubmitProduct}
              onCancel={handleCancelProductEditor}
              isSubmittingProduct={isSubmittingProduct}
            />
          ) : (
            <ProductsTab
              products={products}
              categories={categories}
              onOpenCreateProduct={handleOpenCreateProduct}
              onStartEdit={handleStartEditProduct}
              onRemoveProduct={handleRemoveProduct}
              deletingProductId={deletingProductId}
            />
          )
        )}

        {activeTab === 'orders' && <OrdersTab orders={orders} />}

        {activeTab === 'customers' && (
          selectedCustomer ? (
            <CustomerDetailView
              customer={selectedCustomer}
              onBack={() => setSelectedCustomer(null)}
            />
          ) : (
            <CustomersTab
              customers={customers}
              onSelectCustomer={(cust) => setSelectedCustomer(cust)}
            />
          )
        )}

        {activeTab === 'gallery' && <GalleryTab />}

        {activeTab === 'settings' && <SettingsTab adminUser={adminUser} />}
      </main>
    </div >
  );
}
