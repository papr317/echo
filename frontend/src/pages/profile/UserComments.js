import { Card, Typography, Spin, Space } from 'antd';
import { SoundOutlined } from '@ant-design/icons';

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

const UserComments = ({ myComments, setMyComments, tabLoading, setTabLoading }) => {


  if (tabLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="tab-content">
      {myComments.length > 0 ?
        myComments.map(comment => <CommentCard key={comment.id} comment={comment} />
      ) : (
        <Text type="secondary" style={{ color: '#a6a6a6' }}>
          У вас нет активных комментариев.
        </Text>
      )}
    </div>
  );
};

export default UserComments;
