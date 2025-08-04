import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

function Layout() {
  return (
    <div className="app-container">
      <Header />
      <div className="main-layout">
        <Sidebar />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default Layout;
