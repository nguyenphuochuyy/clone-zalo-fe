import React, { useEffect, useRef, useState } from 'react';
import { Layout, List, Avatar, Badge, Typography, Button, Row, Col, Dropdown, Menu, Upload, Input } from 'antd';
import {
  SearchOutlined,
  MessageOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  MoonOutlined,
  LogoutOutlined,
  UploadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { TbLockPassword } from 'react-icons/tb';
import { Navigate } from 'react-router-dom';
import ModalProfile from '../../components/ModalProfile';
import ModalForgetPassword from '../../components/ModalResetPassword';
import io from 'socket.io-client';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const HomeChat = ({ setIsAuthenticated, userProfile, avatar, setAvatar }) => {
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [listConversation, setListConversation] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [pendingMessages, setPendingMessages] = useState([]); // Lưu trữ tin nhắn đến khi chưa có selectedUser

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    window.location.href = '/';
  };
 // lấy danh sách cuộc trò chuyện của người dùng
  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`http://localhost:5000/api/chat/${currentUser.userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Danh sách cuộc trò chuyện:', data);
      
      setListConversation(data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', error);
      alert('Không thể tải danh sách cuộc trò chuyện');
    }
  };

  // Đánh dấu tin nhắn là đã đọc khi người dùng chọn cuộc trò chuyện
  const markMessagesAsRead = async (conversationId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          conversationId,
          userId: currentUser.userId,
        }),
      });
      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
      }
      fetchConversations();
    } catch (error) {
      console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    socketRef.current = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token'), userId: currentUser.userId },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Đã kết nối tới Socket.IO server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Kết nối tới Socket.io server lỗi', error);
      alert('Không thể kết nối tới server chat, vui lòng thử lại sau');
    });

    socketRef.current.on('error', (error) => {
      console.error('Lỗi từ server:', error.message);
      alert(error.message);
    });

    socketRef.current.on(`receiveMessage_${currentUser.userId}`, (message) => {
      if (
        selectedUser &&
        ((message.senderId === currentUser.userId && message.receiverId === selectedUser.userId) ||
         (message.senderId === selectedUser.userId && message.receiverId === currentUser.userId))
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      } else {
        // Lưu tin nhắn vào pendingMessages nếu chưa có selectedUser
        setPendingMessages((prev) => [...prev, message]);
      }
      fetchConversations();
    });

    fetchConversations();

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(`receiveMessage_${currentUser.userId}`);
      console.log('Disconnected from Socket.IO server');
    };
  }, [currentUser]);

  useEffect(() => {
    if (!selectedUser) return;
  
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/chat/messages/${selectedUser.userId}`,{
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
        }
     
        
        const data = await response.json();
        // Kết hợp tin nhắn từ API và pendingMessages
        const newMessages = [...data, ...pendingMessages.filter(
          (msg) =>
            (msg.senderId === selectedUser.userId && msg.receiverId === currentUser.userId) ||
            (msg.senderId === currentUser.userId && msg.receiverId === selectedUser.userId)
        )];
        // Sắp xếp lại tin nhắn theo thời gian
        newMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(newMessages);

        // Đánh dấu tin nhắn là đã đọc
        const conversationId = [currentUser.userId, selectedUser.userId].sort().join('#');
        // Gọi hàm đánh dấu tin nhắn là đã đọc
        await markMessagesAsRead(conversationId);

        // Xóa các tin nhắn đã hiển thị khỏi pendingMessages
        setPendingMessages((prev) =>
          prev.filter(
            (msg) =>
              !(
                (msg.senderId === selectedUser.userId && msg.receiverId === currentUser.userId) ||
                (msg.senderId === currentUser.userId && msg.receiverId === selectedUser.userId)
              )
          )
        );
      } catch (error) {
        console.error('Lỗi khi lấy danh sách tin nhắn:', error);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentUser || !selectedUser) {
      alert('Vui lòng đăng nhập và chọn người nhận trước khi gửi tin nhắn');
      return;
    }

    if (messageInput.trim() === '') {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          senderId: currentUser.userId,
          receiverId: selectedUser.userId,
          content: messageInput,
          type: 'text',
          fileUrl: null,
          isRead: false,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
      }
      setMessageInput('');
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      alert('Không thể gửi tin nhắn, vui lòng thử lại');
    }
  };

  const menu = (
    <Menu>
      <Menu.Item key="1">
        <ModalProfile userProfile={userProfile} avatarContext={avatar} setAvatarContext={setAvatar} />
      </Menu.Item>
      <Menu.Item key="2">
        <ModalForgetPassword />
      </Menu.Item>
      <Menu.Item key="3" icon={<LogoutOutlined style={{ fontSize: 20 }} />} onClick={handleLogout} style={{ marginTop: 10 }}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={350} style={{ background: '#fff', borderRight: '1px solid #e8e8e8' }}>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e8e8e8' }}>
          <Dropdown overlay={menu} trigger={['click']}>
            <Avatar src={avatar} style={{ cursor: 'pointer', marginRight: '20px' }} />
          </Dropdown>
          <Button type="text" icon={<SearchOutlined style={{ fontSize: '20px' }} />} />
          <Button type="text" icon={<MessageOutlined style={{ fontSize: '20px' }} />} />
          <Button type="text" icon={<TeamOutlined style={{ fontSize: '20px' }} />} />
          <Button type="text" icon={<UserOutlined style={{ fontSize: '20px' }} />} />
          <Button type="text" icon={<SettingOutlined style={{ fontSize: '20px' }} />} onClick={handleLogout} />
        </div>
        <List
          itemLayout="horizontal"
          dataSource={listConversation}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e8e8e8',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedUser(item)}
            >
              <List.Item.Meta
                style={{ padding: '0 10px' }}
                avatar={<Avatar src={item.avatarUrl} />}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.username}</span>
                    <span style={{ color: '#888', fontSize: '12px' }}>{new Date(item.time).toLocaleTimeString()}</span>
                  </div>
                }
                description={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text ellipsis style={{ color: '#888' }}>
                      {item.lastMessage}
                    </Text>
                    {item.unread > 0 && (
                      <Badge count={item.unread} style={{ backgroundColor: '#0068FF' }} />
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Sider>
      <Content style={{ padding: '20px', background: '#f0f2f5' , maxHeight: '100vh'}}>
        {selectedUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div
              style={{
                padding: '10px 20px',
                borderBottom: '1px solid #e8e8e8',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Avatar src={selectedUser.avatarUrl || 'https://randomuser.me/api/portraits/men/1.jpg'} />
              <Title level={4} style={{ margin: '0 10px' }}>
                {selectedUser.username}
              </Title>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                background: '#f0f2f5',
              }}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: msg.senderId === userProfile.userId ? 'flex-end' : 'flex-start',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '60%',
                      padding: '10px',
                      borderRadius: '10px',
                      background: msg.senderId === userProfile.userId ? '#0068FF' : '#fff',
                      color: msg.senderId === userProfile.userId ? '#fff' : '#000',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {msg.type === 'text' ? (
                      <Text>{msg.content}</Text>
                    ) : (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                        {msg.fileUrl.split('/').pop()}
                      </a>
                    )}
                    <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7 }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '10px', background: '#fff', borderTop: '1px solid #e8e8e8' }}>
              <Row gutter={8} align="middle">
                <Col>
                  {/* <Upload beforeUpload={handleUpload} showUploadList={false}>
                    <Button icon={<UploadOutlined />} />
                  </Upload> */}
                </Col>
                <Col flex="auto">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    onPressEnter={handleSendMessage}
                  />
                </Col>
                <Col>
                  <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage} />
                </Col>
              </Row>
            </div>
          </div>
        ) : (
          <Row justify="center" align="middle" style={{ textAlign: 'center' }}>
            <Col>
              <Title level={3}>Chào mừng đến với Zalo !</Title>
              <Text style={{ display: 'block', marginBottom: 16 }}>
                Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng <br />
                người thân, bạn bè được tối ưu hóa cho máy tính của bạn.
              </Text>
              <img
                src="https://chat.zalo.me/assets/quick-message-onboard.3950179c175f636e91e3169b65d1b3e2.png"
                alt="Welcome to Zalo "
                style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}
              />
              <Title level={4}>Nhắn tin nhiều hơn soạn thảo ít hơn</Title>
              <Text style={{ display: 'block', marginBottom: 16 }}>
                Sử dụng tin nhắn nhanh để gửi tin nhắn mà không cần mở cửa sổ chat
              </Text>
            </Col>
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default HomeChat;