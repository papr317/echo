// src/contexts/AuthContext.js

import React, { createContext, useContext, useState } from 'react';
// import axiosInstance from '../api/axiosInstance'; // Пока не будем использовать, чтобы не вызвать новые ошибки

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  // 💡 В реальном приложении здесь будет логика JWT-токенов,
  // загрузки данных пользователя и проверка статуса авторизации.

  // Временно создадим заглушку пользователя для тестирования
  const [user, setUser] = useState({
    id: 1,
    username: 'TestUser1',
    email: 'test@echo.su',
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const login = (userData) => {
    // Логика входа
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Логика выхода
    setUser(null);
    setIsAuthenticated(false);
  };

  // Объект контекста, который будет передан дочерним компонентам
  const contextValue = {
    user,
    isAuthenticated,
    login,
    logout,
    // ... другие функции (например, refresh token)
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
