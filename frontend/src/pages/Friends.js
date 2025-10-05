// src/pages/Friends.js

import React from 'react';
import UsersAndFriends from '../components/UsersAndFriends';
import { useNavigate } from 'react-router-dom';

function FriendsPage() {
  const navigate = useNavigate();

  // Функция, которая будет вызываться, когда пользователь находит
  // кого-то и начинает с ним чат (или кликает на существующего друга)
  const handleChatCreated = (chatId) => {
    // Перенаправляем пользователя на страницу сообщений с ID нового чата
    navigate(`/messages?chatId=${chatId}`);
  };

  return (
    <div className="friends-page-container" style={{ padding: '20px' }}>
      <h2>Поиск пользователей и управление дружбой</h2>
      <p>Здесь вы можете найти новых друзей или принять/отклонить запросы.</p>

      {/* 💡 ЭТОТ КОМПОНЕНТ МЫ СЕЙЧАС НАПИШЕМ */}
      <UsersAndFriends onChatCreated={handleChatCreated} />
    </div>
  );
}

export default FriendsPage;
