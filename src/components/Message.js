import React from 'react';
import { Card, Typography } from 'antd';
import { FileTextOutlined, HeartOutlined } from '@ant-design/icons';

const { Text } = Typography;

const Message = ({ message }) => {
  if (message.type === 'file') {
    return (
      <div style={{ margin: '10px 0' }}>
        <Card style={{ background: '#e6f7ff', width: 'fit-content' }}>
          <FileTextOutlined style={{ marginRight: '5px' }} />
          <Text>{message.content}</Text>
        </Card>
        <Text style={{ fontSize: '12px', color: '#888', marginLeft: '10px' }}>{message.time}</Text>
      </div>
    );
  }

  return (
    <div style={{ margin: '10px 0' }}>
      <Text strong>{message.sender}: </Text>
      <Text>{message.content}</Text>
      <Text style={{ float: 'right', color: '#888', fontSize: '12px', marginLeft: '10px' }}>{message.time}</Text>
      {message.content.includes('Hữu Duy') && (
        <HeartOutlined style={{ color: 'red', marginLeft: '10px' }} />
      )}
    </div>
  );
};

export default Message;