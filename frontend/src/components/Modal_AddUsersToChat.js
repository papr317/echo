import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Input,
  List,
  Tag,
  Button,
  Spin,
  message,
  Space,
  Avatar
} from 'antd';
import { UserOutlined, CloseOutlined } from '@ant-design/icons';

const API_BASE_URL = 'http://127.0.0.1:8000/messenger_api';

function AddMembersToChat({ chatId, onMembersAdded, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const getAuthToken = () => localStorage.getItem('access_token');

  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/search/?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Ошибка поиска пользователей:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchUsers]);

  const addUserToSelection = (user) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeUserFromSelection = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const addMembersToChat = async () => {
    if (selectedUsers.length === 0) {
      message.warning('Выберите пользователей для добавления');
      return;
    }

    setAdding(true);
    try {
      const userIds = selectedUsers.map((user) => user.id);
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/members/add-multiple/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_ids: userIds }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const result = await response.json();

      let msg = result.detail;
      if (result.added_users && result.added_users.length > 0) {
        msg += `\nДобавлены: ${result.added_users.join(', ')}`;
      }
      if (result.already_members && result.already_members.length > 0) {
        msg += `\nУже в чате: ${result.already_members.join(', ')}`;
      }
      if (result.not_found && result.not_found.length > 0) {
        msg += `\nНе найдены: ${result.not_found.join(', ')}`;
      }

      message.success(msg);

      if (onMembersAdded) onMembersAdded();
      if (onClose) onClose();
    } catch (error) {
      console.error('Ошибка добавления пользователей:', error);
      message.error('Ошибка при добавлении пользователей в чат');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      title="Добавить участников в чат"
      open={true}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={addMembersToChat}
          disabled={selectedUsers.length === 0 || adding}
          loading={adding}
        >
          {`Добавить ${selectedUsers.length} пользователей`}
        </Button>,
      ]}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.Search
          placeholder="Поиск пользователей..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          enterButton
          loading={loading}
        />

        {loading && <Spin style={{ display: 'block', margin: '20px auto' }} />}

        {searchResults.length > 0 && (
          <List
            itemLayout="horizontal"
            dataSource={searchResults}
            renderItem={(user) => (
              <List.Item
                onClick={() => addUserToSelection(user)}
                style={{ cursor: 'pointer', padding: '8px' }}
                className="hoverable-list-item"
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={user.username}
                  description={user.email}
                />
              </List.Item>
            )}
            style={{ maxHeight: 200, overflow: 'auto' }}
          />
        )}

        {selectedUsers.length > 0 && (
          <div>
            <h4>Выбранные пользователи:</h4>
            <div style={{ marginTop: 10 }}>
              {selectedUsers.map((user) => (
                <Tag
                  key={user.id}
                  closable
                  onClose={() => removeUserFromSelection(user.id)}
                  closeIcon={<CloseOutlined />}
                  style={{ marginBottom: 8 }}
                >
                  {user.username} {user.email && `(${user.email})`}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
}

export default AddMembersToChat;
