import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/messenger_api';

function ChatsList({ onChatSelect, currentSelectedChatId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthToken = () => localStorage.getItem('access_token');

  const fetchChats = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chats/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      setChats(data);
      setLoading(false);

      // Если чатов много, можно автоматически выбрать первый
      if (data.length > 0 && !currentSelectedChatId) {
        onChatSelect(data[0].id);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки списка чатов:', error);
      setLoading(false);
    }
  }, [currentSelectedChatId, onChatSelect]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // --- Стили ---
  const chatItemStyle = (chatId) => ({
    padding: '15px 10px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    backgroundColor: chatId === currentSelectedChatId ? '#e6f7ff' : 'white',
    fontWeight: chatId === currentSelectedChatId ? 'bold' : 'normal',
  });

  if (loading) return <div>Загрузка чатов...</div>;
  if (chats.length === 0) return <div>Нет активных чатов.</div>;

  return (
    <div
      style={{ width: '300px', borderRight: '1px solid #ccc', height: '100vh', overflowY: 'auto' }}
    >
      <h2 style={{ padding: '10px', margin: 0, borderBottom: '1px solid #ccc' }}>Ваши Чаты</h2>
      {chats.map((chat) => (
        <div key={chat.id} style={chatItemStyle(chat.id)} onClick={() => onChatSelect(chat.id)}>
          <div>{chat.display_name}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {chat.last_message_text || 'Начните чат'}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatsList;
