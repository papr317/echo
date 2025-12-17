import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ManOutlined,
  WomanOutlined,
  CalendarOutlined,
  GlobalOutlined,
  CreditCardOutlined,
  LockOutlined,
  EditOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import getAvatarUrl from '../../utils/avatarUtils';
import './Profile.css';

import UserPosts from './UserPosts';
import UserComments from './UserComments';

const { Title, Text } = Typography;

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [personalModal, setPersonalModal] = useState(false);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      navigate('/login');
      return;
    }
    try {
      const response = await axiosInstance.get('http://localhost:8000/users_api/me/', {
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

  const fetchDataForTab = useCallback(
    async (key) => {
      setTabLoading(true);
      try {
        if (key === '2' && myPosts.length === 0) {
          const response = await axiosInstance.get('/echo_api/my/posts/');
          setMyPosts(
            response.data.map((post) => ({
              ...post,
              is_expired: new Date(post.expires_at) < new Date(),
            })),
          );
        } else if (key === '3' && myComments.length === 0) {
          const response = await axiosInstance.get('/echo_api/my/comments/active/');
          setMyComments(response.data);
        }
      } catch (error) {
        messageApi.error(
          `Не удалось загрузить данные для вкладки ${key === '2' ? 'Посты' : 'Комментарии'}.`,
        );
        console.error('Tab data fetch error:', error);
      } finally {
        setTabLoading(false);
      }
    },
    [myPosts.length, myComments.length, setMyPosts, setMyComments, messageApi],
  );

  const handleTabChange = (key) => {
    fetchDataForTab(key);
  };

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, navigate]);

  const getGenderIcon = (gender) => {
    if (gender === 'male') return <ManOutlined style={{ color: '#fff' }} />;
    if (gender === 'female') return <WomanOutlined style={{ color: '#fff' }} />;
    return <UserOutlined style={{ color: '#fff' }} />;
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
    setPersonalModal(true);
  };

  const handleModalClose = () => {
    setPersonalModal(false);
  };

  const handleChangePassword = () => {
    setPersonalModal(false);
    navigate('/profile/change-password');
  };

  const handleChangeEmail = () => {
    setPersonalModal(false);
    messageApi.info('Изменение email будет доступно в следующей версии.');
  };

  const handleChangePhone = () => {
    setPersonalModal(false);
    messageApi.info('Изменение номера телефона будет доступно в следующей версии.');
  };

  const handleChangeCard = () => {
    messageApi.warning('Изменение карты временно недоступно.');
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

  const tabItems = [
    {
      key: '1',
      label: <span className="tab-text">Информация</span>,
      children: (
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

          <Space orientation="vertical" style={{ width: '100%', marginTop: '24px' }}>
            <Button
              block
              style={{ backgroundColor: '#262626', color: '#fff', borderColor: '#434343' }}
              onClick={handleEditProfile}
              icon={<EditOutlined />}
            >
              Изменить
            </Button>
            <Button
              block
              style={{ backgroundColor: '#262626', color: '#fff', borderColor: '#434343' }}
              onClick={handlePersonalInfo}
            >
              изменить личную информацию
            </Button>
          </Space>
        </div>
      ),
    },
    {
      key: '2',
      label: <span className="tab-text">Посты ({myPosts.length})</span>,
      children: (
        <UserPosts
          myPosts={myPosts}
          setMyPosts={setMyPosts}
          tabLoading={tabLoading}
          setTabLoading={setTabLoading}
        />
      ),
    },
    {
      key: '3',
      label: <span className="tab-text">Комментарии ({myComments.length})</span>,
      children: (
        <UserComments
          myComments={myComments}
          setMyComments={setMyComments}
          tabLoading={tabLoading}
          setTabLoading={setTabLoading}
        />
      ),
    },
  ];

  return (
    <div className="profile-container">
      {contextHolder}
      <Card className="profile-card" style={{ backgroundColor: '#141414', color: '#fff' }}>
        <div className="profile-avatar-section">
          <Avatar
            size={120}
            icon={<UserOutlined />}
            src={getAvatarUrl(userData.avatar)}
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

        <Tabs
          defaultActiveKey="1"
          centered
          className="profile-tabs"
          onChange={handleTabChange}
          items={tabItems}
        />

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

      <Modal
        open={personalModal}
        onCancel={handleModalClose}
        footer={null}
        title="Изменить личную информацию"
        centered
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Button
            icon={<MailOutlined />}
            block
            onClick={handleChangeEmail}
            style={{ textAlign: 'left' }}
          >
            Сменить email
          </Button>
          <Button
            icon={<PhoneOutlined />}
            block
            onClick={handleChangePhone}
            style={{ textAlign: 'left' }}
          >
            Сменить номер телефона
          </Button>
          <Button
            icon={<LockOutlined />}
            block
            onClick={handleChangePassword}
            style={{ textAlign: 'left' }}
          >
            Сменить пароль
          </Button>
          <Button
            icon={<CreditCardOutlined />}
            block
            onClick={handleChangeCard}
            style={{ textAlign: 'left' }}
          >
            Привязать/сменить карту
          </Button>
        </Space>
      </Modal>
    </div>
  );
};

export default Profile;
