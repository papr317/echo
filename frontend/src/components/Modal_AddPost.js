import React, { useState } from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { PlusOutlined, FileAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

export default function Modal_AddPost({ isVisible, onClose, fetchPosts }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleBeforeUpload = (file) => {
    const isAllowedFileType = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (!isAllowedFileType) {
      message.error('Вы можете загружать только изображения (JPG, PNG, GIF) или видео (MP4, WebM, MOV)!');
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Файл должен быть меньше 5MB!');
    }
    return isAllowedFileType && isLt5M;
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    if (e?.fileList) {
      return e.fileList.filter(file => file.status !== 'removed');
    }
    return [];
  };

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('content', values.content);

    if (values.file && values.file.length > 0) {
      values.file.forEach((fileItem) => {
        formData.append('files', fileItem.originFileObj);
      });
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

        <Form.Item name="file" valuePropName="fileList" getValueFromEvent={normFile}>
          <Upload
            listType="picture-card"
            beforeUpload={handleBeforeUpload}
            customRequest={({ onSuccess }) => onSuccess()} // Простая заглушка
            maxCount={5}
            accept="image/*,video/*"
          >
            {/* <h4>не более 5мб!</h4> */}
              <div>
                <FileAddOutlined />
              <div style={{ marginTop: 8 }}>Загрузить файл </div>
            </div>
          </Upload>
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <h4>перед тем как создать пост ознакомся с правилами сообщества!</h4>
          <Button style={{margin: '10px'}} onClick={rulesForCommunityNavigate}> правила </Button>

          <Button style={{ backgroundColor: '#000000', borderRadius: '50px' }} type="primary" htmlType="submit" loading={loading}>
            <PlusOutlined /> Создать пост
          </Button>

        </Form.Item>
      </Form>
    </Modal>
  );
}
