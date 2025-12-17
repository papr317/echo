import React, { useState, useEffect, useCallback, memo } from 'react';
import axiosInstance from '../api/axiosInstance';
import CommentsSection from '../components/CommentsSection';
import getAvatarUrl from '../utils/avatarUtils';
import { Progress, Typography, message, Spin, Avatar, Modal } from 'antd';
import { SoundOutlined, SoundFilled, MutedOutlined, MutedFilled } from '@ant-design/icons';
import './Home.css';

// --- КОМПОНЕНТ 1: ПОЛОСКА ЖИЗНИ ---
const PostLifeBar = ({ expiresAt, onExpire }) => {
  const calculateProgress = useCallback(() => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const totalDuration = 24 * 60 * 60 * 1000;
    const remainingTime = expires.getTime() - now.getTime();
    return Math.max((remainingTime / totalDuration) * 100, 0);
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
      const currentPercent = calculateProgress();
      setPercent(currentPercent);
      setFormattedTime(formatTimeLeft());
      if (currentPercent <= 0 && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateProgress, formatTimeLeft, onExpire]);

  const getTextColor = () => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const hours = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hours > 12) return '#52c41a';
    if (hours > 6) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div className="post-lifebar-container">
      <Progress
        percent={percent}
        showInfo={false}
        strokeColor={{ '0%': '#ff4d4f', '100%': '#000000' }}
        style={{ flex: 1 }}
      />
      <Typography.Text className="time-left-text" style={{ color: getTextColor() }}>
        {formattedTime}
      </Typography.Text>
    </div>
  );
};

// --- КОМПОНЕНТ 2: КАРТОЧКА ПОСТА ---
const PostCard = memo(({ post, userAction, isUpdating, onAction, getActionIcon }) => {
  const [isVisible, setIsVisible] = useState(new Date(post.expires_at) > new Date());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const handleImageClick = (url) => {
    setPreviewImage(url);
    setPreviewOpen(true);
  };

  if (!isVisible) return null;

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="author-info">
          <Avatar
            size={40}
            src={post.author_details?.avatar}
            style={{ backgroundColor: '#434343' }}
          >
            {!post.author_details?.avatar && post.author_details?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <span className="author-name">{post.author_details?.username}</span>
        </div>
      </div>

      {post.files && post.files.length > 0 ? (
        <div className={`post-media-grid files-count-${post.files.length}`}>
          {post.files.map((fileItem) => {
            const fileUrl = getAvatarUrl(fileItem.file);
            const isVideo = ['mp4', 'webm', 'mov'].includes(
              fileItem.file.split('.').pop().toLowerCase(),
            );

            return (
              <div
                key={fileItem.id}
                className="media-item-wrapper"
                onClick={() => !isVideo && handleImageClick(fileUrl)}
              >
                {isVideo ? (
                  <video controls src={fileUrl} className="post-video" />
                ) : (
                  <img src={fileUrl} alt="Post" className="post-image" loading="lazy" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="post-image-placeholder">
          <h4>Текстовый пост</h4>
        </div>
      )}

      <p className="post-content">{post.content}</p>

      <PostLifeBar expiresAt={post.expires_at} onExpire={() => setIsVisible(false)} />

      <div className="post-actions-container">
        <div className="likes-actions">
          <button
            className={`echo-button ${userAction?.type === 'echo' ? 'active' : ''}`}
            onClick={() => onAction(post.id, 'echo')}
            disabled={isUpdating}
          >
            {getActionIcon(post.id, 'echo')} <span>Крикнуть {post.echo_count}</span>
          </button>

          <button
            className={`disecho-button ${userAction?.type === 'disecho' ? 'active' : ''}`}
            onClick={() => onAction(post.id, 'disecho')}
            disabled={isUpdating}
          >
            {getActionIcon(post.id, 'disecho')} <span>Глушить {post.disecho_count}</span>
          </button>
        </div>
      </div>

      <CommentsSection
        postId={post.id}
        postExpired={!isVisible}
        initialCommentCount={post.comments_count}
      />

      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        centered
        width="90%"
        styles={{ body: { padding: 0, backgroundColor: 'transparent' } }}
      >
        <img src={previewImage} alt="Preview" className="full-res-image" />
      </Modal>
    </div>
  );
});
function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingPosts, setUpdatingPosts] = useState(new Set());
  const [userActions, setUserActions] = useState({});

  const fetchPosts = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/echo_api/feed/posts/');
      setPosts(response.data);
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
    const aInt = setInterval(fetchUserEchos, 15000);
    return () => clearInterval(aInt);
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

  const getActionIcon = (postId, actionType) => {
    const userAction = userActions[postId];
    if (userAction?.type === actionType) {
      return actionType === 'echo' ? <SoundFilled /> : <MutedFilled />;
    }
    return actionType === 'echo' ? <SoundOutlined /> : <MutedOutlined />;
  };

  if (loading)
    return (
      <div className="home-loading">
        <Spin
          size="large"
          style={{
            '--ant-color-primary': '#464646ff',
          }}
        />
        <h1>Загрузка ленты...</h1>
      </div>
    );

  if (error) return <h1 className="home-error">Ошибка загрузки.</h1>;

  return (
    <div className="home-container">
      <div className="feed-container">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              userAction={userActions[post.id]}
              isUpdating={updatingPosts.has(post.id)}
              onAction={handleAction}
              getActionIcon={getActionIcon}
            />
          ))
        ) : (
          <p className="no-posts-message">Пока нет постов или они закончились ...</p>
        )}
      </div>
    </div>
  );
}

export default Home;
