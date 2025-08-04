import React from 'react';
import { Button, Space } from 'antd';
import './Header.css';

function Header() {
  const isLoggedIn = document.cookie.includes('user=');

  return (
    <div className="echo-header">
      <img src="/assets/logo.png" alt="Echo Logo" className="echo-logo" />
      {/* <input type="text" placeholder="Поиск..." className="search-input" /> */}

      <Space>
        {isLoggedIn ? (
          <a href="/profile">
            <img src="/assets/profile-icon.png" alt="Профиль" className="profile-icon" />
          </a>
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
