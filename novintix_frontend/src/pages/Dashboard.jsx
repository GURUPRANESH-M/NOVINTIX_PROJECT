import { useNavigate } from "react-router-dom";

import {
  Activity,
  ArrowUpRight,
  CreditCard,
  LogOut,
  Package,
  Users,
  Building2,
} from "lucide-react";

import {
  getCurrentUser,
  logout,
} from "../services/authService";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleManageCustomers() {
    navigate("/customers");
  }

  const cards = [
    {
      title: "Total Customers",
      value: "—",
      description: "Customer records",
      icon: Users,
    },
    {
      title: "Credit Exposure",
      value: "—",
      description: "Outstanding commitments",
      icon: CreditCard,
    },
    {
      title: "Open Orders",
      value: "—",
      description: "Orders being processed",
      icon: Package,
    },
    {
      title: "System Status",
      value: "Online",
      description: "Dashboard initialized",
      icon: Activity,
    },
  ];

  return (
    <main className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="brand-logo dashboard-brand">
          <span className="brand-mark">N</span>
          <span>NOVINTIX</span>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </header>

      {/* Dashboard content */}
      <section className="dashboard-content">
        {/* Welcome section */}
        <div className="dashboard-welcome">
          <div>
            <span className="welcome-label">
              YOUR WORKSPACE
            </span>

            <h1>Welcome back!</h1>

            <p>
              Manage your customers, orders, and credit
              operations from one place.
            </p>
          </div>

          {/* Logged-in user */}
          <div className="user-badge">
            <div className="user-avatar">
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.email || "User"}
              </strong>

              <span>
                {user?.role || "USER"}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="dashboard-grid">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                className="dashboard-card"
                key={card.title}
              >
                <div className="card-top">
                  <div className="card-icon">
                    <Icon size={21} />
                  </div>

                  <ArrowUpRight size={18} />
                </div>

                <p>{card.title}</p>

                <h2>{card.value}</h2>

                <span>{card.description}</span>
              </article>
            );
          })}
        </div>

        {/* Customer management navigation */}
        <section className="getting-started">
          <div>
            <span className="welcome-label">
              CUSTOMER OPERATIONS
            </span>

            <h2>Manage your customers</h2>

            <p>
              Register hospitals and distributors, manage
              customer details, and configure their credit
              limits and payment terms.
            </p>

            <button
              type="button"
              className="manage-customers-button"
              onClick={handleManageCustomers}
            >
              <Building2 size={18} />
              Manage Customers
              <ArrowUpRight size={17} />
            </button>
          </div>

          <div className="getting-started-icon">
            <Users size={30} />
          </div>
        </section>
      </section>
    </main>
  );
}