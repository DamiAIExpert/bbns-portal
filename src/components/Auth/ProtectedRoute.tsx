import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// CORRECTED: 'User' is a type, so we use 'import type'
import type { User } from '../../services/authService'; 

// --- Type Definition for Props ---
interface ProtectedRouteProps {
  access: 'user' | 'admin'; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ access }) => {
  const token = localStorage.getItem('token');
  let user: User | null = null;

  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      user = JSON.parse(userData);
    }
  } catch (error) {
    console.error("Failed to parse user data from localStorage", error);
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (access === 'user' && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (access === 'admin' && user.role !== 'admin') {
    return <Navigate to="/user/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
