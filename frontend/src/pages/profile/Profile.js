import React, { useState, useEffect } from 'react';
import {
  Card,
  Avatar,
  Typography,
  Spin,
  Row,
  Col,
  Divider,
  message,
  Tabs,
  Button,
  Space,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ManOutlined,
  WomanOutlined,
  CalendarOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const fetchUserData = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get('http://localhost:8000/users_api/me/', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUserData(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        messageApi.error('Сессия истекла. Пожалуйста, войдите снова.');
        localStorage.clear();
        navigate('/login');
      } else {
        messageApi.error('Не удалось загрузить данные профиля.');
        console.error('Profile fetch error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  const getGenderIcon = (gender) => {
    if (gender === 'male') return <ManOutlined />;
    if (gender === 'female') return <WomanOutlined />;
    return <UserOutlined />;
  };

  const handleLogout = () => {
    localStorage.clear();
    messageApi.success('Вы успешно вышли из аккаунта.');
    navigate('/Welcome');
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handlePersonalInfo = () => {
    navigate('/profile/change-password');
  };

  if (loading) {
    return (
      <div className="profile-container loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-container error">
        <p>Не удалось загрузить данные пользователя. Пожалуйста, попробуйте снова.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {contextHolder}
      <Card className="profile-card" style={{ backgroundColor: '#141414', color: '#fff' }}>
        <div className="profile-avatar-section">
          <Avatar
            size={120}
            icon={<UserOutlined />}
            src={userData.avatar}
            style={{ backgroundColor: '#434343', color: '#fff', border: '2px solid #fff' }}
          />
          <Title level={2} style={{ color: '#fff' }}>
            {userData.username}
          </Title>
          <Text type="secondary" style={{ color: '#a6a6a6' }}>
            {userData.bio || 'Биография не указана'}
          </Text>
        </div>

        <Divider style={{ borderColor: '#434343' }} />

        <Tabs defaultActiveKey="1" centered className="profile-tabs">
          <TabPane tab={<span className="tab-text">Информация</span>} key="1">
            <div className="profile-details-section">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <div className="detail-item">
                    <MailOutlined className="detail-icon" style={{ color: '#fff' }} />
                    <div>
                      <Text strong style={{ color: '#fff' }}>
                        Электронная почта:
                      </Text>
                      <Text style={{ color: '#fff' }}>{userData.email}</Text>
                    </div>
                  </div>
                </Col>
                {userData.phone && (
                  <Col span={24}>
                    <div className="detail-item">
                      <PhoneOutlined className="detail-icon" style={{ color: '#fff' }} />
                      <div>
                        <Text strong style={{ color: '#fff' }}>
                          Телефон:
                        </Text>
                        <Text style={{ color: '#fff' }}>{userData.phone}</Text>
                      </div>
                    </div>
                  </Col>
                )}
                {userData.first_name && (
                  <Col span={24}>
                    <div className="detail-item">
                      <UserOutlined className="detail-icon" style={{ color: '#fff' }} />
                      <div>
                        <Text strong style={{ color: '#fff' }}>
                          Имя:
                        </Text>
                        <Text style={{ color: '#fff' }}>{userData.first_name}</Text>
                      </div>
                    </div>
                  </Col>
                )}
                {userData.last_name && (
                  <Col span={24}>
                    <div className="detail-item">
                      <UserOutlined className="detail-icon" style={{ color: '#fff' }} />
                      <div>
                        <Text strong style={{ color: '#fff' }}>
                          Фамилия:
                        </Text>
                        <Text style={{ color: '#fff' }}>{userData.last_name}</Text>
                      </div>
                    </div>
                  </Col>
                )}
                {userData.nickname && (
                  <Col span={24}>
                    <div className="detail-item">
                      <GlobalOutlined className="detail-icon" style={{ color: '#fff' }} />
                      <div>
                        <Text strong style={{ color: '#fff' }}>
                          Псевдоним:
                        </Text>
                        <Text style={{ color: '#fff' }}>{userData.nickname}</Text>
                      </div>
                    </div>
                  </Col>
                )}
                {userData.gender && (
                  <Col span={24}>
                    <div className="detail-item">
                      {getGenderIcon(userData.gender)}
                      <div>
                        <Text strong style={{ color: '#fff' }}>
                          Пол:
                        </Text>
                        <Text style={{ color: '#fff' }}>
                          {userData.gender === 'male' ? 'Мальчик' : 'Девочка'}
                        </Text>
                      </div>
                    </div>
                  </Col>
                )}
                {userData.date_of_birth && (
                  <Col span={24}>
                    <div className="detail-item">
                      <CalendarOutlined className="detail-icon" style={{ color: '#fff' }} />
                      <div>
                        <Text strong style={{ color: '#fff' }}>
                          Дата рождения:
                        </Text>
                        <Text style={{ color: '#fff' }}>
                          {new Date(userData.date_of_birth).toLocaleDateString()}
                        </Text>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>

              <Space direction="vertical" style={{ width: '100%', marginTop: '24px' }}>
                <Button
                  block
                  style={{ backgroundColor: '#262626', color: '#fff', borderColor: '#434343' }}
                  onClick={handleEditProfile}
                >
                  Изменить
                </Button>
                <Button
                  block
                  style={{ backgroundColor: '#262626', color: '#fff', borderColor: '#434343' }}
                  onClick={handlePersonalInfo}
                >
                  Личная информация
                </Button>
              </Space>
            </div>
          </TabPane>
          <TabPane tab={<span className="tab-text">Посты</span>} key="2">
            <div className="tab-content">
              <h3>Посты пользователя</h3>
              <p>Здесь будут отображаться посты пользователя.</p>
            </div>
          </TabPane>
          <TabPane tab={<span className="tab-text">Комментарии</span>} key="3">
            <div className="tab-content">
              <h3>Комментарии пользователя</h3>
              <p>Здесь будут отображаться комментарии пользователя.</p>
            </div>
          </TabPane>
        </Tabs>
        <Button
          block
          type="primary"
          danger
          onClick={handleLogout}
          style={{
            marginTop: '24px',
            backgroundColor: '#cf1322',
            borderColor: '#cf1322',
            color: '#fff',
          }}
        >
          Выйти
        </Button>
      </Card>
    </div>
  );
};

export default Profile;
