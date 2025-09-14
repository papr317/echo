import React, { useState } from 'react';
import { Card, Typography, Button, Form, Input, message, Space, Divider } from 'antd';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const { Title } = Typography;

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    const accessToken = localStorage.getItem('access_token');
    try {
      await axiosInstance.post('http://localhost:8000/users_api/reset_password/', values, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      message.success('Пароль успешно изменён!');
      navigate('/profile');
    } catch (error) {
      message.error('Не удалось изменить пароль. Проверьте старый пароль.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <Card className="profile-card" style={{ backgroundColor: '#141414', color: '#fff' }}>
        <Title level={2} style={{ color: '#fff' }}>
          Смена пароля
        </Title>
        <Divider style={{ borderColor: '#434343' }} />
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ color: '#fff' }}>
          <Form.Item
            label="Текущий пароль"
            name="old_password"
            rules={[{ required: true, message: 'Пожалуйста, введите текущий пароль!' }]}
          >
            <Input.Password
              style={{ backgroundColor: '#262626', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item
            label="Новый пароль"
            name="new_password"
            rules={[{ required: true, message: 'Пожалуйста, введите новый пароль!' }]}
          >
            <Input.Password
              style={{ backgroundColor: '#262626', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item
            label="Повторите новый пароль"
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Пожалуйста, повторите новый пароль!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Пароли не совпадают!'));
                },
              }),
            ]}
          >
            <Input.Password
              style={{ backgroundColor: '#262626', color: '#fff', border: '1px solid #434343' }}
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
                loading={loading}
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }}
              >
                Изменить пароль
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePassword;
