import React, { useEffect, useState, useCallback } from 'react';
import { Card, Avatar, Typography, Spin, Row, Col, Divider, message, Tabs } from 'antd';
import {
  UserOutlined,
  ManOutlined,
  WomanOutlined,
  CalendarOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';
import { useParams } from 'react-router-dom';
import getAvatarUrl from '../../utils/avatarUtils';
import './Profile.css';

import OtherUserPosts from './OtherUserPosts';
import OtherUserComments from './OtherUserComments';

const { Title, Text } = Typography;

const OtherProfile = () => {
  // Added a comment to trigger re-evaluation
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const getGenderIcon = (gender) => {
    if (gender === 'male') return <ManOutlined style={{ color: '#fff' }} />;
    if (gender === 'female') return <WomanOutlined style={{ color: '#fff' }} />;
    return <UserOutlined style={{ color: '#fff' }} />;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        if (!id) {
          console.warn('User ID not found in URL parameters.');
          setUserData(null);
          setLoading(false);
          return;
        }
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

  const fetchDataForTab = useCallback(
    async (key) => {
      setTabLoading(true);
      try {
        if (key === '2' && userPosts.length === 0) {
          // Посты загружаются в OtherUserPosts
        } else if (key === '3' && userComments.length === 0) {
          // Комментарии загружаются в OtherUserComments
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
    [userPosts.length, userComments.length, messageApi],
  );

  const handleTabChange = (key) => {
    fetchDataForTab(key);
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
            {userData.location && (
              <Col span={24}>
                <div className="detail-item">
                  <GlobalOutlined className="detail-icon" style={{ color: '#fff' }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>
                      Местоположение:
                    </Text>
                    <Text style={{ color: '#fff' }}>{userData.location}</Text>
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </div>
      ),
    },
    {
      key: '2',
      label: <span className="tab-text">Посты ({userPosts.length})</span>,
      children: (
        <OtherUserPosts
          userPosts={userPosts}
          setUserPosts={setUserPosts}
          tabLoading={tabLoading}
          setTabLoading={setTabLoading}
          userId={id}
        />
      ),
    },
    {
      key: '3',
      label: <span className="tab-text">Комментарии ({userComments.length})</span>,
      children: (
        <OtherUserComments
          userComments={userComments}
          setUserComments={setUserComments}
          tabLoading={tabLoading}
          setTabLoading={setTabLoading}
          userId={id}
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
      </Card>
    </div>
  );
};

export default OtherProfile;
