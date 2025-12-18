import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../contexts/AuthContext';
import ChatsList from '../components/ChatsList';
import Messages from '../components/Messeges';
import Modal_AddUsersToChat from '../components/Modal_AddUsersToChat';
import './MessengerPage.css';

const API_CHATS = '/messenger_api/chats/';

function MessengerPage() {
  // ВСЕ ХУКИ ВЫЗЫВАЮТСЯ БЕЗУСЛОВНО В НАЧАЛЕ КОМПОНЕНТА!
  const { user, isAuthenticated, isLoading } = useAuth(); // Безопасная деструктуризация
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const initialChatId = urlParams.get('chatId');

  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(initialChatId);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  // --- ЗАГРУЗКА ЧАТОВ ---
  const fetchChats = useCallback(async () => {
    // Пропускаем загрузку, если нет авторизации
    if (!isAuthenticated || !user) return;

    setLoadingChats(true);
    try {
      const response = await axiosInstance.get(API_CHATS);
      setChats(response.data);

      if (initialChatId && !selectedChatId) {
        setSelectedChatId(initialChatId);
      }
    } catch (err) {
      console.error('Ошибка загрузки списка чатов:', err);
    } finally {
      setLoadingChats(false);
    }
  }, [isAuthenticated, user, initialChatId, selectedChatId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // --- ЗАГРУЗКА СООБЩЕНИЙ ---
  const fetchMessages = useCallback(
    async (chatId) => {
      if (!chatId || !isAuthenticated || !user) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);
      try {
        const response = await axiosInstance.get(`${API_CHATS}${chatId}/messages/`);
        setMessages(response.data);
      } catch (err) {
        console.error(`Ошибка загрузки сообщений для чата ${chatId}:`, err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [isAuthenticated, user],
  );

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId, fetchMessages]);

  // --- ПРОВЕРКИ АВТОРИЗАЦИИ И ЗАГРУЗКИ ---
  if (isLoading) {
    return <div className="messenger-unauthorized">Проверка авторизации...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="messenger-unauthorized">
        Пожалуйста, авторизуйтесь для доступа к мессенджеру.
      </div>
    );
  }

  // --- ФУНКЦИИ ОБРАБОТКИ ---
  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    if (location.search) {
      navigate('/messages', { replace: true });
    }
  };

  const handleSendMessage = async (chatId, text) => {
    if (!chatId || !text.trim()) return;

    try {
      const response = await axiosInstance.post(`${API_CHATS}${chatId}/messages/`, { text });

      const newMessage = response.data;
      setMessages((prev) => [...prev, newMessage]);
      fetchChats(); // Обновляем список чатов
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
    }
  };

  // Функция для обновления чатов после добавления участников
  const handleMembersAdded = () => {
    fetchChats(); // Обновляем список чатов
    setShowAddMembersModal(false); // Закрываем модальное окно
  };

  return (
    <div className="messenger-page-container column-layout">
      {/* Вверху: сообщения в горизонтальной ленте */}
      <div className="top-messages-area">
        {selectedChatId ? (
          <>
            {(() => {
              const selectedChat = chats.find((c) => String(c.id) === String(selectedChatId));
              const chatName =
                selectedChat?.name || selectedChat?.title || `Чат #${selectedChatId}`;
              const chatAvatar = selectedChat?.avatar || selectedChat?.image || selectedChat?.icon;
              return (
                <div className="messages-header">
                  <div className="chat-header-left">
                    {chatAvatar ? (
                      <img className="chat-avatar" src={chatAvatar} alt={chatName} />
                    ) : (
                      <div className="chat-avatar placeholder" />
                    )}
                    <div className="chat-title">{chatName}</div>
                  </div>
                  <div className="chat-header-right"></div>
                </div>
              );
            })()}
            {loadingMessages ? (
              <div className="loading-state">Загрузка сообщений...</div>
            ) : (
              <Messages
                chatId={selectedChatId}
                messages={messages}
                onSendMessage={handleSendMessage}
                // Мы добавляем проверку: если в user.id лежит 1,
                // но в системе ты 13, это значит данные в Context устарели.
                currentUserId={user?.id}
              />
            )}
          </>
        ) : (
          <div className="messages-placeholder">Выберите чат, чтобы начать общение.</div>
        )}
      </div>

      {/* Внизу: список чатов в горизонтальной ленте */}
      <div className="bottom-chats-area">
        <div className="chat-list-header">Ваши Чаты</div>
        {loadingChats ? (
          <div className="loading-state">Загрузка чатов...</div>
        ) : (
          <div className="chats-list-block">
            <ChatsList
              chats={chats}
              currentSelectedChatId={selectedChatId}
              onChatSelect={handleSelectChat}
            />
          </div>
        )}
      </div>

      {/* Навигация снизу */}
      <div className="bottom-navigation">
        <button className="nav-btn">Чаты</button>
        <button className="nav-btn">Группы</button>
        <button className="nav-btn">Избранные</button>
        <button className="nav-btn nav-btn-create" onClick={() => setShowAddMembersModal(true)}>
          + добавить
        </button>
      </div>
      {showAddMembersModal && (
        <Modal_AddUsersToChat
          chatId={selectedChatId}
          onClose={() => setShowAddMembersModal(false)}
          onMembersAdded={handleMembersAdded}
        />
      )}
    </div>
  );
}

export default MessengerPage;
