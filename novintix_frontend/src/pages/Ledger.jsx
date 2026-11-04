import { useEffect, useState } from "react";
import {
  BookOpen,
  DollarSign,
  CreditCard,
  TrendingUp,
  Package,
  PlusCircle,
  RotateCcw,
  CheckCircle,
  FileText,
  AlertCircle,
  X
} from "lucide-react";
import Navbar from "../components/Navbar";
import customerService from "../services/customerService";
import ledgerService from "../services/ledgerService";
import invoiceService from "../services/invoiceService";
import paymentService from "../services/paymentService";
import creditNoteService from "../services/creditNoteService";
import productService from "../services/productService";

export default function Ledger() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [ledgerData, setLedgerData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);

  // Payment Form state
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "",
    amount: "",
    paymentMethod: "BANK_TRANSFER",
    referenceNumber: "",
    notes: "",
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Credit Note Form state
  const [creditNoteForm, setCreditNoteForm] = useState({
    invoiceId: "",
    reason: "Damaged in transit during cold-chain shipping",
    items: [{ productId: "", quantity: 1, unitPrice: 0, conditionReason: "DAMAGED" }],
  });
  const [submittingCreditNote, setSubmittingCreditNote] = useState(false);

  // Load customers on mount
  useEffect(() => {
    async function init() {
      try {
        const [custRes, prodRes] = await Promise.all([
          customerService.getAll(),
          productService.getAll(),
        ]);
        const custList = custRes.data || [];
        setCustomers(custList);
        setProducts(prodRes.data || []);
        if (custList.length > 0) {
          setSelectedCustomerId(custList[0].id);
          loadCustomerLedger(custList[0].id);
        }
      } catch (err) {
        setError("Failed to load customers.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadCustomerLedger(customerId) {
    if (!customerId) return;
    setLoading(true);
    try {
      const [ledgerRes, invRes] = await Promise.all([
        ledgerService.getByCustomer(customerId),
        invoiceService.getAll(customerId),
      ]);
      setLedgerData(ledgerRes.data);
      setInvoices(invRes.data || []);
    } catch (err) {
      setError("Failed to load customer ledger.");
    } finally {
      setLoading(false);
    }
  }

  function handleCustomerSelect(id) {
    setSelectedCustomerId(id);
    loadCustomerLedger(id);
  }

  // Handle Payment Submit
  async function handleRecordPayment(e) {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    setSubmittingPayment(true);
    try {
      await paymentService.create({
        customerId: Number(selectedCustomerId),
        invoiceId: paymentForm.invoiceId ? Number(paymentForm.invoiceId) : null,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber || "REF-" + Date.now(),
        notes: paymentForm.notes,
      });

      setShowPaymentModal(false);
      setPaymentForm({
        invoiceId: "",
        amount: "",
        paymentMethod: "BANK_TRANSFER",
        referenceNumber: "",
        notes: "",
      });
      setSuccess("Payment successfully recorded and posted to ledger.");
      loadCustomerLedger(selectedCustomerId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmittingPayment(false);
    }
  }

  // Handle Credit Note Submit (Damaged / Near Expiry)
  async function handleIssueCreditNote(e) {
    e.preventDefault();
    const validItems = creditNoteForm.items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      alert("Please specify at least one returned product.");
      return;
    }

    setSubmittingCreditNote(true);
    try {
      await creditNoteService.create({
        customerId: Number(selectedCustomerId),
        invoiceId: creditNoteForm.invoiceId ? Number(creditNoteForm.invoiceId) : null,
        reason: creditNoteForm.reason,
        items: validItems.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          conditionReason: i.conditionReason,
        })),
      });

      setShowCreditNoteModal(false);
      setCreditNoteForm({
        invoiceId: "",
        reason: "Damaged in transit during cold-chain shipping",
        items: [{ productId: "", quantity: 1, unitPrice: 0, conditionReason: "DAMAGED" }],
      });
      setSuccess("Credit Note issued for returned goods! Ledger credited.");
      loadCustomerLedger(selectedCustomerId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to issue credit note.");
    } finally {
      setSubmittingCreditNote(false);
    }
  }

  const creditLimit = Number(ledgerData?.creditLimit || 0);
  const totalExposure = Number(ledgerData?.totalExposure || 0);
  const availableCredit = Number(ledgerData?.availableCredit || 0);
  const unpaidBalance = Number(ledgerData?.unpaidInvoicesBalance || 0);
  const openOrders = Number(ledgerData?.openOrdersValue || 0);
  const utilization = creditLimit > 0 ? Math.min(100, Math.round((totalExposure / creditLimit) * 100)) : 0;

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="customers-content" style={{ maxWidth: "1350px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Top Header */}
        <div className="customers-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <span className="eyebrow">FINANCIAL AUDIT TRAIL</span>
            <h1 style={{ fontSize: "32px", margin: "6px 0", fontWeight: "800", color: "#111827" }}>
              Customer Ledger & Credit Exposure
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>
              Chronological money trail: Invoices (Debits), Payments & Credit Notes (Credits), and Net Balances.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setShowCreditNoteModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 16px",
                backgroundColor: "#fff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                color: "#475569",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={15} color="#7c3aed" />
              Issue Credit Note (Returns)
            </button>

            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 18px",
                backgroundColor: "#059669",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                color: "white",
                cursor: "pointer",
              }}
            >
              <DollarSign size={16} />
              Record Payment
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", marginBottom: "20px" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#15803d", marginBottom: "20px" }}>
            {success}
          </div>
        )}

        {/* Customer Selector Ribbon */}
        <div style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Select Customer Account:
            </span>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {customers.map((c) => {
                const isSelected = String(c.id) === String(selectedCustomerId);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCustomerSelect(c.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      backgroundColor: isSelected ? "#eff6ff" : "white",
                      color: isSelected ? "#1d4ed8" : "#475569",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{c.companyName}</span>
                    <span style={{ fontSize: "11px", opacity: 0.7 }}>({c.customerType})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Credit Exposure & Balance KPI Cards */}
        {ledgerData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {/* Card 1: Credit Limit */}
            <div style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Credit Limit</span>
                <CreditCard size={18} color="#2563eb" />
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
                ${creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Authorized credit threshold
              </span>
            </div>

            {/* Card 2: Net Unpaid Invoices */}
            <div style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Net Receivables</span>
                <DollarSign size={18} color="#e11d48" />
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#e11d48" }}>
                ${unpaidBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Invoiced minus Payments & Returns
              </span>
            </div>

            {/* Card 3: Open Orders Commitment */}
            <div style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Open Orders</span>
                <Package size={18} color="#d97706" />
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#d97706" }}>
                ${openOrders.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Un-invoiced committed orders
              </span>
            </div>

            {/* Card 4: Total Exposure & Available Credit */}
            <div style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Available Credit</span>
                <TrendingUp size={18} color={availableCredit <= 0 ? "#dc2626" : "#059669"} />
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: availableCredit <= 0 ? "#dc2626" : "#059669" }}>
                ${availableCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                  <span>Exposure: ${totalExposure.toLocaleString()}</span>
                  <span>{utilization}% used</span>
                </div>
                <div style={{ height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${utilization}%`,
                      backgroundColor: utilization >= 100 ? "#dc2626" : utilization > 75 ? "#d97706" : "#2563eb",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ledger Statement Table */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                Account Statement & Money Trail
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                All shipments invoiced, payments recorded, and credit notes for returned goods
              </span>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 18px", fontWeight: "600" }}>Date</th>
                <th style={{ padding: "12px 18px", fontWeight: "600" }}>Type</th>
                <th style={{ padding: "12px 18px", fontWeight: "600" }}>Reference</th>
                <th style={{ padding: "12px 18px", fontWeight: "600" }}>Description</th>
                <th style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>Debit (+)</th>
                <th style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>Credit (-)</th>
                <th style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    Loading ledger statement...
                  </td>
                </tr>
              ) : !ledgerData?.entries || ledgerData.entries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    No financial transactions recorded for this customer yet.
                  </td>
                </tr>
              ) : (
                ledgerData.entries.map((entry, idx) => {
                  const isInvoice = entry.transactionType === "INVOICE";
                  const isPayment = entry.transactionType === "PAYMENT";
                  const isCreditNote = entry.transactionType === "CREDIT_NOTE";

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 18px", color: "#64748b", whiteSpace: "nowrap" }}>
                        {new Date(entry.date).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        {isInvoice && (
                          <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", backgroundColor: "#eff6ff", color: "#2563eb" }}>
                            INVOICE
                          </span>
                        )}
                        {isPayment && (
                          <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", backgroundColor: "#ecfdf5", color: "#059669" }}>
                            PAYMENT
                          </span>
                        )}
                        {isCreditNote && (
                          <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
                            CREDIT NOTE
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 18px", fontWeight: "700", color: "#1e293b" }}>
                        {entry.referenceNumber}
                      </td>
                      <td style={{ padding: "12px 18px", color: "#475569" }}>
                        {entry.description}
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", color: Number(entry.debit) > 0 ? "#0f172a" : "#94a3b8" }}>
                        {Number(entry.debit) > 0 ? `$${Number(entry.debit).toFixed(2)}` : "—"}
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", color: Number(entry.credit) > 0 ? "#059669" : "#94a3b8" }}>
                        {Number(entry.credit) > 0 ? `-$${Number(entry.credit).toFixed(2)}` : "—"}
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: "800", color: Number(entry.runningBalance) > 0 ? "#e11d48" : "#059669" }}>
                        ${Number(entry.runningBalance).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* RECORD PAYMENT MODAL */}
        {showPaymentModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ backgroundColor: "white", borderRadius: "14px", width: "100%", maxWidth: "550px", padding: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>Record Customer Payment</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                    Account: <strong>{ledgerData?.companyName}</strong>
                  </p>
                </div>
                <button type="button" onClick={() => setShowPaymentModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRecordPayment}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Apply to Invoice (Optional)
                  </label>
                  <select
                    value={paymentForm.invoiceId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="">-- General Account Payment --</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} (Total: ${inv.totalAmount}, Due: ${inv.balanceDue}) - {inv.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                      Amount Received ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                      <option value="CHECK">Cheque</option>
                      <option value="ONLINE">Online Portal</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Reference / Transaction #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-9988223311"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", cursor: "pointer", fontWeight: "600" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    style={{ padding: "8px 20px", borderRadius: "6px", border: "none", backgroundColor: "#059669", color: "white", cursor: "pointer", fontWeight: "700" }}
                  >
                    {submittingPayment ? "Posting..." : "Confirm & Post Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ISSUE CREDIT NOTE MODAL (DAMAGED / NEAR EXPIRY) */}
        {showCreditNoteModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ backgroundColor: "white", borderRadius: "14px", width: "100%", maxWidth: "680px", padding: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>Issue Credit Note (Returns)</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                    Problem rule: Damaged or near-expiry goods returned require credit notes to clear the money trail.
                  </p>
                </div>
                <button type="button" onClick={() => setShowCreditNoteModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleIssueCreditNote}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Return Reason
                  </label>
                  <input
                    type="text"
                    value={creditNoteForm.reason}
                    onChange={(e) => setCreditNoteForm({ ...creditNoteForm, reason: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                    Returned Product Details:
                  </label>

                  {creditNoteForm.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const p = products.find((prod) => String(prod.id) === String(pId));
                          const updated = [...creditNoteForm.items];
                          updated[idx] = {
                            ...updated[idx],
                            productId: pId,
                            unitPrice: p ? p.standardPrice : 0,
                          };
                          setCreditNoteForm({ ...creditNoteForm, items: updated });
                        }}
                        style={{ flex: 3, padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        required
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (${p.standardPrice})
                          </option>
                        ))}
                      </select>

                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...creditNoteForm.items];
                            updated[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setCreditNoteForm({ ...creditNoteForm, items: updated });
                          }}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                          required
                        />
                      </div>

                      <div style={{ flex: 1.5 }}>
                        <select
                          value={item.conditionReason}
                          onChange={(e) => {
                            const updated = [...creditNoteForm.items];
                            updated[idx].conditionReason = e.target.value;
                            setCreditNoteForm({ ...creditNoteForm, items: updated });
                          }}
                          style={{ width: "100%", padding: "8px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        >
                          <option value="DAMAGED">Damaged Goods</option>
                          <option value="NEAR_EXPIRY">Near Expiry</option>
                        </select>
                      </div>

                      <div style={{ flex: 1.5, textAlign: "right", fontSize: "13px", fontWeight: "700" }}>
                        ${((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreditNoteModal(false)}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", cursor: "pointer", fontWeight: "600" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCreditNote}
                    style={{ padding: "8px 20px", borderRadius: "6px", border: "none", backgroundColor: "#7c3aed", color: "white", cursor: "pointer", fontWeight: "700" }}
                  >
                    {submittingCreditNote ? "Issuing..." : "Issue Credit Note"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

