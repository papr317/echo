// src/components/UsersAndFriends.js

import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance'; // Предполагается, что у вас настроен axiosInstance
import { useAuth } from '../contexts/AuthContext'; // Предполагается, что у вас есть AuthContext

// Константы API
const API_FRIENDS = '/messenger_api/friends/';
const API_SEARCH = '/messenger_api/friends/search/';
const API_CHATS = '/messenger_api/chats/';

// Функция-утилита для обработки ошибок
const handleError = (err, defaultMessage) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') {
    alert(detail);
  } else if (err.response?.data?.non_field_errors) {
    alert(err.response.data.non_field_errors[0]);
  } else {
    alert(defaultMessage);
  }
  console.error(err);
};

function UsersAndFriends({ onChatCreated }) {
  const { user } = useAuth(); // Получаем информацию о текущем пользователе
  const currentUserId = user?.id;

  // Состояния
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendshipList, setFriendshipList] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. Основное получение данных (список дружбы) ---

  const fetchFriendshipData = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_FRIENDS);
      setFriendshipList(response.data);
    } catch (err) {
      handleError(err, 'Не удалось загрузить список друзей и запросов.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchFriendshipData();
  }, [fetchFriendshipData]);

  // --- 2. Логика поиска ---

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setActiveTab('search'); // Переключаемся на вкладку результатов поиска
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_SEARCH, { params: { q: searchTerm } });
      setSearchResults(response.data);
    } catch (err) {
      handleError(err, 'Ошибка при поиске пользователей.');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Действия с дружбой ---

  const handleSendRequest = async (receiverId) => {
    try {
      await axiosInstance.post(API_FRIENDS, { receiver_id: receiverId });
      alert('Запрос на дружбу отправлен!');
      fetchFriendshipData(); // Обновляем списки
      setSearchResults((prev) => prev.filter((u) => u.id !== receiverId)); // Убираем из результатов поиска
    } catch (err) {
      handleError(err, 'Ошибка при отправке запроса.');
    }
  };

  const handleRespondToRequest = async (friendshipId, action) => {
    try {
      await axiosInstance.post(`${API_FRIENDS}${friendshipId}/respond/`, {
        action,
      });

      if (action === 'accept') {
        alert('Запрос принят. Вы теперь друзья!');

        // 💡 Инициируем создание или поиск существующего чата
        const friendship = friendshipList.find((f) => f.id === friendshipId);
        const partnerId = friendship.sender.id;

        // Создаем чат с новым другом
        await handleStartChat(partnerId);
      } else {
        alert('Запрос отклонен.');
      }

      fetchFriendshipData(); // Обновляем список дружбы
    } catch (err) {
      // Специальная обработка ошибки, которую мы добавили в ChatSerializer
      const customChatId = err.response?.data?.chat_id;
      if (customChatId && onChatCreated) {
        alert('Запрос принят. Чат уже существует!');
        onChatCreated(customChatId);
      } else {
        handleError(err, 'Ошибка при обработке запроса.');
      }
    }
  };

  const handleStartChat = async (partnerId) => {
    try {
      const response = await axiosInstance.post(API_CHATS, { participant_ids: [partnerId] });
      const chatId = response.data.id;

      if (chatId && onChatCreated) {
        onChatCreated(chatId); // Перенаправляем на страницу сообщений
      }
    } catch (err) {
      // Обработка ошибки "чат уже существует" при попытке создать личный чат
      const existingChatId = err.response?.data?.detail?.chat_id;
      if (existingChatId && onChatCreated) {
        alert('Переход к существующему диалогу.');
        onChatCreated(existingChatId);
      } else {
        handleError(err, 'Ошибка при создании чата.');
      }
    }
  };

  // --- Вспомогательные переменные для рендеринга ---

  // Запросы, где текущий пользователь - получатель
  const incomingRequests = friendshipList.filter(
    (f) => f.status === 'pending' && f.receiver.id === currentUserId,
  );

  // Друзья (включая тех, кто отправил запрос и тех, кто его принял)
  const friends = friendshipList.filter((f) => f.status === 'accepted');

  // --- 4. Рендеринг вкладок ---

  const renderContent = () => {
    if (loading) {
      return <div className="loading-state">Загрузка...</div>;
    }

    switch (activeTab) {
      case 'requests':
        return (
          <div className="requests-tab">
            <h3>Входящие запросы ({incomingRequests.length})</h3>
            {incomingRequests.length === 0 ? (
              <p>У вас нет новых запросов на дружбу.</p>
            ) : (
              incomingRequests.map((f) => (
                <div
                  key={f.id}
                  className="friend-request-item"
                  style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
                >
                  <p>
                    От: <strong>{f.sender.username}</strong>
                  </p>
                  <button
                    onClick={() => handleRespondToRequest(f.id, 'accept')}
                    style={{ marginRight: '10px' }}
                  >
                    Принять
                  </button>
                  <button onClick={() => handleRespondToRequest(f.id, 'reject')}>Отклонить</button>
                </div>
              ))
            )}
          </div>
        );

      case 'friends':
        return (
          <div className="friends-tab">
            <h3>Мои друзья ({friends.length})</h3>
            {friends.length === 0 ? (
              <p>У вас пока нет друзей.</p>
            ) : (
              friends.map((f) => {
                // Определяем, кто партнер в этом Friendship (не текущий пользователь)
                const partner = f.sender.id === currentUserId ? f.receiver : f.sender;
                return (
                  <div
                    key={f.id}
                    className="friend-item"
                    style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}
                  >
                    <p>
                      Имя: <strong>{partner.username}</strong>
                    </p>
                    <button onClick={() => handleStartChat(partner.id)}>Написать</button>
                  </div>
                );
              })
            )}
          </div>
        );

      case 'search':
        return (
          <div className="search-tab">
            <h3>Результаты поиска</h3>
            {searchResults.length === 0 ? (
              <p>Введите имя пользователя или email для поиска.</p>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="search-result-item"
                  style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}
                >
                  <p>
                    Пользователь: <strong>{user.username}</strong>
                  </p>
                  <button onClick={() => handleSendRequest(user.id)}>Добавить в друзья</button>
                </div>
              ))
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="users-friends-main">
      {/* Панель поиска */}
      <form
        onSubmit={handleSearch}
        style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Поиск по имени или email..."
          style={{ padding: '8px', width: '70%', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '8px 15px' }}>
          Найти
        </button>
      </form>

      {/* Панель вкладок */}
      <div className="tabs-navigation" style={{ display: 'flex', marginBottom: '15px' }}>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'requests' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'requests' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            marginRight: '5px',
          }}
        >
          Запросы ({incomingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'friends' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'friends' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            marginRight: '5px',
          }}
        >
          Друзья ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'search' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'search' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Поиск
        </button>
      </div>

      {/* Контент активной вкладки */}
      {renderContent()}
    </div>
  );
}

export default UsersAndFriends;
