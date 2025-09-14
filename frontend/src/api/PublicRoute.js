import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');

  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

export default PublicRoute;
