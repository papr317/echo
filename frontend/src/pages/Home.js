import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import CommentsSection from '../components/CommentsSection';
// ✅ Добавлен Modal и QuestionCircleOutlined
import { Progress, Typography, message, Spin, Modal } from 'antd';
import {
  SoundOutlined,
  SoundFilled,
  MutedOutlined,
  MutedFilled,
  QuestionCircleOutlined, // ✅ Иконка вопросительного знака
} from '@ant-design/icons';
import './Home.css';

// Компонент PostLifeBar (без изменений)
const PostLifeBar = ({ expiresAt }) => {
  const calculateProgress = useCallback(() => {
    const now = new Date();
    const expires = new Date(expiresAt);
    // Предполагаем, что максимальная продолжительность жизни поста (или коммента) 24 часа для прогресс бара.
    const totalDuration = 24 * 60 * 60 * 1000;
    const remainingTime = expires.getTime() - now.getTime();

    if (remainingTime <= 0) {
      return 0;
    }

    const percent = Math.min((remainingTime / totalDuration) * 100, 100);
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

// ====================================================================

function Home() {
  const [posts, setPosts] = useState([]);
  const [floatingComments, setFloatingComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingPosts, setUpdatingPosts] = useState(new Set());
  const [userActions, setUserActions] = useState({});

  // ✅ НОВОЕ СОСТОЯНИЕ для модального окна
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 1. Загрузка постов (без изменений)
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

  // 2. Загрузка действий пользователя (Echo/DisEcho) (без изменений)
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

  // 3. Загрузка плавающих комментариев (без изменений)
  const fetchFloatingComments = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/echo_api/feed/floating/');
      setFloatingComments(response.data);
    } catch (err) {
      console.error('Ошибка при получении плавающих комментариев:', err);
    }
  }, []);

  // 4. useEffect для запуска и интервалов (без изменений, кроме зависимостей)
  useEffect(() => {
    fetchPosts();
    fetchUserEchos();
    fetchFloatingComments();

    const postsInterval = setInterval(fetchPosts, 60000);
    const actionsInterval = setInterval(fetchUserEchos, 15000);
    const floatingInterval = setInterval(fetchFloatingComments, 30000);

    return () => {
      clearInterval(postsInterval);
      clearInterval(actionsInterval);
      clearInterval(floatingInterval);
    };
  }, [fetchPosts, fetchUserEchos, fetchFloatingComments]);

  // Обработка действия (Лайк/Дизлайк) - без изменений
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

  // Компонент FloatingCommentCard (без изменений)
  const FloatingCommentCard = ({ comment }) => {
    const expired = isPostExpired(comment.expires_at);

    return (
      <div key={comment.id} className="floating-comment-card post-card">
        <div className="post-header">
          <div className="author-info">
            <div className="avatar">{comment.author_details?.username.charAt(0).toUpperCase()}</div>
            <Typography.Text strong>{comment.author_details?.username}</Typography.Text>
          </div>
        </div>

        <Typography.Paragraph
          className="post-content"
          style={{ fontSize: '0.9em', margin: '10px 0' }}
        >
          {comment.text}
        </Typography.Paragraph>

        <PostLifeBar expiresAt={comment.expires_at} />

        <div className="floating-footer post-actions-container">
          <Typography.Text type="secondary" style={{ fontSize: '0.85em' }}>
            <SoundOutlined /> {comment.echo_count} | <MutedOutlined /> {comment.disecho_count}
          </Typography.Text>
        </div>

        {expired && <div className="expired-notice">Истек 💀</div>}
      </div>
    );
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
      {/* ... (основная лента постов без изменений) ... */}
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

      <div className="floating-comments">
        <Typography.Title
          level={5}

        >
          Плавучие комментарии {floatingComments.length}
          <QuestionCircleOutlined
            onClick={showModal}
            style={{ marginLeft: 8, cursor: 'pointer', color: '#000000ff' }}
          />
        </Typography.Title>

        <div className="comments-floating-list">
          {floatingComments.length > 0 ? (
            floatingComments.map((comment) => (
              <FloatingCommentCard key={comment.id} comment={comment} />
            ))
          ) : (
            <p className="no-floating-message">Сейчас нет активных плавающих комментариев.</p>
          )}
        </div>
      </div>

      <Modal
        title="Что такое плавучие комментарии?"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <p>
          **Плавучие комментарии** — это комментарии, которые были **спасены** после того, как пост,
          к которому они относились, **истёк и исчез**.
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>
            **Спасение:** Когда время жизни поста заканчивается, он удаляется, но все его
            комментарии автоматически переводятся в "плавучее" состояние (`is_floating=True`).
          </li>
          <li>
            **Время жизни:** Плавучий комментарий сохраняет то время жизни, которое у него
            оставалось на момент исчезновения поста, и продолжает отсчитывать его.
          </li>
          <li>
            **Взаимодействие:** На плавучие комментарии **нельзя** ставить Echo/DisEcho и **нельзя**
            на них отвечать. Они существуют как "память" о посте без контекста , пока не истечет их собственное
            время.
          </li>
        </ul>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <button className="modal-ok-button"
            onClick={handleOk}
          >
            Понятно
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Home;
