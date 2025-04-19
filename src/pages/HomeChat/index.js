import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layout, List, Avatar, Badge, Typography, Button, Row, Col, Dropdown, Menu, Upload, Input, message, Popover, Modal } from 'antd';
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
  SmileOutlined,
  MoreOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { TbLockPassword } from 'react-icons/tb';
import { Navigate } from 'react-router-dom';
import ModalProfile from '../../components/ModalProfile';
import ModalForgetPassword from '../../components/ModalResetPassword';
import io from 'socket.io-client';
import { notification } from 'antd';
import MessageContent from '../../components/MessageContent/index.js';
import EmojiPicker from 'emoji-picker-react';
import SearchUserModel from '../../components/SearchUserModel/index.js';
import ListFriendModal from '../../components/ListFriendModal/index.js';
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
  const [pendingMessages, setPendingMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false); // Thêm trạng thái kết nối
  const [isFriendListModalVisible, setIsFriendListModalVisible] = useState(false);

  const handleOpenFriendList = () => {
    setIsFriendListModalVisible(true);
    console.log('Opening Friend List Modal');
console.log('Current userProfile:', userProfile);
console.log('Current userProfile.userId:', userProfile?.userId);
console.log('Is socket connected:', isSocketConnected);
  };

  const handleCloseFriendList = () => {
    setIsFriendListModalVisible(false);
  };

  const handleCancelFriendListModal = () => {
    setIsFriendListModalVisible(false);
  };


  const deletedMessages = useMemo(() => {
    return JSON.parse(localStorage.getItem('deletedMessages') || '[]');
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('avt');
    setCurrentUser(null);
    setMessages([]);
    setSelectedUser(null);
    setPendingMessages([]);
    setListConversation([]);
    setMessageInput('');
    setFileList([]);
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const handleEmojiClick = (emojiObject) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
  };
  
  

  const handleUploadChange = ({ fileList }) => {
    const filteredFileList = fileList.slice(-1).filter((file) => {
      if (file.status === 'error') {
        message.error(`${file.name} tải lên thất bại.`);
        return false;
      }
      return true;
    });
    setFileList(filteredFileList);
  };

  const handleBeforeUpload = (file) => {
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File phải nhỏ hơn 5MB!');
      return false;
    }
    return false;
  };

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
      setListConversation(data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', error);
      message.error('Không thể tải danh sách cuộc trò chuyện, vui lòng thử lại');
    }
  };

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
    if (!currentUser) {
      console.log('Không có currentUser, bỏ qua khởi tạo Socket.IO');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Không có token, bỏ qua khởi tạo Socket.IO');
      message.error('Token không hợp lệ, vui lòng đăng nhập lại');
      return;
    }

    console.log('Khởi tạo Socket.IO với userId:', currentUser.userId);
    socketRef.current = io('http://localhost:5000', {
      auth: { token, userId: currentUser.userId },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Đã kết nối tới Socket.IO server, socket.id:', socketRef.current.id);
      setIsSocketConnected(true);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Kết nối tới Socket.IO server lỗi:', error.message);
      setIsSocketConnected(false);
      message.error('Không thể kết nối tới server chat, vui lòng thử lại sau');
    });

    socketRef.current.on('disconnect', (reason) => {
      console.warn('Socket.IO ngắt kết nối:', reason);
      setIsSocketConnected(false);
      if (reason === 'io server disconnect') {
        socketRef.current.connect();
      }
    });

    socketRef.current.on('error', (error) => {
      console.error('Lỗi từ server:', error.message);
      message.error(error.message);
    });

    socketRef.current.on(`receiveMessage_${currentUser.userId}`, (message) => {
      if (!message || !message.conversationId || !message.senderId || !message.timestamp) {
        console.error('Tin nhắn không hợp lệ:', message);
        return;
      }
      const currentConversationId = selectedUser ? [currentUser.userId, selectedUser.userId].sort().join('#') : null;
      if (
        message.conversationId === currentConversationId &&
        message.senderId !== currentUser.userId &&
        message.senderId === selectedUser.userId &&
        message.receiverId === currentUser.userId
      ) {
        setMessages((prevMessages) => {
          if (prevMessages.some((msg) => msg.timestamp === message.timestamp && msg.content === message.content)) {
            return prevMessages;
          }
          const newMessages = [...prevMessages, message];
          return newMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });

        const conversationId = [currentUser.userId, selectedUser.userId].sort().join('#');
        markMessagesAsRead(conversationId).catch((error) => {
          console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
        });
      } else {
        setPendingMessages((prev) => [...prev, message]);
      }
      fetchConversations();
    });

    fetchConversations();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(`receiveMessage_${currentUser.userId}`);
        console.log('Ngắt kết nối Socket.IO');
        setIsSocketConnected(false);
      }
    };
  }, [currentUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/chat/messages/${selectedUser.userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        const newMessages = [...data, ...pendingMessages.filter(
          (msg) =>
            (msg.senderId === selectedUser.userId && msg.receiverId === currentUser.userId) ||
            (msg.senderId === currentUser.userId && msg.receiverId === selectedUser.userId)
        )].reduce((acc, msg) => {
          if (!acc.some((existing) => existing.timestamp === msg.timestamp)) {
            acc.push(msg);
          }
          return acc;
        }, []);

        newMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(newMessages);

        const conversationId = [currentUser.userId, selectedUser.userId].sort().join('#');
        await markMessagesAsRead(conversationId);

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
        message.error('Không thể tải tin nhắn, vui lòng thử lại');
      }
    };

    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!isDeleting && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isDeleting]);

  const handleSendMessage = async () => {
    if (!currentUser || !selectedUser) {
      message.error('Vui lòng đăng nhập và chọn người nhận trước khi gửi tin nhắn');
      return;
    }
    const formData = new FormData();
    formData.append('senderId', currentUser.userId);
    formData.append('receiverId', selectedUser.userId);
    formData.append('content', messageInput);
    formData.append('type', fileList.length > 0 ? 'file' : 'text');
    formData.append('isRead', false);
    formData.append('timestamp', new Date().toISOString());
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('file', fileList[0].originFileObj);
    }
    const newMessage = {
      senderId: currentUser.userId,
      receiverId: selectedUser.userId,
      content: messageInput,
      type: fileList.length > 0 ? 'file' : 'text',
      fileUrl: fileList.length > 0 ? fileList[0].originFileObj : null,
      isRead: false,
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    try {
      const response = await fetch('http://localhost:5000/api/chat/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
      }
      const savedMessage = await response.json();
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.senderId === newMessage.senderId &&
          msg.receiverId === newMessage.receiverId &&
          msg.content === newMessage.content &&
          msg.timestamp === newMessage.timestamp
            ? { ...savedMessage }
            : msg
        )
      );
      setMessageInput('');
      setFileList([]);
      fetchConversations();
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      message.error('Không thể gửi tin nhắn, vui lòng thử lại');
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

  const emojiPickerContent = (
    <EmojiPicker onEmojiClick={handleEmojiClick} />
  );

  const handleDeleteMessage = (msg) => {
    Modal.confirm({
      title: 'Xóa tin nhắn',
      content: 'Bạn có chắc chắn muốn xóa tin nhắn này? Hành động này chỉ xóa tin nhắn trên thiết bị của bạn.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setIsDeleting(!isDeleting);
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.messageId === msg.messageId
              ? { ...message, content: 'Tin nhắn đã xóa', isDeleted: true }
              : message
          )
        );
        const deletedMessages = JSON.parse(localStorage.getItem('deletedMessages') || '[]');
        localStorage.setItem(
          'deletedMessages',
          JSON.stringify([...deletedMessages, msg])
        );
      },
    });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={350} style={{ background: '#fff', borderRight: '1px solid #e8e8e8' }}>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e8e8e8' }}>
          <Dropdown overlay={menu} trigger={['click']}>
            <Avatar src={avatar} style={{ cursor: 'pointer', marginRight: '20px' }} />
          </Dropdown>
          <SearchUserModel
            style={{ fontSize: '20px' }}
            setSelectedUser={setSelectedUser}
            userId={currentUser?.userId}
            socket={isSocketConnected ? socketRef.current : null} // Chỉ truyền socket khi đã kết nối
          />
          <ListFriendModal
  visible={isFriendListModalVisible} // Kiểm soát hiển thị bằng prop visible
  onCancel={handleCancelFriendListModal} // Sử dụng hàm đóng modal mới
  userProfile={userProfile}
  setSelectedUser={setSelectedUser}
  socket={isSocketConnected ? socketRef.current : null}
