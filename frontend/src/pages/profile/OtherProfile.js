import React, { useEffect, useState } from 'react';
import { Card, Avatar, Typography, Spin, Row, Col, Divider, Tabs } from 'antd';
import {
  UserOutlined,
  ManOutlined,
  WomanOutlined,
  CalendarOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';
import { useParams } from 'react-router-dom';

const { Title, Text } = Typography;

// --- Константы для темной темы ---
const BACKGROUND_COLOR = '#1e1e1e'; // Очень темный фон
const CARD_COLOR = '#2c2c2c'; // Более светлый фон для карточки
const TEXT_COLOR = '#f0f0f0'; // Светлый текст
const SECONDARY_TEXT_COLOR = '#a0a0a0'; // Серый текст для деталей
const HIGHLIGHT_COLOR = '#3a3a3a'; // Цвет для фона аватара или раздела
const ACCENT_COLOR = '#87e8de'; // Цвет для иконок или активных элементов

// --- Вспомогательная функция для URL аватара (если нужно) ---
// Вставьте ваш BASE_URL сюда, если ваш API возвращает относительные пути.
const BASE_URL = 'http://127.0.0.1:8000'; // Замените на ваш реальный базовый URL, если он другой

const getFullAvatarUrl = (relativePath) => {
  if (!relativePath) return undefined;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${BASE_URL}${normalizedPath}`;
};

const OtherProfile = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/users_api/users/${id}`);
        setUserData(response.data);
      } catch (error) {
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [id]);

  const getGenderIcon = (gender) => {
    const iconStyle = { color: TEXT_COLOR };
    if (gender === 'male') return <ManOutlined style={iconStyle} />;
    if (gender === 'female') return <WomanOutlined style={iconStyle} />;
    return <UserOutlined style={iconStyle} />;
  };

  if (loading) {
    return (
      <div
        className="profile-container loading"
        style={{
          background: BACKGROUND_COLOR,
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Spin size="large" style={{ color: TEXT_COLOR }} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div
        className="profile-container error"
        style={{ background: BACKGROUND_COLOR, minHeight: '100vh', padding: 20 }}
      >
        <p style={{ color: TEXT_COLOR, textAlign: 'center' }}>Пользователь не найден.</p>
      </div>
    );
  }

  const detailItemStyle = {
    marginBottom: 12,
    color: SECONDARY_TEXT_COLOR,
  };
  const detailTitleStyle = {
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginRight: 8,
  };

  const tabItems = [
    {
      key: '1',
      label: <span style={{ color: TEXT_COLOR }}>Информация</span>,
      children: (
        <div className="profile-details-section" style={{ padding: 24 }}>
          <Row gutter={[16, 16]}>
            {userData.first_name && (
              <Col span={24}>
                <div style={detailItemStyle}>
                  <span style={detailTitleStyle}>Имя:</span> {userData.first_name}
                </div>
              </Col>
            )}
            {userData.last_name && (
              <Col span={24}>
                <div style={detailItemStyle}>
                  <span style={detailTitleStyle}>Фамилия:</span> {userData.last_name}
                </div>
              </Col>
            )}
            {userData.nickname && (
              <Col span={24}>
                <div style={detailItemStyle}>
                  <span style={detailTitleStyle}>Псевдоним:</span> {userData.nickname}
                </div>
              </Col>
            )}
            {userData.gender && (
              <Col span={24}>
                <div style={detailItemStyle}>
                  <span style={detailTitleStyle}>Пол:</span>{' '}
                  {userData.gender === 'male' ? 'Мальчик' : 'Девочка'}
                </div>
              </Col>
            )}
            {userData.date_of_birth && (
              <Col span={24}>
                <div style={detailItemStyle}>
                  <span style={detailTitleStyle}>Дата рождения:</span>{' '}
                  {new Date(userData.date_of_birth).toLocaleDateString()}
                </div>
              </Col>
            )}
            {userData.location && (
              <Col span={24}>
                <div style={detailItemStyle}>
                  <span style={detailTitleStyle}>Местоположение:</span> {userData.location}
                </div>
              </Col>
            )}
          </Row>
        </div>
      ),
    },
    // Здесь могут быть другие вкладки
  ];

  return (
    <div
      className="profile-container"
      style={{
        background: BACKGROUND_COLOR,
        minHeight: '100vh',
        padding: '40px 20px', // Добавим padding для центрирования
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Card
        className="profile-card"
        style={{
          background: CARD_COLOR,
          color: TEXT_COLOR,
          borderRadius: 16,
          boxShadow: '0 4px 30px rgba(0,0,0,0.5)', // Более выраженная тень для темной темы
          minWidth: 340,
          maxWidth: 420,
          width: '100%',
          padding: 0,
        }}
        bodyStyle={{ padding: 0 }}
      >
        <div
          className="profile-avatar-section"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            // Темный градиент или сплошной цвет для шапки
            background: HIGHLIGHT_COLOR,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: '32px 24px 16px 24px',
          }}
        >
          <Avatar
            size={120}
            icon={<UserOutlined style={{ color: TEXT_COLOR }} />}
            // Используем вспомогательную функцию для корректного пути
            src={getFullAvatarUrl(userData.avatar)}
            style={{
              backgroundColor: SECONDARY_TEXT_COLOR,
              color: TEXT_COLOR,
              border: '3px solid ' + CARD_COLOR, // Обводка цветом карточки
              marginBottom: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          />
          <Title level={2} style={{ color: TEXT_COLOR, marginBottom: 0 }}>
            {userData.username}
          </Title>
          <Text style={{ color: SECONDARY_TEXT_COLOR, marginBottom: 8 }}>
            {userData.bio || 'Биография не указана'}
          </Text>
        </div>
        <Divider style={{ margin: 0, background: SECONDARY_TEXT_COLOR }} />
        <Tabs
          defaultActiveKey="1"
          centered
          items={tabItems}
          tabBarStyle={{
            borderBottom: `1px solid ${HIGHLIGHT_COLOR}`,
            color: SECONDARY_TEXT_COLOR,
          }}
        />
      </Card>
    </div>
  );
};

export default OtherProfile;
