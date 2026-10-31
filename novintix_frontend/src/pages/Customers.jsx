import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Building2,
    Plus,
    Search,
    Pencil,
    Ban,
    X,
} from "lucide-react";

import customerService from "../services/customerService";

const emptyForm = {
    customerCode: "",
    companyName: "",
    customerType: "HOSPITAL",
    contactPerson: "",
    email: "",
    phone: "",
    billingAddress: "",
    shippingAddress: "",
    creditLimit: "0",
    paymentTermsDays: "30",
};

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadCustomers(searchTerm = search) {
        setLoading(true);
        setError("");

        try {
            const response = await customerService.getAll(searchTerm);
            setCustomers(response.data);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                "Unable to load customers. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCustomers("");
        // Initial load only; search is handled by the submit handler.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setFormError("");
        setSuccess("");
        setShowForm(true);
    }

    function openEditForm(customer) {
        setEditingId(customer.id);

        setForm({
            customerCode: customer.customerCode,
            companyName: customer.companyName,
            customerType: customer.customerType,
            contactPerson: customer.contactPerson,
            email: customer.email,
            phone: customer.phone,
            billingAddress: customer.billingAddress,
            shippingAddress: customer.shippingAddress,
            creditLimit: String(customer.creditLimit),
            paymentTermsDays: String(customer.paymentTermsDays),
        });

        setFormError("");
        setSuccess("");
        setShowForm(true);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setFormError("");
        setSuccess("");

        const payload = {
            ...form,
            customerCode: form.customerCode.trim(),
            companyName: form.companyName.trim(),
            contactPerson: form.contactPerson.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            billingAddress: form.billingAddress.trim(),
            shippingAddress: form.shippingAddress.trim(),
            creditLimit: Number(form.creditLimit),
            paymentTermsDays: Number(form.paymentTermsDays),
        };

        try {
            if (editingId !== null) {
                await customerService.update(editingId, payload);
                setSuccess("Customer updated successfully.");
            } else {
                await customerService.create(payload);
                setSuccess("Customer created successfully.");
            }

            setShowForm(false);
            setForm(emptyForm);
            await loadCustomers();
        } catch (err) {
            setFormError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                "Unable to save customer. Check the submitted information."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDeactivate(customer) {
        const confirmed = window.confirm(
            `Deactivate ${customer.companyName}?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            await customerService.deactivate(customer.id);
            setSuccess(`${customer.companyName} was deactivated.`);
            await loadCustomers();
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                "Unable to deactivate customer."
            );
        }
    }

    async function handleSearch(event) {
        event.preventDefault();
        await loadCustomers(search);
    }

    return (
        <div className="customers-page">
            <header className="customers-topbar">
                <a href="/dashboard" className="back-link">
                    <ArrowLeft size={18} />
                    Dashboard
                </a>

                <div className="customers-brand">
                    <span className="brand-mark">N</span>
                    <span>NOVINTIX</span>
                </div>
            </header>

            <main className="customers-content">
                <div className="customers-heading">
                    <div>
                        <span className="eyebrow">CUSTOMER OPERATIONS</span>
                        <h1>Customers</h1>
                        <p>Manage hospitals, distributors, and their credit limits.</p>
                    </div>

                    <button className="primary-button" onClick={openCreateForm}>
                        <Plus size={18} />
                        Add customer
                    </button>
                </div>

                <section className="customers-summary">
                    <div className="summary-icon">
                        <Building2 size={22} />
                    </div>

                    <div>
                        <span>Total customers shown</span>
                        <strong>{customers.length}</strong>
                    </div>
                </section>

                {success && (
                    <div className="notice notice-success">{success}</div>
                )}

                {error && (
                    <div className="notice notice-error">{error}</div>
                )}

                <section className="customers-panel">
                    <form className="customer-search" onSubmit={handleSearch}>
                        <Search size={19} />

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by company name or customer code..."
                            aria-label="Search customers"
                        />

                        <button type="submit" className="secondary-button">
                            Search
                        </button>
                    </form>

                    {loading ? (
                        <div className="customer-state">Loading customers...</div>
                    ) : customers.length === 0 ? (
                        <div className="customer-state">
                            <Building2 size={36} />
                            <h3>No customers found</h3>
                            <p>Add a customer or try a different search.</p>
                        </div>
                    ) : (
                        <div className="customer-table-wrapper">
                            <table className="customer-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Code</th>
                                        <th>Type</th>
                                        <th>Contact</th>
                                        <th>Credit limit</th>
                                        <th>Terms</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {customers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td>
                                                <div className="customer-name">
                                                    {customer.companyName}
                                                </div>
                                                <div className="customer-email">
                                                    {customer.email}
                                                </div>
                                            </td>

                                            <td>{customer.customerCode}</td>
                                            <td>{customer.customerType}</td>
                                            <td>
                                                <div>{customer.contactPerson}</div>
                                                <div className="customer-email">
                                                    {customer.phone}
                                                </div>
                                            </td>

                                            <td>
                                                {Number(customer.creditLimit).toLocaleString(
                                                    "en-IN",
                                                    {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                            </td>

                                            <td>Net {customer.paymentTermsDays}</td>

                                            <td>
                                                <span
                                                    className={`status-pill ${customer.active ? "active" : "inactive"
                                                        }`}
                                                >
                                                    {customer.active ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="customer-actions">
                                                    <button
                                                        type="button"
                                                        className="icon-button"
                                                        title="Edit customer"
                                                        onClick={() => openEditForm(customer)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>

                                                    {customer.active && (
                                                        <button
                                                            type="button"
                                                            className="icon-button danger"
                                                            title="Deactivate customer"
                                                            onClick={() => handleDeactivate(customer)}
                                                        >
                                                            <Ban size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {showForm && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowForm(false);
                        }
                    }}
                >
                    <section
                        className="customer-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="customer-form-title"
                    >
                        <div className="modal-heading">
                            <div>
                                <span className="eyebrow">
                                    CUSTOMER INFORMATION
                                </span>

                                <h2 id="customer-form-title">
                                    {editingId !== null
                                        ? "Edit customer"
                                        : "Add customer"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="icon-button"
                                aria-label="Close form"
                                onClick={() => setShowForm(false)}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {formError && (
                            <div className="notice notice-error">{formError}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <label>
                                    Customer code *
                                    <input
                                        name="customerCode"
                                        value={form.customerCode}
                                        onChange={handleChange}
                                        maxLength={30}
                                        required
                                    />
                                </label>

                                <label>
                                    Company name *
                                    <input
                                        name="companyName"
                                        value={form.companyName}
                                        onChange={handleChange}
                                        maxLength={150}
                                        required
                                    />
                                </label>

                                <label>
                                    Customer type *
                                    <select
                                        name="customerType"
                                        value={form.customerType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="HOSPITAL">Hospital</option>
                                        <option value="DISTRIBUTOR">Distributor</option>
                                    </select>
                                </label>

                                <label>
                                    Contact person *
                                    <input
                                        name="contactPerson"
                                        value={form.contactPerson}
                                        onChange={handleChange}
                                        maxLength={100}
                                        required
                                    />
                                </label>

                                <label>
                                    Email *
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        maxLength={150}
                                        required
                                    />
                                </label>

                                <label>
                                    Phone *
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        minLength={7}
                                        maxLength={20}
                                        required
                                    />
                                </label>

                                <label>
                                    Credit limit (₹) *
                                    <input
                                        type="number"
                                        name="creditLimit"
                                        value={form.creditLimit}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </label>

                                <label>
                                    Payment terms (days) *
                                    <input
                                        type="number"
                                        name="paymentTermsDays"
                                        value={form.paymentTermsDays}
                                        onChange={handleChange}
                                        min="0"
                                        max="365"
                                        step="1"
                                        required
                                    />
                                </label>

                                <label className="full-width">
                                    Billing address *
                                    <textarea
                                        name="billingAddress"
                                        value={form.billingAddress}
                                        onChange={handleChange}
                                        maxLength={500}
                                        rows={2}
                                        required
                                    />
                                </label>

                                <label className="full-width">
                                    Shipping address *
                                    <textarea
                                        name="shippingAddress"
                                        value={form.shippingAddress}
                                        onChange={handleChange}
                                        maxLength={500}
                                        rows={2}
                                        required
                                    />
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setShowForm(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId !== null
                                            ? "Save changes"
                                            : "Create customer"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}