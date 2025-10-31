// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, user }) => {
  // If no user is logged in, redirect to login/home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user is logged in, render the protected content
  return children;
};

export default ProtectedRoute;
