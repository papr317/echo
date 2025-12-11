import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { message, Space, Button, Typography, Spin } from 'antd';
import {
  MailOutlined,
  UserOutlined,
  PhoneOutlined,
  GoogleOutlined,
  AppleOutlined,
  WechatOutlined,
  UploadOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import './RegisterForm.css';

const { Text } = Typography;

const RegisterForm = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [step, setStep] = useState(1);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const [nicknameValidation, setNicknameValidation] = useState({
    isChecking: false,
    isToxic: false,
    message: '',
  });

  const avatarFileName = useMemo(() => {
    return formData.avatar ? formData.avatar.name : 'Файл не выбран';
  }, [formData.avatar]);

  const nicknameCheckTimeout = useRef(null);

  const handleChange = (e) => {
    const { name, type, value, files, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
  };

  const checkNickname = async (nickname) => {
    if (!nickname) return;

    setNicknameValidation((prev) => ({ ...prev, isChecking: true }));
    try {
      const response = await axiosInstance.post('/users_api/check-nickname/', {
        nickname: nickname,
      });

      setNicknameValidation({
        isChecking: false,
        isToxic: response.data.is_toxic,
        message: response.data.message,
      });

      if (response.data.is_toxic) {
        messageApi.warning('Пожалуйста, выберите другой никнейм');
      }
    } catch (error) {
      setNicknameValidation({
        isChecking: false,
        isToxic: false,
        message: 'Ошибка проверки никнейма',
      });
    }
  };

  const handleNicknameChange = (e) => {
    const value = e.target.value;
    handleChange(e);

    if (nicknameCheckTimeout.current) {
      clearTimeout(nicknameCheckTimeout.current);
    }

    nicknameCheckTimeout.current = setTimeout(() => {
      checkNickname(value);
    }, 500);
  };

  const handleNext = () => {
    if (!formData.email || !formData.password) {
      messageApi.error('Пожалуйста, заполните email и пароль.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nicknameValidation.isToxic) {
      messageApi.error('Пожалуйста, выберите другой никнейм');
      return;
    }

    setShowPolicy(true);
  };

  const handleAccept = async () => {
    if (!formData.accepted_privacy_policy) {
      messageApi.error('Вы должны принять политику конфиденциальности.');
      return;
    }
    const dataToSend = new FormData();
    for (const key in formData) {
      const value = formData[key];
      if (value === null || value === '' || value === undefined) {
        continue;
      }
      if (key === 'avatar' && value instanceof File) {
        dataToSend.append(key, value, value.name);
      } else if (typeof value === 'boolean') {
        dataToSend.append(key, String(value));
      } else {
        dataToSend.append(key, value);
      }
    }
    if (formData.username && !dataToSend.has('username')) {
      dataToSend.append('username', formData.username);
    }

    try {
      const response = await axiosInstance.post(
        'http://127.0.0.1:8000/users_api/register/',
        dataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      messageApi.success('Регистрация прошла успешно!');
      navigate('/');
    } catch (err) {
      let errorMsg = 'Произошла ошибка при регистрации.';
      const responseData = err.response?.data;

      if (typeof responseData === 'object' && responseData !== null) {
        const firstErrorKey = Object.keys(responseData)[0];
        const firstErrorValue = responseData[firstErrorKey];
        if (Array.isArray(firstErrorValue) && firstErrorValue.length > 0) {
          errorMsg = `${firstErrorKey}: ${firstErrorValue[0]}`;
        } else if (typeof firstErrorValue === 'string') {
          errorMsg = firstErrorValue;
        }
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }

      messageApi.error(`Ошибка: ${errorMsg}`);
      setShowPolicy(false);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSocialRegister = (platform) => {
    messageApi.info(`Регистрация через ${platform} временно не работает.`);
  };

  return (
    <div className="register-page">
      {contextHolder}
      <form className="register-form" onSubmit={handleSubmit} autoComplete="off">
        <img src="/logo_2.png" alt="Logo" className="form-logo" />

        {step === 1 && (
          <>
            <div className="input-group">
              <span className="input-icon">
                <MailOutlined />
              </span>
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                onChange={handleChange}
                value={formData.email}
                autoComplete="username"
              />
            </div>
            <div className="input-group">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                required
                onChange={handleChange}
                value={formData.password}
                autoComplete="new-password"
                style={{ paddingRight: 36 }}
              />
              <span
                className="input-icon password-eye"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={0}
                role="button"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
              </span>
            </div>
            <button type="button" className="main-button" onClick={handleNext}>
              Далее
            </button>
            <div className="divider">или</div>
            <Space className="social-login-buttons-compact" size="middle">
              <Button
                type="default"
                icon={<GoogleOutlined />}
                onClick={() => handleSocialRegister('Google')}
              />
              <Button
                type="default"
                icon={<AppleOutlined />}
                onClick={() => handleSocialRegister('Apple')}
              />
              <Button
                type="default"
                icon={<WechatOutlined />}
                onClick={() => handleSocialRegister('WeChat')}
              />
            </Space>
          </>
        )}
        {step === 2 && (
          <>
            <div className="input-group">
              <span className="input-icon">
                <UserOutlined />
              </span>
              <input
                name="username"
                type="text"
                placeholder="Никнейм (username)"
                required
                onChange={handleNicknameChange}
                value={formData.username}
                style={{
                  borderColor: nicknameValidation.isToxic ? '#ff4d4f' : undefined,
                }}
              />
              {nicknameValidation.isChecking && <Spin size="small" style={{ marginLeft: 8 }} />}
              {nicknameValidation.message && (
                <div
                  className={`nickname-validation-message ${
                    nicknameValidation.isToxic ? 'error' : 'success'
                  }`}
                >
                  {nicknameValidation.message}
                </div>
              )}
            </div>
            <div className="input-group">
              <input
                name="first_name"
                placeholder="Имя"
                onChange={handleChange}
                value={formData.first_name}
              />
            </div>
            <div className="input-group">
              <input
                name="last_name"
                placeholder="Фамилия"
                onChange={handleChange}
                value={formData.last_name}
              />
            </div>
            <div className="input-group">
              <span className="input-icon">
                <PhoneOutlined />
              </span>
              <input
                name="phone"
                type="tel"
                placeholder="Телефон"
                onChange={handleChange}
                value={formData.phone}
              />
            </div>
            <select
              name="gender"
              onChange={handleChange}
              value={formData.gender}
              className="form-select"
            >
              <option value="" disabled>
                Пол
              </option>
              <option value="male">Мальчик</option>
              <option value="female">Девочка</option>
            </select>
            <div className="input-group date-input">
              <label>Дата рождения:</label>
              <input
                name="date_of_birth"
                type="date"
                onChange={handleChange}
                value={formData.date_of_birth}
              />
            </div>
            <div className="file-upload-wrapper">
              <input
                type="file"
                name="avatar"
                id="avatar-upload"
                accept="image/*"
                onChange={handleChange}
                className="hidden-file-input"
              />
              <label htmlFor="avatar-upload" className="file-upload-label">
                <Button icon={<UploadOutlined />} type="default" block>
                  Загрузить Аватар
                </Button>
                <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                  {avatarFileName}
                </Text>
              </label>
            </div>
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
        <div className="register-options-bottom">
          <p>Есть аккаунт?</p>
          <button type="button" onClick={() => navigate('/login')} className="link-button">
            Войти
          </button>
        </div>
      </form>
      {showPolicy && (
        <div className="modal">
          <div className="modal-content policy-modal">
            <h2>Политика конфиденциальности</h2>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="accepted_privacy_policy"
                onChange={handleChange}
                checked={formData.accepted_privacy_policy}
              />
              Я принимаю
              <a href="/privacy-policy" target="_blank" className="link" rel="noopener noreferrer">
                политику конфиденциальности
              </a>
            </label>
            <Button
              onClick={handleAccept}
              disabled={!formData.accepted_privacy_policy}
              className="main-button"
              type="primary"
              block
            >
              Принять и Зарегистрироваться
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
