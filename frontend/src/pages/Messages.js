import React, { useState, useEffect, useRef, useCallback } from 'react';

const getAuthToken = () => {
  const token = localStorage.getItem('access_token');
  return token;
};

const CHAT_ID = 1;
const API_BASE_URL = 'http://127.0.0.1:8000/messenger_api';

function Messages() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const chatSocket = useRef(null);
  const isUnmounting = useRef(false);

  const fetchMessages = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      console.error('❌ Отсутствует токен аутентификации.');
      return;
    }

    try {
      console.log('📡 Загружаю историю сообщений...');
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
      // Убедись что сообщения правильно форматируются
      const formattedMessages = data.map((msg) => ({
        ...msg,
        text: msg.text, // Unicode символы должны автоматически конвертироваться
      }));
      setMessages(formattedMessages.reverse());
    } catch (error) {
      console.error('❌ Ошибка загрузки истории сообщений:', error);
    }
  }, []);

  useEffect(() => {
    isUnmounting.current = false;

    const token = getAuthToken();
    if (!token) {
      setConnectionStatus('no_token');
      return;
    }

    const url = `ws://127.0.0.1:8000/ws/chat/${CHAT_ID}/?token=${encodeURIComponent(token)}`;
    console.log('🔗 Подключаюсь к:', url);

    const socket = new WebSocket(url);
    chatSocket.current = socket;

    socket.onopen = () => {
      if (isUnmounting.current) return;
      console.log('✅ WebSocket: Соединение установлено.');
      setConnectionStatus('connected');
      fetchMessages();
    };

    socket.onmessage = (e) => {
      if (isUnmounting.current) return;
      try {
        const data = JSON.parse(e.data);
        console.log('📨 WebSocket: Получено сообщение:', data);

        // Unicode символы должны автоматически правильно отображаться
        setMessages((prevMessages) => [...prevMessages, data]);
      } catch (error) {
        console.error('❌ Ошибка парсинга сообщения:', error);
      }
    };

    socket.onclose = (e) => {
      if (isUnmounting.current) return;
      console.log(`🔌 WebSocket: Соединение закрыто. Код: ${e.code}, Причина: ${e.reason}`);
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

  const handleSend = (e) => {
    e.preventDefault();

    if (newMessage.trim() === '') {
      return;
    }

    if (!chatSocket.current || chatSocket.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket не подключен');
      return;
    }

    const messageToSend = {
      text: newMessage.trim(),
    };

    console.log('📤 Отправляю сообщение:', messageToSend);
    chatSocket.current.send(JSON.stringify(messageToSend));
    setNewMessage('');
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
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

  const getStatusText = () => {
    switch (connectionStatus) {
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

  const handleReconnect = () => {
    window.location.reload(); // Простой способ переподключения
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Чат ID: {CHAT_ID}</h1>

      {/* Статус соединения */}
      <div
        style={{
          padding: '10px',
          backgroundColor: getStatusColor(),
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
        <span>Статус: {getStatusText()}</span>
        {connectionStatus !== 'connected' && (
          <button
            onClick={handleReconnect}
            style={{
              padding: '5px 10px',
              backgroundColor: 'white',
              color: getStatusColor(),
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
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#666',
              marginTop: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {connectionStatus === 'connected' ? 'Нет сообщений. Начните общение!' : 'Загрузка...'}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              style={{
                alignSelf: msg.sender_id === 1 ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender_id === 1 ? '#dcf8c6' : '#ffffff',
                margin: '5px',
                padding: '8px 12px',
                borderRadius: '15px',
                maxWidth: '80%',
                border: '1px solid #e0e0e0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '2px' }}>
                {msg.sender_username || `Пользователь ${msg.sender_id}`}
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
          ))
        )}
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
            backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
          disabled={connectionStatus !== 'connected' || newMessage.trim() === ''}
        >
          Отправить
        </button>
      </form>

      {/* Отладочная информация */}
      <div
        style={{
          marginTop: '10px',
          fontSize: '12px',
          color: '#666',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '5px',
        }}
      >
        <div>Сообщений: {messages.length}</div>
        <div>Статус: {connectionStatus}</div>
        <div>
          Последнее сообщение: {messages.length > 0 ? messages[messages.length - 1].text : 'нет'}
        </div>
      </div>
    </div>
  );
}

export default Messages;
