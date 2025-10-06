import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Profile from './pages/profile/Profile';
import EditProfile from './pages/profile/EditProfile';
import ChangePassword from './pages/profile/ChangePassword';
import OtherProfile from './pages/profile/OtherProfile';

import Home from './pages/Home';
import Search from './pages/Search';

import Friends from './pages/Friends';
import Messenger from './pages/MessengerPage'; 
import ExplorePlan from './pages/ExplorePlan';
import Support from './pages/Support';

import Welcome from './pages/Welcome';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';

import Layout from './components/Layout';
import ProtectedRoute from './api/ProtectedRoute';
import PublicRoute from './api/PublicRoute';

function App() {
  return (
    <Routes>
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

      {/* Protected routes with Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/edit" element={<EditProfile />} />
        <Route path="profile/change-password" element={<ChangePassword />} />
        <Route path="profile/:id" element={<OtherProfile />} />
        <Route path="search" element={<Search />} />
        <Route path="friends" element={<Friends />} />
        <Route path="messenger" element={<Messenger />} />
        <Route path="explore-plan" element={<ExplorePlan />} />
        <Route path="support" element={<Support />} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Route>

      {/* Default redirect for unmatched routes */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default App;