/>
<Button type="text" icon={<TeamOutlined style={{ fontSize: '20px' }} />} onClick={handleOpenFriendList} />
          {/* <Button type="text" icon={<TeamOutlined style={{ fontSize: '20px' }} />} /> */}
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
      <Content style={{ padding: '20px', background: '#f0f2f5', maxHeight: '100vh' }}>
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
              {messages.map((msg, index) =>
                deletedMessages.some((deletedMsg) => deletedMsg.messageId === msg.messageId) ? null : (
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
                        background: msg.senderId === userProfile.userId ? '#dbebff' : '#fff',
                        color: msg.senderId === userProfile.userId ? '#fff' : '#000',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                    >
                      {deletedMessages.some((deletedMsg) => deletedMsg.messageId === msg.messageId) ? (
                        <Text style={{ color: '#888' }}>Tin nhắn đã xóa</Text>
                      ) : (
                        <MessageContent msg={msg} />
                      )}
                      <div style={{ fontSize: '10px', marginTop: '5px', opacity: 1, color: '#000', textAlign: 'center' }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                      {deletedMessages.some((deletedMsg) => deletedMsg.messageId === msg.messageId) ? (
                        <></>
                      ) : (
                        <div style={{ color: '#000', cursor: 'pointer', marginTop: '5px', textAlign: 'right', opacity: 0.5 }}>
                          <DeleteOutlined onClick={() => handleDeleteMessage(msg)} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '10px', background: '#fff', borderTop: '1px solid #e8e8e8' }}>
              <Row gutter={8} align="middle">
                <Col>
                  <Upload
                    beforeUpload={handleBeforeUpload}
                    onChange={handleUploadChange}
                    showUploadList={true}
                    disabled={loading || !selectedUser}
                    fileList={fileList}
                    accept="image/*,video/*,.pdf"
                  >
                    <Button icon={<UploadOutlined />} loading={loading} disabled={loading || !selectedUser} />
                  </Upload>
                </Col>
                <Col>
                  <Popover content={emojiPickerContent} trigger="click">
                    <Button icon={<SmileOutlined />} disabled={loading || !selectedUser} />
                  </Popover>
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