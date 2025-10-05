// src/components/Messages.js

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/messenger_api';

// Получение токена из localStorage
const getAuthToken = () => localStorage.getItem('access_token');

/**
 * Компонент для отображения и отправки сообщений в конкретный чат.
 * @param {object} props
 * @param {number} props.chatId - ID текущего выбранного чата.
 * @param {number} props.currentUserId - ID текущего авторизованного пользователя.
 */
function Messages({ chatId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const chatSocket = useRef(null);
  const messagesEndRef = useRef(null);
  const isUnmounting = useRef(false);

  // Сброс сообщений и статуса при смене чата
  useEffect(() => {
    setMessages([]);
    setConnectionStatus('disconnected');
    if (chatSocket.current) {
      chatSocket.current.close(1000, 'Chat ID changed');
    }
  }, [chatId]);

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
        setMessages(data.reverse());
        scrollToBottom();
      } catch (error) {
        console.error('Ошибка загрузки истории сообщений:', error);
      }
    },
    [chatId],
  );

  // 2. Установка и управление WebSocket-соединением
  useEffect(() => {
    if (!chatId) return;

    isUnmounting.current = false;
    const token = getAuthToken();

    if (!token) {
      setConnectionStatus('no_token');
      return;
    }

    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${chatId}/?token=${encodeURIComponent(token)}`;
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

    socket.onclose = () => {
      if (isUnmounting.current) return;
      setConnectionStatus('disconnected');
    };

    socket.onerror = () => {
      if (isUnmounting.current) return;
      setConnectionStatus('error');
    };

    return () => {
      isUnmounting.current = true;
      if (chatSocket.current) {
        chatSocket.current.close(1000, 'Component cleanup');
      }
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

  if (!chatId) {
    return <div className="messages-placeholder">Выберите чат для просмотра сообщений.</div>;
  }

  return (
    <>
      {/* Окно сообщений: две горизонтальные ленты */}
      <div className="messages-window">
        {/* Верхняя лента: сообщения других пользователей */}
        <div className="lane lane-top">
          {messages
            .filter((m) => !(m.sender && m.sender.id === currentUserId))
            .map((msg, index) => (
              <div key={msg.id || `top-${index}`} className="message-bubble message-other">
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
                  style={{ fontSize: '10px', textAlign: 'right', opacity: 0.7, marginTop: '4px' }}
                >
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'только что'}
                </div>
              </div>
            ))}
        </div>

        <div className="lane-separator" />

        {/* Нижняя лента: мои сообщения */}
        <div className="lane lane-bottom">
          {messages
            .filter((m) => m.sender && m.sender.id === currentUserId)
            .map((msg, index) => (
              <div key={msg.id || `bottom-${index}`} className="message-bubble message-mine">
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
                  style={{ fontSize: '10px', textAlign: 'right', opacity: 0.7, marginTop: '4px' }}
                >
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'только что'}
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Форма отправки */}
      <form className="message-input-form" onSubmit={handleSend}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={
            connectionStatus === 'connected' ? 'Напишите сообщение...' : 'Соединение отсутствует...'
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
    </>
  );
}

export default Messages;
