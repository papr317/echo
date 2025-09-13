import React, { useState } from 'react';
import './Support.css';
import {
  InfoCircleOutlined,
  WhatsAppOutlined,
  InstagramOutlined,
  XOutlined,
  GithubOutlined,
  DollarOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Modal, Typography, Button, message } from 'antd';

const { Title, Paragraph } = Typography;

const Footer = () => {
  const year = new Date().getFullYear();
  const [isModalVisible, setIsModalVisible] = useState(false);
  // Правильное использование хука message.useMessage()
  const [messageApi, contextHolder] = message.useMessage();

  const showTechModal = () => {
    setIsModalVisible(true);
  };

  const handleTechModalCancel = () => {
    setIsModalVisible(false);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    // Теперь messageApi доступен и будет работать
    messageApi.success(`${type} успешно скопирован!`);
  };

  return (
    <>
      {contextHolder} {/* 👈 Я добавил этот компонент здесь */}
      <footer>
        <div className="footer-container">
          {/* Левая колонка: Контакты */}
          <div className="footer-left">
            <h3>Контакты</h3>
            <ul className="contact-list">
              <li>
                <PhoneOutlined />
                <span
                  className="contact-link"
                  onClick={() => copyToClipboard('+7 (777) 130-XX-XX', 'Номер телефона')}
                >
                  +7 (777) 130-XX-XX
                </span>
              </li>
              <li>
                <PhoneOutlined />
                <span
                  className="contact-link"
                  onClick={() => copyToClipboard('+7 (708) 290-XX-XX', 'Номер телефона')}
                >
                  +7 (708) 290-XX-XX
                </span>
              </li>
              <li>
                <MailOutlined />
                <span
                  className="contact-link"
                  onClick={() => copyToClipboard('echo@support.gmail.com', 'Почта')}
                >
                  echo@support.gmail.com
                </span>
              </li>
            </ul>
          </div>

          {/* Центральная колонка: Соцсети */}
          <div className="footer-center">
            <h3>
              <img src="/logo_2.png" alt="Echo Logo" className="echo-logo" /> — ваш надёжный партнёр
            </h3>
            <p>
              Мы создаём инновационные решения.
              <br />
              Свяжитесь с нами, чтобы узнать больше!
            </p>
            <div className="social-icons">
              <a href="https://wa.me/7777130XXXX" target="_blank" rel="noreferrer">
                <WhatsAppOutlined />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
                <InstagramOutlined />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer">
                <XOutlined />
              </a>
              <a href="https://github.com/papr317/echo" target="_blank" rel="noreferrer">
                <GithubOutlined />
              </a>
            </div>
          </div>

          {/* Правая колонка: Помощь */}
          <div className="footer-right">
            <h3>Помощь</h3>
            <div className="help-links">
              <button onClick={showTechModal} className="help-link-button">
                О проекте
                <InfoCircleOutlined style={{ marginLeft: '8px' }} />
              </button>

              <a href="./donate">
                Поддержать проект
                <DollarOutlined style={{ marginLeft: '8px' }} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">&copy; {year} PaprCorp. Все права защищены.</div>

        {/* Модальное окно для технологий */}
        <Modal
          title="О проекте"
          open={isModalVisible}
          onCancel={handleTechModalCancel}
          footer={[
            <Button key="close" onClick={handleTechModalCancel} className="modal-close-btn">
              Закрыть
            </Button>,
          ]}
        >
          <div className="modal-content">
            <Title level={4}>Используемые технологии</Title>
            <Paragraph>
              Наш сайт разработан с использованием современных технологий и библиотек. Например:
              React, Ant Design, CSS3 и JavaScript.
            </Paragraph>
          </div>
        </Modal>
      </footer>
    </>
  );
};

export default Footer;
