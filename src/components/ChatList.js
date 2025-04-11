import React from 'react';
import { List, Avatar, Badge, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const ChatList = ({ chats, onSelectChat }) => {
  return (
    <div>
      <div style={{ padding: '10px', fontWeight: 'bold' }}>Zalo - Nguyễn Phúc Huy</div>
      <Input
        placeholder="Tìm kiếm"
        prefix={<SearchOutlined />}
        style={{ margin: '10px', borderRadius: '20px' }}
      />
      <List
        itemLayout="horizontal"
        dataSource={chats}
        renderItem={(chat) => (
          <List.Item
            onClick={() => onSelectChat(chat)}
            style={{ cursor: 'pointer', padding: '10px' }}
          >
            <List.Item.Meta
              avatar={<Avatar>{chat.name[0]}</Avatar>}
              title={chat.name}
              description={
                <div>
                  <span>{chat.lastMessage}</span>
                  <span style={{ float: 'right' }}>{chat.time}</span>
                </div>
              }
            />
            {chat.unread > 0 && <Badge count={chat.unread} />}
          </List.Item>
        )}
      />
    </div>
  );
};

export default ChatList;