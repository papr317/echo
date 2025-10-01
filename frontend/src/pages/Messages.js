import React, { useState, useEffect, useRef, useCallback } from 'react';

// Предполагаем, что этот ID хранится где-то
// Для демо-целей, захардкодим его, но в реальном приложении он будет в стейте пользователя
const getAuthToken = () => localStorage.getItem('access_token');
const getUserId = () => {
  // В реальном приложении нужно декодировать JWT или получать из контекста/Redux
  // Для теста, захардкодим ID пользователя, который будет отправлять сообщения (например, 1)
  return 1;
};

const CHAT_ID = 1;
const API_BASE_URL = 'http://127.0.0.1:8000/messenger_api'; // ИСПРАВЛЕННЫЙ ПУТЬ

function Messages() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const chatSocket = useRef(null);
  const messagesEndRef = useRef(null); // Для автоскролла
  const isUnmounting = useRef(false);
  const currentUserId = getUserId(); // Получаем ID текущего пользователя

  // Автоматический скролл вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Загрузка истории сообщений (REST API)
  const fetchMessages = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      console.error('❌ Отсутствует токен аутентификации.');
      return;
    }

    try {
      console.log('📡 Загружаю историю сообщений...');
      // ИСПОЛЬЗУЕМ API_BASE_URL/chats/{chat_id}/messages/
      const response = await fetch(`${API_BASE_URL}/chats/${CHAT_ID}/messages/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ История загружена:', data.length, 'сообщений');

      // Сообщения приходят в обратном порядке (DESC), поэтому переворачиваем
      setMessages(data.reverse());
      scrollToBottom();
    } catch (error) {
      console.error('❌ Ошибка загрузки истории сообщений:', error);
    }
  }, []);

  // 2. Установка и управление WebSocket-соединением
  useEffect(() => {
    isUnmounting.current = false;

    const token = getAuthToken();
    if (!token) {
      setConnectionStatus('no_token');
      return;
    }

    // ВАЖНО: WebSocket должен использовать WSS/WS. У нас WS.
    // Передаем токен в URL-параметрах
    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${CHAT_ID}/?token=${encodeURIComponent(token)}`;
    console.log('🔗 Подключаюсь к:', wsUrl);

    const socket = new WebSocket(wsUrl);
    chatSocket.current = socket;

    socket.onopen = () => {
      if (isUnmounting.current) return;
      console.log('✅ WebSocket: Соединение установлено.');
      setConnectionStatus('connected');
      fetchMessages(); // Загрузка истории после подключения
    };

    socket.onmessage = (e) => {
      if (isUnmounting.current) return;
      try {
        const data = JSON.parse(e.data);
        console.log('📨 WebSocket: Получено сообщение:', data);

        // ВАЖНО: Добавляем новое сообщение в конец
        setMessages((prevMessages) => {
          // Убедимся, что не дублируем сообщение, если оно было отправлено REST API
          const isDuplicate = prevMessages.some((msg) => msg.id === data.id);
          return isDuplicate ? prevMessages : [...prevMessages, data];
        });

        scrollToBottom();
      } catch (error) {
        console.error('❌ Ошибка парсинга сообщения:', error);
      }
    };

    socket.onclose = (e) => {
      if (isUnmounting.current) return;
      console.log(`🔌 WebSocket: Соединение закрыто. Код: ${e.code}`);
      setConnectionStatus('disconnected');
    };

    socket.onerror = (error) => {
      if (isUnmounting.current) return;
      console.error('❌ WebSocket: Ошибка:', error);
      setConnectionStatus('error');
    };

    return () => {
      console.log('🧹 Очистка WebSocket соединения');
      isUnmounting.current = true;
      if (chatSocket.current) {
        chatSocket.current.close(1000, 'Component unmount');
      }
    };
  }, [fetchMessages]);

  // 3. Обработчик отправки сообщения (WebSocket)
  const handleSend = (e) => {
    e.preventDefault();

    const trimmedMessage = newMessage.trim();
    if (trimmedMessage === '' || connectionStatus !== 'connected') {
      return;
    }

    if (!chatSocket.current || chatSocket.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket не подключен');
      return;
    }

    // Отправляем только текст, остальное добавляет сервер
    const messageToSend = { text: trimmedMessage };

    console.log('📤 Отправляю сообщение:', messageToSend);
    chatSocket.current.send(JSON.stringify(messageToSend));
    setNewMessage('');
  };

  // 4. Логика отображения
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return '#4CAF50';
      case 'disconnected':
        return '#f44336';
      case 'error':
        return '#ff9800';
      case 'no_token':
        return '#9c27b0';
      default:
        return '#9e9e9e';
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Подключено ✅';
      case 'disconnected':
        return 'Отключено ❌';
      case 'error':
        return 'Ошибка подключения ⚠️';
      case 'no_token':
        return 'Нет токена авторизации 🔐';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Чат ID: {CHAT_ID}</h1>

      {/* Статус соединения */}
      <div
        style={{
          padding: '10px',
          backgroundColor: getStatusColor(connectionStatus),
          color: 'white',
          borderRadius: '5px',
          marginBottom: '10px',
          textAlign: 'center',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Статус: {getStatusText(connectionStatus)}</span>
        {connectionStatus !== 'connected' && (
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '5px 10px',
              backgroundColor: 'white',
              color: getStatusColor(connectionStatus),
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Переподключить
          </button>
        )}
      </div>

      {/* Окно сообщений */}
      <div
        style={{
          height: '400px',
          border: '1px solid #ccc',
          overflowY: 'scroll',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f9f9f9',
          borderRadius: '5px',
          marginBottom: '10px',
        }}
      >
        {messages.length === 0 && connectionStatus === 'connected' ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '150px' }}>
            Нет сообщений. Начните общение!
          </div>
        ) : (
          messages.map((msg, index) => {
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем msg.sender.id
            const isMyMessage = msg.sender && msg.sender.id === currentUserId;

            return (
              <div
                key={msg.id || index}
                style={{
                  alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
                  backgroundColor: isMyMessage ? '#dcf8c6' : '#ffffff',
                  margin: '5px',
                  padding: '8px 12px',
                  borderRadius: '15px',
                  maxWidth: '80%',
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '12px',
                    marginBottom: '2px',
                    color: isMyMessage ? '#075e54' : '#666',
                  }}
                >
                  {/* Используем sender.username */}
                  {msg.sender ? msg.sender.username : `Пользователь ${msg.sender_id}`}
                </div>
                <div style={{ marginBottom: '5px', wordBreak: 'break-word' }}>{msg.text}</div>
                <div
                  style={{
                    fontSize: '10px',
                    textAlign: 'right',
                    color: '#666',
                    opacity: 0.7,
                  }}
                >
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'только что'}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} /> {/* Якорь для скролла */}
      </div>

      {/* Форма отправки */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={
            connectionStatus === 'connected' ? 'Напишите сообщение...' : 'Соединение отсутствует...'
          }
          style={{
            flexGrow: 1,
            padding: '10px',
            border: `1px solid ${connectionStatus === 'connected' ? '#4CAF50' : '#ccc'}`,
            borderRadius: '5px',
            fontSize: '14px',
          }}
          disabled={connectionStatus !== 'connected'}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor:
              connectionStatus === 'connected' && newMessage.trim() !== '' ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor:
              connectionStatus === 'connected' && newMessage.trim() !== ''
                ? 'pointer'
                : 'not-allowed',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
          disabled={connectionStatus !== 'connected' || newMessage.trim() === ''}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}

export default Messages;
