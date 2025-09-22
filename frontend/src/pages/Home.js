import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Progress, Typography } from 'antd';
import { SoundOutlined, MutedOutlined, MessageFilled } from '@ant-design/icons';
import './Home.css';

// Компонент "Полоса жизни" для поста
const PostLifeBar = ({ expiresAt }) => {
  const calculateProgress = () => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const totalDuration = 24 * 60 * 60 * 1000;
    const remainingTime = expires.getTime() - now.getTime();

    if (remainingTime <= 0) {
      return 0;
    }

    const percent = (remainingTime / totalDuration) * 100;

    return percent < 0 ? 0 : percent;
  };

  const formatTimeLeft = (expiresAt) => {
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
  };

  const [percent, setPercent] = useState(calculateProgress());
  const [formattedTime, setFormattedTime] = useState(formatTimeLeft(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(calculateProgress());
      setFormattedTime(formatTimeLeft(expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const getTextColor = () => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const remainingTimeHours = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);

    // цвет часов 
    if (remainingTimeHours > 12) {
      return '#52c41a'; // Зеленый для первых 12 часов
    } else if (remainingTimeHours > 6) {
      return '#faad14'; // Желтый для следующих 6 часов (от 6 до 12 часов)
    } else {
      return '#ff4d4f'; // Красный для последних 6 часов
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

  useEffect(() => {
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

    fetchPosts();

    const interval = setInterval(fetchPosts, 60000);
    return () => clearInterval(interval);
  }, []);

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
          posts.map((post) => (
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

              {/* нижняя часть  */}
              <div className="post-actions-container">
                <div className="likes-actions">
                  <span className="echo-button">
                    <SoundOutlined /> крикнуть {post.echo_count}
                  </span>
                  <span className="disecho-button">
                    <MutedOutlined />
                    заглушить {post.disecho_count}
                  </span>
                </div>
                <div className="comment-count">
                  <MessageFilled /> комментарии {post.comments_count}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-posts-message">Пока нет постов. Будьте первым!</p>
        )}
      </div>
      <div className="floating-comments">тут будут плавающие комментарии</div>
    </div>
  );
}

export default Home;
