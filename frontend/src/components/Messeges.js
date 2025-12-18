import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PaperClipOutlined, PictureOutlined, SendOutlined } from '@ant-design/icons';

const API_BASE_URL = 'http://127.0.0.1:8000/messenger_api';
const getAuthToken = () => localStorage.getItem('access_token');

function Messages({ chatId, currentUserId, onSendMessage }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const chatSocket = useRef(null);
  const messagesEndRef = useRef(null);
  const isUnmounting = useRef(false);

  const getMyId = useCallback(() => {
    const token = getAuthToken();
    if (!token) return String(currentUserId);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return String(payload.user_id || payload.id);
    } catch (e) {
      return String(currentUserId);
    }
  }, [currentUserId]);

  const myId = getMyId();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
        if (response.ok) {
          const data = await response.json();
          if (!isUnmounting.current) setMessages(data.reverse());
        }
      } catch (error) {
        console.error(error);
      }
    },
    [chatId],
  );

  useEffect(() => {
    isUnmounting.current = false;
    const token = getAuthToken();
    if (!chatId || !token) return;

    if (chatSocket.current) chatSocket.current.close();

    const wsUrl = `ws://127.0.0.1:8001/ws/chat/${chatId}/?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);
    chatSocket.current = socket;

    socket.onopen = () => {
      if (!isUnmounting.current) {
        setConnectionStatus('connected');
        fetchMessages(token);
      }
    };

    socket.onmessage = (e) => {
      if (isUnmounting.current) return;
      const data = JSON.parse(e.data);
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
    };

    socket.onclose = () => {
      if (!isUnmounting.current) setConnectionStatus('disconnected');
    };

    return () => {
      isUnmounting.current = true;
      if (socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, [chatId, fetchMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim() && chatSocket.current?.readyState === WebSocket.OPEN) {
      chatSocket.current.send(JSON.stringify({ text: newMessage.trim() }));
      setNewMessage('');
    }
  };

  return (
    <div className="bw-messenger-layout">
      <div className="horizontal-scroll-viewport">
        <div className="messages-inline-row">
          {messages.map((msg, index) => {
            const isMine = String(msg.sender?.id || msg.sender) === myId;
            return (
              <div
                key={msg.id || index}
                className={`msg-card-wrapper ${isMine ? 'mine' : 'other'}`}
              >
                <div className="msg-bubble">
                  {!isMine && <div className="msg-author">{msg.sender?.username}</div>}
                  <div className="msg-text">{msg.text}</div>
                  <div className="msg-time">
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} style={{ minWidth: '100px' }} />
        </div>
      </div>

      <form className="bw-bottom-bar" onSubmit={handleSend}>
        <div className="input-group">
          <button type="button" className="icon-btn">
            <PaperClipOutlined />
          </button>
          <button type="button" className="icon-btn">
            <PictureOutlined />
          </button>
          <input
            type="text"
            className="main-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="TYPE..."
          />
          <button type="submit" className="send-btn-circle" disabled={!newMessage.trim()}>
            <SendOutlined />
          </button>
        </div>
      </form>
    </div>
  );
}

export default Messages;
