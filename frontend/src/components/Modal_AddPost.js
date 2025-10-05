import React, { useState } from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { PlusOutlined, FileImageOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axiosInstance';

// 🛑 УДАЛИТЕ ОБЪЕКТ modalStyles (он был причиной проблемы с дизайном)
// const modalStyles = { ... };

export default function Modal_AddPost({ isVisible, onClose, fetchPosts }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Вспомогательная функция для проверки и ограничения файла
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

  // Вспомогательная функция AntD для передачи fileList в Form values
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  // ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ onFinish для работы с FormData
  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('content', values.content);

    // 1. Проверяем, есть ли файл
    // values.image теперь является массивом fileList благодаря normFile
    if (values.image && values.image.length > 0) {
      // 2. Берем сам объект файла и добавляем его в FormData
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
      // Улучшенный вывод ошибок валидации от DRF
      const errorMessage =
        errorData?.detail || errorData?.content?.[0] || 'Не удалось создать пост.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Создать новый пост" // Возвращаем стандартный заголовок
      open={isVisible}
      onCancel={onClose}
      footer={null}
      centered
      // 🛑 УДАЛИТЕ ВСЕ СТРОКИ styles={{...}}
      // Это вернет стандартный/наследуемый вид модалки
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
            // 🛑 УДАЛИТЕ style={modalStyles.input}
          />
        </Form.Item>

        <Form.Item
          name="image"
          valuePropName="fileList"
          getValueFromEvent={normFile} // ✅ ГЛАВНОЕ ИСПРАВЛЕНИЕ ДЛЯ ФАЙЛОВ
        >
          <Upload
            listType="picture-card"
            beforeUpload={handleBeforeUpload}
            customRequest={({ onSuccess }) => onSuccess()} // Простая заглушка
            maxCount={1}
            accept=".jpg,.jpeg,.png"
            // 🛑 УДАЛИТЕ style={modalStyles.upload}
          >
            {/* Логика отображения кнопки загрузки */}
            <div>
              <FileImageOutlined />
              <div style={{ marginTop: 8 }}>Загрузить изображение</div>
            </div>
          </Upload>
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            <PlusOutlined /> Создать пост
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
