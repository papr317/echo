// главная страница
import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import CommentsSection from '../components/CommentsSection';
import { Progress, Typography, message, Spin, Avatar } from 'antd';
import { SoundOutlined, SoundFilled, MutedOutlined, MutedFilled } from '@ant-design/icons';
import './Home.css';

const PostLifeBar = ({ expiresAt }) => {
  const calculateProgress = useCallback(() => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const totalDuration = 24 * 60 * 60 * 1000;
    const remainingTime = expires.getTime() - now.getTime();
    if (remainingTime <= 0) return 0;
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
    return minutes < 60
      ? `${minutes}м ${seconds}с`
      : `${Math.floor(minutes / 60)}ч ${minutes % 60}м`;
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
    const hours = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hours > 24) return '#1890ff';
    if (hours > 12) return '#52c41a';
    if (hours > 6) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div className="post-lifebar-container">
      <Progress
        percent={percent}
        showInfo={false}
        strokeColor={{ '0%': '#ff0000ff', '20%': '#3d3d3dff', '100%': '#000000ff' }}
        style={{ flex: 1 }}
      />
      <Typography.Text className="time-left-text" style={{ color: getTextColor() }}>
        {formattedTime}
      </Typography.Text>
    </div>
  );
};

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingPosts, setUpdatingPosts] = useState(new Set());
  const [userActions, setUserActions] = useState({});

  const fetchPosts = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/echo_api/feed/posts/');
      setPosts(response.data.map((post) => ({ ...post })));
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);

  const fetchUserEchos = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/echo_api/my/echos/');
      const newActions = response.data.reduce((acc, action) => {
        if (action.content_type_model === 'post') {
          acc[action.object_id] = { type: action.is_echo ? 'echo' : 'disecho' };
        }
        return acc;
      }, {});
      setUserActions(newActions);
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchUserEchos();
    const pInt = setInterval(fetchPosts, 60000);
    const aInt = setInterval(fetchUserEchos, 15000);
    return () => {
      clearInterval(pInt);
      clearInterval(aInt);
    };
  }, [fetchPosts, fetchUserEchos]);

  const handleAction = async (postId, actionType) => {
    if (updatingPosts.has(postId)) return;
    setUpdatingPosts((prev) => new Set(prev).add(postId));
    try {
      const endpoint =
        actionType === 'echo'
          ? `/echo_api/posts/${postId}/echo/`
          : `/echo_api/posts/${postId}/disecho/`;
      const response = await axiosInstance.post(endpoint);
      setPosts((prev) => prev.map((post) => (post.id === postId ? response.data : post)));
      message.success('Готово!');
    } catch (error) {
      message.error('Ошибка действия');
    } finally {
      setUpdatingPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const isPostExpired = (expiresAt) => new Date(expiresAt) < new Date();

  const getActionIcon = (postId, actionType) => {
    const userAction = userActions[postId];
    if (userAction?.type === actionType) {
      return actionType === 'echo' ? <SoundFilled /> : <MutedFilled />;
    }
    return actionType === 'echo' ? <SoundOutlined /> : <MutedOutlined />;
  };

  if (loading)
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>

    <Spin 
  size="large" 
  style={{ '--ant-color-primary': '#2e2e2eff' }} />
      <h1>Загрузка...</h1>
      </div>
    );
  if (error)
    return (
      <h1 style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Ошибка загрузки.</h1>
    );

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
                    <Avatar
                      size={40}
                      src={post.author_details?.avatar}
                      icon={
                        !post.author_details?.avatar &&
                        post.author_details?.username?.charAt(0).toUpperCase()
                      }
                      style={{ backgroundColor: '#434343', color: '#fff', marginRight: 8 }}
                    />
                    <p>{post.author_details?.username}</p>
                  </div>
                </div>

                {post.image ? (
                  <img
                    src={`http://127.0.0.1:8000${post.image}`}
                    alt="Post"
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
                      {getActionIcon(post.id, 'echo')} крикнуть {post.echo_count}
                    </button>

                    <button
                      className={`disecho-button ${
                        userAction?.type === 'disecho' ? 'active' : ''
                      } ${expired ? 'disabled' : ''}`}
                      onClick={() => handleAction(post.id, 'disecho')}
                      disabled={expired || isUpdating}
                    >
                      {getActionIcon(post.id, 'disecho')} заглушить {post.disecho_count}
                    </button>
                  </div>
                </div>

                {expired && <div className="expired-notice">Пост истек.....</div>}

                <CommentsSection
                  postId={post.id}
                  postExpired={expired}
                  initialCommentCount={post.comments_count}
                />
              </div>
            );
          })
        ) : (
          <p className="no-posts-message">Пока нет постов. Будьте первым, или они закончились...</p>
        )}
      </div>
    </div>
  );
}

export default Home;
