import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CommunityRules() {
  const [rulesText, setRulesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    // ПРИМЕЧАНИЕ: Файл community_rules.txt должен быть в папке public
    fetch('/community_rules.txt')
      .then((res) => {
        if (!res.ok) throw new Error('Файл правил не найден (404)');
        return res.text();
      })
      .then((text) => {
        setRulesText(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading rules:', err);
        setError('Не удалось загрузить правила.');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Правила сообщества Echo</h2>

      {/* Логика загрузки и ошибок */}
      {loading && <p>Загрузка правил...</p>}
      {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>}

      {/* Отображение неформатированного текста */}
      {!loading && !error && rulesText && (
        <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontFamily: 'sans-serif' }}>
          {rulesText}
        </pre>
      )}

      {/* Кнопка "Назад" */}
      <button
        style={{ marginTop: '20px', padding: '10px 15px', cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        Вернуться на главную
      </button>
    </div>
  );
}
