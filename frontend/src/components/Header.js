import React, { useState, useEffect } from 'react';
import { Avatar, Modal } from 'antd';
import { UserOutlined, BellOutlined } from '@ant-design/icons'; // Import BellOutlined
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './Header.css';
import NotificationsModal from './NotificationsModal'; // Import the new modal component

const AppHeader = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

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

  // Functions to handle modal visibility
  const handleShowModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="echo-header">
        <a href="/">
          <img src="/logo_2.png" alt="Логотип" className="echo-logo" />
        </a>
        <Avatar
          size="large"
          icon={<UserOutlined />}
          style={{ backgroundColor: '#fff', color: '#000', cursor: 'pointer' }}
        />
      </div>
    );
  }

  return (
    <div className="echo-header">
      <a href="/">
        <img src="/logo.png" alt="Логотип" className="echo-logo" />
      </a>

      <div className="header-icons">
        {/* уведомления */}
        <BellOutlined
          className="header-icon"
          onClick={handleShowModal}
          style={{ cursor: 'pointer', fontSize: '24px', marginRight: '20px' }} // Stylize the icon
        />

        {/* аватарка */}
        <Avatar
          size="large"
          icon={<UserOutlined />}
          src={userData?.avatar}

          onClick={handleAvatarClick}
          style={
            !userData?.avatar_url
              ? { backgroundColor: '#fff', color: '#000', cursor: 'pointer' }
              : { cursor: 'pointer' }
          }
        />
      </div>

      {/* модалка уведомлений */}
      <NotificationsModal isModalOpen={isModalOpen} handleCloseModal={handleCloseModal} />
    </div>
  );
};

export default AppHeader;
