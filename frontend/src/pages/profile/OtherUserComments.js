import React, { useCallback } from 'react';
import { Card, Typography, Spin, message, Space } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';

const { Text } = Typography;

const CommentCard = ({ comment }) => {
  const commentText = comment.content || '';

  return (
    <Card
      size="small"
      style={{ marginBottom: '10px', backgroundColor: '#262626', borderColor: '#434343' }}
      title={
        <Text style={{ color: '#fff' }}>
          {commentText.substring(0, 50)}
          {commentText.length > 50 ? '...' : ''}
        </Text>
      }
      extra={
        <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '12px' }}>
          {new Date(comment.created_at).toLocaleDateString()}
        </Text>
      }
    >
      <Space size="large">
        <Text style={{ color: '#fff' }}>
          <SoundOutlined /> {comment.echo_count}
        </Text>
        <Text style={{ color: '#fff' }}>
          {comment.is_floating ? 'Плавучий' : `К посту #${comment.post}`}
        </Text>
        <Text style={{ color: '#52c41a' }}>Активен</Text>
      </Space>
    </Card>
  );
};

const OtherUserComments = ({
  userComments,
  setUserComments,
  tabLoading,
  setTabLoading,
  userId,
}) => {
  const fetchUserComments = useCallback(async () => {
    if (userComments.length > 0) return; // Загружаем только один раз при первом клике на вкладку

    setTabLoading(true);
    try {
      const response = await axiosInstance.get(`/echo_api/users/${userId}/comments/active/`);
      setUserComments(response.data);
    } catch (error) {
      message.error('Не удалось загрузить комментарии.');
      console.error('User comments fetch error:', error);
    } finally {
      setTabLoading(false);
    }
  }, [userComments.length, setUserComments, setTabLoading, userId]);

  React.useEffect(() => {
    fetchUserComments();
  }, [fetchUserComments]);

  if (tabLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="tab-content">
      {userComments.length > 0 ? (
        userComments.map((comment) => <CommentCard key={comment.id} comment={comment} />)
      ) : (
        <Text type="secondary" style={{ color: '#a6a6a6' }}>
          У пользователя нет активных комментариев.
        </Text>
      )}
    </div>
  );
};

export default OtherUserComments;
