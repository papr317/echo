import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Modal, Typography, Avatar, Spin } from 'antd';
import { QuestionCircleOutlined, SoundOutlined, MutedOutlined } from '@ant-design/icons';

// Вспомогательный компонент для карточки
const FloatingCommentCard = ({ comment }) => {
  const expired = new Date(comment.expires_at) < new Date();

  return (
    <div key={comment.id} className="floating-comment-card post-card">
      <div className="post-header">
        <div className="author-info">
          <Avatar
            size={32}
            src={comment.author_details?.avatar}
            icon={
              !comment.author_details?.avatar &&
              comment.author_details?.username?.charAt(0).toUpperCase()
            }
            style={{ backgroundColor: '#434343', color: '#fff', marginRight: 8 }}
          />
          <Typography.Text strong>{comment.author_details?.username}</Typography.Text>
        </div>
      </div>

      <Typography.Paragraph
        className="post-content"
        style={{ fontSize: '0.9em', margin: '10px 0' }}
      >
        {comment.text}
      </Typography.Paragraph>

      {/* Жизненная полоска для комментария */}
      <div className="floating-footer post-actions-container">
        <Typography.Text type="secondary" style={{ fontSize: '0.85em' }}>
          <SoundOutlined /> {comment.echo_count} | <MutedOutlined /> {comment.disecho_count}
        </Typography.Text>
      </div>

      {expired && <div className="expired-notice">Истек..</div>}
    </div>
  );
};

function FloatingComments() {
  const [floatingComments, setFloatingComments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFloatingComments = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/echo_api/feed/floating/');
      setFloatingComments(response.data);
    } catch (err) {
      console.error('Ошибка при получении плавающих комментариев:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFloatingComments();
    const floatingInterval = setInterval(fetchFloatingComments, 30000);
    return () => clearInterval(floatingInterval);
  }, [fetchFloatingComments]);

  const showModal = () => setIsModalVisible(true);
  const handleOk = () => setIsModalVisible(false);

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <Spin />
      </div>
    );

  return (
    <>
      <div className="floating-comments">
        <Typography.Title level={5}>
          Плавучие комментарии {floatingComments.length}
          <QuestionCircleOutlined
            onClick={showModal}
            style={{ marginLeft: 8, cursor: 'pointer', color: '#000000ff' }}
          />
        </Typography.Title>

        <div className="comments-floating-list">
          {floatingComments.length > 0 ? (
            floatingComments.map((comment) => (
              <FloatingCommentCard key={comment.id} comment={comment} />
            ))
          ) : (
            <p className="no-floating-message">Сейчас нет активных плавающих комментариев.</p>
          )}
        </div>
      </div>

      <Modal
        title="Что такое плавучие комментарии?"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleOk}
        footer={null}
      >
        <p>
          **Плавучие комментарии** — это комментарии, которые были **спасены** после того, как пост,
          к которому они относились, **истёк и исчез**.
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>
            **Спасение:** Комментарии переводятся в "плавучее" состояние (`is_floating=True`).
          </li>
          <li>
            **Время жизни:** Они продолжают существовать, пока не истечет их собственное время.
          </li>
          <li>**Взаимодействие:** На них нельзя отвечать или ставить реакции.</li>
        </ul>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <button className="modal-ok-button" onClick={handleOk}>
            Понятно
          </button>
        </div>
      </Modal>
    </>
  );
}

export default FloatingComments;
