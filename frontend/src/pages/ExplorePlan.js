import React from 'react';
import { Card, Button, Typography, Space, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import './ExplorePlan.css';

const { Title, Text, Paragraph } = Typography;

const ExplorePlan = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const handlePurchase = (planName) => {
    messageApi.warning(
      `Извините, покупка тарифа "${planName}" временно недоступна. Пожалуйста, попробуйте позже.`,
    );
  };

  return (
    <div className="subscription-container">
      {contextHolder}

      <Title level={1} className="page-title">
        Стань PRO-пользователем
      </Title>
      <Paragraph className="page-description">
        Разблокируй эксклюзивные функции и выведи свой профиль на новый уровень.
        <br />
        <Text strong>
          Синяя галочка, GIF-аватарки, МегаЭхо, персонализация, расширенная статистика, "Капсула
          времени"
        </Text>
        — все это доступно для PRO-пользователей.
      </Paragraph>

      <div className="plans-horizontal-scroll">
        <Space size="large" className="plans-wrapper">
          {/* План на один день */}
          <Card
            className="subscription-card"
            title={<Title level={3}>Один день</Title>}
            extra={
              <Text strong className="card-price">
                $0.99
              </Text>
            }
          >
            <ul className="features-list">
              <li>
                <CheckCircleOutlined /> <Text>Тестовый доступ</Text>
              </li>
              <li>
                <CheckCircleOutlined /> <Text>Синяя галочка на 24 часа</Text>
              </li>
              <li>
                <CheckCircleOutlined /> <Text>МегаЭхо</Text>
              </li>
            </ul>
            <Button
              type="primary"
              size="large"
              block
              className="card-button"
              onClick={() => handlePurchase('Один день')}
            >
              Выбрать
            </Button>
          </Card>

          {/* План на месяц */}
          <Card
            className="subscription-card"
            title={<Title level={3}>Месяц</Title>}
            extra={
              <Text strong className="card-price">
                $4.99
              </Text>
            }
          >
            <ul className="features-list">
              <li>
                <CheckCircleOutlined /> <Text>Полный доступ</Text>
              </li>
              <li>
                <CheckCircleOutlined /> <Text>GIF-аватарки</Text>
              </li>
              <li>
                <CheckCircleOutlined /> <Text>Расширенная статистика</Text>
              </li>
            </ul>
            <Button
              type="primary"
              size="large"
              block
              className="card-button"
              onClick={() => handlePurchase('Месяц')}
            >
              Выбрать
            </Button>
          </Card>

          {/* План на год */}
          <Card
            className="subscription-card"
            title={<Title level={3}>Год</Title>}
            extra={
              <Text strong className="card-price">
                $49.99
              </Text>
            }
          >
            <ul className="features-list">
              <li>
                <CheckCircleOutlined /> <Text>Все функции месячного плана</Text>
              </li>
              <li>
                <CheckCircleOutlined /> <Text>Персонализация</Text>
              </li>
              <li>
                <CheckCircleOutlined /> <Text>Экономия 16%</Text>
              </li>
            </ul>
            <Button
              type="primary"
              size="large"
              block
              className="card-button"
              onClick={() => handlePurchase('Год')}
            >
              Выбрать
            </Button>
          </Card>

          {/* План "Пожизненно" */}
          <Card
            className="subscription-card"
            title={<Title level={3}>Навсегда</Title>}
            extra={
              <Text strong className="card-price">
                $149.99
              </Text>
            }
          >
            <ul className="features-list">
              <li>
                <CheckCircleOutlined /> <Text>"Капсула времени"</Text>
              </li>
              <li>
                <CheckCircleOutlined /> <Text>Ранний доступ к новым функциям</Text>
              </li>
              <li>
                <CheckCircleOutlined /> <Text>Пожизненный доступ</Text>
              </li>
              <li>
                <CheckCircleOutlined /> <Text>Заморозка после ухода</Text>
              </li>
            </ul>
            <Button
              type="primary"
              size="large"
              block
              className="card-button"
              onClick={() => handlePurchase('Навсегда')}
            >
              Выбрать
            </Button>
          </Card>
        </Space>
      </div>
    </div>
  );
};

export default ExplorePlan;
