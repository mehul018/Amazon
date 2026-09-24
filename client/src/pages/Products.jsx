import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';

const categoriesList = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Books',
  'Beauty',
  'Sports'
];

const initialProductForm = {
  name: '',
  category: 'Electronics',
  brand: '',
  sku: '',
  price: '',
  originalPrice: '',
  discount: '',
  stock: '',
  rating: 4.5,
  image: '',
  specifications: '',
  warranty: '1 Year Manufacturer Warranty',
  tags: '',
  description: ''
};

const Products = () => {
  const { isAdmin, isVerified, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [formData, setFormData] = useState(initialProductForm);
  const [submitting, setSubmitting] = useState(false);

  // View Product Details Modal
  const [viewProduct, setViewProduct] = useState(null);

  // Delete Confirm Modal
  const [deleteId, setDeleteId] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (!isAdmin && user?._id) params.sellerId = user._id;
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'All') params.category = selectedCategory;

      const res = await productService.getAll(params);
      if (res.data?.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please check if backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenAddModal = () => {
    if (isAdmin) {
      setError('Action Restricted: Platform Admins manage sellers only and cannot add products.');
      return;
    }
    if (!isVerified) {
      setError('Action Restricted: Your seller account is unverified. Admin approval is required to add new products.');
      return;
    }
    setIsEditMode(false);
    setCurrentProductId(null);
    setFormData(initialProductForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    if (isAdmin) {
      setError('Action Restricted: Platform Admins manage sellers only and cannot edit products.');
      return;
    }
    if (!isVerified) {
      setError('Action Restricted: Your seller account is unverified. Admin verification is required to edit products.');
      return;
    }
    setIsEditMode(true);
    setCurrentProductId(product._id);
    setFormData({
      name: product.name || '',
      category: product.category || 'Electronics',
      brand: product.brand || '',
      sku: product.sku || '',
      price: product.price !== undefined ? product.price : '',
      originalPrice: product.originalPrice || '',
      discount: product.discount || '',
      stock: product.stock !== undefined ? product.stock : '',
      rating: product.rating || 4.5,
      image: product.image || '',
      specifications: product.specifications || '',
      warranty: product.warranty || '1 Year Manufacturer Warranty',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
      description: product.description || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(initialProductForm);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      alert('Action Restricted: Your seller account is unverified. Admin approval is required to add or edit products.');
      return;
    }
    if (!formData.name || !formData.category || formData.price === '' || formData.stock === '') {
      alert('Please fill all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditMode) {
        await productService.update(currentProductId, formData);
        setSuccessMsg('Product updated successfully!');
      } else {
        await productService.create(formData);
        setSuccessMsg('New product added to inventory successfully!');
      }
      handleCloseModal();
      fetchProducts();
    } catch (err) {
      console.error('Save product error:', err);
      alert(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteId) return;
    if (!isVerified) {
      alert('Action Restricted: Your seller account is unverified. Admin approval is required to delete products.');
      return;
    }
    try {
      await productService.delete(deleteId);
      setSuccessMsg('Product removed from inventory.');
      setDeleteId(null);
      fetchProducts();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete product.');
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">Product Inventory</h3>
          <p className="text-muted mb-0 small">
            Manage your store's catalog, pricing, categories and stock levels.
          </p>
        </div>
        {!isAdmin && (
          <button
            className={`btn d-flex align-items-center gap-2 shadow-sm ${
              !isVerified ? 'btn-secondary opacity-75' : 'btn-amazon-primary'
            }`}
            onClick={handleOpenAddModal}
            title={!isVerified ? 'Admin verification required to add products' : 'Add New Product'}
          >
            <i className={!isVerified ? 'bi bi-lock-fill' : 'bi bi-plus-lg'}></i>
            <span>{!isVerified ? 'Add Product (Verification Required)' : 'Add New Product'}</span>
          </button>
        )}
      </div>


      {/* Unverified Seller Notification */}
      {!isAdmin && !isVerified && (
        <div className="alert alert-warning border border-warning shadow-sm rounded-3 d-flex align-items-center gap-3 p-3 mb-4">
          <i className="bi bi-shield-exclamation fs-3 text-warning"></i>
          <div>
            <div className="fw-bold text-dark">Merchant Account Unverified</div>
            <small className="text-secondary">
              Product catalog listings cannot be published until your account is verified by the platform Admin.
            </small>
          </div>
        </div>
      )}

      {/* Notifications */}
      <AlertBanner message={error} type="danger" onClose={() => setError(null)} />
      <AlertBanner message={successMsg} type="success" onClose={() => setSuccessMsg(null)} />

      {/* Search & Category Filter Bar */}
      <div className="amz-card mb-4">
        <div className="row g-3 align-items-center">
          {/* Search Input */}
          <div className="col-12 col-md-5">
            <form onSubmit={handleSearchSubmit} className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by product name, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-dark px-3">
                Search
              </button>
            </form>
          </div>

          {/* Category Filter Pills */}
          <div className="col-12 col-md-7">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="amz-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 text-dark">
            Products Catalog <span className="text-muted fs-6 fw-normal">({products.length} items)</span>
          </h5>
          <button
            onClick={fetchProducts}
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading products inventory..." />
        ) : products.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-box-seam text-muted" style={{ fontSize: '3rem' }}></i>
            <h5 className="fw-bold mt-3">No Products Found</h5>
            <p className="text-muted small">Try searching with different keywords or add a new product.</p>
            <button className="btn btn-sm btn-amazon-primary mt-2" onClick={handleOpenAddModal}>
              Add First Product
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="amz-table align-middle">
              <thead>
                <tr>
                  <th>Product & Brand</th>
                  <th>Category</th>
                  <th>Price & MRP</th>
                  <th>Stock</th>
                  <th>Rating</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isOutOfStock = p.stock === 0;
                  const isLowStock = p.stock > 0 && p.stock < 15;
                  const hasDiscount = p.originalPrice > p.price;
                  const discountPct = p.discount || (hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0);

                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="product-img-thumb"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setViewProduct(p)}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                            }}
                          />
                          <div style={{ maxWidth: '300px' }}>
                            <div
                              className="fw-bold text-dark text-truncate text-hover-primary"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setViewProduct(p)}
                              title={p.name}
                            >
                              {p.name}
                            </div>
                            <div className="d-flex align-items-center gap-2 mt-0.5">
                              {p.brand && (
                                <span className="badge bg-secondary-subtle text-secondary py-0.5 px-1.5" style={{ fontSize: '0.7rem' }}>
                                  {p.brand}
                                </span>
                              )}
                              {p.sku && (
                                <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  SKU: {p.sku}
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-medium">
                          {p.category}
                        </span>
                      </td>

                      <td>
                        <div className="fw-bold text-dark">
                          ₹{Number(p.price).toFixed(2)}
                        </div>
                        {hasDiscount && (
                          <div className="d-flex align-items-center gap-1">
                            <small className="text-muted text-decoration-line-through" style={{ fontSize: '0.75rem' }}>
                              ₹{Number(p.originalPrice).toFixed(2)}
                            </small>
                            <span className="badge bg-danger-subtle text-danger py-0 px-1" style={{ fontSize: '0.65rem' }}>
                              {discountPct}% OFF
                            </span>
                          </div>
                        )}
                      </td>

                      <td>
                        {isOutOfStock ? (
                          <span className="badge bg-danger-subtle text-danger fw-semibold">
                            Out of Stock (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis fw-semibold">
                            Low Stock ({p.stock})
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success fw-semibold">
                            In Stock ({p.stock})
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="rating-stars">
                          <i className="bi bi-star-fill"></i>
                          <span className="text-dark fw-bold ms-1" style={{ fontSize: '0.85rem' }}>
                            {p.rating || 4.5}
                          </span>
                        </div>
                      </td>

                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => setViewProduct(p)}
                            title="View Full Product Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {!isAdmin && (
                            <>
                              <button
                                className={`btn btn-outline-secondary ${!isVerified ? 'disabled opacity-50' : ''}`}
                                onClick={() => handleOpenEditModal(p)}
                                disabled={!isVerified}
                                title={!isVerified ? 'Account unverified — Edit is locked' : 'Edit Product'}
                              >
                                <i className={`bi ${!isVerified ? 'bi-lock-fill' : 'bi-pencil'}`}></i>
                              </button>
                              <button
                                className={`btn btn-outline-danger ${!isVerified ? 'disabled opacity-50' : ''}`}
                                onClick={() => setDeleteId(p._id)}
                                disabled={!isVerified}
                                title={!isVerified ? 'Account unverified — Delete is locked' : 'Delete Product'}
                              >
                                <i className={`bi ${!isVerified ? 'bi-lock-fill' : 'bi-trash'}`}></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">
                  {isEditMode ? 'Edit Product Details' : 'Add New Product to Catalog'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Product Name */}
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold small">Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                        value={formData.name}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Brand */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Brand Name</label>
                      <input
                        type="text"
                        name="brand"
                        className="form-control"
                        placeholder="e.g. Sony, Apple, Nike"
                        value={formData.brand}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Category */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Category *</label>
                      <select
                        name="category"
                        className="form-select"
                        value={formData.category}
                        onChange={handleFormChange}
                        required
                      >
                        {categoriesList.filter((c) => c !== 'All').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SKU */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">SKU / Product Code</label>
                      <input
                        type="text"
                        name="sku"
                        className="form-control"
                        placeholder="e.g. AMZ-EL-9082 (leave blank to auto-generate)"
                        value={formData.sku}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Price, MRP and Discount */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Selling Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="price"
                        className="form-control fw-bold"
                        placeholder="e.g. 2499.00"
                        value={formData.price}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Original Price / MRP (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="originalPrice"
                        className="form-control text-muted"
                        placeholder="e.g. 2999.00"
                        value={formData.originalPrice}
                        onChange={handleFormChange}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Stock Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        name="stock"
                        className="form-control"
                        placeholder="e.g. 50"
                        value={formData.stock}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Rating */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Rating (0 - 5.0)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        name="rating"
                        className="form-control"
                        placeholder="4.5"
                        value={formData.rating}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Warranty */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Warranty Terms</label>
                      <input
                        type="text"
                        name="warranty"
                        className="form-control"
                        placeholder="e.g. 1 Year Manufacturer Warranty"
                        value={formData.warranty}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Tags */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        name="tags"
                        className="form-control"
                        placeholder="Wireless, Bluetooth, Premium"
                        value={formData.tags}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Image URL */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Product Image URL</label>
                      <input
                        type="url"
                        name="image"
                        className="form-control"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.image}
                        onChange={handleFormChange}
                      />
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Leave blank to use default placeholder image.
                      </small>
                    </div>

                    {/* Key Specifications */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Key Specifications</label>
                      <input
                        type="text"
                        name="specifications"
                        className="form-control"
                        placeholder="e.g. Driver: 40mm | Battery: 30h | Weight: 250g | Color: Matte Black"
                        value={formData.specifications}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Product Description *</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows="3"
                        placeholder="Provide details about features, specifications, and what makes this product stand out..."
                        value={formData.description}
                        onChange={handleFormChange}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-amazon-primary px-4"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Product Details Modal */}
      {viewProduct && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-amazon-dark text-white">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark fw-bold">
                    {viewProduct.category}
                  </span>
                  <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1.05rem' }}>
                    {viewProduct.name}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setViewProduct(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-4">
                  {/* Left Column: Image & Badges */}
                  <div className="col-12 col-md-5 text-center">
                    <div className="p-3 bg-light rounded-3 border mb-3">
                      <img
                        src={viewProduct.image}
                        alt={viewProduct.name}
                        className="img-fluid rounded-3"
                        style={{ maxHeight: '240px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
                        }}
                      />
                    </div>

                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      {viewProduct.stock > 0 ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          In Stock ({viewProduct.stock} units)
                        </span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1.5 rounded-pill">
                          <i className="bi bi-x-circle-fill me-1"></i>
                          Out of Stock
                        </span>
                      )}

                      <span className="badge bg-warning-subtle text-dark border border-warning-subtle px-3 py-1.5 rounded-pill fw-bold">
                        ★ {viewProduct.rating || 4.5} Rating
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Key Details */}
                  <div className="col-12 col-md-7">
                    {/* Brand & SKU */}
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                      <div>
                        <span className="text-muted small">Brand: </span>
                        <strong className="text-dark">{viewProduct.brand || 'Generic'}</strong>
                      </div>
                      <div>
                        <span className="text-muted small">SKU: </span>
                        <code className="text-primary fw-bold">{viewProduct.sku || 'N/A'}</code>
                      </div>
                    </div>

                    {/* Price and Discount */}
                    <div className="mb-3 p-3 bg-light rounded-3">
                      <div className="d-flex align-items-baseline gap-2">
                        <h3 className="fw-bold text-dark mb-0">
                          ₹{Number(viewProduct.price).toFixed(2)}
                        </h3>
                        {viewProduct.originalPrice > viewProduct.price && (
                          <>
                            <span className="text-muted text-decoration-line-through fs-6">
                              ₹{Number(viewProduct.originalPrice).toFixed(2)}
                            </span>
                            <span className="badge bg-danger text-white">
                              {viewProduct.discount || Math.round(((viewProduct.originalPrice - viewProduct.price) / viewProduct.originalPrice) * 100)}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      <small className="text-muted">Inclusive of all applicable taxes</small>
                    </div>

                    {/* Warranty */}
                    {viewProduct.warranty && (
                      <div className="mb-2 small">
                        <i className="bi bi-shield-check text-success me-1"></i>
                        <strong>Warranty: </strong>
                        <span className="text-secondary">{viewProduct.warranty}</span>
                      </div>
                    )}

                    {/* Specifications */}
                    {viewProduct.specifications && (
                      <div className="mb-3">
                        <div className="small fw-bold text-dark mb-1">
                          <i className="bi bi-cpu me-1 text-primary"></i>
                          Technical Specifications:
                        </div>
                        <div className="p-2.5 bg-light rounded-2 small text-secondary border">
                          {viewProduct.specifications}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {viewProduct.tags && (Array.isArray(viewProduct.tags) ? viewProduct.tags.length > 0 : viewProduct.tags) && (
                      <div className="mb-3">
                        <div className="small fw-bold text-dark mb-1">Tags:</div>
                        <div className="d-flex gap-1 flex-wrap">
                          {(Array.isArray(viewProduct.tags) ? viewProduct.tags : String(viewProduct.tags).split(',')).map((t, i) => (
                            <span key={i} className="badge bg-secondary-subtle text-secondary border">
                              #{String(t).trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seller Name */}
                    <div className="small text-muted pt-2 border-top">
                      Sold by: <strong className="text-dark">{viewProduct.sellerName || 'Amazon Store'}</strong>
                    </div>
                  </div>

                  {/* Full Description */}
                  <div className="col-12 pt-2 border-top">
                    <h6 className="fw-bold text-dark mb-2">Detailed Product Description</h6>
                    <p className="text-secondary small mb-0 lh-base" style={{ whiteSpace: 'pre-line' }}>
                      {viewProduct.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light d-flex justify-content-between">
                {!isAdmin ? (
                  <button
                    type="button"
                    className={`btn btn-sm ${!isVerified ? 'btn-outline-secondary disabled opacity-50' : 'btn-outline-secondary'}`}
                    disabled={!isVerified}
                    title={!isVerified ? 'Account unverified — Edit is locked' : 'Edit Product'}
                    onClick={() => {
                      if (!isVerified) return;
                      const toEdit = viewProduct;
                      setViewProduct(null);
                      handleOpenEditModal(toEdit);
                    }}
                  >
                    <i className={`bi ${!isVerified ? 'bi-lock-fill' : 'bi-pencil'} me-1`}></i> {!isVerified ? 'Edit (Locked)' : 'Edit Product'}
                  </button>
                ) : <span />}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setViewProduct(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
