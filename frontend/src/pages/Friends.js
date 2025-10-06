// src/pages/Friends.js

import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { message, Button, Spin, Typography } from 'antd'; // Используем компоненты Ant Design

const { Text } = Typography;

function FriendsPage() {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [friendshipList, setFriendshipList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFriendshipData = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.get('/friends_api/friends/');
      setFriendshipList(response.data);
    } catch (err) {
      console.error('Ошибка загрузки данных о дружбе:', err);
      message.error('Не удалось загрузить список друзей и запросов.');
      setFriendshipList([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchFriendshipData();
  }, [fetchFriendshipData]);

  // Запросы, где текущий пользователь - получатель
  const incomingRequests = friendshipList.filter(
    (f) => f.status === 'pending' && f.receiver.id === currentUserId,
  );

  // Друзья (статус 'accepted')
  const friends = friendshipList.filter((f) => f.status === 'accepted');

  const handleRespondToRequest = async (friendshipId, action) => {
    try {
      await axiosInstance.post(`/friends_api/friends/${friendshipId}/${action}/`);
      message.success(action === 'accept' ? 'Запрос принят!' : 'Запрос отклонен.');
      fetchFriendshipData(); // Обновление списка
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Ошибка при ответе на запрос.';
      message.error(errorMsg);
    }
  };

  // Функция для перехода в профиль партнера (полезно!)
  const handleProfileClick = (id) => {
    navigate(`/profile/${id}`);
  };

  return (
    <div className="friends-page-container" style={{ padding: '20px' }}>
      <Typography.Title level={2}>Управление друзьями</Typography.Title>

      {loading ? (
        <Spin tip="Загрузка данных о дружбе..." style={{ marginTop: '20px' }} />
      ) : (
        <>
          <div style={{ marginBottom: 32 }}>
            <Typography.Title level={3}>
              Входящие запросы ({incomingRequests.length})
            </Typography.Title>
            {incomingRequests.length === 0 ? (
              <Text type="secondary">Нет новых запросов на дружбу.</Text>
            ) : (
              incomingRequests.map((f) => (
                <div
                  key={f.id}
                  className="friend-request-item"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #e0e0e0',
                    padding: 15,
                    marginBottom: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    onClick={() => handleProfileClick(f.sender.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    Запрос от: <Text strong>{f.sender.username}</Text>
                  </Text>
                  <div>
                    <Button
                      type="primary"
                      onClick={() => handleRespondToRequest(f.id, 'accept')}
                      style={{ marginLeft: 10 }}
                    >
                      Принять
                    </Button>
                    <Button
                      type="default"
                      onClick={() => handleRespondToRequest(f.id, 'reject')}
                      danger
                      style={{ marginLeft: 10 }}
                    >
                      Отклонить
                    </Button>
                  </div>
                </div>
              ))
            )}
            </div>
            
          <div>
            <Typography.Title level={3}>Мои друзья ({friends.length})</Typography.Title>
            {friends.length === 0 ? (
              <Text type="secondary">У вас пока нет друзей.</Text>
            ) : (
              friends.map((f) => {
                // Определяем, кто является вашим партнером (не вы)
                const partner = f.sender.id === currentUserId ? f.receiver : f.sender;
                return (
                  <div
                    key={f.id}
                    className="friend-item"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #e0e0e0',
                      padding: 15,
                      marginBottom: 10,
                      borderRadius: 8,
                    }}
                    onClick={() => handleProfileClick(partner.id)}
                  >
                    <Text style={{ cursor: 'pointer' }}>
                      Имя: <Text strong>{partner.username}</Text>
                    </Text>
                    <Button type="default" size="small">
                      Написать
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default FriendsPage;
