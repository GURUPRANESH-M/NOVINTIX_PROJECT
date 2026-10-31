import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleOff,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";

import productService from "../services/productService";

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(price));
}

function getErrorMessage(error) {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.response?.data?.title ||
    (typeof error.response?.data === "string"
      ? error.response.data
      : null) ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

const emptyForm = {
  productCode: "",
  name: "",
  description: "",
  standardPrice: "",
};

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function loadProducts(searchTerm = search) {
    setLoading(true);
    setError("");

    try {
      const response = await productService.getAll(searchTerm);
      setProducts(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts("");
    // Load the initial list once when the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreateModal() {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);

    setForm({
      productCode: product.productCode,
      name: product.name,
      description: product.description || "",
      standardPrice: String(product.standardPrice),
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const price = Number(form.standardPrice);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Standard price must be greater than zero.");
      return;
    }

    const payload = {
      productCode: form.productCode.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      standardPrice: price,
    };

    if (!payload.productCode || !payload.name) {
      setError("Product code and product name are required.");
      return;
    }

    setSaving(true);

    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
        setSuccess("Product updated successfully.");
      } else {
        await productService.create(payload);
        setSuccess("Product created successfully.");
      }

      setModalOpen(false);
      setEditingProduct(null);
      setForm(emptyForm);

      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusToggle(product) {
    const action = product.active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${product.name}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      if (product.active) {
        await productService.deactivate(product.id);
        setSuccess("Product deactivated successfully.");
      } else {
        await productService.activate(product.id);
        setSuccess("Product activated successfully.");
      }

      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const activeCount = products.filter(
    (product) => product.active
  ).length;

  return (
    <main className="products-page">
      <header className="products-header">
        <button
          type="button"
          className="products-back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>

        <div className="brand-logo">
          <span className="brand-mark">N</span>
          <span>NOVINTIX</span>
        </div>
      </header>

      <section className="products-content">
        <div className="products-heading">
          <div>
            <span className="welcome-label">
              PRODUCT OPERATIONS
            </span>

            <h1>Products</h1>

            <p>
              Manage your medical products and standard prices.
            </p>
          </div>

          <button
            type="button"
            className="products-primary-button"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Add product
          </button>
        </div>

        <div className="products-summary">
          <div className="products-summary-icon">
            <Package size={23} />
          </div>

          <div>
            <span>Products shown</span>
            <strong>{products.length}</strong>
          </div>

          <div className="products-summary-divider" />

          <div>
            <span>Active products</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        {success && (
          <div className="products-alert products-alert-success">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error && !modalOpen && (
          <div className="products-alert products-alert-error">
            {error}
          </div>
        )}

        <section className="products-table-card">
          <form
            className="products-search"
            onSubmit={(event) => {
              event.preventDefault();
              loadProducts(search);
            }}
          >
            <Search size={19} />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name or product code..."
              aria-label="Search products"
            />

            <button
              type="submit"
              className="products-secondary-button"
            >
              Search
            </button>
          </form>

          {loading ? (
            <div className="products-empty-state">
              <LoaderCircle className="products-spinner" size={25} />
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty-state">
              <Package size={35} />
              <h3>No products found</h3>
              <p>
                Add your first product or try a different search.
              </p>

              <button
                type="button"
                className="products-primary-button"
                onClick={openCreateModal}
              >
                <Plus size={17} />
                Add product
              </button>
            </div>
          ) : (
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>CODE</th>
                    <th>STANDARD PRICE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="products-name">
                          <strong>{product.name}</strong>
                          <span>
                            {product.description || "No description"}
                          </span>
                        </div>
                      </td>

                      <td>{product.productCode}</td>

                      <td className="products-price">
                        {formatPrice(product.standardPrice)}
                      </td>

                      <td>
                        <span
                          className={
                            product.active
                              ? "products-status products-status-active"
                              : "products-status products-status-inactive"
                          }
                        >
                          {product.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="products-actions">
                          <button
                            type="button"
                            className="products-icon-button"
                            title="Edit product"
                            aria-label={`Edit ${product.name}`}
                            onClick={() => openEditModal(product)}
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            className={`products-icon-button ${
                              product.active
                                ? "products-deactivate-button"
                                : "products-activate-button"
                            }`}
                            title={
                              product.active
                                ? "Deactivate product"
                                : "Activate product"
                            }
                            aria-label={
                              product.active
                                ? `Deactivate ${product.name}`
                                : `Activate ${product.name}`
                            }
                            onClick={() => handleStatusToggle(product)}
                          >
                            {product.active ? (
                              <CircleOff size={17} />
                            ) : (
                              <CheckCircle2 size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {modalOpen && (
        <div
          className="products-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="products-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="products-modal-title"
          >
            <div className="products-modal-header">
              <div>
                <span className="welcome-label">
                  PRODUCT DETAILS
                </span>

                <h2 id="products-modal-title">
                  {editingProduct ? "Edit product" : "Add product"}
                </h2>

                <p>
                  Enter the product information below.
                </p>
              </div>

              <button
                type="button"
                className="products-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="products-alert products-alert-error">
                {error}
              </div>
            )}

            <form
              className="products-form"
              onSubmit={handleSubmit}
            >
              <label>
                Product code *
                <input
                  name="productCode"
                  value={form.productCode}
                  onChange={handleChange}
                  placeholder="e.g. PROD-001"
                  maxLength={30}
                  required
                />
              </label>

              <label>
                Product name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Surgical Gloves"
                  maxLength={120}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter a short description"
                  maxLength={500}
                  rows={3}
                />
              </label>

              <label>
                Standard price (₹) *
                <input
                  type="number"
                  name="standardPrice"
                  value={form.standardPrice}
                  onChange={handleChange}
                  placeholder="e.g. 500.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </label>

              <div className="products-form-actions">
                <button
                  type="button"
                  className="products-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="products-primary-button"
                  disabled={saving}
                >
                  {saving && (
                    <LoaderCircle
                      size={17}
                      className="products-spinner"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Save changes"
                      : "Create product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}