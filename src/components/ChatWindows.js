import React from 'react';
import {  Divider } from 'antd';
import Message from './Message.js';
import MessageInput from './MessageInput';
import { messages } from '../data/data.js';
const ChatWindow = ({ chat }) => {
  const chatMessages = messages.filter((msg) => msg.chatId === chat.id);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', fontWeight: 'bold' }}>{chat.name}</div>
      <Divider style={{ margin: 0 }} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {chatMessages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatWindow;