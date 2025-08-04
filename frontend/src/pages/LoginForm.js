import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({
    email: '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: авторизация через backend
    console.log('Вход:', credentials);
    navigate('/');
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <img src="/static/logo_2.png" alt="Logo" className="form-logo" />
        <input
          name="email"
          type="text"
          placeholder="Email или телефон"
          required
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          required
          onChange={handleChange}
        />
        <button type="submit">Войти</button>

        <div className="login-prompt">
          <p>Нет аккаунта?</p>
          <button type="button" onClick={() => navigate('/register')}>
            Зарегистрироваться
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
