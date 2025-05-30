import React, { useState } from 'react';
import { Avatar, Button, Form, Input, message, Modal } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const SearchUserModel = ({ setSelectedUser, userId, socket }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [form] = Form.useForm();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setEmail(values.email);
      await searchUserByEmail(values.email);
      form.resetFields();
    } catch (error) {
      message.error('Vui lòng nhập email hợp lệ');
    }
  };

  const handleCancel = () => {
    setEmail('');
    setUser(null);
    setIsModalOpen(false);
  };

  const handleSendMessage = () => {
    setIsModalOpen(false);
    setSelectedUser(user);
  };

  const handleAddFriend = () => {
    if (!socket) {
      message.error('Chưa khởi tạo kết nối với server, vui lòng thử lại sau');
      return;
    }

    if (!socket.connected) {
      message.error('Mất kết nối với server, vui lòng kiểm tra mạng hoặc thử lại sau');
      return;
    }

    if (!userId) {
      message.error('Không tìm thấy ID người dùng, vui lòng đăng nhập lại');
      return;
    }

    setLoading(true);
    socket.emit('sendFriendRequest', {
      senderId: userId,
      receiverEmail: email,
    });

    socket.once('friendRequestSent', (data) => {
      message.success(data.message);
      setLoading(false);
    });

    socket.once('error', (error) => {
      message.error(error.message);
      setLoading(false);
    });
  };

  const searchUserByEmail = async (email) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/search/${encodeURIComponent(email)}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Lỗi khi tìm kiếm người dùng');
      }
      const data = await response.json();
      if (data.userId) {
        const userResponse = await fetch(`http://localhost:5000/api/user/getUserById/${encodeURIComponent(data.userId)}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!userResponse.ok) {
          throw new Error('Lỗi khi lấy thông tin người dùng');
        }
        const userData = await userResponse.json();
        setUser(userData);
      } else {
        setUser(null);
        message.warning('Không tìm thấy người dùng');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      message.error(error.message);
    }
  };

  return (
    <>
      <Button type="text" onClick={showModal} icon={<SearchOutlined />} />
      <Modal title="Nhập email người dùng cần tìm" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <div>
          <Form
            form={form}
            name="searchUser"
            layout="vertical"
            initialValues={{ email: '' }}
            onFinish={handleOk}
          >
            <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }]}>
              <Input type="email" placeholder="Nhập email người dùng" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" onClick={handleOk} style={{ width: '100%' }}>
                Tìm kiếm
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div className="search-user-result">
          {user && (
            <div style={{ textAlign: 'center', padding: '20px 0', border: '1px solid #f0f0f0' }}>
              <Avatar
                size={80}
                src={user?.avatarUrl || "https://randomuser.me/api/portraits/men/1.jpg"}
                icon={!user?.avatarUrl && <UserOutlined />}
                style={{ marginBottom: 16 }}
              />
              <Title level={4} style={{ marginBottom: 8 }}>
                {user?.username || 'Người dùng'}
              </Title>
              <Text type="secondary">{user?.email || 'Không có email'}</Text>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
                <Button
                  onClick={handleAddFriend}
                  style={{ backgroundColor: '#f0f2f5', border: 'none' }}
                  loading={loading}
                >
                  Kết bạn
                </Button>
                <Button type="primary" onClick={handleSendMessage} style={{ backgroundColor: '#1890ff', border: 'none' }}>
                  Nhắn tin
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default SearchUserModel;