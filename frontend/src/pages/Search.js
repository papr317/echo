import React, { useState, useEffect, useCallback } from 'react';
import { Input, Radio, Space, message, Alert, Avatar, Button, Spin, Typography } from 'antd';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import './Search.css';
import { useAuth } from '../contexts/AuthContext';
import { MessageOutlined, UserAddOutlined, UserSwitchOutlined } from '@ant-design/icons'; // Добавлен MessageOutlined

const { Search } = Input;
const { Text } = Typography; // Добавлен Typography для более чистого текста

function SearchPage() {
  const { user } = useAuth();
  const myId = user?.id;
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [myFriends, setMyFriends] = useState(new Set());
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [currentQuery, setCurrentQuery] = useState('');
  const navigate = useNavigate();

  const fetchFriendsAndRequests = useCallback(async () => {
    if (!myId) return;
    try {
      const res = await axiosInstance.get('/friends_api/friends/');

      const friendsSet = new Set(
        res.data
          .filter((f) => f.status === 'accepted')
          .map((f) => (f.sender.id === myId ? f.receiver.id : f.sender.id)),
      );
      setMyFriends(friendsSet);

      const pendingSet = new Set(
        res.data
          .filter((f) => f.status === 'pending' && f.sender.id === myId)
          .map((f) => f.receiver.id),
      );
      setPendingRequests(pendingSet);
    } catch (error) {
      console.error('Ошибка при получении списка друзей:', error);
    }
  }, [myId]);

  useEffect(() => {
    fetchFriendsAndRequests();
  }, [fetchFriendsAndRequests]);

  const handleSearch = async (query) => {
    const trimmedQuery = query.trim();
    setCurrentQuery(trimmedQuery);
    setSearchResults([]);

    if (!trimmedQuery) {
      return;
    }

    setLoading(true);

    try {
      if (searchType === 'users' || searchType === 'all') {
        const response = await axiosInstance.get('/users_api/search/', {
          params: { q: trimmedQuery },
        });

        // Фильтруем самого себя и добавляем тип
        const userResults = response.data
          .filter((u) => u.id !== myId)
          .map((u) => ({ ...u, type: 'user' }));

        setSearchResults(userResults);
      } else if (searchType === 'posts' || searchType === 'support' || searchType === 'friends') {
        message.info(
          `Поиск по категории '${searchType}' пока не реализован. (Используйте 'Пользователи')`,
        );
      }
    } catch (err) {
      console.error('Ошибка поиска:', err);
      message.error('Произошла ошибка при выполнении поиска.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };
  const handleAddFriend = async (receiverId) => {
    if (myFriends.has(receiverId) || pendingRequests.has(receiverId)) {
      message.warning('Вы уже друзья или запрос ожидает подтверждения.');
      return;
    }

    try {
      await axiosInstance.post('/friends_api/friends/', { receiver: receiverId });

      message.success('Запрос в друзья отправлен!');

      setPendingRequests((prev) => new Set(prev).add(receiverId));

      await fetchFriendsAndRequests(); // Обновляем полную картину в фоне
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 500 && detail?.includes('повторяющееся значение ключа')) {
        message.warning('Запрос уже был отправлен или вы уже друзья. Обновляю статус...');
        await fetchFriendsAndRequests();
      } else if (detail) {
        message.error('Ошибка: ' + detail);
      } else {
        message.error('Не удалось отправить запрос в друзья.');
      }
      console.error('Ошибка при отправке запроса в друзья:', err);
    }
  };

  const handleOpenChat = async (userId) => {
    if (!userId) return;
    try {
      const response = await axiosInstance.post('/messenger_api/chats/', {
        participant_ids: [userId],
        is_private: true,
      });
      const chatId = response.data.id;
      navigate(`/messenger?chatId=${chatId}`);
    } catch (err) {
      // Если чат уже существует, попробуйте получить его id из ошибки или выполните GET-запрос
      if (err.response && err.response.data && err.response.data.detail) {
        // Можно добавить обработку, если бэкенд возвращает id существующего чата в detail
        message.error('Не удалось открыть чат: ' + err.response.data.detail);
      } else {
        message.error('Ошибка при открытии чата');
      }
      console.error('Ошибка открытия чата:', err);
    }
  };

  const handleProfileClick = (id) => {
    navigate(`/profile/${id}`);
  };

  const renderResults = () => {
    if (currentQuery.length === 0) {
      return <div className="search-status-text">Введите запрос для начала поиска.</div>;
    }

    if (searchResults.length === 0) {
      return (
        <div className="search-status-text">
          Результаты не найдены по запросу "{currentQuery}". Попробуйте другой запрос.
        </div>
      );
    }

    if (currentQuery.length === 0) {
      return <p className="search-status-text">Введите запрос для начала поиска.</p>;
    }

    if (searchType === 'contats') {
      return (
        <Alert
          message="Вкладка 'Контакты' появится в следующей версии"
          type="info"
          showIcon
          style={{ marginTop: 24 }}
        />
      );
    }

    return (
      <div className="search-results">
        <h3 className="search-results-heading">
          Найдено {searchResults.length}{' '}
          {searchResults[0]?.type === 'user' ? 'пользователей' : 'результатов'}:
        </h3>
        {searchResults.map((item) => {
          if (item.type === 'user') {
            const isFriend = myFriends.has(item.id);
            const isPending = pendingRequests.has(item.id);

            return (
              <div
                key={item.id}
                className="result-item user-result"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Space
                  size="middle"
                  align="center"
                  onClick={() => handleProfileClick(item.id)}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  <Avatar
                    src={item.avatar}
                    style={{ backgroundColor: '#434343', color: '#fff' }}
                    size={48}
                  >
                    {!item.avatar && item.username ? item.username.charAt(0).toUpperCase() : null}
                  </Avatar>
                  <div>
                    <Text strong style={{ display: 'block' }}>
                      {item.username}
                    </Text>
                    {item.bio && (
                      <Text type="secondary" style={{ fontSize: '0.9em' }}>
                        {item.bio}
                      </Text>
                    )}
                  </div>
                </Space>

                {/* КНОПКА ОТКРЫТЬ ЧАТ */}
                <Button
                  type="default"
                  icon={<MessageOutlined />}
                  style={{ marginRight: 8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenChat(item.id);
                  }}
                >
                  Открыть чат
                </Button>

                {/* КНОПКИ ДРУЖБЫ */}
                {isFriend ? (
                  <Button type="primary" disabled>
                    В друзьях
                  </Button>
                ) : isPending ? (
                  <Button type="default" disabled icon={<UserSwitchOutlined />}>
                    Запрос отправлен
                  </Button>
                ) : (
                  <Button
                    type="default"
                    icon={<UserAddOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddFriend(item.id);
                    }}
                  >
                    Добавить
                  </Button>
                )}
              </div>
            );
          }

          // Если вы хотите отображать посты/поддержку, используйте моки:
          if ((searchType === 'posts' || searchType === 'support') && item.type === searchType) {
            return (
              <div
                key={item.id}
                className="result-item"
                style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 10 }}
              >
                <h4 style={{ margin: 0 }}>{item.title}</h4>
                {item.author && (
                  <p style={{ margin: 0, fontSize: '0.9em' }}>Автор: {item.author}</p>
                )}
                {item.content && (
                  <p style={{ margin: 0, fontSize: '0.9em', color: '#888' }}>
                    {item.content.substring(0, 50)}...
                  </p>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="search-page-container">
      <h1>Поиск</h1>
      <div className="search-controls">
        <Search
          placeholder="Введите имя, тег или ключевое слово..."
          allowClear
          enterButton="Найти"
          size="large"
          onSearch={handleSearch}
          loading={loading}
          style={{ width: '100%', maxWidth: '500px' }}
        />
        <Radio.Group onChange={(e) => setSearchType(e.target.value)} value={searchType}>
          <Space direction="horizontal">
            <Radio.Button value="all">Все</Radio.Button>
            <Radio.Button value="posts">Посты</Radio.Button>
            <Radio.Button value="users">Пользователи</Radio.Button>
            <Radio.Button value="contats">Контакты</Radio.Button>
            <Radio.Button value="support">Помощь</Radio.Button>
          </Space>
        </Radio.Group>
      </div>
      {renderResults()}
    </div>
  );
}

export default SearchPage;
