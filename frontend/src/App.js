import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RegisterForm from './pages/RegisterForm';
import PrivacyPolicy from './pages/PrivacyPolicy';
import LoginForm from './pages/LoginForm';

import Layout from './components/Layout';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
      </Route>
      {/* без Layout */}
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/login" element={<LoginForm />} />
      {/* другие страницы */}
    </Routes>
  );
}

export default App;
