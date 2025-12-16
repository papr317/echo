import React, { useCallback } from 'react';
import { Card, Typography, Spin, message, Space } from 'antd';
import { SoundOutlined, CommentOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';

const { Text } = Typography;

const PostCard = ({ post }) => (
  <Card
    size="small"
    style={{ marginBottom: '10px', backgroundColor: '#262626', borderColor: '#434343' }}
    title={
      <Text style={{ color: '#fff' }}>
        {post.content.substring(0, 50)}
        {post.content.length > 50 ? '...' : ''}
      </Text>
    }
    extra={
      <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '12px' }}>
        {new Date(post.created_at).toLocaleDateString()}
      </Text>
    }
  >
    <Space size="large">
      <Text style={{ color: '#fff' }}>
        <SoundOutlined /> {post.echo_count}
      </Text>
      <Text style={{ color: '#fff' }}>
        <CommentOutlined /> {post.comments_count || 0}
      </Text>
      <Text style={{ color: post.is_expired ? 'red' : '#52c41a' }}>
        {post.is_expired ? 'Истёк' : 'Активен'}
      </Text>
    </Space>
  </Card>
);

const OtherUserPosts = ({ userPosts, setUserPosts, tabLoading, setTabLoading, userId }) => {
  const fetchUserPosts = useCallback(async () => {
    if (userPosts.length > 0) return; // Загружаем только один раз при первом клике на вкладку

    setTabLoading(true);
    try {
      const response = await axiosInstance.get(`/echo_api/users/${userId}/posts/`);

      setUserPosts(
        response.data.map((post) => ({
          ...post,
          is_expired: new Date(post.expires_at) < new Date(),
        })),
      );
    } catch (error) {
      message.error('Не удалось загрузить посты.');
      console.error('User posts fetch error:', error);
    } finally {
      setTabLoading(false);
    }
  }, [userPosts.length, setUserPosts, setTabLoading, userId]);

  React.useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  if (tabLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="tab-content">
      {userPosts.length > 0 ? (
        userPosts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <Text type="secondary" style={{ color: '#a6a6a6' }}>
          У пользователя пока нет постов.
        </Text>
      )}
    </div>
  );
};

export default OtherUserPosts;
