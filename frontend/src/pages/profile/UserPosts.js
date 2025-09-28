import React, {useCallback } from 'react';
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

const UserPosts = ({ myPosts, setMyPosts, tabLoading, setTabLoading }) => {
  const fetchMyPosts = useCallback(async () => {
    if (myPosts.length > 0) return; // Загружаем только один раз при первом клике на вкладку

    setTabLoading(true);
    try {
      const response = await axiosInstance.get('/echo_api/my/posts/');

      setMyPosts(
        response.data.map((post) => ({
          ...post,
          is_expired: new Date(post.expires_at) < new Date(),
        })),
      );
    } catch (error) {
      message.error('Не удалось загрузить посты.');
      console.error('My posts fetch error:', error);
    } finally {
      setTabLoading(false);
    }
  }, [myPosts.length, setMyPosts, setTabLoading]);

  if (tabLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="tab-content">
      {myPosts.length > 0 ? (
        myPosts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <Text type="secondary" style={{ color: '#a6a6a6' }}>
          У вас пока нет постов.
        </Text>
      )}
    </div>
  );
};

export default UserPosts;
