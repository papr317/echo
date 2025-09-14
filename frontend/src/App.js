import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Friends from './pages/Friends';
import Messages from './pages/Messages';
import ExplorePlan from './pages/ExplorePlan';
import Support from './pages/Support';
import Donate from './pages/Donate';
import Welcome from './pages/Welcome';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <Routes>
      {/* Welcome страницы (публичные) */}
      <Route
        path="/welcome"
        element={
          <PublicRoute>
            <Welcome />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterForm />
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        }
      />

      <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      {/* Защищенные маршруты с Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/explore-plan" element={<ExplorePlan />} />
        <Route path="/support" element={<Support />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Route>

      {/* Редирект по умолчанию */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default App;
