import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Typography, message } from 'antd';
import { GoogleOutlined, AppleOutlined, WechatOutlined } from '@ant-design/icons';
import './Welcome.css';

const { Title, Text } = Typography;

function Welcome() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSocialLogin = (platform) => {
    messageApi.info(`Вход через ${platform} временно не работает.`);
  };

  return (
    <div className="login-page">
      {contextHolder}

      <div className="login-form">
        <img src="/logo_2.png" alt="Echo Logo" className="form-logo" />

        <Title level={2}>Добро пожаловать в Echo</Title>
        <Text>Социальная сеть, где всё течёт, всё изменяется, и ничто не вечно</Text>

<Space orientation="vertical" style={{ width: '100%' }}>
            <Button
            type="primary"
            size="large"
            className="main-button ant-btn-primary" // Добавим класс для стилизации
            onClick={() => navigate('/register')}
          >
            Создать аккаунт
          </Button>
          <Button
            type="default"
            size="large"
            className="main-button ant-btn-default" // Добавим класс для стилизации
            onClick={() => navigate('/login')}
          >
            Войти
          </Button>
        </Space>

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
          <Button
            type="default"
            icon={<WechatOutlined />}
            onClick={() => handleSocialLogin('WeChat')}
          />{' '}
        </Space>

        <Button type="link" onClick={() => navigate('/privacy-policy')} className="privacy-link">
          Политика конфиденциальности
        </Button>
      </div>
    </div>
  );
}

export default Welcome;
