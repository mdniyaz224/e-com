'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/utils/formatPrice';
import styles from '../../admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function UploadProductPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [brand, setBrand] = useState('PulseKart Select');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [deliveryBy, setDeliveryBy] = useState('Tomorrow, 2 PM');
  const [warrantyText, setWarrantyText] = useState('1 Year Manufacturer Warranty');

  // Media
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Flags & Badges
  const [isTopDeal, setIsTopDeal] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isAssured, setIsAssured] = useState(true);
  const [freeDelivery, setFreeDelivery] = useState(true);

  // Highlights
  const [highlights, setHighlights] = useState([
    '100% Original and authentic product with manufacturer warranty',
    'Premium high-grade materials and certified durability',
    'Fast doorstep delivery with secure tamper-proof packaging'
  ]);
  const [newHighlight, setNewHighlight] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) {
            setCategory(data[0].name);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Compute live discount percentage
  const numPrice = parseFloat(price) || 0;
  const numOrig = parseFloat(originalPrice) || 0;
  let calculatedDiscount = 0;
  if (numOrig > numPrice && numOrig > 0) {
    calculatedDiscount = Math.round(((numOrig - numPrice) / numOrig) * 100);
  }

  // Handle Image File Upload (Multer)
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    setIsUploadingFiles(true);
    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.urls) {
        setImages(prev => [...prev, ...data.urls]);
        showToast(`${data.urls.length} image(s) uploaded successfully!`);
      } else {
        showToast(data.error || 'Failed to upload images', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error uploading image files', 'error');
    } finally {
      setIsUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle URL Add
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
    showToast('Image URL added to gallery');
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const setCoverImage = (index) => {
    setImages(prev => {
      const target = prev[index];
      const rest = prev.filter((_, idx) => idx !== index);
      return [target, ...rest];
    });
    showToast('Cover photo updated');
  };

  // Highlights handlers
  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setHighlights(prev => [...prev, newHighlight.trim()]);
    setNewHighlight('');
  };

  const removeHighlight = (idx) => {
    setHighlights(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please enter product title', 'error');
      return;
    }

    if (!numPrice || numPrice <= 0) {
      showToast('Please specify a valid price', 'error');
      return;
    }

    const finalCategory = category === 'custom' ? customCategory.trim() : category;
    if (!finalCategory) {
      showToast('Please choose or enter a category', 'error');
      return;
    }

    setIsPublishing(true);

    const payload = {
      name: name.trim(),
      shortName: shortName.trim() || (name.length > 32 ? name.substring(0, 32) + '...' : name),
      brand: brand.trim() || 'PulseKart Direct',
      category: finalCategory,
      categoryTag: `Top in ${finalCategory}`,
      price: numPrice,
      originalPrice: numOrig || numPrice,
      discount: calculatedDiscount,
      images: images.length > 0 ? images : ['/images/headphones.png'],
      highlights: highlights,
      stock: parseInt(stock) || 50,
      seller: 'PulseKart Direct',
      isTopDeal: isTopDeal,
      trendingTag: isTrending ? '🔥 Trending Now' : (isTopDeal ? 'Deal of the Day' : ''),
      isAssured: isAssured,
      freeDelivery: freeDelivery,
      deliveryBy: deliveryBy,
      warranty: {
        replacement: '7 Days Replacement',
        cod: true,
        brandWarranty: warrantyText
      }
    };

    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.product) {
        showToast('🎉 Product uploaded & published to PulseKart successfully!');
        setTimeout(() => {
          router.push('/admin/products');
        }, 1200);
      } else {
        showToast(data.error || 'Failed to upload product', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while publishing product', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Upload New Product</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Add a new item to your online store with photos, pricing, and key features.
          </p>
        </div>
        <Link href="/admin/products" className={`${styles.btnSm} ${styles.btnSecondary}`}>
          ← Back to Catalog
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* Left Column: Core Product Info */}
          <div>
            {/* 1. General Details */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>
                <span>📝</span>
                <span>General Product Details</span>
              </div>

              <div className={styles.formGroup}>
                <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                  Product Title (Full Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Silver)"
                  className={styles.formInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Short Name (for compact mobile badges)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sony WH-1000XM5..."
                    className={styles.formInput}
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                    Brand
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony, Apple, Samsung"
                    className={styles.formInput}
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                    Category
                  </label>
                  <select
                    className={styles.formSelect}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="custom">+ Custom / New Category</option>
                  </select>
                </div>

                {category === 'custom' && (
                  <div className={styles.formGroup}>
                    <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smart Wearables"
                      className={styles.formInput}
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Media & Image Upload */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>
                <span>🖼️</span>
                <span>Product Images & Media</span>
              </div>

              {/* Drag & Drop File Selector */}
              <div
                className={styles.dropzone}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.dropzoneIcon}>📁</div>
                <div className={styles.dropzoneTitle}>
                  {isUploadingFiles ? 'Uploading images to server...' : 'Click or Drag images here to upload'}
                </div>
                <div className={styles.dropzoneHint}>
                  Supports PNG, JPG, WEBP up to 10MB each. Images are saved to store storage.
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              {/* Paste URL Option */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Or paste external image URL (e.g. /images/headphones.png or https://...)"
                  className={styles.formInput}
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                />
                <button
                  type="button"
                  className={`${styles.btnSm} ${styles.btnSecondary}`}
                  onClick={handleAddImageUrl}
                  style={{ whiteSpace: 'nowrap', padding: '10px 14px' }}
                >
                  + Add URL
                </button>
              </div>

              {/* Image Previews */}
              {images.length > 0 ? (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    Gallery ({images.length} images) — First image is the Primary Cover:
                  </div>
                  <div className={styles.imagePreviewsGrid}>
                    {images.map((imgUrl, idx) => (
                      <div key={idx} className={styles.imagePreviewCard}>
                        <img src={imgUrl} alt={`Upload ${idx}`} />
                        {idx === 0 && <span className={styles.coverBadge}>COVER</span>}
                        <button
                          type="button"
                          className={styles.removeImageBtn}
                          onClick={() => removeImage(idx)}
                          title="Remove image"
                        >
                          ✕
                        </button>
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => setCoverImage(idx)}
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              left: '2px',
                              background: '#334155',
                              color: '#fff',
                              border: 'none',
                              fontSize: '8px',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Set Cover
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '8px' }}>
                  No images attached yet. A default placeholder will be assigned if left empty.
                </div>
              )}
            </div>

            {/* 3. Product Highlights */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>
                <span>✨</span>
                <span>Key Specifications & Highlights</span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                {highlights.map((h, i) => (
                  <div key={i} className={styles.highlightItem}>
                    <span style={{ color: '#2874f0', fontWeight: 800 }}>•</span>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={h}
                      onChange={(e) => {
                        const next = [...highlights];
                        next[i] = e.target.value;
                        setHighlights(next);
                      }}
                    />
                    <button
                      type="button"
                      className={`${styles.btnSm} ${styles.btnDanger}`}
                      onClick={() => removeHighlight(i)}
                      title="Remove bullet"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Type new highlight (e.g. 50-Hour Playtime, Turbo Fast Charging)..."
                  className={styles.formInput}
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHighlight();
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.addHighlightBtn}
                  onClick={addHighlight}
                >
                  + Add Point
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Inventory & Badges */}
          <div>
            {/* 1. Pricing Card */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>
                <span>💰</span>
                <span>Pricing & Discount</span>
              </div>

              <div className={styles.formGroup}>
                <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2499"
                  className={styles.formInput}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Original MRP (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 4999"
                  className={styles.formInput}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                />
              </div>

              {calculatedDiscount > 0 && (
                <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#065f46', fontWeight: 600 }}>Discount Calculated:</span>
                  <span className={styles.discountBadge} style={{ fontSize: '13px' }}>{calculatedDiscount}% OFF</span>
                </div>
              )}
            </div>

            {/* 2. Stock & Logistics */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>
                <span>📦</span>
                <span>Inventory & Delivery</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Stock Inventory Units</label>
                <input
                  type="number"
                  placeholder="50"
                  className={styles.formInput}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Delivery Estimate</label>
                <input
                  type="text"
                  placeholder="e.g. Tomorrow by 2 PM"
                  className={styles.formInput}
                  value={deliveryBy}
                  onChange={(e) => setDeliveryBy(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Warranty Info</label>
                <input
                  type="text"
                  placeholder="e.g. 1 Year Manufacturer Warranty"
                  className={styles.formInput}
                  value={warrantyText}
                  onChange={(e) => setWarrantyText(e.target.value)}
                />
              </div>
            </div>

            {/* 3. Badges & Promotion Toggles */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>
                <span>🏷️</span>
                <span>Merchandising & Badges</span>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>🔥 Top Deal of the Day</div>
                  <div className={styles.toggleDesc}>Highlight on Home carousel & Deals bar</div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={isTopDeal}
                    onChange={(e) => setIsTopDeal(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>⭐ Trending Product</div>
                  <div className={styles.toggleDesc}>Show under Trending & Recommended</div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={isTrending}
                    onChange={(e) => setIsTrending(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>PulseKart Assured</div>
                  <div className={styles.toggleDesc}>Show verified quality check badge</div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={isAssured}
                    onChange={(e) => setIsAssured(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Free Delivery</div>
                  <div className={styles.toggleDesc}>Offer zero-cost shipping banner</div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={freeDelivery}
                    onChange={(e) => setFreeDelivery(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            {/* Submit & Cancel */}
            <div className={styles.submitBar}>
              <Link href="/admin/products" className={`${styles.btnLarge} ${styles.btnCancel}`}>
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isPublishing}
                className={`${styles.btnLarge} ${styles.btnPublish}`}
              >
                {isPublishing ? 'Publishing Product...' : '🚀 Publish Product'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

