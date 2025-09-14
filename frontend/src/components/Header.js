import React, { useState, useEffect } from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './Header.css';

const AppHeader = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get('http://127.0.0.1:8000/users_api/me/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setUserData(response.data);
      } catch (error) {
        console.error('Не удалось получить данные пользователя:', error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleAvatarClick = () => {
    if (userData) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="echo-header">
        <a href="/">
          <img src="/logo_2.png" alt="Логотип" className="echo-logo" />
        </a>
        {/* Пока загружается, показываем белый круг с иконкой */}
        <Avatar
          size="large"
          icon={<UserOutlined />}
          style={{ backgroundColor: '#fff', color: '#000', cursor: 'pointer' }} // Белый круг, чёрная иконка
        />
      </div>
    );
  }

  return (
    <div className="echo-header">
      <a href="/">
        <img src="/logo.png" alt="Логотип" className="echo-logo" />
      </a>

      <Avatar
        size="large"
        icon={<UserOutlined />}
        src={userData?.avatar_url || undefined}
        onClick={handleAvatarClick}
        // Применяем белый фон только если нет URL аватарки
        style={
          !userData?.avatar_url
            ? { backgroundColor: '#fff', color: '#000', cursor: 'pointer' }
            : { cursor: 'pointer' }
        }
      />
    </div>
  );
};

export default AppHeader;
