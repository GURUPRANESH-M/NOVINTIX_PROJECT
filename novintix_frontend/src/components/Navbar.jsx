import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Boxes,
  ShoppingCart,
  BookOpen,
  LogOut
} from "lucide-react";
import { getCurrentUser, logout } from "../services/authService";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/products", label: "Products", icon: Boxes },
    { to: "/orders", label: "Orders & Fulfillment", icon: ShoppingCart },
    { to: "/ledger", label: "Customer Ledger", icon: BookOpen },
  ];

  return (
    <header className="dashboard-header app-navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <Link to="/dashboard" style={{ textDecoration: "none" }}>
          <div className="brand-logo dashboard-brand">
            <span className="brand-mark">N</span>
            <span style={{ letterSpacing: "1px", fontWeight: "800" }}>NOVINTIX</span>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: isActive ? "700" : "500",
                  textDecoration: "none",
                  color: isActive ? "#3267f5" : "#64748b",
                  background: isActive ? "#edf2ff" : "transparent",
                  transition: "all 0.15s ease-in-out",
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
          <div className="user-avatar" style={{ width: "32px", height: "32px", fontSize: "13px" }}>
            {(user?.email?.[0] || "U").toUpperCase()}
          </div>
          <span style={{ fontWeight: 600, color: "#374151" }}>{user?.email || "User"}</span>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
          title="Sign out"
          style={{ padding: "8px 12px" }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </header>
  );
}

