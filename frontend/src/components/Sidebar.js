import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  return (
    <nav className="sidebar">
      <ul>
        <li>
          <NavLink to="/">Главная</NavLink>
        </li>
        <li>
          <NavLink to="/profile">Профиль</NavLink>
        </li>
        <li>
          <NavLink to="/messages">Сообщения</NavLink>
        </li>
        <li>
          <NavLink to="/settings">Настройки</NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;
