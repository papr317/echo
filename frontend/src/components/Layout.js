import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AppHeader from './Header';
import Sidebar from './Sidebar';
import Modal_AddPost from './Modal_AddPost';

const { Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState('left');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const siderWidth = collapsed ? 60 : 200;

  const handleSideChange = (newPosition) => {
    setSidebarPosition(newPosition);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div
      style={{
        background: '#f0f2f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppHeader />

      {/* Контейнер для сайдбара и основного контента */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          width: '100%',
          // Добавляем отступ, чтобы контент не перекрывался хедером
          marginTop: '80px',
        }}
      >
        {/* Левый сайдбар */}
        {sidebarPosition === 'left' && (
          <div
            style={{
              width: siderWidth,
              minWidth: siderWidth,
              background: '#000',
              // Позиционирование сайдбара
              position: 'fixed',
              top: 80, // Начинается сразу под хедером
              left: 0,
              bottom: 0,
              height: 'calc(100vh - 80px)', // Занимает всю оставшуюся высоту
              zIndex: 999, // Убедимся, что сайдбар выше контента
            }}
          >
            <Sidebar
              collapsed={collapsed}
              onToggle={() => setCollapsed(!collapsed)}
              position={sidebarPosition}
              onSideChange={handleSideChange}
              onAddPostClick={showModal}
            />
          </div>
        )}

        {/* Контейнер для основного контента. Добавляем отступы, 
        чтобы он не перекрывался сайдбаром */}
        <Content
          style={{
            flex: 1,
            padding: 16,
            margin: 0,
            transition: 'all 0.3s ease',
            // Добавляем левый или правый отступ в зависимости от позиции сайдбара
            marginLeft: sidebarPosition === 'left' ? siderWidth : 0,
            marginRight: sidebarPosition === 'right' ? siderWidth : 0,
          }}
        >
          <Outlet />
        </Content>

        {/* Правый сайдбар */}
        {sidebarPosition === 'right' && (
          <div
            style={{
              width: siderWidth,
              minWidth: siderWidth,
              background: '#000',
              // Позиционирование сайдбара
              position: 'fixed',
              top: 80,
              right: 0,
              bottom: 0,
              height: 'calc(100vh - 80px)',
              zIndex: 999,
            }}
          >
            <Sidebar
              collapsed={collapsed}
              onToggle={() => setCollapsed(!collapsed)}
              position={sidebarPosition}
              onSideChange={handleSideChange}
              onAddPostClick={showModal}
            />
          </div>
        )}
      </div>

      <Modal_AddPost isVisible={isModalVisible} onClose={handleCancel} />
    </div>
  );
}
