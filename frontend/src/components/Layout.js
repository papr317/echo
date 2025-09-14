import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Modal_AddPost from './Modal_AddPost';

const { Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState('left');
  // Состояние для управления видимостью модального окна
  const [isModalVisible, setIsModalVisible] = useState(false);

  const siderWidth = collapsed ? 60 : 200;

  const handleSideChange = (newPosition) => {
    setSidebarPosition(newPosition);
  };

  // Функции для открытия и закрытия модального окна
  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header />

      {/* Убираем Ant Design Layout и используем обычный div */}
      <div
        style={{
          display: 'flex',
          margin: 0,
          padding: 0,
          position: 'relative',
        }}
      >
        {sidebarPosition === 'left' && (
          <div
            style={{
              width: siderWidth,
              minWidth: siderWidth,
              background: '#000',
              position: 'sticky',
              top: 0,
              height: '100vh',
              alignSelf: 'flex-start',
            }}
          >
            <Sidebar
              collapsed={collapsed}
              onToggle={() => setCollapsed(!collapsed)}
              position={sidebarPosition}
              onSideChange={handleSideChange}
              onAddPostClick={showModal} // Передаем функцию для открытия модалки
            />
          </div>
        )}

        <Content
          style={{
            flex: 1,
            padding: 16,
            margin: 0,
            minHeight: 'calc(100vh - 128px)',
            transition: 'all 0.3s ease',
            marginLeft: 0,
            marginRight: 0,
          }}
        >
          <Outlet />
        </Content>

        {sidebarPosition === 'right' && (
          <div
            style={{
              width: siderWidth,
              minWidth: siderWidth,
              background: '#000',
              position: 'sticky',
              top: 0,
              height: '100vh',
              alignSelf: 'flex-start',
            }}
          >
            <Sidebar
              collapsed={collapsed}
              onToggle={() => setCollapsed(!collapsed)}
              position={sidebarPosition}
              onSideChange={handleSideChange}
              onAddPostClick={showModal} // Передаем функцию для открытия модалки
            />
          </div>
        )}
      </div>

      <Modal_AddPost isVisible={isModalVisible} onClose={handleCancel} />
    </Layout>
  );
}
