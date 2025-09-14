import React, { useState } from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { PlusOutlined, FileImageOutlined } from '@ant-design/icons';
import axios from 'axios';

// Обновленные стили с более округлыми элементами
const modalStyles = {
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #000',
    padding: '16px 24px',
    borderRadius: '16px 16px 0 0', // Округление только верхних углов
  },
  title: {
    color: '#000',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  body: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '0 0 16px 16px', // Округление только нижних углов
  },
  button: {
    backgroundColor: '#000',
    color: '#fff',
    border: '1px solid #000',
    borderRadius: '16px', // Круглая кнопка
    fontWeight: 'bold',
    transition: 'all 0.3s', // Добавляем плавный переход
  },
  buttonHover: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#000',
    transform: 'scale(1.05)', // Небольшое увеличение при наведении
  },
  input: {
    backgroundColor: '#fff',
    border: '1px solid #000',
    color: '#000',
    borderRadius: '16px', // Круглые поля ввода
  },
  upload: {
    border: '1px dashed #000',
    borderRadius: '16px', // Округленный блок загрузки
    backgroundColor: '#fff',
  },
};

export default function Modal_AddPost({ isVisible, onClose }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const handleBeforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('Вы можете загружать только JPG/PNG файлы!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Изображение должно быть меньше 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const customRequest = ({ onSuccess }) => {
    onSuccess();
  };

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('content', values.content);
    if (fileList.length > 0) {
      formData.append('image', fileList[0].originFileObj);
    }

    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      console.error('JWT-токен не найден. Вы не авторизованы.');
      message.error('Вы не авторизованы. Пожалуйста, войдите в систему.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('http://127.0.0.1:8000/echo_api/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      message.success('Пост успешно создан!');
      form.resetFields();
      setFileList([]);
      onClose();
    } catch (error) {
      console.error('Ошибка при создании поста:', error);
      message.error('Не удалось создать пост.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<div style={modalStyles.title}>Создать новый пост</div>}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      centered
      styles={{
        body: modalStyles.body,
        header: modalStyles.header,
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
        content: {
          border: '2px solid #000',
          borderRadius: '16px', // Округление всего модального окна
          padding: '0',
          overflow: 'hidden', // Скрываем выходящие за границы элементы
        },
      }}
      closeIcon={<div style={{ color: '#000' }}>✖</div>}
    >
      <Form form={form} name="create_post" onFinish={onFinish} initialValues={{ content: '' }}>
        <Form.Item
          name="content"
          rules={[{ required: true, message: 'Пожалуйста, введите содержимое поста!' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Что у вас на уме? (макс. 500 символов)"
            maxLength={500}
            style={modalStyles.input}
          />
        </Form.Item>

        <Form.Item name="image">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={handleBeforeUpload}
            customRequest={customRequest}
            maxCount={1}
            showUploadList={{
              showPreviewIcon: false,
              showRemoveIcon: true,
            }}
            accept=".jpg,.jpeg,.png"
            style={modalStyles.upload}
          >
            {fileList.length === 0 && (
              <div style={{ color: '#000' }}>
                <FileImageOutlined />
                <div style={{ marginTop: 8 }}>Загрузить изображение</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={modalStyles.button}
            onMouseOver={(e) => {
              Object.assign(e.currentTarget.style, modalStyles.buttonHover);
            }}
            onMouseOut={(e) => {
              Object.assign(e.currentTarget.style, modalStyles.button);
            }}
          >
            <PlusOutlined /> Создать пост
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
