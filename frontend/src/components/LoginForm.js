import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
      const response = await axios.post('http://127.0.0.1:8000/users_api/login/', {
        credential: credentials.credential,
        password: credentials.password,
      });

      console.log('Успешный вход:', response.data);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('userData', JSON.stringify(response.data.user));

      messageApi.success('Вход выполнен успешно!');
      navigate('/');
    } catch (err) {
      console.error('Ошибка входа:', err.response?.data);
      const serverError = err.response?.data?.error || 'Произошла ошибка при входе.';
      messageApi.error(serverError);
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
        <img src="/logo_2.png" alt="Logo" className="form-logo" />

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

        <input
          name="credential"
          type={getInputType()}
          placeholder={getPlaceholderText()}
          required
          onChange={handleChange}
          value={credentials.credential}
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          required
          onChange={handleChange}
          value={credentials.password}
        />
        <button type="submit" className="main-button" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>

        <div className="divider">или</div>
        <Space className="social-login-buttons-compact" size="middle">
          <Button
            type="default"
            icon={<GoogleOutlined />}
            onClick={() => handleSocialLogin('Google')}
          />
          <Button
            type="default"
            icon={<AppleOutlined />}
            onClick={() => handleSocialLogin('Apple')}
          />
          <Button type="default" icon={<UserOutlined />} onClick={() => handleSocialLogin('VK')} />
        </Space>

        <div className="register-options">
          <p>Нет аккаунта?</p>
          <div className="register-options-vertical">
            <Button type="link" onClick={() => navigate('/register')} className="link-button">
              Зарегистрироваться
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
