import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем интерцептор для обработки ответов
axiosInstance.interceptors.response.use(
  (response) => response, // Если ответ успешный, просто возвращаем его
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 (Unauthorized) и это не повторный запрос на обновление токена
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Отправляем запрос на обновление токена
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/users_api/token/refresh/', {
          refresh: refreshToken,
        });

        // Сохраняем новые токены
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);

        // Обновляем заголовок Authorization для повторного запроса
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

        // Повторяем изначальный запрос
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Если обновление токена не удалось (например, refresh_token истек)
        // Выбрасываем пользователя и очищаем хранилище
        localStorage.clear();
        window.location.href = '/Welcome';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
