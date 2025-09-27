// src/components/CommentsSection.js

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, Typography, message, Spin } from 'antd';
// Удалены CaretDownOutlined и CaretUpOutlined, т.к. MessageFilled выглядит лучше
import { MessageFilled, SendOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axiosInstance';
import './CommentsSection.css'; // <--- ИМПОРТ НОВОГО ФАЙЛА СТИЛЕЙ!

const { TextArea } = Input;

// Компонент для отдельного комментария (ОСТАВЛЯЕМ БЕЗ ИЗМЕНЕНИЙ)
const CommentCard = ({ comment }) => {
  return (
    <div className="comment-card-inline">
      <div className="comment-header-inline">
        <div className="avatar-small">
          {comment.author_details?.username.charAt(0).toUpperCase()}
        </div>
        <Typography.Text strong className="comment-author-inline">
          {comment.author_details?.username}
        </Typography.Text>
        <Typography.Text className="comment-date-inline">
          {new Date(comment.created_at).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography.Text>
      </div>
      <p className="comment-content-inline">{comment.content}</p>
    </div>
  );
};

// Основной компонент секции комментариев
const CommentsSection = ({ postId, postExpired, initialCommentCount }) => {
  const [comments, setComments] = useState([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/echo_api/posts/${postId}/comments/`);
      setComments(response.data);
      setCommentCount(response.data.length);
    } catch (error) {
      console.error('Ошибка при загрузке комментариев:', error);
      message.error('Не удалось загрузить комментарии.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Управление видимостью секции и загрузкой данных
  const toggleComments = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      // Если комментарии еще не загружались, загружаем их
      if (comments.length === 0 && commentCount > 0) {
        fetchComments();
      }
    }
  };

  const handleAddComment = async () => {
    if (!newCommentContent.trim()) {
      message.warning('Введите текст комментария.');
      return;
    }

    if (postExpired) {
      message.error('Нельзя комментировать истекший пост.');
      return;
    }

    setIsSending(true);
    try {
      await axiosInstance.post(`/echo_api/posts/${postId}/comments/`, {
        content: newCommentContent.trim(),
      });

      setNewCommentContent('');
      message.success('Комментарий успешно добавлен!');

      // После добавления обновляем список и счетчик
      await fetchComments();
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при добавлении комментария.';
      message.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="comments-section-wrapper">
      {/* Кнопка-переключатель */}
      <button className="comments-toggle-button" onClick={toggleComments} disabled={postExpired}>
        <MessageFilled />
        Комментарии {commentCount}
      </button>

      {/* Условный рендеринг: отображаем форму и список только при isExpanded = true */}
      {isExpanded && (
        <div className="comments-section-inline">
          {/* Форма для нового комментария */}
          <div className={`new-comment-form-inline ${postExpired ? 'disabled' : ''}`}>
            <TextArea
              rows={1}
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              placeholder={postExpired ? 'Пост истек...' : 'Написать комментарий...'}
              disabled={postExpired || isSending}
              autoSize={{ minRows: 1, maxRows: 3 }}
              maxLength={200}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAddComment}
              disabled={postExpired || isSending || !newCommentContent.trim()}
              loading={isSending}
            />
          </div>

          {/* Список комментариев */}
          <div className="comments-list-inline">
            {loading ? (
              <div style={{ padding: '10px', textAlign: 'center' }}>
                <Spin size="small" tip="Загрузка..." />
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => <CommentCard key={comment.id} comment={comment} />)
            ) : (
              <Typography.Text
                type="secondary"
                style={{ padding: '10px', display: 'block', fontSize: '0.9em' }}
              >
                Будьте первым, кто прокомментирует этот пост.
              </Typography.Text>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
