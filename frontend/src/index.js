// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';

import App from './App';
import './App.css';
import { AuthProvider } from './contexts/AuthContext'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Provider (Redux) должен быть выше всех, чтобы store был доступен
  <Provider store={store}>
    <AuthProvider>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </AuthProvider>
  </Provider>
);