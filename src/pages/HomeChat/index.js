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
import EmojiPicker from 'emoji-picker-react'; // Thêm thư viện emoji
import SearchUserModel from '../../components/SearchUserModel/index.js';
import ListFriendModal from '../../components/ListFriendModal/index.js';
const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const HomeChat = ({ setIsAuthenticated, userProfile, avatar, setAvatar }) => {
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user'))); // Lấy thông tin người dùng từ localStorage
  const [listConversation, setListConversation] = useState([]); // Danh sách cuộc trò chuyện của người dùng
  const [selectedUser, setSelectedUser] = useState(null); // Người dùng được chọn
  const [messages, setMessages] = useState([]); // Danh sách tin nhắn 
  const [messageInput, setMessageInput] = useState('');// Nội dung tin nhắn đang nhập
  const socketRef = useRef(null); // Tham chiếu đến socket
  const messagesEndRef = useRef(null); // Tham chiếu đến cuối danh sách tin nhắn
  const [pendingMessages, setPendingMessages] = useState([]); // Lưu trữ tin nhắn đến khi chưa có selectedUser
  const [loading, setLoading] = useState(false); // Trạng thái tải lên file
  const [fileList, setFileList] = useState([]); // Danh sách file đã chọn
  const [isDeleting, setIsDeleting] = useState(false);

  // Memoize deletedMessages để tránh đọc localStorage nhiều lần
  const deletedMessages = useMemo(() => {
    return JSON.parse(localStorage.getItem('deletedMessages') || '[]');
  }, [messages]); // Cập nhật khi messages thay đổi (do xóa mới)

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
    socketRef.current.disconnect(); // Ngắt kết nối socket khi đăng xuất

    setIsAuthenticated(false);
    window.location.href = '/';
  };
  // Xử lý chọn emoji
  const handleEmojiClick = (emojiObject) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
  };
  // Xử lý khi thay đổi file
  const handleUploadChange = ({ fileList }) => {
    // Giới hạn chỉ chọn 1 file
    const filteredFileList = fileList.slice(-1).filter((file) => {
      // Kiểm tra trạng thái file
      if (file.status === 'error') {
        message.error(`${file.name} tải lên thất bại.`);
        return false;
      }
      return true;
    });
    setFileList(filteredFileList);
  };

  // Xử lý trước khi upload (chặn upload tự động)
  const handleBeforeUpload = (file) => {
    // Kiểm tra kích thước file (ví dụ: tối đa 5MB)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File phải nhỏ hơn 5MB!');
      return false;
    }
    // Trả về false để chặn upload tự động
    return false;
  }
   // Duy
  // lấy danh sách cuộc trò chuyện của người dùng hiện tại và người dùng đã chọn
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

  // hàm tạo kết nối socket
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
    socketRef.current.on('disconnect', (reason) => {
      console.warn('Socket.IO ngắt kết nối:', reason);
      if (reason === 'io server disconnect') {
        // Server chủ động ngắt, thử kết nối lại
        socketRef.current.connect();
      }
    });
    socketRef.current.on('error', (error) => {
      console.error('Lỗi từ server:', error.message);
      alert(error.message);
    });

    socketRef.current.on(`receiveMessage_${currentUser.userId}`, (message) => {
      // Kiểm tra định dạng tin nhắn
      if (!message || !message.conversationId || !message.senderId || !message.timestamp) {
        console.error('Tin nhắn không hợp lệ:', message);
        return;
      }
      // Tạo conversationId từ selectedUser 
      const currentConversationId = (selectedUser ? [currentUser.userId, selectedUser.userId].sort().join('#') : null);
      if (message.conversationId === currentConversationId &&
        message.senderId !== currentUser.userId &&
        message.senderId === selectedUser.userId &&
        message.receiverId === currentUser.userId) {

        // Thêm tin nhắn vào messages, tránh trùng lặp
        setMessages((prevMessages) => {
          if (prevMessages.some((msg) => msg.timestamp === message.timestamp && msg.content === message.content)) {
            return prevMessages; // Tránh trùng lặp
          }
          const newMessages = [...prevMessages, message];
          return newMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });

        // Đánh dấu tin nhắn là đã đọc
        const conversationId = [currentUser.userId, selectedUser.userId].sort().join('#');
        markMessagesAsRead(conversationId).catch((error) => {
          console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
        });

      }

      else {
        // Lưu tin nhắn vào pendingMessages, tránh trùng lặp
        setPendingMessages((prev) => {
          return [...prev, message];
        });
      }
      // Cập nhật danh sách cuộc trò chuyện
      fetchConversations();
    });

    fetchConversations();


    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(`receiveMessage_${currentUser.userId}`);
        console.log('Mất kết nối tới Socket.IO server');
      }
    };
  }, [currentUser]);

  // hàm gọi API để lấy danh sách tin nhắn khi người dùng chọn cuộc trò chuyện
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

        // Kết hợp tin nhắn từ API và pendingMessages, tránh trùng lặp
        const newMessages = [...data, ...pendingMessages.filter(
          (msg) =>
            (msg.senderId === selectedUser.userId && msg.receiverId === currentUser.userId) ||
            (msg.senderId === currentUser.userId && msg.receiverId === selectedUser.userId)
        )].reduce((acc, msg) => {
          if (
            !acc.some(
              (existing) =>
                existing.timestamp === msg.timestamp
            )
          ) {
            acc.push(msg);
          }
          return acc;
        }, []);

        // Sắp xếp tin nhắn theo timestamp
        newMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(newMessages);

        // Đánh dấu tin nhắn là đã đọc
        const conversationId = [currentUser.userId, selectedUser.userId].sort().join('#');
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
        alert('Không thể tải tin nhắn, vui lòng thử lại');
      }
    };

    fetchMessages();



  }, [selectedUser]);

  //cuộn xuống cuối danh sách tin nhắn khi có tin nhắn mới
  useEffect(() => {
    if ( !isDeleting && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages , isDeleting]);

  // hàm gửi tin nhắn 
  const handleSendMessage = async () => {
    if (!currentUser || !selectedUser) {
      alert('Vui lòng đăng nhập và chọn người nhận trước khi gửi tin nhắn');
      return;
    }
    // tạo formData để gửi tin nhắn
    const formData = new FormData();
    formData.append('senderId', currentUser.userId);
    formData.append('receiverId', selectedUser.userId);
    formData.append('content', messageInput);
    formData.append('type', fileList.length > 0 ? 'file' : 'text');
    formData.append('isRead', false);
    formData.append('timestamp', new Date().toISOString());
    // Thêm file nếu có
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('file', fileList[0].originFileObj);
    }
    // Tạo một đối tượng tin nhắn mới và thêm vào danh sách tin nhắn cục bộ
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
      // Lấy tin nhắn từ phản hồi server
      const savedMessage = await response.json();
      // Cập nhật tin nhắn cục bộ với dữ liệu từ server
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
      setMessageInput(''); // Xóa nội dung ô nhập sau khi gửi tin nhắn
      setFileList([]); // Xóa danh sách file đã chọn sau khi gửi tin nhắn
      fetchConversations(); // Cập nhật danh sách cuộc trò chuyện sau khi gửi tin nhắn
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

  // Nội dung của EmojiPicker
  const emojiPickerContent = (
    <EmojiPicker onEmojiClick={handleEmojiClick} />
  );
  // Xử lý xóa tin nhắn cục bộ 
  const handleDeleteMessage = (msg) => {
    Modal.confirm({
      title: 'Xóa tin nhắn',
      content: 'Bạn có chắc chắn muốn xóa tin nhắn này? Hành động này chỉ xóa tin nhắn trên thiết bị của bạn.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setIsDeleting(!isDeleting); // Đánh dấu trạng thái xóa tin nhắn
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.messageId === msg.messageId
              ? { ...message, content: 'Tin nhắn đã xóa', isDeleted: true }
              : message
          )
        );
           // Lưu tin nhắn đã xóa vào localStorage
           const deletedMessages = JSON.parse(localStorage.getItem('deletedMessages')) || [];
           localStorage.setItem(
             'deletedMessages',
             JSON.stringify([
               ...deletedMessages,
               msg
             ])
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

          <SearchUserModel style={{ fontSize: '20px' }} setSelectedUser={setSelectedUser} />
          <ListFriendModal style={{ fontSize: '20px' }} /> 
     
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
            {/* Danh sách tin nhắn */}
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
                      <div style={{ color: '#000', cursor: 'pointer', marginTop: '5px', textAlign: 'right', opaci: 0.5 }}>
                      <DeleteOutlined onClick={() => { handleDeleteMessage(msg) }} />
                    </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>


            {/* Phần gửi tin nhắn : textinput và button */}
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