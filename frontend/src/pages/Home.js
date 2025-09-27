import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Progress, Typography, message } from 'antd';
import {
  SoundOutlined,
  SoundFilled,
  MutedOutlined,
  MutedFilled,
  MessageFilled,
} from '@ant-design/icons';
import './Home.css';

// Компонент "Полоса жизни" для поста (без изменений)
const PostLifeBar = ({ expiresAt }) => {
  const calculateProgress = useCallback(() => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const totalDuration = 24 * 60 * 60 * 1000;
    const remainingTime = expires.getTime() - now.getTime();

    if (remainingTime <= 0) {
      return 0;
    }

    const percent = (remainingTime / totalDuration) * 100;
    return percent < 0 ? 0 : percent;
  }, [expiresAt]);

  const formatTimeLeft = useCallback(() => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffInSeconds = Math.floor((expires - now) / 1000);

    if (diffInSeconds <= 0) return '0с';

    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;

    if (minutes < 60) {
      return `${minutes}м ${seconds}с`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}ч ${remainingMinutes}м`;
    }
  }, [expiresAt]);

  const [percent, setPercent] = useState(calculateProgress());
  const [formattedTime, setFormattedTime] = useState(formatTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(calculateProgress());
      setFormattedTime(formatTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, calculateProgress, formatTimeLeft]);

  const getTextColor = () => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const remainingTimeHours = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (remainingTimeHours > 24) {
      return '#1890ff';
    } else if (remainingTimeHours > 12) {
      return '#52c41a';
    } else if (remainingTimeHours > 6) {
      return '#faad14';
    } else {
      return '#ff4d4f';
    }
  };

  return (
    <div className="post-lifebar-container">
      <Progress
        percent={percent}
        showInfo={false}
        strokeColor={{
          '0%': '#ff0000ff',
          '20%': '#3d3d3dff',
          '100%': '#000000ff',
        }}
        style={{ flex: 1 }}
      />
      <Typography.Text className="time-left-text" style={{ color: getTextColor() }}>
        {formattedTime}
      </Typography.Text>
    </div>
  );
};

// Главный компонент Home
function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingPosts, setUpdatingPosts] = useState(new Set());
  const [userActions, setUserActions] = useState({});

  const fetchPosts = async () => {
    try {
      const response = await axiosInstance.get('/echo_api/feed/');
      setPosts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка при получении постов:', err);
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Упрощенная функция для обработки действий
  const handleAction = async (postId, newActionType) => {
    if (updatingPosts.has(postId)) return;

    setUpdatingPosts((prev) => new Set(prev).add(postId));

    try {
      const currentAction = userActions[postId]?.type;

      // Если нажимаем ту же кнопку - отменяем действие
      if (currentAction === newActionType) {
        // Отменяем текущее действие
        let timeChange = 0;

        if (newActionType === 'echo') {
          timeChange = -60 * 60 * 1000; // -1 час
        } else {
          timeChange = 60 * 60 * 1000; // +1 час (компенсируем дизлайк)
        }

        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  echo_count:
                    newActionType === 'echo' ? Math.max(0, post.echo_count - 1) : post.echo_count,
                  disecho_count:
                    newActionType === 'disecho'
                      ? Math.max(0, post.disecho_count - 1)
                      : post.disecho_count,
                  expires_at: new Date(
                    new Date(post.expires_at).getTime() + timeChange,
                  ).toISOString(),
                }
              : post,
          ),
        );

        // Удаляем действие
        setUserActions((prev) => {
          const newActions = { ...prev };
          delete newActions[postId];
          return newActions;
        });

        message.info(newActionType === 'echo' ? 'Крик отменен!' : 'Заглушка отменена!');
      } else {
        // Если нажимаем другую кнопку или ставим новое действие
        let timeChange = 0;
        let oppositeActionChange = 0;

        if (newActionType === 'echo') {
          timeChange = 60 * 60 * 1000; // +1 час
          // Если был дизлайк - компенсируем его отмену
          if (currentAction === 'disecho') {
            timeChange += 60 * 60 * 1000; // дополнительно +1 час за снятие дизлайка
            oppositeActionChange = -1;
          }
        } else {
          timeChange = -60 * 60 * 1000; // -1 час
          // Если был лайк - компенсируем его отмену
          if (currentAction === 'echo') {
            timeChange -= 60 * 60 * 1000; // дополнительно -1 час за снятие лайка
            oppositeActionChange = -1;
          }
        }

        // Сначала обновляем локальное состояние
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  echo_count:
                    newActionType === 'echo'
                      ? post.echo_count + 1
                      : Math.max(0, post.echo_count + oppositeActionChange),
                  disecho_count:
                    newActionType === 'disecho'
                      ? post.disecho_count + 1
                      : Math.max(0, post.disecho_count + oppositeActionChange),
                  expires_at: new Date(
                    new Date(post.expires_at).getTime() + timeChange,
                  ).toISOString(),
                }
              : post,
          ),
        );

        // Затем делаем запрос к API
        const endpoint = newActionType === 'echo' ? 'echo' : 'disecho';
        await axiosInstance.post(`/echo_api/posts/${postId}/${endpoint}/`);

        // Сохраняем новое действие
        setUserActions((prev) => ({
          ...prev,
          [postId]: { type: newActionType, timestamp: Date.now() },
        }));

        message.success(
          newActionType === 'echo' ? 'Крик добавлен! +1 час жизни' : 'Заглушено! -1 час жизни',
        );
      }
    } catch (error) {
      console.error('Ошибка при обработке действия:', error);

      // Откатываем изменения при ошибке
      fetchPosts(); // Перезагружаем посты чтобы синхронизировать состояние

      if (error.response?.data?.error === 'Пост истек') {
        message.error('Пост истек, действие невозможно');
      } else {
        message.error('Ошибка при обработке действия');
      }
    } finally {
      setUpdatingPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // Проверка истек ли пост
  const isPostExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  // Получить иконку для кнопки
  const getActionIcon = (postId, actionType) => {
    const userAction = userActions[postId];

    if (userAction?.type === actionType) {
      return actionType === 'echo' ? <SoundFilled /> : <MutedFilled />;
    } else {
      return actionType === 'echo' ? <SoundOutlined /> : <MutedOutlined />;
    }
  };

  if (loading) {
    return <h1 style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка...</h1>;
  }

  if (error) {
    return (
      <h1 style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        Ошибка: Не удалось загрузить посты.
      </h1>
    );
  }

  return (
    <div className="home-container">
      <div className="feed-container">
        {posts.length > 0 ? (
          posts.map((post) => {
            const expired = isPostExpired(post.expires_at);
            const isUpdating = updatingPosts.has(post.id);
            const userAction = userActions[post.id];

            return (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="author-info">
                    <div className="avatar">
                      {post.author_details?.username.charAt(0).toUpperCase()}
                    </div>
                    <p>{post.author_details?.username}</p>
                  </div>
                </div>

                {post.image ? (
                  <img
                    src={`http://127.0.0.1:8000${post.image}`}
                    alt="Содержимое поста"
                    className="post-image"
                  />
                ) : (
                  <div className="post-image-placeholder">Содержимое поста</div>
                )}

                <p className="post-content">{post.content}</p>
                <PostLifeBar expiresAt={post.expires_at} />

                <div className="post-actions-container">
                  <div className="likes-actions">
                    {/* Кнопка лайка */}
                    <button
                      className={`echo-button ${userAction?.type === 'echo' ? 'active' : ''} ${
                        expired ? 'disabled' : ''
                      }`}
                      onClick={() => handleAction(post.id, 'echo')}
                      disabled={expired || isUpdating}
                    >
                      {getActionIcon(post.id, 'echo')}
                      крикнуть {post.echo_count}
                      {isUpdating && '...'}
                    </button>

                    {/* Кнопка дизлайка */}
                    <button
                      className={`disecho-button ${
                        userAction?.type === 'disecho' ? 'active' : ''
                      } ${expired ? 'disabled' : ''}`}
                      onClick={() => handleAction(post.id, 'disecho')}
                      disabled={expired || isUpdating}
                    >
                      {getActionIcon(post.id, 'disecho')}
                      заглушить {post.disecho_count}
                      {isUpdating && '...'}
                    </button>
                  </div>
                  <div className="comment-count">
                    <MessageFilled /> комментарии {post.comments_count}
                  </div>
                </div>

                {expired && <div className="expired-notice">Пост истек ❌</div>}
              </div>
            );
          })
        ) : (
          <p className="no-posts-message">Пока нет постов. Будьте первым!</p>
        )}
      </div>
      <div className="floating-comments">тут будут плавающие комментарии</div>
    </div>
  );
}

export default Home;
