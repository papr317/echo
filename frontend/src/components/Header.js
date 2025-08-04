import React from 'react';
import { Button, Space } from 'antd';
import './Header.css';

function Header() {
  const isLoggedIn = document.cookie.includes('user=');

  const handleLogout = () => {
    document.cookie = 'user=; Max-Age=0';
    window.location.reload();
  };

  return (
    <div className="echo-header">
      <img src="/assets/logo.png" alt="Echo Logo" className="echo-logo" />
      <Space>
        {isLoggedIn ? (
          <Button type="default" onClick={handleLogout}>
            Выйти
          </Button>
        ) : (
          <>
            <a href="/login">
              <Button type="default">Вход</Button>
            </a>
            <a href="/register">
              <Button type="default">Регистрация</Button>
            </a>
          </>
        )}
      </Space>
    </div>
  );
}

export default Header;
