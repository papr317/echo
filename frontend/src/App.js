import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
// import Profile from './pages/Profile';
// import Messages from './pages/Messages';
// import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        {/* <Route path="profile" element={<Profile />} />
        <Route path="messages" element={<Messages />} />
        <Route path="settings" element={<Settings />} /> */}
      </Route>
    </Routes>
  );
}

export default App;
