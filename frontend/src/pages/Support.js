import React, { useState } from 'react';
import './Support.css';
import {
  InfoCircleOutlined,
  WhatsAppOutlined,
  InstagramOutlined,
  XOutlined,
  GithubOutlined,
  PhoneOutlined,
  MailOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Modal, Typography, Button, message } from 'antd';

const { Title, Paragraph } = Typography;

const Support = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFaqModalVisible, setIsFaqModalVisible] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const showTechModal = () => {
    setIsModalVisible(true);
  };

  const showFaqModal = () => {
    setIsFaqModalVisible(true);
  };

  const handleTechModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleFaqModalCancel = () => {
    setIsFaqModalVisible(false);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    messageApi.success(`${type} успешно скопирован!`);
  };

  return (
    <>
      {contextHolder}
      <div className="support-page-container">
        {/* Описание проекта */}
        <div className="about-section">
          <Title level={2}>
            <img src="/logo_2.png" alt="Echo Logo" className="echo-logo" /> : Социальная сеть,
            которая живёт и дышит
          </Title>
          <p>
            Echo — это совершенно новый взгляд на социальные медиа, где контент не застывает во
            времени, а существует, как волны, — временно, но ярко. Мы создали платформу, где каждое
            сообщение имеет свой жизненный цикл, и именно ваше взаимодействие определяет его
            продолжительность. Здесь нет бесконечной ленты, которая поглощает ваше внимание. Есть
            только моменты, которые нужно успеть запечатлеть.
          </p>

          <Title level={3}>✨ Ключевые особенности</Title>
          <Paragraph>
            <span style={{ fontWeight: 'bold' }}>⏳ Динамическая жизнь контента:</span> Посты живут
            24 часа, а комментарии — до 240 часов. Каждое "Эхо" (лайк) продлевает жизнь поста на +1
            час, "Раз эхо" (дизлайк) сокращает время на -1 час.
          </Paragraph>
          <Paragraph>
            <span style={{ fontWeight: 'bold' }}>👻 Плавучие комментарии:</span> Когда пост
            "умирает", его комментарии не исчезают, а начинают "плавать" по общей ленте.
          </Paragraph>
          <Paragraph>
            <span style={{ fontWeight: 'bold' }}>📱 Уникальная навигация:</span> Забудьте о
            вертикальном скролле! Лента Echo движется горизонтально. Свайп вправо → следующий пост,
            свайп влево ← предыдущий.
          </Paragraph>

          <Title level={3}>🚀 PRO подписка</Title>
          <Paragraph>
            <span style={{ fontWeight: 'bold' }}>
              Синяя галочка, GIF-аватарки, МегаЭхо, персонализация, расширенная статистика, "Капсула
              времени"
            </span>{' '}
            — все это доступно для PRO-пользователей.
          </Paragraph>

          <Title level={3}>👥 Авторы</Title>
          <Paragraph> @papr317</Paragraph>
        </div>

        {/* Колонки с контактами и помощью, стилизованные для горизонтального отображения */}
        <div className="support-columns-container">
          <div className="column">
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

          <div className="column">
            <h3>Помощь</h3>
            <div className="help-links">
              <button onClick={showTechModal} className="help-link-button">
                Используемые технологии
                <InfoCircleOutlined style={{ marginLeft: '8px' }} />
              </button>
              <button onClick={showFaqModal} className="help-link-button">
                Часто задаваемые вопросы
                <QuestionCircleOutlined style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </div>

          <div className="column">
            <Title level={4}>Мы в соцсетях</Title>
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
        </div>
      </div>

      {/* Модальное окно для технологий */}
      <Modal
        title="Используемые технологии"
        open={isModalVisible}
        onCancel={handleTechModalCancel}
        footer={[
          <Button key="close" onClick={handleTechModalCancel} className="modal-close-btn">
            Закрыть
          </Button>,
        ]}
      >
        <div className="modal-content">
          <Paragraph>
            **Backend:** Python 3.11+, Django 4.2+, Django REST Framework, PostgreSQL.
            <br />
            **Frontend:** React / Next.js (Web), iOS / Android на Flutter (планируется).
          </Paragraph>
          <a href="https://github.com/papr317/echo" target="_blank" rel="noreferrer">
            <GithubOutlined />
          </a>
        </div>
      </Modal>

      <Modal
        title="Часто задаваемые вопросы"
        open={isFaqModalVisible}
        onCancel={handleFaqModalCancel}
        footer={[
          <Button key="close" onClick={handleFaqModalCancel} className="modal-close-btn">
            Закрыть
          </Button>,
        ]}
      >
        <div className="modal-content">
          <Title level={4}>Как создать аккаунт?</Title>
          <Paragraph>
            Чтобы создать аккаунт, перейдите на страницу регистрации и заполните необходимые поля.
          </Paragraph>

          <Title level={4}>Как опубликовать пост?</Title>
          <Paragraph>
            После входа в аккаунт вы сможете создать пост, нажав на кнопку "Создать пост" в верхнем
            меню.
          </Paragraph>
        </div>
      </Modal>
    </>
  );
};

export default Support;
