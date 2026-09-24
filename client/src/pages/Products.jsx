import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

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
  price: '',
  stock: '',
  rating: 4.5,
  image: '',
  description: ''
};

const Products = () => {
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

  // Delete Confirm Modal
  const [deleteId, setDeleteId] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
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
    setIsEditMode(false);
    setCurrentProductId(null);
    setFormData(initialProductForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setIsEditMode(true);
    setCurrentProductId(product._id);
    setFormData({
      name: product.name || '',
      category: product.category || 'Electronics',
      price: product.price || '',
      stock: product.stock !== undefined ? product.stock : '',
      rating: product.rating || 4.5,
      image: product.image || '',
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
        <button
          className="btn btn-amazon-primary d-flex align-items-center gap-2 shadow-sm"
          onClick={handleOpenAddModal}
        >
          <i className="bi bi-plus-lg"></i>
          <span>Add New Product</span>
        </button>
      </div>

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
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Rating</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isOutOfStock = p.stock === 0;
                  const isLowStock = p.stock > 0 && p.stock < 15;

                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="product-img-thumb"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                            }}
                          />
                          <div style={{ maxWidth: '300px' }}>
                            <div className="fw-bold text-dark text-truncate">{p.name}</div>
                            <small className="text-muted text-truncate d-block" style={{ fontSize: '0.78rem' }}>
                              {p.description}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-medium">
                          {p.category}
                        </span>
                      </td>

                      <td className="fw-bold text-dark">
                        ${Number(p.price).toFixed(2)}
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
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Product"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => setDeleteId(p._id)}
                            title="Delete Product"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
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
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="e.g. Wireless Noise Cancelling Headphones"
                        value={formData.name}
                        onChange={handleFormChange}
                        required
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

                    {/* Price */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="price"
                        className="form-control"
                        placeholder="e.g. 49.99"
                        value={formData.price}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Stock Quantity */}
                    <div className="col-12 col-md-6">
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
                    <div className="col-12 col-md-6">
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

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Product Description *</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows="3"
                        placeholder="Provide details about features, specifications, and warranty..."
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger-subtle">
                <h5 className="modal-title text-danger fw-bold">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteId(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-0">
                  Are you sure you want to delete this product from your store inventory? This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={handleDeleteProduct}
                >
                  Delete Product
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
