import React from 'react';
import { Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const isLoggedIn = document.cookie.includes('user=');

  const goToProfile = () => {
    navigate('/profile');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="echo-header">
      <img
        src="/logo.png"
        alt="Echo Logo"
        className="echo-logo"
      />

      <Space>
        {isLoggedIn ? (
          <img
            src="/assets/profile-icon.png"
            alt="Профиль"
            className="profile-icon"
            onClick={goToProfile}
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <>
            <Button type="default" onClick={goToLogin}>
              Вход
            </Button>
            <Button type="default" onClick={goToRegister}>
              Регистрация
            </Button>
          </>
        )}
      </Space>
    </div>
  );
}

export default Header;
