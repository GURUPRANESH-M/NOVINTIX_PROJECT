import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import {
    Building2,
    Plus,
    Search,
    Pencil,
    Ban,
    X,
    Tag,
    Check,
    RotateCcw,
    Percent,
    DollarSign
} from "lucide-react";

import customerService from "../services/customerService";
import contractService from "../services/contractService";

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

    // Negotiated Special Pricing Modal states
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [pricingCustomer, setPricingCustomer] = useState(null);
    const [pricingMatrix, setPricingMatrix] = useState([]);
    const [pricingLoading, setPricingLoading] = useState(false);
    const [editedPrices, setEditedPrices] = useState({});
    const [pricingSavingId, setPricingSavingId] = useState(null);

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
            await loadCustomers();
        } catch (err) {
            setFormError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                "Unable to save customer. Please check the values and try again."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDeactivate(customer) {
        const confirmed = window.confirm(
            `Are you sure you want to deactivate ${customer.companyName}?`
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

    // SPECIAL PRICING MODAL HANDLERS
    async function openPricingModal(customer) {
        setPricingCustomer(customer);
        setShowPricingModal(true);
        setPricingLoading(true);
        try {
            const res = await contractService.getPricingMatrix(customer.id);
            const matrix = res.data || [];
            setPricingMatrix(matrix);

            // Populate initial input values
            const initialMap = {};
            matrix.forEach((item) => {
                initialMap[item.productId] = item.negotiatedPrice != null ? String(item.negotiatedPrice) : "";
            });
            setEditedPrices(initialMap);
        } catch (err) {
            console.error("Failed to load customer pricing matrix", err);
        } finally {
            setPricingLoading(false);
        }
    }

    async function handleSaveSpecialPrice(item) {
        const inputVal = editedPrices[item.productId];
        if (!inputVal || Number(inputVal) <= 0) {
            alert("Please enter a valid price greater than zero.");
            return;
        }

        setPricingSavingId(item.productId);
        try {
            await contractService.save({
                customerId: pricingCustomer.id,
                productId: item.productId,
                contractPrice: Number(inputVal),
            });
            // Refresh matrix
            const res = await contractService.getPricingMatrix(pricingCustomer.id);
            setPricingMatrix(res.data || []);
            setSuccess(`Special price of $${Number(inputVal).toFixed(2)} agreed for ${item.productName}!`);
        } catch (err) {
            alert("Failed to save special contract price.");
        } finally {
            setPricingSavingId(null);
        }
    }

    async function handleResetToStandard(item) {
        if (!item.contractPriceId) return;
        const confirmReset = window.confirm(`Reset ${item.productName} back to standard catalog price of $${item.standardPrice}?`);
        if (!confirmReset) return;

        setPricingSavingId(item.productId);
        try {
            await contractService.delete(item.contractPriceId);
            const res = await contractService.getPricingMatrix(pricingCustomer.id);
            setPricingMatrix(res.data || []);
            setEditedPrices((prev) => ({ ...prev, [item.productId]: "" }));
            setSuccess(`Reset ${item.productName} to standard catalog price.`);
        } catch (err) {
            alert("Failed to reset price.");
        } finally {
            setPricingSavingId(null);
        }
    }

    return (
        <div className="customers-page">
            <Navbar />

            <main className="customers-content">
                <div className="customers-heading">
                    <div>
                        <span className="eyebrow">CUSTOMER OPERATIONS</span>
                        <h1>Customers</h1>
                        <p>Manage hospitals, distributors, credit limits, and negotiated contract prices.</p>
                    </div>

                    <button className="primary-button" onClick={openCreateForm}>
                        <Plus size={18} />
                        Add customer
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-banner" style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#15803d", marginBottom: "20px" }}>{success}</div>}

                <section className="customers-toolbar">
                    <form onSubmit={handleSearch} className="search-form">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or customer code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                </section>

                <section className="customers-table-section">
                    {loading ? (
                        <div className="empty-state">
                            <p>Loading customers...</p>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="empty-state">
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
                                            <td>
                                                <span style={{
                                                    padding: "3px 8px",
                                                    borderRadius: "12px",
                                                    fontSize: "11px",
                                                    fontWeight: "700",
                                                    backgroundColor: customer.customerType === "HOSPITAL" ? "#eff6ff" : "#fef3c7",
                                                    color: customer.customerType === "HOSPITAL" ? "#1d4ed8" : "#b45309"
                                                }}>
                                                    {customer.customerType}
                                                </span>
                                            </td>
                                            <td>
                                                <div>{customer.contactPerson}</div>
                                                <div className="customer-email">
                                                    {customer.phone}
                                                </div>
                                            </td>

                                            <td style={{ fontWeight: "700", color: "#0f172a" }}>
                                                ${Number(customer.creditLimit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>

                                            <td>Net {customer.paymentTermsDays}</td>

                                            <td>
                                                <span
                                                    className={`status-pill ${customer.active ? "active" : "inactive"}`}
                                                >
                                                    {customer.active ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="customer-actions" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                    {/* NEGOTIATED CONTRACT PRICING BUTTON */}
                                                    <button
                                                        type="button"
                                                        className="icon-button"
                                                        title="Negotiate Special Contract Prices"
                                                        onClick={() => openPricingModal(customer)}
                                                        style={{
                                                            color: "#2563eb",
                                                            backgroundColor: "#eff6ff",
                                                            border: "1px solid #bfdbfe",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            padding: "5px 9px",
                                                            borderRadius: "6px",
                                                            fontSize: "12px",
                                                            fontWeight: "600",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        <Tag size={14} />
                                                        <span>Special Pricing</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="icon-button"
                                                        title="Edit customer details"
                                                        onClick={() => openEditForm(customer)}
                                                    >
                                                        <Pencil size={15} />
                                                    </button>

                                                    {customer.active && (
                                                        <button
                                                            type="button"
                                                            className="icon-button danger"
                                                            title="Deactivate customer"
                                                            onClick={() => handleDeactivate(customer)}
                                                        >
                                                            <Ban size={15} />
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

            {/* CREATE / EDIT CUSTOMER MODAL */}
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
                            <div className="error-message">{formError}</div>
                        )}

                        <form onSubmit={handleSubmit} className="customer-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="customerCode">
                                        Customer code *
                                    </label>
                                    <input
                                        id="customerCode"
                                        name="customerCode"
                                        type="text"
                                        required
                                        value={form.customerCode}
                                        onChange={handleChange}
                                        placeholder="e.g. CUST-HOSP-01"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="companyName">
                                        Company / Facility name *
                                    </label>
                                    <input
                                        id="companyName"
                                        name="companyName"
                                        type="text"
                                        required
                                        value={form.companyName}
                                        onChange={handleChange}
                                        placeholder="e.g. Apollo City Hospital"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="customerType">
                                        Customer type *
                                    </label>
                                    <select
                                        id="customerType"
                                        name="customerType"
                                        value={form.customerType}
                                        onChange={handleChange}
                                    >
                                        <option value="HOSPITAL">
                                            Hospital
                                        </option>
                                        <option value="DISTRIBUTOR">
                                            Distributor
                                        </option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="contactPerson">
                                        Contact person *
                                    </label>
                                    <input
                                        id="contactPerson"
                                        name="contactPerson"
                                        type="text"
                                        required
                                        value={form.contactPerson}
                                        onChange={handleChange}
                                        placeholder="Dr. Rajesh Sharma"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email *</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="purchase@facility.org"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone *</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        required
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98450 11223"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="creditLimit">
                                        Credit limit ($) *
                                    </label>
                                    <input
                                        id="creditLimit"
                                        name="creditLimit"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={form.creditLimit}
                                        onChange={handleChange}
                                        placeholder="10000.00"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="paymentTermsDays">
                                        Payment terms (Days) *
                                    </label>
                                    <input
                                        id="paymentTermsDays"
                                        name="paymentTermsDays"
                                        type="number"
                                        min="0"
                                        required
                                        value={form.paymentTermsDays}
                                        onChange={handleChange}
                                        placeholder="30"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="billingAddress">
                                        Billing address *
                                    </label>
                                    <input
                                        id="billingAddress"
                                        name="billingAddress"
                                        type="text"
                                        required
                                        value={form.billingAddress}
                                        onChange={handleChange}
                                        placeholder="14 Greams Road, Chennai"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="shippingAddress">
                                        Shipping address *
                                    </label>
                                    <input
                                        id="shippingAddress"
                                        name="shippingAddress"
                                        type="text"
                                        required
                                        value={form.shippingAddress}
                                        onChange={handleChange}
                                        placeholder="Central Medical Store Receiving, Gate 2"
                                    />
                                </div>
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

            {/* SPECIAL NEGOTIATED CONTRACT PRICING MODAL */}
            {showPricingModal && pricingCustomer && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: "20px",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "14px",
                            width: "100%",
                            maxWidth: "850px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            padding: "30px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                            <div>
                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", letterSpacing: "1px", textTransform: "uppercase" }}>
                                    CONTRACT PRICING AGREEMENT
                                </span>
                                <h2 style={{ margin: "4px 0", fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
                                    Special Negotiated Prices for {pricingCustomer.companyName}
                                </h2>
                                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                                    Set customer-specific contract prices. When placing orders, the system automatically uses these negotiated rates instead of the standard catalog price.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowPricingModal(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {pricingLoading ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                Loading pricing matrix...
                            </div>
                        ) : pricingMatrix.length === 0 ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                No products found in the catalog.
                            </div>
                        ) : (
                            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                            <th style={{ padding: "12px 16px", fontWeight: "600" }}>Product</th>
                                            <th style={{ padding: "12px 16px", fontWeight: "600" }}>Standard Catalog Price</th>
                                            <th style={{ padding: "12px 16px", fontWeight: "600" }}>Negotiated Special Price</th>
                                            <th style={{ padding: "12px 16px", fontWeight: "600" }}>Discount / Terms</th>
                                            <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pricingMatrix.map((item) => {
                                            const enteredVal = editedPrices[item.productId] ?? "";
                                            const isSaving = pricingSavingId === item.productId;
                                            const standard = Number(item.standardPrice) || 0;
                                            const enteredNum = Number(enteredVal) || 0;
                                            const liveDiscount = (standard > 0 && enteredNum > 0)
                                                ? Math.round(((standard - enteredNum) / standard) * 100)
                                                : 0;

                                            return (
                                                <tr key={item.productId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                    <td style={{ padding: "12px 16px" }}>
                                                        <div style={{ fontWeight: "700", color: "#1e293b" }}>{item.productName}</div>
                                                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{item.productCode}</span>
                                                    </td>

                                                    <td style={{ padding: "12px 16px", color: "#64748b", fontWeight: "600" }}>
                                                        ${standard.toFixed(2)}
                                                    </td>

                                                    <td style={{ padding: "12px 16px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <span style={{ color: "#64748b", fontWeight: "700" }}>$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0.01"
                                                                placeholder={standard.toFixed(2)}
                                                                value={enteredVal}
                                                                onChange={(e) => {
                                                                    setEditedPrices({
                                                                        ...editedPrices,
                                                                        [item.productId]: e.target.value,
                                                                    });
                                                                }}
                                                                style={{
                                                                    width: "110px",
                                                                    padding: "6px 10px",
                                                                    borderRadius: "6px",
                                                                    border: item.hasSpecialPrice ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                                                                    fontWeight: "700",
                                                                    fontSize: "14px",
                                                                    color: item.hasSpecialPrice ? "#1d4ed8" : "#0f172a",
                                                                    backgroundColor: item.hasSpecialPrice ? "#eff6ff" : "white",
                                                                }}
                                                            />
                                                        </div>
                                                    </td>

                                                    <td style={{ padding: "12px 16px" }}>
                                                        {item.hasSpecialPrice ? (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                <span style={{
                                                                    padding: "3px 8px",
                                                                    borderRadius: "12px",
                                                                    fontSize: "11px",
                                                                    fontWeight: "700",
                                                                    backgroundColor: item.discountPercentage > 0 ? "#ecfdf5" : "#f1f5f9",
                                                                    color: item.discountPercentage > 0 ? "#059669" : "#475569"
                                                                }}>
                                                                    {item.discountPercentage > 0 ? `${item.discountPercentage}% OFF` : "Contract Active"}
                                                                </span>
                                                            </div>
                                                        ) : enteredNum > 0 && enteredNum < standard ? (
                                                            <span style={{ fontSize: "11px", color: "#d97706", fontWeight: "600" }}>
                                                                Will save {liveDiscount}%
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Standard List Rate</span>
                                                        )}
                                                    </td>

                                                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                                        <div style={{ display: "inline-flex", gap: "6px" }}>
                                                            <button
                                                                type="button"
                                                                disabled={isSaving || !enteredVal}
                                                                onClick={() => handleSaveSpecialPrice(item)}
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                    padding: "6px 12px",
                                                                    borderRadius: "6px",
                                                                    border: "none",
                                                                    backgroundColor: "#2563eb",
                                                                    color: "white",
                                                                    fontSize: "12px",
                                                                    fontWeight: "700",
                                                                    cursor: isSaving || !enteredVal ? "not-allowed" : "pointer",
                                                                    opacity: isSaving || !enteredVal ? 0.6 : 1,
                                                                }}
                                                            >
                                                                <Check size={13} />
                                                                {isSaving ? "Saving..." : "Save Agreement"}
                                                            </button>

                                                            {item.hasSpecialPrice && (
                                                                <button
                                                                    type="button"
                                                                    disabled={isSaving}
                                                                    onClick={() => handleResetToStandard(item)}
                                                                    style={{
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        gap: "4px",
                                                                        padding: "6px 10px",
                                                                        borderRadius: "6px",
                                                                        border: "1px solid #e2e8f0",
                                                                        backgroundColor: "white",
                                                                        color: "#64748b",
                                                                        fontSize: "12px",
                                                                        fontWeight: "600",
                                                                        cursor: isSaving ? "not-allowed" : "pointer",
                                                                    }}
                                                                    title="Revert back to catalog list price"
                                                                >
                                                                    <RotateCcw size={13} />
                                                                    Reset
                                                                </button>
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

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                            <button
                                type="button"
                                onClick={() => setShowPricingModal(false)}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    backgroundColor: "white",
                                    color: "#475569",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
