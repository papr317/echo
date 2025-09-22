import React, { useState } from 'react';
import { Input, Radio, Space } from 'antd';
import './Search.css';

const { Search } = Input;

function SearchPage() {
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('all');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    setLoading(true);

    // Здесь должна быть ваша логика для реального API-запроса
    // Для примера используем имитацию данных и задержки
    setTimeout(() => {
      const mockResults = [
        { id: 1, type: 'post', title: 'Как создать свой первый пост', author: 'Иван' },
        { id: 2, type: 'user', name: 'Иван Петров', bio: 'Привет, я Иван!' },
        { id: 3, type: 'post', title: 'Поиск: 10 лучших практик', author: 'Мария' },
        { id: 4, type: 'user', name: 'Мария Смирнова', bio: 'Люблю программировать' },
        {
          id: 5,
          type: 'support',
          title: 'Что делать, если забыл пароль?',
          content: '...перейдите по ссылке.',
        },
        { id: 6, type: 'friends', name: 'Алексей', status: 'В сети' },
        { id: 7, type: 'friends', name: 'Анна', status: 'Не в сети' },
      ];

      const filteredResults = mockResults.filter((item) => {
        const queryLower = query.toLowerCase();
        if (searchType === 'all') {
          return JSON.stringify(item).toLowerCase().includes(queryLower);
        }
        if (searchType === 'posts' && item.type === 'post') {
          return item.title.toLowerCase().includes(queryLower);
        }
        if (searchType === 'users' && item.type === 'user') {
          return item.name.toLowerCase().includes(queryLower);
        }
        if (searchType === 'support' && item.type === 'support') {
          return item.title.toLowerCase().includes(queryLower);
        }
        if (searchType === 'friends' && item.type === 'friends') {
          return item.name.toLowerCase().includes(queryLower);
        }
        return false;
      });

      setSearchResults(filteredResults);
      setLoading(false);
    }, 1000);
  };

  const renderResults = () => {
    if (loading) {
      return <p className="search-status-text">Идёт поиск...</p>;
    }

    if (searchResults.length === 0) {
      return <p className="search-status-text">Результаты не найдены. Попробуйте другой запрос.</p>;
    }

    return (
      <div className="search-results">
        <h3 className="search-results-heading">
          Найдено {searchResults.length}{' '}
          {searchType === 'all'
            ? 'результатов'
            : searchType === 'posts'
            ? 'постов'
            : searchType === 'users'
            ? 'пользователей'
            : searchType === 'support'
            ? 'статей'
            : 'друзей'}
          :
        </h3>
        {searchResults.map((item) => (
          <div key={item.id} className="result-item">
            {item.type === 'post' && (
              <>
                <h4>{item.title}</h4>
                <p>Автор: {item.author}</p>
              </>
            )}
            {item.type === 'user' && (
              <>
                <h4>{item.name}</h4>
                <p>{item.bio}</p>
              </>
            )}
            {item.type === 'support' && (
              <>
                <h4>{item.title}</h4>
                <p>{item.content}</p>
              </>
            )}
            {item.type === 'friends' && (
              <>
                <h4>{item.name}</h4>
                <p>Статус: {item.status}</p>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="search-page-container">
      <h1>Поиск</h1>
      <div className="search-controls">
        <Search
          placeholder="Введите имя, тег или ключевое слово..."
          allowClear
          enterButton="Найти"
          size="large"
          onSearch={handleSearch}
          style={{ width: '100%', maxWidth: '500px' }}
        />
        <Radio.Group onChange={(e) => setSearchType(e.target.value)} value={searchType}>
          <Space direction="horizontal">
            <Radio.Button value="all">Все</Radio.Button>
            <Radio.Button value="posts">Посты</Radio.Button>
            <Radio.Button value="users">Пользователи</Radio.Button>
            <Radio.Button value="friends">Друзья</Radio.Button>
            <Radio.Button value="support">Помощь</Radio.Button>
          </Space>
        </Radio.Group>
      </div>
      {renderResults()}
    </div>
  );
}

export default SearchPage;
