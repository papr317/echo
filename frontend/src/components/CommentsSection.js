// src/components/CommentsSection.js

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Input, Button, Typography, message, Spin } from 'antd';
import {
  MessageFilled,
  SendOutlined,
  SoundOutlined,
  SoundFilled,
  MutedOutlined,
  MutedFilled,
  CommentOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import axiosInstance from '../api/axiosInstance';
import './CommentsSection.css';

const { TextArea } = Input;
// Максимальная высота текста комментария до появления кнопки "Показать полностью"
const MAX_COMMENT_HEIGHT = 70;

// -------------------------------------------------------------
// Вспомогательный компонент: Время жизни комментария
// -------------------------------------------------------------
const CommentLifeTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const expirationTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const remaining = expirationTime - now;

      if (remaining <= 0) {
        setTimeLeft('0с');
        setIsExpired(true);
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      let timeString = '';
      if (hours > 0) timeString += `${hours}ч `;
      if (minutes > 0) timeString += `${minutes}м `;
      timeString += `${seconds}с`;

      setTimeLeft(timeString.trim());
      setIsExpired(false);
    };

    const intervalId = setInterval(updateTimer, 1000);
    updateTimer();

    return () => clearInterval(intervalId);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <Typography.Text className="comment-life-timer" type={isExpired ? 'danger' : 'warning'}>
      {isExpired ? 'Истёк' : timeLeft}
    </Typography.Text>
  );
};

