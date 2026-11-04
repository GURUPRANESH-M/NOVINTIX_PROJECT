import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Truck,
  FileText,
  Clock,
  X,
  ShieldAlert,
  Unlock,
  ChevronRight
} from "lucide-react";
import Navbar from "../components/Navbar";
import orderService from "../services/orderService";
import customerService from "../services/customerService";
import productService from "../services/productService";
import contractService from "../services/contractService";
import shipmentService from "../services/shipmentService";
import ledgerService from "../services/ledgerService";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Create Order Form state
  const [orderCustomer, setOrderCustomer] = useState("");
  const [customerCreditInfo, setCustomerCreditInfo] = useState(null);
  const [orderItems, setOrderItems] = useState([{ productId: "", quantity: 1, unitPrice: 0 }]);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Shipment Form state
  const [shipmentData, setShipmentData] = useState({
    carrier: "Express Medical Logistics",
    trackingNumber: "",
    notes: "",
    items: [],
  });
  const [submittingShipment, setSubmittingShipment] = useState(false);

  // Load initial data
  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [ordersRes, custRes, prodRes] = await Promise.all([
        orderService.getAll(),
        customerService.getAll(),
        productService.getAll(),
      ]);
      setOrders(ordersRes.data || []);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      setError("Failed to load orders or catalog data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // When customer changes in Create Order modal
  async function handleCustomerChange(customerId) {
    setOrderCustomer(customerId);
    setCustomerCreditInfo(null);
    setContracts([]);

    if (!customerId) return;

    try {
      const [ledgerRes, contractsRes] = await Promise.all([
        ledgerService.getByCustomer(customerId),
        contractService.getByCustomer(customerId),
      ]);
      setCustomerCreditInfo(ledgerRes.data);
      setContracts(contractsRes.data || []);

      // Re-evaluate current line items prices
      setOrderItems((prev) =>
        prev.map((item) => {
          if (!item.productId) return item;
          const price = resolveItemPrice(item.productId, contractsRes.data || []);
          return { ...item, unitPrice: price };
        })
      );
    } catch (err) {
      console.error("Failed to load customer credit details", err);
    }
  }

  function resolveItemPrice(productId, contractList = contracts) {
    const matchedContract = contractList.find(
      (c) => String(c.productId) === String(productId) && c.active
    );
    if (matchedContract) {
      return matchedContract.contractPrice;
    }
    const standardProd = products.find((p) => String(p.id) === String(productId));
    return standardProd ? standardProd.standardPrice : 0;
  }

  function handleProductSelect(index, productId) {
    const price = resolveItemPrice(productId);
    const updated = [...orderItems];
    updated[index] = {
      ...updated[index],
      productId,
      unitPrice: price,
    };
    setOrderItems(updated);
  }

  function handleQuantityChange(index, qty) {
    const updated = [...orderItems];
    updated[index].quantity = Math.max(1, parseInt(qty, 10) || 1);
    setOrderItems(updated);
  }

  function addItemRow() {
    setOrderItems([...orderItems, { productId: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItemRow(index) {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }

  // Calculate projected exposure
  const newOrderTotal = orderItems.reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);

  const currentExposure = customerCreditInfo ? Number(customerCreditInfo.totalExposure) || 0 : 0;
  const creditLimit = customerCreditInfo ? Number(customerCreditInfo.creditLimit) || 0 : 0;
  const projectedExposure = currentExposure + newOrderTotal;
  const willExceedLimit = customerCreditInfo && projectedExposure > creditLimit;
  const landsExactlyOnLimit = customerCreditInfo && projectedExposure === creditLimit && newOrderTotal > 0;

  async function handleCreateOrder(e) {
    e.preventDefault();
    if (!orderCustomer) {
      alert("Please select a customer.");
      return;
    }
    const validItems = orderItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      alert("Please add at least one valid product line.");
      return;
    }

    setSubmittingOrder(true);
    setError("");
    try {
      const payload = {
        customerId: Number(orderCustomer),
        items: validItems.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
        })),
      };

      const res = await orderService.create(payload);
      setShowCreateModal(false);
      setOrderItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
      setOrderCustomer("");

      if (res.data.status === "ON_HOLD") {
        setSuccess(`Order ${res.data.orderNumber} created and placed ON HOLD due to Credit Limit Exceeded.`);
      } else {
        setSuccess(`Order ${res.data.orderNumber} created successfully with status APPROVED!`);
      }
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || "Failed to create order.");
    } finally {
      setSubmittingOrder(false);
    }
  }

  // Shipment Preparation
  function openShipmentModal(order) {
    setSelectedOrder(order);
    const initialItems = order.items
      .filter((i) => i.remainingQuantity > 0)
      .map((i) => ({
        orderItemId: i.id,
        productName: i.productName,
        orderedQuantity: i.quantity,
        remainingQuantity: i.remainingQuantity,
        quantityShipped: i.remainingQuantity, // Default to ship remaining, user can adjust down for partial
      }));

    setShipmentData({
      carrier: "BlueDart Healthcare Logistics",
      trackingNumber: "TRK-" + Math.floor(100000 + Math.random() * 900000),
      notes: "Standard cold-chain shipment",
      items: initialItems,
    });
    setShowShipModal(true);
  }

  async function handleDispatchShipment(e) {
    e.preventDefault();
    const itemsToShip = shipmentData.items.filter((i) => Number(i.quantityShipped) > 0);
    if (itemsToShip.length === 0) {
      alert("Please specify a quantity to ship greater than 0.");
      return;
    }

    setSubmittingShipment(true);
    try {
      const payload = {
        orderId: selectedOrder.id,
        carrier: shipmentData.carrier,
        trackingNumber: shipmentData.trackingNumber,
        notes: shipmentData.notes,
        items: itemsToShip.map((i) => ({
          orderItemId: i.orderItemId,
          quantityShipped: Number(i.quantityShipped),
        })),
      };

      const res = await shipmentService.create(payload);
      setShowShipModal(false);
      setSuccess(
        `Shipment ${res.data.shipmentNumber} dispatched! Invoice ${res.data.invoiceNumber || ""} automatically generated for shipped items.`
      );
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to dispatch shipment.");
    } finally {
      setSubmittingShipment(false);
    }
  }

  async function handleReleaseHold(orderId) {
    if (!window.confirm("Are you sure you want to approve this order from Credit Hold?")) return;
    try {
      await orderService.releaseHold(orderId);
      setSuccess("Order hold successfully released and marked as Approved.");
      loadData();
    } catch (err) {
      setError("Failed to release order hold.");
    }
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === "ALL" || order.status === filterStatus;
    const matchesSearch =
      (order.orderNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (order.customerName || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="customers-content" style={{ maxWidth: "1350px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Top Header */}
        <div className="customers-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <span className="eyebrow">SALES & CREDIT OPERATIONS</span>
            <h1 style={{ fontSize: "32px", margin: "6px 0", fontWeight: "800", color: "#111827" }}>
              Orders & Fulfillment
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>
              Automatic contract pricing, real-time credit limit evaluation, and partial shipment dispatch.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setShowCreateModal(true);
              handleCustomerChange(customers[0]?.id || "");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
            Create Sales Order
          </button>
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

        {/* Filter Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { id: "ALL", label: "All Orders" },
              { id: "APPROVED", label: "Approved" },
              { id: "ON_HOLD", label: "On Hold (Credit Risk)" },
              { id: "PARTIALLY_SHIPPED", label: "Partially Shipped" },
              { id: "FULFILLED", label: "Fulfilled" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: filterStatus === tab.id ? "1px solid #2563eb" : "1px solid #e2e8f0",
                  backgroundColor: filterStatus === tab.id ? "#eff6ff" : "white",
                  color: filterStatus === tab.id ? "#2563eb" : "#64748b",
                  fontWeight: filterStatus === tab.id ? "700" : "500",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by order or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
              }}
            />
          </div>
        </div>

        {/* Orders Table */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "14px 18px", fontWeight: "600" }}>Order #</th>
                <th style={{ padding: "14px 18px", fontWeight: "600" }}>Date</th>
                <th style={{ padding: "14px 18px", fontWeight: "600" }}>Customer</th>
                <th style={{ padding: "14px 18px", fontWeight: "600" }}>Amount</th>
                <th style={{ padding: "14px 18px", fontWeight: "600" }}>Status</th>
                <th style={{ padding: "14px 18px", fontWeight: "600" }}>Items Summary</th>
                <th style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    No orders found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isHold = order.status === "ON_HOLD";
                  const isApproved = order.status === "APPROVED";
                  const isPartial = order.status === "PARTIALLY_SHIPPED";
                  const isFulfilled = order.status === "FULFILLED";

                  return (
                    <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 18px", fontWeight: "700", color: "#1e293b" }}>
                        {order.orderNumber}
                      </td>
                      <td style={{ padding: "14px 18px", color: "#64748b" }}>
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: "600", color: "#1e293b" }}>{order.customerName}</div>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{order.customerCode}</span>
                      </td>
                      <td style={{ padding: "14px 18px", fontWeight: "700", color: "#0f172a" }}>
                        ${Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        {isApproved && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", backgroundColor: "#ecfdf5", color: "#059669" }}>
                            <CheckCircle size={13} /> Approved
                          </span>
                        )}
                        {isHold && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", backgroundColor: "#fef2f2", color: "#dc2626" }} title={order.holdReason}>
                            <AlertTriangle size={13} /> Credit Hold
                          </span>
                        )}
                        {isPartial && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", backgroundColor: "#fffbeb", color: "#d97706" }}>
                            <Truck size={13} /> Partially Shipped
                          </span>
                        )}
                        {isFulfilled && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", backgroundColor: "#eff6ff", color: "#2563eb" }}>
                            Fulfilled
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: "13px", color: "#475569" }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx}>
                            {item.quantity}x {item.productName} ({item.shippedQuantity || 0} shipped)
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          {isHold && (
                            <button
                              type="button"
                              onClick={() => handleReleaseHold(order.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #fecaca",
                                backgroundColor: "#fff1f2",
                                color: "#e11d48",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                              title="Override and approve hold"
                            >
                              <Unlock size={13} /> Release Hold
                            </button>
                          )}

                          {(isApproved || isPartial) && (
                            <button
                              type="button"
                              onClick={() => openShipmentModal(order)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #93c5fd",
                                backgroundColor: "#eff6ff",
                                color: "#1d4ed8",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              <Truck size={13} /> Dispatch Shipment
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              backgroundColor: "white",
                              color: "#475569",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* CREATE ORDER MODAL */}
        {showCreateModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ backgroundColor: "white", borderRadius: "14px", width: "100%", maxWidth: "780px", maxHeight: "90vh", overflowY: "auto", padding: "30px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Create Sales Order</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                    Select a customer to evaluate contract pricing and credit exposure in real-time.
                  </p>
                </div>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateOrder}>
                {/* Customer Selector */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Select Customer
                  </label>
                  <select
                    value={orderCustomer}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    required
                  >
                    <option value="">-- Choose Hospital or Distributor --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.customerType}) — Limit: ${Number(c.creditLimit).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Live Credit Exposure Card */}
                {customerCreditInfo && (
                  <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", textAlign: "center" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Credit Limit</span>
                        <div style={{ fontWeight: "700", fontSize: "16px", color: "#1e293b" }}>
                          ${creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Unpaid Invoices</span>
                        <div style={{ fontWeight: "700", fontSize: "16px", color: "#e11d48" }}>
                          ${Number(customerCreditInfo.unpaidInvoicesBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Open Orders</span>
                        <div style={{ fontWeight: "700", fontSize: "16px", color: "#d97706" }}>
                          ${Number(customerCreditInfo.openOrdersValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Available Credit</span>
                        <div style={{ fontWeight: "700", fontSize: "16px", color: Number(customerCreditInfo.availableCredit) <= 0 ? "#dc2626" : "#059669" }}>
                          ${Number(customerCreditInfo.availableCredit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Line Items */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Order Line Items</label>
                    <button
                      type="button"
                      onClick={addItemRow}
                      style={{ fontSize: "12px", fontWeight: "600", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}
                    >
                      + Add Item
                    </button>
                  </div>

                  {orderItems.map((item, index) => {
                    const subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    return (
                      <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          style={{ flex: 3, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                          required
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map((p) => {
                            const contractMatch = contracts.find((c) => String(c.productId) === String(p.id) && c.active);
                            return (
                              <option key={p.id} value={p.id}>
                                {p.name} {contractMatch ? `— Negotiated Special: $${Number(contractMatch.contractPrice).toFixed(2)} (List: $${Number(p.standardPrice).toFixed(2)})` : `— Catalog List: $${Number(p.standardPrice).toFixed(2)}`}
                              </option>
                            );
                          })}
                        </select>

                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            required
                          />
                        </div>

                        <div style={{ flex: 1.5, fontSize: "13px", color: "#334155", textAlign: "right" }}>
                          @ ${Number(item.unitPrice).toFixed(2)} = <strong>${subtotal.toFixed(2)}</strong>
                        </div>

                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Real-time Credit Check Evaluation Notice */}
                {customerCreditInfo && (
                  <div style={{ padding: "16px", borderRadius: "10px", marginBottom: "24px", border: willExceedLimit ? "1px solid #fecaca" : landsExactlyOnLimit ? "1px solid #fed7aa" : "1px solid #bbf7d0", backgroundColor: willExceedLimit ? "#fef2f2" : landsExactlyOnLimit ? "#fffbeb" : "#f0fdf4" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {willExceedLimit ? (
                        <ShieldAlert size={22} color="#dc2626" />
                      ) : (
                        <CheckCircle size={22} color="#16a34a" />
                      )}
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "14px", color: willExceedLimit ? "#b91c1c" : landsExactlyOnLimit ? "#b45309" : "#15803d" }}>
                          {willExceedLimit
                            ? `Credit Risk Alert: Will Exceed Limit by $${(projectedExposure - creditLimit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : landsExactlyOnLimit
                            ? `Boundary Match: Order Total Lands Exactly on Credit Limit ($0.00 Remaining Credit)`
                            : `Credit Check Passed: $${(creditLimit - projectedExposure).toLocaleString(undefined, { minimumFractionDigits: 2 })} Available After Order`}
                        </div>
                        <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                          Order Total: ${newOrderTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} | Total Projected Exposure: ${projectedExposure.toLocaleString(undefined, { minimumFractionDigits: 2 })} vs Limit: ${creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          {willExceedLimit && " (This order will automatically be placed ON HOLD according to credit policy)."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOrder}
                    style={{ padding: "10px 22px", borderRadius: "8px", border: "none", backgroundColor: willExceedLimit ? "#dc2626" : "#2563eb", color: "white", fontWeight: "700", cursor: "pointer" }}
                  >
                    {submittingOrder ? "Submitting..." : willExceedLimit ? "Submit Order (Will Place on Hold)" : "Place Order ($" + newOrderTotal.toFixed(2) + ")"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DISPATCH SHIPMENT MODAL (PARTIAL SHIPMENT SUPPORT) */}
        {showShipModal && selectedOrder && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ backgroundColor: "white", borderRadius: "14px", width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", padding: "30px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                    Dispatch Shipment for {selectedOrder.orderNumber}
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                    Customer: <strong>{selectedOrder.customerName}</strong>. Specify shipped quantities below (supports partial dispatches).
                  </p>
                </div>
                <button type="button" onClick={() => setShowShipModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleDispatchShipment}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Carrier</label>
                    <input
                      type="text"
                      value={shipmentData.carrier}
                      onChange={(e) => setShipmentData({ ...shipmentData, carrier: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Tracking Number</label>
                    <input
                      type="text"
                      value={shipmentData.trackingNumber}
                      onChange={(e) => setShipmentData({ ...shipmentData, trackingNumber: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      required
                    />
                  </div>
                </div>

                {/* Line Items for shipment */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                    Line Items to Dispatch (Adjust to Ship Partially):
                  </label>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                          <th style={{ padding: "10px 14px", fontWeight: "600" }}>Product</th>
                          <th style={{ padding: "10px 14px", fontWeight: "600" }}>Ordered</th>
                          <th style={{ padding: "10px 14px", fontWeight: "600" }}>Remaining</th>
                          <th style={{ padding: "10px 14px", fontWeight: "600", width: "140px" }}>Ship Now</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipmentData.items.map((item, idx) => (
                          <tr key={item.orderItemId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 14px", fontWeight: "600" }}>{item.productName}</td>
                            <td style={{ padding: "10px 14px", color: "#64748b" }}>{item.orderedQuantity}</td>
                            <td style={{ padding: "10px 14px", color: "#d97706", fontWeight: "600" }}>{item.remainingQuantity}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <input
                                type="number"
                                min="0"
                                max={item.remainingQuantity}
                                value={item.quantityShipped}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  const updated = [...shipmentData.items];
                                  updated[idx].quantityShipped = Math.min(item.remainingQuantity, Math.max(0, val));
                                  setShipmentData({ ...shipmentData, items: updated });
                                }}
                                style={{ width: "90px", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "700" }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "12px 14px", marginBottom: "20px", fontSize: "12px", color: "#1e40af" }}>
                  💡 <strong>Invoicing Rule:</strong> Invoices strictly follow shipments. An invoice will only be issued for the quantities dispatched right now.
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowShipModal(false)}
                    style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingShipment}
                    style={{ padding: "10px 22px", borderRadius: "8px", border: "none", backgroundColor: "#2563eb", color: "white", fontWeight: "700", cursor: "pointer" }}
                  >
                    {submittingShipment ? "Dispatching..." : "Dispatch & Auto-Invoice"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ORDER DETAILS MODAL */}
        {showDetailsModal && selectedOrder && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ backgroundColor: "white", borderRadius: "14px", width: "100%", maxWidth: "650px", padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>Order {selectedOrder.orderNumber}</h2>
                <button type="button" onClick={() => setShowDetailsModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: "16px", fontSize: "14px" }}>
                <div>Customer: <strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerCode})</div>
                <div>Date: {new Date(selectedOrder.orderDate).toLocaleString()}</div>
                <div>Status: <strong>{selectedOrder.status}</strong></div>
                {selectedOrder.holdReason && (
                  <div style={{ marginTop: "8px", padding: "8px 12px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "6px", fontSize: "13px" }}>
                    Reason: {selectedOrder.holdReason}
                  </div>
                )}
              </div>

              <h4 style={{ margin: "16px 0 8px", fontSize: "14px" }}>Line Items:</h4>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Product</th>
                      <th style={{ padding: "8px 12px", textAlign: "center" }}>Ordered</th>
                      <th style={{ padding: "8px 12px", textAlign: "center" }}>Shipped</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Contract Price</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 12px" }}>{item.productName}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>{item.quantity}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", color: "#2563eb", fontWeight: "600" }}>{item.shippedQuantity || 0}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>${Number(item.unitPrice).toFixed(2)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "700" }}>${Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", cursor: "pointer", fontWeight: "600" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

