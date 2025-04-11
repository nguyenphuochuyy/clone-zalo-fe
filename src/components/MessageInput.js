import React from 'react';
import { Input, Button, Space } from 'antd';
import { SendOutlined, PaperClipOutlined, SmileOutlined } from '@ant-design/icons';

const MessageInput = () => {
  return (
    <div style={{ padding: '10px', borderTop: '1px solid #f0f0f0' }}>
      <Space style={{ width: '100%' }}>
        <Input
          placeholder="Nhập @, tin nhắn tới Công nghệ mới - Nhóm 08"
          style={{ borderRadius: '20px' }}
        />
        <Button icon={<PaperClipOutlined />} />
        <Button icon={<SmileOutlined />} />
        <Button type="primary" icon={<SendOutlined />} />
      </Space>
    </div>
  );
};

export default MessageInput;