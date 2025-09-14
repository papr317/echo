import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { message, Space, Button } from 'antd';
import {
  MailOutlined,
  UserOutlined,
  PhoneOutlined,
  GoogleOutlined,
  AppleOutlined,
} from '@ant-design/icons';
import './LoginForm.css';

const LoginForm = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [credentials, setCredentials] = useState({
    credential: '',
    password: '',
  });
  const [loginMethod, setLoginMethod] = useState('email');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Отправляем простой JSON объект
      const response = await axiosInstance.post(
        'http://127.0.0.1:8000/users_api/login/',
        {
          credential: credentials.credential,
          password: credentials.password,
        },
        {
          headers: {
            'Content-Type': 'application/json', // Явно указываем JSON
          },
        },
      );

      console.log('Успешный вход:', response.data);

      // Сохраняем токены и данные пользователя
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('userData', JSON.stringify(response.data.user));

      // Показываем успешное сообщение
      messageApi.success('Вход выполнен успешно!');

      // Переходим на главную страницу
      navigate('/');
    } catch (err) {
      console.error('Ошибка входа:', err);

      // Обрабатываем разные типы ошибок
      let errorMessage = 'Произошла ошибка при входе';

      if (err.response) {
        // Ошибка от сервера (4xx, 5xx)
        errorMessage = err.response.data?.error || 'Неверные учетные данные';
      } else if (err.request) {
        // Ошибка сети (нет ответа от сервера)
        errorMessage = 'Нет соединения с сервером';
      } else {
        // Другие ошибки
        errorMessage = err.message;
      }

      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform) => {
    messageApi.info(`Вход через ${platform} временно не работает.`);
  };

  const getPlaceholderText = () => {
    switch (loginMethod) {
      case 'email':
        return 'Email';
      case 'username':
        return 'Никнейм (username)';
      case 'phone':
        return 'Номер телефона';
      default:
        return 'Введите данные';
    }
  };

  const getInputType = () => {
    if (loginMethod === 'phone') {
      return 'tel';
    }
    return 'text';
  };

  return (
    <div className="login-page">
      {contextHolder}

      <form className="login-form" onSubmit={handleSubmit}>
        <img src="/logo_2.png" alt="Echo Logo" className="form-logo" />

        {/* Селектор метода входа */}
        <div className="login-method-selector">
          <button
            type="button"
            className={`method-button ${loginMethod === 'email' ? 'active' : ''}`}
            onClick={() => setLoginMethod('email')}
          >
            <MailOutlined />
          </button>
          <button
            type="button"
            className={`method-button ${loginMethod === 'username' ? 'active' : ''}`}
            onClick={() => setLoginMethod('username')}
          >
            <UserOutlined />
          </button>
          <button
            type="button"
            className={`method-button ${loginMethod === 'phone' ? 'active' : ''}`}
            onClick={() => setLoginMethod('phone')}
          >
            <PhoneOutlined />
          </button>
        </div>

        {/* Поле для ввода (email/username/phone) */}
        <input
          name="credential"
          type={getInputType()}
          placeholder={getPlaceholderText()}
          required
          onChange={handleChange}
          value={credentials.credential}
          disabled={loading}
        />

        {/* Поле для пароля */}
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          required
          onChange={handleChange}
          value={credentials.password}
          disabled={loading}
        />

        {/* Кнопка входа */}
        <button type="submit" className="main-button" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>

        {/* Разделитель */}
        <div className="divider">или</div>

        {/* Кнопки соцсетей */}
        <Space className="social-login-buttons-compact" size="middle">
          <Button
            type="default"
            icon={<GoogleOutlined />}
            onClick={() => handleSocialLogin('Google')}
            disabled={loading}
          />
          <Button
            type="default"
            icon={<AppleOutlined />}
            onClick={() => handleSocialLogin('Apple')}
            disabled={loading}
          />
          <Button
            type="default"
            icon={<UserOutlined />}
            onClick={() => handleSocialLogin('VK')}
            disabled={loading}
          />
        </Space>

        {/* Ссылка на регистрацию */}
        <div className="register-options">
          <p>Нет аккаунта?</p>
          <div className="register-options-vertical">
            <Button
              type="link"
              onClick={() => navigate('/register')}
              className="link-button"
              disabled={loading}
            >
              Зарегистрироваться
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
