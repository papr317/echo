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
    CloseOutlined,
} from '@ant-design/icons';
// import axiosInstance from '../api/axiosInstance'; // Используйте ваш реальный импорт
import './CommentsSection.css';

const { TextArea } = Input;
const MAX_COMMENT_HEIGHT = 60; 

// --- Вспомогательный компонент: Время жизни комментария (без изменений) ---
const CommentLifeTimer = ({ expiresAt }) => {
    // ... (Логика CommentLifeTimer без изменений)
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


// --- Рекурсивный компонент для отображения вертикального списка ответов ---
const CommentReplyRenderer = memo(({ comments, userCommentActions, onAction, onReply, depth }) => {
    return (
        <div className="comment-replies-list">
            {comments.map(comment => (
                <CommentCard
                    key={comment.id}
                    comment={comment}
                    userAction={userCommentActions[comment.id]}
                    onAction={onAction}
                    onReply={onReply}
                    userCommentActions={userCommentActions}
                    depth={depth} 
                />
            ))}
        </div>
    );
});


// --- Компонент для отдельного комментария ---
const CommentCard = memo(({ comment, userAction, onAction, onReply, userCommentActions, depth = 0 }) => {
    const contentRef = useRef(null);
    const [showReplies, setShowReplies] = useState(false); 

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
    
    // Определяем, является ли это ответом
    const isReply = depth > 0;
    
    // !!! ИЗМЕНЕНИЕ: Убираем lineOffset, иерархия будет на CSS через border-left
    
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
        // !!! ИЗМЕНЕНИЕ: Класс 'depth-{depth}' добавлен для CSS-иерархии
        <div 
            className={`comment-card-inline ${expired ? 'expired' : ''} ${isReply ? 'is-reply' : 'is-root'} depth-${depth}`}
        >
            {/* !!! УДАЛЕНО: Элемент reply-thread-line больше не нужен */}
            
            {/* Обертка для контента - теперь она сама получит границу и отступ */}
            {/* !!! ИЗМЕНЕНИЕ: style={} теперь пустой, все стили в CSS */}
            <div className="comment-content-wrapper"> 
                
                <div className="comment-header-inline">
                    <div className="avatar-small">
                        {comment.author_details?.username.charAt(0).toUpperCase()}
                    </div>
                    <Typography.Text strong className="comment-author-inline">
                        {comment.author_details?.username}
                    </Typography.Text>
                </div>

                {parentUsername && <div className="comment-reply-to-bar">Ответ @{parentUsername}</div>}

                {/* БЛОК КОНТЕНТА */}
                <div
                    ref={contentRef}
                    className={`comment-content-container ${isReply ? 'is-reply-content' : 'is-root-content'}`}
                    style={{ maxHeight: MAX_COMMENT_HEIGHT + 'px' }}
                >
                    <p className="comment-content-inline">{comment.content}</p>
                </div>

                <div className="comment-footer-inline">
                    <div className="comment-info-left">
                        <CommentLifeTimer expiresAt={comment.expires_at} />
                        <Typography.Text className="comment-date-inline">
                            {new Date(comment.created_at).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Typography.Text>
                    </div>

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
                
                {/* Кнопка Показать Ответы */}
                {hasReplies && (
                    <button
                        className="replies-toggle-button"
                        onClick={() => setShowReplies(!showReplies)}
                    >
                        {showReplies ? (
                            <>
                                <UpOutlined /> Скрыть {comment.replies.length} {comment.replies.length === 1 ? 'ответ' : 'ответов'}
                            </>
                        ) : (
                            <>
                                <DownOutlined /> Показать {comment.replies.length} {comment.replies.length === 1 ? 'ответ' : 'ответа'}
                            </>
                        )}
                    </button>
                )}
            </div>
            
            {/* БЛОК ОТВЕТОВ: РЕНДЕРИНГ ТОЛЬКО ПРИ РАСКРЫТИИ */}
            {hasReplies && showReplies && (
                <div className="comment-replies-wrapper">
                    <CommentReplyRenderer 
                        comments={comment.replies} 
                        userCommentActions={userCommentActions} 
                        onAction={onAction}
                        onReply={onReply}
                        depth={depth + 1} // Увеличиваем глубину
                    />
                </div>
            )}
        </div>
    );
});

// --- Основной компонент CommentsSection (с заглушкой бэкенда) ---
const CommentsSection = ({ postId, postExpired, initialCommentCount, axiosInstance }) => { 
    const [comments, setComments] = useState([]);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [userCommentActions, setUserCommentActions] = useState({});
    const [replyTo, setReplyTo] = useState(null);

    const [isExpanded, setIsExpanded] = useState(false);
    const [commentCount, setCommentCount] = useState(initialCommentCount);

    useEffect(() => {
        setCommentCount(initialCommentCount);
    }, [initialCommentCount]);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        // !!! ЗАГЛУШКА БЭКЕНДА
        const mockFetchComments = () => {
             return new Promise(resolve => {
                setTimeout(() => {
                    resolve([
                        {
                            id: 1, content: "Это корневой комментарий, который должен быть в горизонтальной ленте. Его высота 60px.", 
                            author_details: { username: "User1" }, created_at: new Date(), 
                            echo_count: 5, disecho_count: 1, 
                            replies: [
                                { id: 11, content: "Ответ на корневой коммент. Первая ступень. Имеет левую границу.", author_details: { username: "Replyer1" }, created_at: new Date(), echo_count: 2, disecho_count: 0, 
                                    parent_comment_id: 1, parent_comment_details: { author_details: { username: "User1" } },
                                    replies: [
                                        { id: 111, content: "Вложенный ответ. Вторая ступень. Имеет две левые границы. ", author_details: { username: "Replyer2" }, created_at: new Date(), echo_count: 1, disecho_count: 0, 
                                            parent_comment_id: 11, parent_comment_details: { author_details: { username: "Replyer1" } }, 
                                            replies: [
                                                { id: 1111, content: "Третья ступень. Узкий коммент.", author_details: { username: "Replyer3" }, created_at: new Date(), echo_count: 1, disecho_count: 0, 
                                                    parent_comment_id: 111, parent_comment_details: { author_details: { username: "Replyer2" } }, 
                                                    replies: [] },
                                            ]
                                        },
                                    ]
                                },
                                { id: 12, content: "Второй ответ на корневой.", author_details: { username: "Replyer4" }, created_at: new Date(), echo_count: 0, disecho_count: 0, parent_comment_id: 1, parent_comment_details: { author_details: { username: "User1" } }, replies: [] },
                            ]
                        },
                        { id: 2, content: "Второй корневой комментарий.", author_details: { username: "User2" }, created_at: new Date(), echo_count: 3, disecho_count: 0, replies: [] },
                        { id: 3, content: "Третий корневой, для прокрутки.", author_details: { username: "User3" }, created_at: new Date(), echo_count: 0, disecho_count: 0, replies: [] },
                    ]);
                }, 500);
            });
        }
        
        try {
            // Вставьте вашу логику тут:
            // const response = await axiosInstance.get(`/echo_api/posts/${postId}/comments/`); 
            // const rootComments = process_response(response.data); 

            const rootComments = await mockFetchComments(); 
            
            setComments(rootComments);
            setCommentCount(rootComments.length);
        } catch (error) {
            console.error('Ошибка при загрузке комментариев:', error);
            message.error('Не удалось загрузить комментарии.');
        } finally {
            setLoading(false);
        }
    }, [postId, axiosInstance]);

    // ... (Остальные функции handleReplyClick, handleAddComment, handleCommentAction и т.д. без изменений)
    const fetchUserCommentEchos = useCallback(async () => {
        setUserCommentActions({});
    }, []);

    useEffect(() => {
        fetchUserCommentEchos();
    }, [fetchUserCommentEchos]);

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
        if (replyTo && newCommentContent.startsWith(`@${replyTo?.author_details?.username}`)) {
            setNewCommentContent('');
        }
    }, [replyTo, newCommentContent]);

    const handleAddComment = async () => {
        if (!newCommentContent.trim() || postExpired) return;

        setIsSending(true);
        try {
            // const payload = { ... }; await axiosInstance.post(..., payload);
            message.success('Комментарий успешно добавлен! (Демо)');
            setNewCommentContent('');
            setReplyTo(null);
            await fetchComments();
        } catch (error) {
            message.error('Ошибка при добавлении комментария. (Демо)');
        } finally {
            setIsSending(false);
        }
    };

    const handleCommentAction = async (commentId, actionType) => {
        message.info(`Действие "${actionType}" на коммент ${commentId}. (Демо)`);
    };

    return (
        <div className="comments-section-wrapper">
            <button className="comments-toggle-button" onClick={toggleComments} disabled={postExpired}>
                <MessageFilled />
                Комментарии ({commentCount})
                {isExpanded ? <UpOutlined style={{fontSize: '0.8em'}}/> : <DownOutlined style={{fontSize: '0.8em'}}/>}
            </button>

            {isExpanded && (
                <div className="comments-section-inline">
                    {replyTo && (
                        <div className="reply-info-bar">
                            <Typography.Text type="secondary" style={{ marginRight: 'auto' }}>
                                Ответ пользователю 
                                <Typography.Text strong> 
                                    {' '}@{replyTo.author_details?.username}
                                </Typography.Text>
                            </Typography.Text>
                            <Button
                                size="small"
                                type="link"
                                onClick={handleClearReply}
                                icon={<CloseOutlined style={{ fontSize: '0.7em' }} />}
                            >
                                Отмена
                            </Button>
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
                            maxLength={300}
                        />
                        <Button
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
                                        userCommentActions={userCommentActions}
                                        depth={0} 
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