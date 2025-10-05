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
  Upload,
  Avatar,
  Modal,
} from 'antd';
import { UserOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
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
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(undefined);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const validateMinAge = (_, value) => {
    if (!value) return Promise.resolve();

    // Преобразуем value в moment, если это строка
    const date = moment.isMoment(value) ? value : moment(value, 'YYYY-MM-DD');
    const now = moment();
    const minAge = 8;

    if (date.isAfter(now)) {
      return Promise.reject(new Error('Дата рождения не может быть в будущем.'));
    }

    const age = now.diff(date, 'years');
    if (age < minAge) {
      return Promise.reject(new Error(`Вам должно быть не менее ${minAge} лет.`));
    }
    return Promise.resolve();
  };

  // Функция для запрета выбора дат в будущем
  const disableFutureDates = (current) => {
    return current && current.valueOf() > moment().endOf('day');
  };

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
        if (userData.avatar) {
          setAvatarUrl(userData.avatar);
        }
      } catch (error) {
        message.error('Не удалось загрузить данные профиля.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();

    // Очистка objectURL при размонтировании
    return () => {
      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
      }
    };
    // eslint-disable-next-line
  }, []);

  // --- ЛОГИКА АВАТАРА ---
  const handleAvatarChange = (info) => {
    const file = info.file.originFileObj;
    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
      setAvatarObjectUrl(null);
    }
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarFile(file); // Сначала сохраняем файл
      setAvatarUrl(url); // Потом обновляем url для отображения
      setAvatarObjectUrl(url);
    }
  };

  const handleAvatarRemove = () => {
    setAvatarUrl(null);
    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
      setAvatarObjectUrl(null);
    }
    setAvatarFile(null);
    message.info('Аватар будет удален при сохранении профиля.');
  };

  const onFinish = async (values) => {
    const accessToken = localStorage.getItem('access_token');
    const formData = new FormData();

    formData.append('username', values.username || '');
    formData.append('first_name', values.first_name || '');
    formData.append('last_name', values.last_name || '');
    formData.append('nickname', values.nickname || '');
    formData.append('bio', values.bio || '');
    formData.append('gender', values.gender || '');
    formData.append(
      'date_of_birth',
      values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : '',
    );

    if (avatarFile === null) {
      formData.append('avatar', '');
    } else if (avatarFile instanceof File) {
      formData.append('avatar', avatarFile, avatarFile.name);
    }

    try {
      const response = await axiosInstance.put('http://localhost:8000/users_api/me/', formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      // Если сервер возвращает новый avatar, обновите avatarUrl:
      if (response.data.avatar) {
        setAvatarUrl(response.data.avatar);
      }
      setAvatarFile(undefined);
      message.success('Профиль успешно обновлён!');
      navigate('/profile');
    } catch (error) {
      console.error('Ошибка:', error.response?.data);
      const errorData = error.response?.data;
      let errorMessage = 'Не удалось обновить профиль.';
      if (errorData) {
        const firstErrorKey = Object.keys(errorData)[0];
        const firstErrorValue = errorData[firstErrorKey];
        if (firstErrorKey === 'detail') {
          errorMessage = firstErrorValue;
        } else if (Array.isArray(firstErrorValue) && firstErrorValue.length > 0) {
          errorMessage = `${firstErrorKey}: ${firstErrorValue[0]}`;
        } else if (typeof firstErrorValue === 'string') {
          errorMessage = firstErrorValue;
        }
      }
      message.error(errorMessage);
    }
  };

  console.log('avatarFile:', avatarFile, 'typeof:', typeof avatarFile);

  if (loading) {
    return (
      <div className="profile-container loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Card className="profile-card" style={{ backgroundColor: '#18181c', color: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={96}
            src={avatarUrl}
            icon={<UserOutlined />}
            style={{ background: '#262626', marginBottom: 8 }}
          />
          <Space>
            <Button icon={<UploadOutlined />} onClick={() => setAvatarModalOpen(true)}>
              Изменить аватар
            </Button>
          </Space>
        </div>
        <Modal
          open={avatarModalOpen}
          onCancel={() => setAvatarModalOpen(false)}
          footer={null}
          title="Аватар"
          centered
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleAvatarChange}
              accept="image/*"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Изменить аватар</Button>
            </Upload>
            <Button
              block
              icon={<UserOutlined />}
              onClick={() => {
                setAvatarModalOpen(false);
                setTimeout(() => {
                  message.warning('Доступ к камере временно недоступен.');
                }, 300); // Даем модалке закрыться, потом показываем сообщение
              }}
            >
              Сделать фото
            </Button>
            {avatarUrl && (
              <Button
                block
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  handleAvatarRemove();
                  setAvatarModalOpen(false);
                }}
              >
                Удалить
              </Button>
            )}
          </Space>
        </Modal>
        <Title level={2} style={{ color: '#fff', marginTop: 16, textAlign: 'center' }}>
          Изменить профиль
        </Title>
        <Divider style={{ borderColor: '#434343' }} />
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={() => message.error('Проверьте правильность заполнения формы')}
          style={{ color: '#fff' }}
        >
          <Form.Item label="Имя пользователя" name="username">
            <Input
              style={{ backgroundColor: '#23232b', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Имя" name="first_name">
            <Input
              style={{ backgroundColor: '#23232b', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Фамилия" name="last_name">
            <Input
              style={{ backgroundColor: '#23232b', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Псевдоним" name="nickname">
            <Input
              style={{ backgroundColor: '#23232b', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Биография" name="bio">
            <Input.TextArea
              rows={4}
              style={{ backgroundColor: '#23232b', color: '#fff', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Пол" name="gender">
            <Select style={{ backgroundColor: '#23232b', color: '#fff' }}>
              <Option value="male">Мужской</Option>
              <Option value="female">Женский</Option>
              <Option value="">Не указан</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Дата рождения"
            name="date_of_birth"
            rules={[
              {
                required: true,
                message: 'Пожалуйста, выберите дату рождения',
              },
              { validator: validateMinAge },
            ]}
          >
            <DatePicker
              format="YYYY-MM-DD"
              disabledDate={disableFutureDates}
              allowClear={false}
              style={{
                backgroundColor: '#23232b',
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
                style={{ backgroundColor: '#23232b', color: '#fff', borderColor: '#434343' }}
              >
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  backgroundColor: '#1a1a1aff',
                  borderColor: '#000000ff',
                  color: '#fff',
                  fontWeight: 600,
                }}
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
