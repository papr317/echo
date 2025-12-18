import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageOutlined, TeamOutlined, StarOutlined, PlusOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../contexts/AuthContext';
import ChatsList from '../components/ChatsList';
import Messages from '../components/Messeges';
import Modal_AddUsersToChat from '../components/Modal_AddUsersToChat';
import './MessengerPage.css';

const API_CHATS = '/messenger_api/chats/';

function MessengerPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const initialChatId = urlParams.get('chatId');

  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(initialChatId);
  const [loadingChats, setLoadingChats] = useState(true);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  const fetchChats = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setLoadingChats(true);
    try {
      const response = await axiosInstance.get(API_CHATS);
      setChats(response.data);
      if (initialChatId && !selectedChatId) setSelectedChatId(initialChatId);
    } catch (err) {
      console.error('Ошибка загрузки чатов:', err);
    } finally {
      setLoadingChats(false);
    }
  }, [isAuthenticated, user, initialChatId, selectedChatId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  if (isLoading) return <div className="bw-loader">ЗАГРУЗКА...</div>;

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    if (location.search) navigate('/messages', { replace: true });
  };

  return (
    <div className="bw-messenger-wrapper">
      {/* ВЕРХНЯЯ ЧАСТЬ: СООБЩЕНИЯ */}
      <div className="bw-top-section">
        {selectedChatId ? (
          <Messages chatId={selectedChatId} currentUserId={user?.id} />
        ) : (
          <div className="bw-empty-state">ВЫБЕРИТЕ ЧАТ</div>
        )}
      </div>

      {/* НИЖНЯЯ ЧАСТЬ: ЗАКРЕПЛЕННЫЙ БЛОК */}
      <div className="bw-bottom-fixed-panel">
        {/* ГОРИЗОНТАЛЬНЫЕ ЧАТЫ */}
        <div className="bw-chats-horizontal-strip">
          {loadingChats ? (
            <div className="bw-mini-loader">Загрузка чатов...</div>
          ) : (
            <div className="chats-force-row">
              <ChatsList
                chats={chats}
                currentSelectedChatId={selectedChatId}
                onChatSelect={handleSelectChat}
              />
            </div>
          )}
        </div>

        {/* НАВИГАЦИЯ */}
        <div className="bw-nav-bar">
          <button className="bw-nav-item active">
            <MessageOutlined /> <span>Чаты</span>
          </button>
          <button className="bw-nav-item">
            <TeamOutlined /> <span>Группы</span>
          </button>
          <button className="bw-nav-item">
            <StarOutlined /> <span>Избранное</span>
          </button>
          {/* <button
            className="bw-nav-item bw-create-btn"
            onClick={() => setShowAddMembersModal(true)}
          >
            <PlusOutlined /> добавить
          </button> */}
        </div>
      </div>

      {showAddMembersModal && (
        <Modal_AddUsersToChat
          chatId={selectedChatId}
          onClose={() => setShowAddMembersModal(false)}
          onMembersAdded={fetchChats}
        />
      )}
    </div>
  );
}

export default MessengerPage;
