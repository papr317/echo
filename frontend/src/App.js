import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Friends from './pages/Friends';
import Messages from './pages/Messages';
import ExplorePlan from './pages/ExplorePlan';

import Support from './pages/Support';
import Donate from './pages/Donate';

import PrivacyPolicy from './pages/PrivacyPolicy';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';

import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      {/* с Layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/explore-plan" element={<ExplorePlan />} />
        {/* Footer */}
        <Route path="/support" element={<Support />} />
        <Route path="/donate" element={<Donate />} />
        
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Route>
      {/* без Layout */}
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/login" element={<LoginForm />} />
    </Routes>
  );
}

export default App;
