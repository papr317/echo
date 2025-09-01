import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterForm.css';

const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [showPolicy, setShowPolicy] = useState(false);
  const [accepted, setAccepted] = useState(false);
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
  });

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;
    if (name === 'accepted_privacy_policy') {
      setAccepted(e.target.checked);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'file' ? files[0] : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowPolicy(true);
  };

  const handleAccept = () => {
    if (!accepted) return;
    setShowPolicy(false);
    console.log('Регистрация:', formData);
    navigate('/');
  };

  return (
    <div className="register-page">
      <form className="register-form" onSubmit={handleSubmit}>
        <img src="/logo_2.png" alt="Logo" className="form-logo" />

        {step === 1 && (
          <>
            <input
              name="email"
              type="email"
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
            <button type="button" onClick={() => setStep(2)}>
              Далее
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input name="nickname" placeholder="Никнейм" onChange={handleChange} />
            <input name="first_name" placeholder="Имя" onChange={handleChange} />
            <input name="last_name" placeholder="Фамилия" onChange={handleChange} />
            <select name="gender" onChange={handleChange}>
              <option value="">Пол</option>
              <option value="male">Мальчик</option>
              <option value="female">Девочка</option>
            </select>

            <input name="date_of_birth" type="date" onChange={handleChange} />
            <button type="submit">Зарегистрироваться</button>
          </>
        )}
      </form>

      {showPolicy && (
        <div className="modal">
          <div className="modal-content policy-modal">
            <label className="checkbox-label">
              <input type="checkbox" name="accepted_privacy_policy" onChange={handleChange} />Я
              принимаю{' '}
              <a href="/privacy-policy" target="_blank">
                политику конфиденциальности
              </a>
            </label>
            <button onClick={handleAccept} disabled={!accepted}>
              Принять
            </button>
          </div>
        </div>
      )}
      <div className="login-prompt">
        <p>есть аккаунт?</p>
        <button onClick={() => navigate('/login')}>Войти</button>
      </div>
    </div>
  );
};

export default RegisterForm;
