import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeOutlined,
  // PushpinOutlined,
  SearchOutlined,
  // TeamOutlined,
  CrownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import './Sidebar.css';

function Sidebar({ collapsed, onToggle, position, onSideChange, onAddPostClick }) {
  const handlePositionChange = () => {
    const newPosition = position === 'left' ? 'right' : 'left';
    onSideChange(newPosition);
  };

  return (
    <nav className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} sidebar-${position}`}>
      <ul className="sidebar-nav">
        <div className="sidebar-button-container">
          {/* кнопка нового поста */}
          <button className="public-post-button" onClick={onAddPostClick}>
            <PlusOutlined />
            {!collapsed && 'Новый пост'}
          </button>
        </div>
        <li>
          <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
            <HomeOutlined />
            {!collapsed && 'Главная'}
          </NavLink>
        </li>

        {/* TODO: доделать страницу открепленных комментариев  и друзей*/}
        {/* <li>
          <NavLink to="/floating-comment" className={({ isActive }) => (isActive ? 'active' : '')}>
            <PushpinOutlined /> {!collapsed && 'открепленные '}
          </NavLink>
        </li> */}

        <li>
          <NavLink to="/search" className={({ isActive }) => (isActive ? 'active' : '')}>
            <SearchOutlined />
            {!collapsed && 'Поиск'}
          </NavLink>
        </li>
        <li>
          <NavLink to="messenger" className={({ isActive }) => (isActive ? 'active' : '')}>
            <CommentOutlined />
            {!collapsed && 'общение'}
          </NavLink>
        </li>
        {/* <li>
          <NavLink to="/friends" className={({ isActive }) => (isActive ? 'active' : '')}>
            <TeamOutlined />
            {!collapsed && 'Друзья'}
          </NavLink>
        </li> */}
        <li>
          <NavLink to="/explore-plan" className={({ isActive }) => (isActive ? 'active' : '')}>
            <CrownOutlined />
            {!collapsed && 'Стать PRO'}
          </NavLink>
        </li>
        <li>
          <NavLink to="/support" className={({ isActive }) => (isActive ? 'active' : '')}>
            <QuestionCircleOutlined />
            {!collapsed && 'Помощь'}
          </NavLink>
        </li>
      </ul>

      <div className="sidebar-controls">
        <button
          onClick={onToggle}
          className="sidebar-toggle-btn"
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>

        {!collapsed && (
          <button
            onClick={handlePositionChange}
            className="sidebar-position-btn"
            title="Сменить сторону"
          >
            <SwapOutlined
              style={{
                transform: position === 'left' ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.3s ease',
              }}
            />
          </button>
        )}
      </div>
    </nav>
  );
}

export default Sidebar;
