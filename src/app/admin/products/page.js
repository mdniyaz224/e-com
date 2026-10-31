'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/utils/formatPrice';
import styles from '../admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDealFilter, setSelectedDealFilter] = useState('');
  
  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/categories`)
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error('Error fetching catalog data:', err);
      showToast('Failed to load products from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter products based on search & category
  const filteredProducts = products.filter(p => {
    let matchSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matchSearch =
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
    }

    let matchCategory = true;
    if (selectedCategory) {
      matchCategory = p.category?.toLowerCase() === selectedCategory.toLowerCase();
    }

    let matchDeal = true;
    if (selectedDealFilter === 'deals') {
      matchDeal = Boolean(p.isTopDeal);
    } else if (selectedDealFilter === 'normal') {
      matchDeal = !p.isTopDeal;
    }

    return matchSearch && matchCategory && matchDeal;
  });

  // Handle Delete
  const handleDeleteProduct = async (product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/products/${product.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== product.id));
        showToast(`"${product.name.slice(0, 24)}..." deleted successfully`);
      } else {
        showToast(data.error || 'Failed to delete product', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting product', 'error');
    }
  };

  // Handle Toggle Deal
  const handleToggleDeal = async (product) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${product.id}/toggle-deal`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p.id === product.id ? { ...p, isTopDeal: data.isTopDeal } : p))
        );
        showToast(`Top deal ${data.isTopDeal ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Error toggling deal', 'error');
    }
  };

  // Open Edit Modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name || '',
      brand: product.brand || '',
      category: product.category || '',
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      stock: product.stock !== undefined ? product.stock : 50,
      isTopDeal: Boolean(product.isTopDeal),
      isAssured: Boolean(product.isAssured)
    });
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);

    try {
      const res = await fetch(`${API_URL}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();

      if (res.ok && data.product) {
        setProducts(prev =>
          prev.map(p => (p.id === editingProduct.id ? data.product : p))
        );
        showToast('Product updated successfully!');
        setEditingProduct(null);
      } else {
        showToast(data.error || 'Failed to update product', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving product edits', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div>
      {/* Toast Alert */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchInputWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search products by title, brand, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className={styles.selectInput}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className={styles.selectInput}
          value={selectedDealFilter}
          onChange={(e) => setSelectedDealFilter(e.target.value)}
        >
          <option value="">All Products</option>
          <option value="deals">🔥 Top Deals Only</option>
          <option value="normal">Standard Products</option>
        </select>

        <Link href="/admin/products/new" className={styles.uploadShortcutBtn}>
          <span>➕</span>
          <span>Upload Product</span>
        </Link>
      </div>

      {/* Products Table Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <span>📦</span>
            <span>Product Catalog ({filteredProducts.length} items)</span>
          </div>
          {searchQuery && (
            <button
              className={`${styles.btnSm} ${styles.btnSecondary}`}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedDealFilter('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price & MRP</th>
                <th>Discount</th>
                <th>Deal</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading product catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                    <p>No products match your search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: '#64748b', fontWeight: 600 }}>#{p.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={p.images?.[0] || '/images/headphones.png'}
                          alt={p.name}
                          className={styles.productThumb}
                        />
                        <div>
                          <span className={styles.productMetaTitle} title={p.name}>
                            {p.name}
                          </span>
                          <span className={styles.productMetaBrand}>
                            Brand: <strong>{p.brand}</strong>
                            {p.isAssured && (
                              <span
                                className={`${styles.badge} ${styles.badgeAssured}`}
                                style={{ marginLeft: '6px', fontSize: '10px' }}
                              >
                                ✓ Assured
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeInfo}`}>{p.category}</span>
                    </td>
                    <td>
                      <span className={styles.priceTag}>{formatPrice(p.price)}</span>
                      {p.originalPrice > p.price && (
                        <span className={styles.mrpTag}>{formatPrice(p.originalPrice)}</span>
                      )}
                    </td>
                    <td>
                      {p.discount > 0 ? (
                        <span className={styles.discountBadge}>{p.discount}% OFF</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`${styles.badge} ${p.isTopDeal ? styles.badgeDeal : styles.btnSecondary}`}
                        onClick={() => handleToggleDeal(p)}
                        title="Click to toggle Top Deal status"
                        style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                      >
                        {p.isTopDeal ? '🔥 Deal Active' : '○ Make Deal'}
                      </button>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                        {p.stock !== undefined ? `${p.stock} units` : '50 units'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionBtnsRow}>
                        <button
                          className={`${styles.btnSm} ${styles.btnPrimary}`}
                          onClick={() => openEditModal(p)}
                          title="Edit Product"
                        >
                          ✏️ Edit
                        </button>
                        <Link
                          href={`/product/${p.id}`}
                          target="_blank"
                          className={`${styles.btnSm} ${styles.btnSecondary}`}
                          title="View on store"
                        >
                          👁️ View
                        </Link>
                        <button
                          className={`${styles.btnSm} ${styles.btnDanger}`}
                          onClick={() => handleDeleteProduct(p)}
                          title="Delete Product"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className={styles.modalOverlay} onClick={() => setEditingProduct(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Product #{editingProduct.id}</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setEditingProduct(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                    Product Title
                  </label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Brand Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editFormData.brand}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, brand: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <select
                      className={styles.formSelect}
                      value={editFormData.category}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, category: e.target.value })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow3}>
                  <div className={styles.formGroup}>
                    <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      className={styles.formInput}
                      value={editFormData.price}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          price: parseFloat(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>MRP / Original (₹)</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={editFormData.originalPrice}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          originalPrice: parseFloat(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Stock Units</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={editFormData.stock}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          stock: parseInt(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                </div>

                <div className={styles.toggleRow}>
                  <div>
                    <div className={styles.toggleLabel}>🔥 Top Deal of the Day</div>
                    <div className={styles.toggleDesc}>
                      Feature prominently in deals carousel on home page
                    </div>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={editFormData.isTopDeal}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, isTopDeal: e.target.checked })
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div>
                    <div className={styles.toggleLabel}>PulseKart Assured Badge</div>
                    <div className={styles.toggleDesc}>
                      Shows trusted quality verification badge
                    </div>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={editFormData.isAssured}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, isAssured: e.target.checked })
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btnLarge} ${styles.btnCancel}`}
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className={`${styles.btnLarge} ${styles.btnPublish}`}
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

