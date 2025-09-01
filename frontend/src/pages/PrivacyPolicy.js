import React, { useEffect, useState } from 'react';

const PrivacyPolicy = () => {
  const [text, setText] = useState('');

  useEffect(() => {
    fetch('/privacy_policy.txt')
      .then((res) => res.text())
      .then(setText)
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Политика конфиденциальности</h2>
      <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{text}</pre>
      <button
        style={{ marginTop: 20 }}
        onClick={() => window.location.href = '/register'}
      >
        Назад к регистрации
      </button>
    </div>
  );
};

export default PrivacyPolicy;
