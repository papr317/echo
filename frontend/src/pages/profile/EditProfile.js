import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Form,
  Input,
  message,
  Spin,
  Space,
  DatePicker,
  Select,
  Divider,
} from 'antd';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

import './Profile.css';

const { Title } = Typography;
const { Option } = Select;

const EditProfile = () => {
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        navigate('/login');
        return;
      }
      try {
        const response = await axiosInstance.get('http://localhost:8000/users_api/me/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userData = response.data;
        form.setFieldsValue({
          ...userData,
          date_of_birth: userData.date_of_birth ? moment(userData.date_of_birth) : null,
        });
      } catch (error) {
        message.error('Не удалось загрузить данные профиля.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [form, navigate]);

  // Исправленная функция для отправки данных
  const onFinish = async (values) => {
    const accessToken = localStorage.getItem('access_token');

    // Создаем новый объект для отправки на сервер
    const dataToSend = {
      username: values.username,
      first_name: values.first_name,
      last_name: values.last_name,
      nickname: values.nickname,
      bio: values.bio,
      gender: values.gender,
      // Преобразуем объект Moment.js в строку формата 'YYYY-MM-DD'
      date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
    };

    try {
      await axiosInstance.put('http://localhost:8000/users_api/me/', dataToSend, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      message.success('Профиль успешно обновлён!');
      navigate('/profile');
    } catch (error) {
      message.error('Не удалось обновить профиль.');
      console.error('Ошибка:', error.response.data);
    }
  };

  if (loading) {
    return (
      <div className="profile-container loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Card className="profile-card" style={{ backgroundColor: '#141414', color: '#fff' }}>
        <Title level={2} style={{ color: '#fff' }}>
          Изменить профиль
        </Title>
        <Divider style={{ borderColor: '#434343' }} />
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ color: '#fff' }}>
          <Form.Item label="Имя пользователя" name="username">
            <Input
              style={{ backgroundColor: '#262626', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Имя" name="first_name">
            <Input
              style={{ backgroundColor: '#262626', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Фамилия" name="last_name">
            <Input
              style={{ backgroundColor: '#262626', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Псевдоним" name="nickname">
            <Input
              style={{ backgroundColor: '#262626', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Биография" name="bio">
            <Input.TextArea
              rows={4}
              style={{ backgroundColor: '#262626', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Пол" name="gender">
            <Select style={{ backgroundColor: '#262626', color: '#fff' }}>
              <Option value="male">Мужской</Option>
              <Option value="female">Женский</Option>
              <Option value="">Не указан</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Дата рождения" name="date_of_birth">
            <DatePicker
              format="YYYY-MM-DD"
              style={{
                backgroundColor: '#262626',
                color: '#fff',
                border: '1px solid #434343',
                width: '100%',
              }}
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => navigate('/profile')}
                style={{ backgroundColor: '#262626', color: '#fff', borderColor: '#434343' }}
              >
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }}
              >
                Сохранить
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditProfile;