// -------------------------------------------------------------
// Компонент для отдельного комментария
// -------------------------------------------------------------
const CommentCard = memo(({ comment, userAction, onAction, onReply }) => {
  const [isFullContent, setIsFullContent] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  // Логика сворачивания/разворачивания
  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        // Проверяем, превышает ли прокручиваемая высота максимальную (70px)
        setIsOverflowing(contentRef.current.scrollHeight > MAX_COMMENT_HEIGHT + 5);
      }
    };
    checkOverflow();
  }, [comment.content]);

  // Определяем, истек ли сам комментарий
  const expired =
    comment.is_expired || (comment.expires_at && new Date(comment.expires_at) < new Date());
  const isUpdating = false;

  const getActionIcon = (type) => {
    if (userAction?.type === type) {
      return type === 'echo' ? <SoundFilled /> : <MutedFilled />;
    } else {
      return type === 'echo' ? <SoundOutlined /> : <MutedOutlined />;
    }
  };

  const handleCommentAction = (actionType) => {
    if (expired || isUpdating) return;
    onAction(comment.id, actionType);
  };

  // Если есть родительский комментарий (для отображения, не для действий)
  const parentUsername = comment.parent_comment_details?.author_details?.username;

  return (
    <div className={`comment-card-inline ${expired ? 'expired' : ''}`}>
      <div className="comment-header-inline">
        <div className="avatar-small">
          {comment.author_details?.username.charAt(0).toUpperCase()}
        </div>
        <Typography.Text strong className="comment-author-inline">
          {comment.author_details?.username}
        </Typography.Text>
      </div>

      {/* Отображение, если это ответ */}
      {parentUsername && <div className="comment-reply-to-bar">Ответ @{parentUsername}</div>}

      {/* БЛОК КОНТЕНТА */}
      <div
        ref={contentRef}
        className={`comment-content-container ${
          !isFullContent && isOverflowing ? 'collapsed' : ''
        }`}
        style={isFullContent ? { maxHeight: 'none' } : {}}
      >
        <p className="comment-content-inline">{comment.content}</p>
      </div>

      {/* Кнопка "Показать полностью" */}
      {isOverflowing && (
        <button className="show-more-button" onClick={() => setIsFullContent(!isFullContent)}>
          {isFullContent ? (
            <>
              <UpOutlined style={{ fontSize: '0.7em' }} /> Свернуть
            </>
          ) : (
            <>
              <DownOutlined style={{ fontSize: '0.7em' }} /> Показать полностью
            </>
          )}
        </button>
      )}

      <div className="comment-footer-inline">
        {/* Левый блок: Таймер и дата */}
        <div className="comment-info-left">
          <CommentLifeTimer expiresAt={comment.expires_at} />
          <Typography.Text className="comment-date-inline">
            {new Date(comment.created_at).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography.Text>
        </div>

        {/* Правый блок: Действия */}
        <div className="comment-actions">
          <button
            className="comment-reply-button"
            onClick={() => onReply(comment)}
            disabled={expired || isUpdating}
          >
            <CommentOutlined />
            Ответить
          </button>
          <button
            className={`comment-echo-button ${userAction?.type === 'echo' ? 'active' : ''}`}
            onClick={() => handleCommentAction('echo')}
            disabled={expired || isUpdating}
          >
            {getActionIcon('echo')}
            {comment.echo_count}
          </button>
          <button
            className={`comment-disecho-button ${userAction?.type === 'disecho' ? 'active' : ''}`}
            onClick={() => handleCommentAction('disecho')}
            disabled={expired || isUpdating}
          >
            {getActionIcon('disecho')}
            {comment.disecho_count}
          </button>
        </div>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Основной компонент секции комментариев
// -------------------------------------------------------------
const CommentsSection = ({ postId, postExpired, initialCommentCount }) => {
  const [comments, setComments] = useState([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userCommentActions, setUserCommentActions] = useState({});
  const [replyTo, setReplyTo] = useState(null);

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

  const fetchUserCommentEchos = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/echo_api/my/echos/');

      const newActions = response.data.reduce((acc, action) => {
        if (action.content_type_model === 'comment') {
          const type = action.is_echo ? 'echo' : 'disecho';
          acc[action.object_id] = { type };
        }
        return acc;
      }, {});

      setUserCommentActions(newActions);
    } catch (err) {
      console.error('Ошибка при получении действий пользователя:', err);
    }
  }, []);

  useEffect(() => {
    setCommentCount(initialCommentCount);
    fetchUserCommentEchos();
  }, [initialCommentCount, fetchUserCommentEchos]);

  const toggleComments = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      if (comments.length === 0 || commentCount !== comments.length) {
        fetchComments();
      }
    }
  };

  const handleReplyClick = useCallback((comment) => {
    setReplyTo(comment);
    setNewCommentContent(`@${comment.author_details?.username} `);
  }, []);

  const handleClearReply = useCallback(() => {
    setReplyTo(null);
    setNewCommentContent('');
  }, []);

  const handleAddComment = async () => {
    if (!newCommentContent.trim() || postExpired) return;

    setIsSending(true);
    try {
      const payload = {
        content: newCommentContent.trim(),
        parent_comment_id: replyTo ? replyTo.id : null,
      };

      await axiosInstance.post(`/echo_api/posts/${postId}/comments/`, payload);

      setNewCommentContent('');
      setReplyTo(null);
      message.success('Комментарий успешно добавлен!');
      await fetchComments();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.content ||
        'Ошибка при добавлении комментария.';
      message.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleCommentAction = async (commentId, actionType) => {
    try {
      const endpoint =
        actionType === 'echo'
          ? `/echo_api/comments/${commentId}/echo/`
          : `/echo_api/comments/${commentId}/disecho/`;

      const response = await axiosInstance.post(endpoint);
      const updatedComment = response.data;

      setComments((prevComments) =>
        prevComments.map((c) => (c.id === commentId ? updatedComment : c)),
      );

      const currentAction = userCommentActions[commentId]?.type;
      let newActions = { ...userCommentActions };

      if (currentAction === actionType) {
        delete newActions[commentId];
      } else {
        newActions[commentId] = { type: actionType };
      }
      setUserCommentActions(newActions);

      message.success(actionType === 'echo' ? 'Эхо комментарию!' : 'Заглушка комментарию!');
    } catch (error) {
      console.error('Ошибка при обработке действия комментария:', error);
      message.error(error.response?.data?.error || 'Ошибка действия комментария.');
      fetchUserCommentEchos();
    }
  };

  return (
    <div className="comments-section-wrapper">
      <button className="comments-toggle-button" onClick={toggleComments} disabled={postExpired}>
        <MessageFilled />
        Комментарии ({commentCount})
      </button>

      {isExpanded && (
        <div className="comments-section-inline">
          {/* Блок ответа (отображается только при ответе) */}
          {replyTo && (
            <div className="reply-info-bar">
              <Typography.Text type="secondary">
                Ответ пользователю **@{replyTo.author_details?.username}**
              </Typography.Text>
              <Button size="small" type="link" onClick={handleClearReply}>
                Отмена
              </Button>
            </div>
          )}

          {/* Форма комментария */}
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

          {/* Обертка для горизонтальной прокрутки */}
          <div className="comments-scroll-wrapper">
            {loading ? (
              <div style={{ padding: '10px', textAlign: 'center', minWidth: '100%' }}>
                <Spin size="small" />
              </div>
            ) : comments.length > 0 ? (
              <div className="comments-list-horizontal">
                {comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    userAction={userCommentActions[comment.id]}
                    onAction={handleCommentAction}
                    onReply={handleReplyClick}
                  />
                ))}
              </div>
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
