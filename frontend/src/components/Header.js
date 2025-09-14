import React, { useState, useEffect } from 'react';
import { Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Проверяем наличие токена при загрузке компонента
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  const goToProfile = () => {
    navigate('/profile');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const goToRegister = () => {
    navigate('/register');
  };

  const handleLogout = () => {
    // Удаляем токены из localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <div className="echo-header">
      <img src="/logo.png" alt="Echo Logo" className="echo-logo" />

      <Space>
        {isLoggedIn ? (
          <Space>
            <img
              src="/assets/profile-icon.png"
              alt="Профиль"
              className="profile-icon"
              onClick={goToProfile}
              style={{ cursor: 'pointer', width: 32, height: 32 }}
            />
            <Button type="default" onClick={handleLogout}>
              Выход
            </Button>
          </Space>
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
