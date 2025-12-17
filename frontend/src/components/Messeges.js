import React, { useState, useEffect, useRef, useCallback } from 'react';
// 💡 Используем иконки из Ant Design
import { PaperClipOutlined, PictureOutlined } from '@ant-design/icons';

const API_BASE_URL = 'http://127.0.0.1:8000/messenger_api';

// Получение токена из localStorage
const getAuthToken = () => localStorage.getItem('access_token');

/**
 * Компонент для отображения и отправки сообщений в конкретный чат.
 */
function Messages({ chatId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const chatSocket = useRef(null);
  const messagesEndRef = useRef(null);
  const isUnmounting = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Загрузка истории сообщений (REST API)
  const fetchMessages = useCallback(
    async (token) => {
      if (!token || !chatId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (!isUnmounting.current) {
          setMessages(data.reverse());
          scrollToBottom();
        }
      } catch (error) {
        console.error('Ошибка загрузки истории сообщений:', error);
      }
    },
    [chatId],
  );

  // 2. Установка и управление WebSocket-соединением
  useEffect(() => {
    if (chatSocket.current) {
      chatSocket.current.close(1000, 'Chat ID change or cleanup');
      chatSocket.current = null;
    }

    setMessages([]);
    setConnectionStatus('disconnected');

    if (!chatId) return;

    isUnmounting.current = false;
    const token = getAuthToken();

    if (!token) {
      setConnectionStatus('no_token');
      return;
    }

    setConnectionStatus('connecting');

    const wsUrl = `ws://127.0.0.1:8001/ws/chat/${chatId}/?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);
    chatSocket.current = socket;

    socket.onopen = () => {
      if (isUnmounting.current) return;
      setConnectionStatus('connected');
      fetchMessages(token);
    };

    socket.onmessage = (e) => {
      if (isUnmounting.current) return;
      try {
        const data = JSON.parse(e.data);
        setMessages((prev) => {
          const isDuplicate = prev.some((msg) => msg.id === data.id);
          return isDuplicate ? prev : [...prev, data];
        });
        scrollToBottom();
      } catch (error) {
        console.error('Ошибка парсинга сообщения:', error);
      }
    };

    socket.onclose = (e) => {
      if (e.code !== 1000 && !isUnmounting.current) {
        console.error(`WebSocket закрыт: Код ${e.code}. Причина: ${e.reason || 'Неизвестно'}`);
      }
      if (isUnmounting.current) return;
      setConnectionStatus('disconnected');
    };

    socket.onerror = (e) => {
      if (isUnmounting.current) return;
      console.error('WebSocket ошибка:', e);
      setConnectionStatus('error');
    };

    return () => {
      isUnmounting.current = true;
      if (chatSocket.current && chatSocket.current.readyState === WebSocket.OPEN) {
        chatSocket.current.close(1000, 'Component cleanup');
      }
      chatSocket.current = null;
    };
  }, [chatId, fetchMessages]);

  // 3. Обработчик отправки сообщения (WebSocket)
  const handleSend = (e) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (trimmedMessage === '' || connectionStatus !== 'connected') return;
    if (!chatSocket.current || chatSocket.current.readyState !== WebSocket.OPEN) return;

    chatSocket.current.send(JSON.stringify({ text: trimmedMessage }));
    setNewMessage('');
  };

  // 4. Заглушки для кнопок вложения
  const handleAttachFile = () => {
    alert('Функционал прикрепления файла (скрепки) будет добавлен в следующей версии!');
  };

  const handleAttachPhoto = () => {
    alert('Функционал прикрепления фото/изображения будет добавлен в следующей версии!');
  };

  if (!chatId) {
    return <div className="messages-placeholder">Выберите чат для просмотра сообщений.</div>;
  }

  return (
    <div className="messages-area-fixed-layout">
      <div className="messages-content-area">
        {/* Лента для моих сообщений (сверху) */}
        <div className="my-messages-lane">
          {messages
            .filter((msg) => msg.sender && String(msg.sender.id) === String(currentUserId))
            .map((msg, index) => (
              <div key={msg.id || `msg-mine-${index}`} className="message-bubble message-mine">
                <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                <div
                  style={{
                    fontSize: '10px',
                    textAlign: 'right',
                    opacity: 0.7,
                    marginTop: '4px',
                  }}
                >
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'только что'}
                </div>
              </div>
            ))}
        </div>

        <div className="lane-separator"></div> {/* Разделитель между лентами */}

        {/* Лента для сообщений других пользователей (снизу) */}
        <div className="other-messages-lane">
          {messages
            .filter((msg) => msg.sender && String(msg.sender.id) !== String(currentUserId))
            .map((msg, index) => (
              <div key={msg.id || `msg-other-${index}`} className="message-bubble message-other">
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '12px',
                    marginBottom: '4px',
                    opacity: 0.9,
                  }}
                >
                  {msg.sender ? msg.sender.username : `Пользователь ${msg.sender_id}`}
                </div>
                <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                <div
                  style={{
                    fontSize: '10px',
                    textAlign: 'right',
                    opacity: 0.7,
                    marginTop: '4px',
                  }}
                >
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'только что'}
                </div>
              </div>
            ))}
        </div>
        <div ref={messagesEndRef} /> {/* messagesEndRef теперь здесь, чтобы прокручивать оба контейнера */} 
      </div>

      {/* Форма отправки закреплена снизу */}
      <form className="message-input-form" onSubmit={handleSend}>
        {/* Кнопка-скрепка (Вложение) - AntD Icon */}
        <button
          type="button"
          className="attach-btn"
          onClick={handleAttachFile}
          disabled={connectionStatus !== 'connected'}
        >
          <PaperClipOutlined style={{ fontSize: '16px' }} />
        </button>

        {/* Кнопка-фото (Изображение) - AntD Icon */}
        <button
          type="button"
          className="attach-btn"
          onClick={handleAttachPhoto}
          disabled={connectionStatus !== 'connected'}
        >
          <PictureOutlined style={{ fontSize: '16px' }} />
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={
            connectionStatus === 'connected'
              ? 'Напишите сообщение...'
              : connectionStatus === 'connecting'
              ? 'Подключение...'
              : 'Соединение отсутствует...'
          }
          disabled={connectionStatus !== 'connected'}
        />
        <button
          type="submit"
          disabled={connectionStatus !== 'connected' || newMessage.trim() === ''}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}

export default Messages;
