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
import { UserOutlined, UploadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

import './Profile.css';

const { Title } = Typography;
const { Option } = Select;

const EditProfile = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Новое состояние для кнопки "Сохранить"
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(undefined);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Состояние для валидации никнейма. Теперь используется только для отображения результата после onFinish.
  const [nicknameValidation, setNicknameValidation] = useState({
    isChecking: false,
    isToxic: false,
    message: '',
  });

  const validateMinAge = (_, value) => {
    if (!value) return Promise.resolve();

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

  const validateNicknameToxicity = () => {
    if (nicknameValidation.isToxic) {
      return Promise.reject(
        new Error(nicknameValidation.message || 'Пожалуйста, выберите другое Имя пользователя.'),
      );
    }
    return Promise.resolve();
  };
  
  const checkNickname = async (username) => {
    if (!username || username.length < 3) {
      return { isToxic: false, message: '' };
    }

    setNicknameValidation({ isChecking: true, isToxic: false, message: 'Проверка...' });

    try {
      const response = await axiosInstance.post('http://127.0.0.1:8000/users_api/check-nickname/', {
        nickname: username,
      });

      const isToxic = response.data.is_toxic;
      const messageText = response.data.message;
      
      setNicknameValidation({ isChecking: false, isToxic: isToxic, message: messageText });
      
      return { isToxic: isToxic, message: messageText };

    } catch (error) {
      setNicknameValidation({
        isChecking: false,
        isToxic: false,
        message: 'Ошибка проверки Имени пользователя.',
      });
      message.error('Ошибка проверки Имени пользователя. Попробуйте снова.');
      // Возвращаем, что проверка не удалась (считаем нетоксичным, но выводим ошибку)
      return { isToxic: false, message: 'Ошибка проверки' }; 
    }
  };


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
        const response = await axiosInstance.get('http://127.0.0.1:8000/users_api/me/', {
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


    return () => {
      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
      }
    };
    // eslint-disable-next-line
  }, []);

  // --- ЛОГИКА АВАТАРА (без изменений) ---
  const handleAvatarChange = (info) => {
    const file = info.file.originFileObj;
    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
      setAvatarObjectUrl(null);
    }
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarFile(file);
      setAvatarUrl(url);
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

  // --- ОБНОВЛЕННАЯ ФУНКЦИЯ onFinish ---
  const onFinish = async (values) => {
    setIsSaving(true);
    setNicknameValidation({ isChecking: true, isToxic: false, message: 'Проверка Имени пользователя...' });

    // 1. ПРОВЕРКА НИКНЕЙМА
    const currentUsername = values.username || '';
    const { isToxic, message: toxicityMessage } = await checkNickname(currentUsername);

    // Дополнительный вызов валидации Ant Design, чтобы обновить сообщение
    // о токсичности, если она была обнаружена.
    form.validateFields(['username']); 

    if (isToxic) {
      message.error(toxicityMessage || 'Нельзя сохранить профиль: Имя пользователя признано токсичным.');
      setIsSaving(false);
      return;
    }

    // 2. СОХРАНЕНИЕ ПРОФИЛЯ (только если проверка прошла успешно)
    const accessToken = localStorage.getItem('access_token');
    const formData = new FormData();

    formData.append('username', currentUsername);
    formData.append('first_name', values.first_name || '');
    formData.append('last_name', values.last_name || '');
    formData.append('nickname', currentUsername);
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
    } finally {
      setIsSaving(false);
      // Сбрасываем сообщение "Проверка...", если оно осталось висеть
      if(nicknameValidation.isChecking) {
          setNicknameValidation(prev => ({ ...prev, isChecking: false }));
      }
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
      <Card className="profile-card" style={{ backgroundColor: '#18181c', color: '#000' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={96}
            src={avatarUrl}
            icon={<UserOutlined />}
            style={{ background: '#262626', marginBottom: 8 }}
          />
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setAvatarModalOpen(true)}>
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
                }, 300);
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

        <Title level={2} style={{ color: '#ffffffff', marginTop: 16, textAlign: 'center' }}>
          Изменить профиль
        </Title>
        <Divider style={{ borderColor: '#6e6e6eff' }} />
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={() => message.error('Проверьте правильность заполнения формы')}
          style={{ color: '#000000ff' }}
        >
          {/*начало формы */}
          <Form.Item
            color='#ffffffff' label="Имя пользователя"
            name="username"
            rules={[
              { required: true, message: 'Имя пользователя обязательно.' },
              // Теперь эта функция просто проверяет последнее известное состояние
              { validator: validateNicknameToxicity }, 
            ]}
          >
            <Input
              style={{
                backgroundColor: '#ffffffff',
                color: 'rgba(0, 0, 0, 1)',
                border: nicknameValidation.isToxic ? '1px solid #ff4d4f' : '1px solid #434343',
              }}
              // Удалено onChange={handleUsernameChange}
              // Удален индикатор загрузки из suffix, так как он будет в кнопке
            />
          </Form.Item>

          {/* Сообщение о статусе проверки (отображается после onFinish) */}
          {nicknameValidation.message && !nicknameValidation.isChecking && (
            <div
              className={`ant-form-item-explain ant-form-item-explain-error`}
              style={{
                marginTop: -10,
                marginBottom: 10,
                color: nicknameValidation.isToxic ? '#ff4d4f' : '#52c41a',
              }}
            >
              {nicknameValidation.message}
            </div>
          )}

          <Form.Item label="Имя" name="first_name">
            <Input
              style={{ backgroundColor: '##ffffffff', color: '#000', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Фамилия" name="last_name">
            <Input
              style={{ backgroundColor: '#ffffffff', color: 'rgba(0, 0, 0, 1)', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Биография" name="bio">
            <Input.TextArea
              rows={4}
              style={{ backgroundColor: '##ffffffff', color: '#000', border: '1px solid #434343' }}
            />
          </Form.Item>
          <Form.Item label="Пол" name="gender">
            <Select style={{ width: '100%' }} styles={{ backgroundColor: '##ffffffff' }}>
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
                backgroundColor: '##ffffffff',
                color: '#000',
                border: '1px solid #434343',
                width: '100%',
              }}
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => navigate('/profile')}
                style={{ backgroundColor: '##ffffffff', color: '#000', borderColor: '#434343' }}
                disabled={isSaving}
              >
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSaving || nicknameValidation.isChecking}
                disabled={isSaving || nicknameValidation.isChecking}
                style={{
                  backgroundColor: '#1a1a1aff',
                  borderColor: '#000000ff',
                  color: '#000',
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