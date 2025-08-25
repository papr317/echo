import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeOutlined,
  SearchOutlined,
  MessageOutlined,
  NotificationOutlined,
  TeamOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import './Sidebar.css';

function Sidebar() {
  return (
    <nav className="sidebar">
      <ul>
        <li>
          <NavLink to="/buy">
            <CrownOutlined /> PRO
          </NavLink>
        </li>
        <li>
          <NavLink to="/">
            <HomeOutlined /> Главная
          </NavLink>
        </li>
        <li>
          <NavLink to="/search">
            <SearchOutlined /> Поиск
          </NavLink>
        </li>
        <li>
          <NavLink to="/notifications">
            <NotificationOutlined /> Уведомления
          </NavLink>
        </li>
        <li>
          <NavLink to="/groups">
            <TeamOutlined /> Группы
          </NavLink>
        </li>
        <li>
          <NavLink to="/messages">
            <MessageOutlined /> Сообщения
          </NavLink>
        </li>
      </ul>
      <div className="sidebar-button-container">
        <button className="public-post-button">Public Post</button>
      </div>
    </nav>
  );
}

export default Sidebar;
