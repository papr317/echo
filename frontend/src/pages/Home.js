import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import CommentsSection from '../components/CommentsSection'; // Используем новый компонент
import { Progress, Typography, message, Spin } from 'antd';
import {
  SoundOutlined,
  SoundFilled,
  MutedOutlined,
  MutedFilled,
  // MessageFilled больше не нужен здесь, он в CommentsSection
} from '@ant-design/icons';
import './Home.css'; // Стили для Home и PostLifeBar

// -------------------------------------------------------------
// Компонент "Полоса жизни" для поста
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// Главный компонент Home
// -------------------------------------------------------------
function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingPosts, setUpdatingPosts] = useState(new Set());
  const [userActions, setUserActions] = useState({});

  // 1. Получение постов
  const fetchPosts = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/echo_api/feed/posts/');
      setPosts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка при получении постов:', err);
      setError(err);
      setLoading(false);
    }
  }, []);

  // 2. Получение действий пользователя (лайки/дизлайки)
  const fetchUserEchos = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/echo_api/my/echos/');

      const newActions = response.data.reduce((acc, action) => {
        if (action.content_type_model === 'post') {
          const type = action.is_echo ? 'echo' : 'disecho';
          acc[action.object_id] = { type };
        }
        return acc;
      }, {});

      setUserActions(newActions);
    } catch (err) {
      console.error('Ошибка при получении действий пользователя:', err);
    }
  }, []);

  // Первичная загрузка и интервальное обновление
  useEffect(() => {
    fetchPosts();
    fetchUserEchos();

    const postsInterval = setInterval(fetchPosts, 60000);
    const actionsInterval = setInterval(fetchUserEchos, 15000);

    return () => {
      clearInterval(postsInterval);
      clearInterval(actionsInterval);
    };
  }, [fetchPosts, fetchUserEchos]);

  // Обработка действия (Лайк/Дизлайк)
  const handleAction = async (postId, actionType) => {
    if (updatingPosts.has(postId)) return;

    setUpdatingPosts((prev) => new Set(prev).add(postId));

    try {
      const endpoint =
        actionType === 'echo'
          ? `/echo_api/posts/${postId}/echo/`
          : `/echo_api/posts/${postId}/disecho/`;

      const response = await axiosInstance.post(endpoint);
      const updatedPost = response.data;

      setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? updatedPost : post)));

      const currentAction = userActions[postId]?.type;

      let newActions = { ...userActions };
      let successMessage = '';

      if (currentAction === actionType) {
        delete newActions[postId];
        successMessage = actionType === 'echo' ? 'Крик отменен!' : 'Заглушка отменена!';
      } else {
        newActions[postId] = { type: actionType };
        successMessage =
          actionType === 'echo'
            ? 'Крик добавлен! Время жизни изменено.'
            : 'Заглушено! Время жизни изменено.';
      }

      setUserActions(newActions);
      message.success(successMessage);
    } catch (error) {
      console.error('Ошибка при обработке действия:', error);

      fetchPosts();
      fetchUserEchos();

      const errorMessage = error.response?.data?.error || 'Ошибка при обработке действия';
      message.error(errorMessage);
    } finally {
      setUpdatingPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const isPostExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  const getActionIcon = (postId, actionType) => {
    const userAction = userActions[postId];

    if (userAction?.type === actionType) {
      return actionType === 'echo' ? <SoundFilled /> : <MutedFilled />;
    } else {
      return actionType === 'echo' ? <SoundOutlined /> : <MutedOutlined />;
    }
  };

  if (loading) {
    return (
      <h1 style={{ textAlign: 'center', marginTop: '50px' }}>
        <Spin size="large" /> Загрузка...
      </h1>
    );
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
                      {/* Убедитесь, что author_details существует */}
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

                </div>

                {expired && <div className="expired-notice">Пост истек ❌</div>}

                {/* Компонент, который включает в себя кнопку, форму и список комментариев */}
                <CommentsSection
                  postId={post.id}
                  postExpired={expired}
                  initialCommentCount={post.comments_count}
                />
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
