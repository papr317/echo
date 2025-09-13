import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message } from 'antd'; // Импортируем message из antd
import './LoginForm.css';

const LoginForm = () => {
  const [messageApi, contextHolder] = message.useMessage(); // Объявляем хук message.useMessage()
  const [credentials, setCredentials] = useState({
    credential: '',
    password: '',
  });
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

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/users_api/login/', // Обновите на ваш URL
        credentials,
      );

      console.log('Успешный вход:', response.data);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      messageApi.success('Вход выполнен успешно!'); // Сообщение об успехе от antd
      navigate('/');
    } catch (err) {
      console.error('Ошибка входа:', err.response?.data);
      const serverError = err.response?.data?.error || 'Произошла ошибка при входе.';
      messageApi.error(serverError); // Сообщение об ошибке от antd
    }
  };

  return (
    <div className="login-page">
      {contextHolder}
      <form className="login-form" onSubmit={handleSubmit}>
        <img src="/logo_2.png" alt="Logo" className="form-logo" />
        <input
          name="credential"
          type="text"
          placeholder="Email, никнейм или телефон"
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
        <button type="submit" className="main-button">
          Войти
        </button>
      </form>

      <div className="login-prompt">
        <p>Нет аккаунта?</p>
        <button type="button" onClick={() => navigate('/register')} className="link-button">
          Зарегистрироваться
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
