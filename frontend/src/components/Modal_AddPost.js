import React, { useState } from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { PlusOutlined, FileImageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

export default function Modal_AddPost({ isVisible, onClose, fetchPosts }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('content', values.content);

    if (values.image && values.image.length > 0) {
      formData.append('image', values.image[0].originFileObj);
    }

    try {
      await axiosInstance.post('/echo_api/posts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      message.success('Пост успешно создан!');
      form.resetFields();
      if (typeof fetchPosts === 'function') {
        fetchPosts();
      }
      onClose();
    } catch (error) {
      console.error('Ошибка при создании поста:', error);
      const errorData = error.response?.data;
      const errorMessage =
        errorData?.detail || errorData?.content?.[0] || 'Не удалось создать пост.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
    const rulesForCommunityNavigate = () => {
      navigate('/community-rules');
      onClose();
    };
  return (
    <Modal title="Создать новый пост" open={isVisible} onCancel={onClose} footer={null} centered>
      <Form form={form} name="create_post" onFinish={onFinish} initialValues={{ content: '' }}>
        <Form.Item
          name="content"
          rules={[{ required: true, message: 'Пожалуйста, введите содержимое поста!' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Что у вас на уме? (макс. 500 символов)"
            maxLength={500}
          />
        </Form.Item>

        <Form.Item name="image" valuePropName="fileList" getValueFromEvent={normFile}>
          <Upload
            listType="picture-card"
            beforeUpload={handleBeforeUpload}
            customRequest={({ onSuccess }) => onSuccess()} // Простая заглушка
            maxCount={1}
            accept=".jpg,.jpeg,.png"
          >
            <div>
              <FileImageOutlined />
              <div style={{ marginTop: 8 }}>Загрузить изображение</div>
            </div>
          </Upload>
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            <PlusOutlined /> Создать пост
          </Button>
          <p>перед тем как создать пост ознакомся с правилами сообщества</p>
          <Button onClick={rulesForCommunityNavigate}> правила </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
