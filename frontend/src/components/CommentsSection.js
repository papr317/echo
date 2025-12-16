import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Input, Button, Typography, message, Spin, Avatar } from 'antd';
import {
  MessageFilled,
  SendOutlined,
  SoundOutlined,
  SoundFilled,
  MutedOutlined,
  MutedFilled,
  CommentOutlined,
  CloseOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import axiosInstance from '../api/axiosInstance';
import './CommentsSection.css';

const { TextArea } = Input;
const MAX_COMMENT_HEIGHT = 50;

const CommentLifeTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('...');
      setIsExpired(false);
      return;
    }
    const expirationTime = new Date(expiresAt).getTime();
    let intervalId;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = expirationTime - now;

      if (remaining <= 0) {
        setTimeLeft('Истёк');
        setIsExpired(true);
        clearInterval(intervalId);
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      let timeString = '';
      if (days > 0) timeString += `${days}д `;
      if (hours > 0) timeString += `${hours}ч `;
      if (minutes > 0) timeString += `${minutes}м `;
      if (timeString === '') {
        const seconds = totalSeconds % 60;
        timeString += `${seconds}с`;
      }

      setTimeLeft(timeString.trim());
      setIsExpired(false);
    };

    intervalId = setInterval(updateTimer, 1000);
    updateTimer();

    return () => clearInterval(intervalId);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <Typography.Text className="comment-life-timer" type={isExpired ? 'danger' : 'warning'}>
      {timeLeft}
    </Typography.Text>
  );
};

const CommentCard = memo(({ comment, userAction, onAction, onReply }) => {
  const [isFullContent, setIsFullContent] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  // Логика сворачивания/разворачивания
  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        // Используем обновленную константу MAX_COMMENT_HEIGHT
        setIsOverflowing(contentRef.current.scrollHeight > MAX_COMMENT_HEIGHT + 5);
      }
    };
    checkOverflow();
  }, [comment.content]);

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

  const parentUsername = comment.parent_comment_details?.author_details?.username;
  // Флаг для стилизации ответа
  const isReply = !!parentUsername;

  return (
    <div className={`comment-card-inline ${expired ? 'expired' : ''} ${isReply ? 'is-reply' : ''}`}>
      <div className="comment-header-inline">
        <Avatar
          size={32}
          src={comment.author_details?.avatar}
          icon={
            !comment.author_details?.avatar && comment.author_details?.username
              ? comment.author_details.username.charAt(0).toUpperCase()
              : undefined
          }
          style={{ backgroundColor: '#434343', color: '#fff', marginRight: 8 }}
        />
        <Typography.Text strong className="comment-author-inline">
          {comment.author_details?.username}
        </Typography.Text>
        <div className="comment-timer-wrapper">
          <CommentLifeTimer expiresAt={comment.expires_at} />
        </div>
      </div>
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
        <div className="comment-info-left"></div>

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
      <button
        className={`comments-toggle-button ${isExpanded ? 'comments-toggle-button-active' : ''}`}
        onClick={toggleComments}
        disabled={postExpired}
      >
        <MessageFilled />
        Комментарии {commentCount}
      </button>

      {isExpanded && (
        <div className="comments-section-inline">
          {/* Блок ответа */}
          {replyTo && (
            <div className="comment-reply-to-bar">
              <Typography.Text type="secondary" style={{ marginRight: '10px' }}>
                Ответ пользователю
                <Typography.Text strong style={{ marginLeft: '5px' }}>
                  @{replyTo.author_details?.username}
                </Typography.Text>
              </Typography.Text>
              <Button
                size="small"
                type="text"
                onClick={handleClearReply}
                icon={<CloseOutlined style={{ fontSize: '0.7em', color: '#888' }} />}
              />
            </div>
          )}

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
              style={{backgroundColor: '#000000', borderColor: '#000000', color: '#fff'}}
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAddComment}
              disabled={postExpired || isSending || !newCommentContent.trim()}
              loading={isSending}
            />
          </div>

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
