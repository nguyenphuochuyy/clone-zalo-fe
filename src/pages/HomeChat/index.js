import React, { useEffect, useState } from 'react';
import { Layout, List, Avatar, Badge, Typography, Button, Row, Col, Dropdown, Menu } from 'antd';
import {
  SearchOutlined,
  MessageOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  MoonOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import ModalProfile from '../../components/ModalProfile';
// import './HomeChat.css';
const { Sider, Content } = Layout;
const { Title, Text } = Typography;
// Dữ liệu giả lập cho danh sách cuộc trò chuyện
const chatData = [
  {
    id: 1,
    name: 'Quốc Anh',
    message: '["version":"2012-10-17","statement"]...',
    time: '1 giờ',
    unread: 1,
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 2,
    name: 'Công nghệ mới. Nhóm 08',
    message: 'Quốc Anh: Ok rồi chia nhóm ra làm nha',
    time: '2 giờ',
    unread: 5,
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: 3,
    name: 'Khôi',
    message: 'mai học môn gì ?',
    time: '2 giờ',
    unread: 0,
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
  },
  {
    id: 4,
    name: 'Hữu Duy',
    message: 'ahaha',
    time: '3 giờ',
    unread: 0,
    avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
  },
  {
    id: 5,
    name: 'Hiếu',
    message: 'mai ba giờ nha',
    time: '4 giờ',
    unread: 0,
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
  }

];

const HomeChat = ({ setIsAuthenticated , userProfile , avatar , setAvatar}) => {
const [profile, setProfile] = useState(userProfile); // Trạng thái thông tin người dùng
    // Hàm xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token'); // Xóa token
    setIsAuthenticated(false); // Cập nhật trạng thái xác thực
    window.location.href = '/'; // Chuyển hướng về trang chủ
  };
  console.log(profile);
  
  // Hàm xử lý chuyển hướng đến trang quản lý tài khoản
  const handleManageAccount = () => {
    // render modal quản lý tài khoản
    

  };
  // Menu cho Dropdown
  const menu = (
  <Menu>
    {/* Quản lý tài khoản */}
    <Menu.Item key="1" >
      <ModalProfile handleManageAccount = {handleManageAccount()} userProfile={userProfile} avatarContext = {avatar} setAvatarContext = {setAvatar} />
    </Menu.Item>

    <Menu.Item key="2" icon={<LogoutOutlined />} onClick={handleLogout}>
      Đăng xuất
    </Menu.Item>
  </Menu>
);
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar bên trái */}
      <Sider width={300} style={{ background: '#fff', borderRight: '1px solid #e8e8e8' }}>
        {/* Header của sidebar */}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e8e8e8', }}>
        <Dropdown overlay={menu} trigger={['click']}>
            <Avatar
              src={avatar}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
          {/* <Title level={5} style={{ margin: '0 0 0 8px', flex: 1 }}>
            Tất cả
          </Title> */}
          <Button type="text" icon={<SearchOutlined />} />
          <Button type="text" icon={<MessageOutlined />} />
          <Button type="text" icon={<TeamOutlined />} />
          <Button type="text" icon={<UserOutlined />} />
          <Button type="text" icon={<SettingOutlined />} onClick={handleLogout} />
        </div>
        {/* Danh sách cuộc trò chuyện */}
            <List
          itemLayout="horizontal"
          dataSource={chatData}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e8e8e8',
                cursor: 'pointer',
              }}
            >
              <List.Item.Meta
                style={{ padding: '0 10px' }}
                avatar={<Avatar src={item.avatar} />}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.name}</span>
                    <span style={{ color: '#888', fontSize: '12px' }}>{item.time}</span>
                  </div>
                }
                description={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text ellipsis style={{ color: '#888' }}>
                      {item.message}
                    </Text>
                    {item.unread > 0 && (
                      <Badge
                        count={item.unread}
                        style={{ backgroundColor: '#0068FF' }}
                      />
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />

      
      </Sider>

      {/*slider bên phải */}
      <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Row justify="center" align="middle" style={{ textAlign: 'center' }}>
          <Col>
            <Title level={3}>Chào mừng đến với Zalo PC!</Title>
            <Text style={{ display: 'block', marginBottom: 16 }}>
              Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng <br />
              người thân, bạn bè được tối ưu hóa cho máy tính của bạn.
            </Text>
            <img
              src="https://chat.zalo.me/assets/welcome.1f90950d04c1c750e7b8e85a697f627.png"
              alt="Welcome to Zalo PC"
              style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}
            />
            <Title level={4}>Giao diện Dark Mode</Title>
            <Text style={{ display: 'block', marginBottom: 16 }}>
              Thử ngay và bắt vẻ một chế độ giao diện tối trên Zalo PC
            </Text>
            <Button type="primary" icon={<MoonOutlined />}>
              Thử ngay
            </Button>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default HomeChat;