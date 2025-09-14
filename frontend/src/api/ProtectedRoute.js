import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('access_token');

  return isAuthenticated ? children : <Navigate to="/welcome" replace />;
};

export default ProtectedRoute;
