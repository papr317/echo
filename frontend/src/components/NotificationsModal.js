import React from 'react';
import { Modal } from 'antd';

const NotificationsModal = ({ isModalOpen, handleCloseModal }) => {
  return (
    <Modal
      title="Уведомления"
      open={isModalOpen}
      onCancel={handleCloseModal}
      footer={null} // You can add buttons here if needed
      centered
      className="notifications-modal"
    >
      {/* This is where you'll display the actual notifications */}
      <div className="notification-item">
        <p>У вас новое уведомление!</p>
      </div>
      <div className="notification-item">
        <p>Ваш пост получил новый лайк.</p>
      </div>
      <div>
        <p>жизнь вашего поста закончилось, комментариев в свободно плавании 32</p>
      </div>
      {/* You can map through an array of notifications here */}
    </Modal>
  );
};

export default NotificationsModal;
