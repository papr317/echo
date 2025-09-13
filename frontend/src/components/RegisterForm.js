import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message } from 'antd'; // 👈 Импортируем message из antd
import './RegisterForm.css';

const RegisterForm = () => {
  // 👈 Объявляем хук message.useMessage()
  const [messageApi, contextHolder] = message.useMessage();

  const [step, setStep] = useState(1);
  const [showPolicy, setShowPolicy] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    nickname: '',
    avatar: null,
    username: '',
    accepted_privacy_policy: false,
  });

  const handleChange = (e) => {
    const { name, type, value, files, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
  };

  const handleNext = () => {
    if (!formData.email || !formData.password) {
      // 👈 Используем messageApi для вызова сообщений
      messageApi.error('Пожалуйста, заполните email и пароль.');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowPolicy(true);
  };

  const handleAccept = async () => {
    if (!formData.accepted_privacy_policy) {
      // 👈 Используем messageApi для вызова сообщений
      messageApi.error('Вы должны принять политику конфиденциальности.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/users_api/register/', formData);

      console.log('Регистрация успешна:', response.data);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      messageApi.success('Регистрация прошла успешно!'); // 👈 Используем messageApi
      navigate('/');
    } catch (err) {
      console.error('Ошибка регистрации:', err.response?.data);
      const serverError = err.response?.data?.detail || JSON.stringify(err.response?.data);
      messageApi.error(`Произошла ошибка: ${serverError}`); // 👈 Используем messageApi
      setShowPolicy(false);
    }
  };

  return (
    <div className="register-page">
      {contextHolder} {/* 👈 Это обязательный компонент для отображения сообщений */}
      <form className="register-form" onSubmit={handleSubmit}>
        <img src="/logo_2.png" alt="Logo" className="form-logo" />

        {step === 1 && (
          <>
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              onChange={handleChange}
              value={formData.email}
            />
            <input
              name="password"
              type="password"
              placeholder="Пароль"
              required
              onChange={handleChange}
              value={formData.password}
            />
            <button type="button" className="main-button" onClick={handleNext}>
              Далее
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              name="username"
              type="text"
              placeholder="Никнейм (username)"
              required
              onChange={handleChange}
              value={formData.username}
            />
            <input
              name="first_name"
              placeholder="Имя"
              onChange={handleChange}
              value={formData.first_name}
            />
            <input
              name="last_name"
              placeholder="Фамилия"
              onChange={handleChange}
              value={formData.last_name}
            />
            <input
              name="phone"
              type="tel"
              placeholder="Телефон"
              onChange={handleChange}
              value={formData.phone}
            />
            <select name="gender" onChange={handleChange} value={formData.gender}>
              <option value="">Пол</option>
              <option value="male">Мальчик</option>
              <option value="female">Девочка</option>
            </select>
            <input
              name="date_of_birth"
              type="date"
              onChange={handleChange}
              value={formData.date_of_birth}
            />

            <div className="form-actions">
              <button type="button" onClick={handleBack} className="secondary-button">
                Назад
              </button>
              <button type="submit" className="main-button">
                Зарегистрироваться
              </button>
            </div>
          </>
        )}
      </form>
      {showPolicy && (
        <div className="modal">
          <div className="modal-content policy-modal">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="accepted_privacy_policy"
                onChange={handleChange}
                checked={formData.accepted_privacy_policy}
              />
              Я принимаю{' '}
              <a href="/privacy-policy" target="_blank" className="link">
                политику конфиденциальности
              </a>
            </label>
            <button
              onClick={handleAccept}
              disabled={!formData.accepted_privacy_policy}
              className="main-button"
            >
              Принять
            </button>
          </div>
        </div>
      )}
      <div className="login-prompt">
        <p>есть аккаунт?</p>
        <button onClick={() => navigate('/login')} className="link-button">
          Войти
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
