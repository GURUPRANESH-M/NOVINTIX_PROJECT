import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/authService";

export default function ProtectedRoute({ children }) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}