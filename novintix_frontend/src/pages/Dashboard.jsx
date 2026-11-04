import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  Package,
  Users,
  Building2,
  Boxes,
  ShoppingCart,
  BookOpen,
  AlertTriangle,
  Truck
} from "lucide-react";
import Navbar from "../components/Navbar";
import { getCurrentUser } from "../services/authService";
import dashboardService from "../services/dashboardService";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await dashboardService.getStats();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const cards = [
    {
      title: "Total Customers",
      value: loading ? "..." : String(stats?.totalCustomers || 0),
      description: "Hospitals & distributors",
      icon: Users,
      link: "/customers",
    },
    {
      title: "Total Credit Exposure",
      value: loading
        ? "..."
        : `$${Number(stats?.totalCreditExposure || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "Unpaid invoices + open orders",
      icon: CreditCard,
      link: "/ledger",
    },
    {
      title: "Open Orders",
      value: loading ? "..." : String(stats?.totalOrders || 0),
      description: `${stats?.ordersOnHold || 0} order(s) on credit hold`,
      icon: Package,
      alert: Number(stats?.ordersOnHold || 0) > 0,
      link: "/orders",
    },
    {
      title: "Total Shipments",
      value: loading ? "..." : String(stats?.totalShipments || 0),
      description: "Dispatched & invoiced shipments",
      icon: Truck,
      link: "/orders",
    },
  ];

  return (
    <main className="dashboard-page">
      <Navbar />

      <section className="dashboard-content">
        {/* Welcome section */}
        <div className="dashboard-welcome">
          <div>
            <span className="welcome-label">CREDIT RISK & FULFILLMENT PLATFORM</span>
            <h1>Welcome back!</h1>
            <p>
              Manage hospital and distributor contract prices, monitor real-time credit limits, dispatch partial shipments, and maintain the money trail.
            </p>
          </div>

          <div className="user-badge">
            <div className="user-avatar">
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <strong>{user?.email || "User"}</strong>
              <span>{user?.role || "USER"}</span>
            </div>
          </div>
        </div>

        {/* Dashboard summary cards */}
        <div className="dashboard-grid">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                className="dashboard-card"
                key={card.title}
                onClick={() => card.link && navigate(card.link)}
                style={{ cursor: "pointer" }}
              >
                <div className="card-top">
                  <div className="card-icon" style={{ backgroundColor: card.alert ? "#fef2f2" : undefined, color: card.alert ? "#dc2626" : undefined }}>
                    <Icon size={21} />
                  </div>
                  <ArrowUpRight size={18} />
                </div>

                <p>{card.title}</p>
                <h2 style={{ color: card.alert ? "#dc2626" : undefined }}>{card.value}</h2>
                <span style={{ color: card.alert ? "#e11d48" : undefined }}>{card.description}</span>
              </article>
            );
          })}
        </div>

        {/* Operational Modules Navigation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "35px" }}>
          {/* Orders & Partial Fulfillment */}
          <section className="getting-started" style={{ margin: 0, cursor: "pointer" }} onClick={() => navigate("/orders")}>
            <div>
              <span className="welcome-label">SALES & CREDIT ENGINE</span>
              <h2 style={{ fontSize: "19px" }}>Orders & Partial Shipments</h2>
              <p style={{ fontSize: "13px" }}>
                Price orders against contract pricing, enforce credit limits (with automatic hold for over-limit orders), and fulfill partial shipments with auto-invoicing.
              </p>
              <button
                type="button"
                className="manage-customers-button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/orders");
                }}
              >
                <ShoppingCart size={17} />
                Manage Orders & Shipments
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="getting-started-icon">
              <ShoppingCart size={28} />
            </div>
          </section>

          {/* Customer Ledger & Audit Trail */}
          <section className="getting-started" style={{ margin: 0, cursor: "pointer" }} onClick={() => navigate("/ledger")}>
            <div>
              <span className="welcome-label">MONEY TRAIL AUDIT</span>
              <h2 style={{ fontSize: "19px" }}>Customer Ledger & Statements</h2>
              <p style={{ fontSize: "13px" }}>
                Audit chronological money trail: Invoices for shipped goods, Payments received, and Credit Notes issued for damaged/near-expiry returns.
              </p>
              <button
                type="button"
                className="manage-products-button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/ledger");
                }}
              >
                <BookOpen size={17} />
                View Customer Ledger
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="getting-started-icon">
              <BookOpen size={28} />
            </div>
          </section>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
          {/* Customer Master */}
          <section className="getting-started" style={{ margin: 0, cursor: "pointer" }} onClick={() => navigate("/customers")}>
            <div>
              <span className="welcome-label">CUSTOMER DIRECTORY</span>
              <h2 style={{ fontSize: "19px" }}>Hospitals & Distributors</h2>
              <p style={{ fontSize: "13px" }}>
                Configure credit limits, payment terms (net 30/45/60), and manage customer master accounts.
              </p>
              <button
                type="button"
                className="manage-customers-button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/customers");
                }}
              >
                <Building2 size={17} />
                Manage Customers
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="getting-started-icon">
              <Users size={28} />
            </div>
          </section>

          {/* Product Master */}
          <section className="getting-started" style={{ margin: 0, cursor: "pointer" }} onClick={() => navigate("/products")}>
            <div>
              <span className="welcome-label">PRODUCT CATALOGUE</span>
              <h2 style={{ fontSize: "19px" }}>Medical Supplies & Pricing</h2>
              <p style={{ fontSize: "13px" }}>
                Maintain medical supplies catalog and standard catalog prices.
              </p>
              <button
                type="button"
                className="manage-products-button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/products");
                }}
              >
                <Boxes size={17} />
                Manage Products
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="getting-started-icon">
              <Package size={28} />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
