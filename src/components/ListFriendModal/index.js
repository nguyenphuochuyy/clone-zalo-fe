import React, { useState, useEffect } from 'react';
import { Modal, List, Avatar, Button, Divider, Empty, message, Typography, Spin } from 'antd';
import { UserAddOutlined, UserDeleteOutlined, MessageOutlined, SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ListFriendModal = ({ visible, onCancel, userProfile, setSelectedUser }) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
      setIsModalOpen(true);
  };

  const handleOk = async () => {

  };
  const handleCancel = () => {
      setIsModalOpen(false);
  };
  // Lấy danh sách lời mời kết bạn và bạn bè
  const fetchData = async () => {
    if (!userProfile?.userId) return;
    setLoading(true);
    try {
      // Lấy lời mời kết bạn
      const requestResponse = await fetch('http://localhost:5000/api/user/friend-requests', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!requestResponse.ok) throw new Error('Lỗi khi lấy lời mời kết bạn');
      const requestData = await requestResponse.json();
      setFriendRequests(requestData);

      // Lấy danh sách bạn bè
      const friendResponse = await fetch('http://localhost:5000/api/user/friends', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!friendResponse.ok) throw new Error('Lỗi khi lấy danh sách bạn bè');
      const friendData = await friendResponse.json();
      setFriends(friendData);
    } catch (error) {
      console.error('Lỗi:', error);
      message.error('Không thể tải dữ liệu, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   if (visible) {
  //     fetchData();
  //   }
  // }, [visible, userProfile]);

  // Chấp nhận lời mời kết bạn
  const handleAccept = async (request) => {
    try {
      const response = await fetch('http://localhost:5000/api/user/accept-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ requesterId: request.userId }),
      });
      if (!response.ok) throw new Error('Lỗi khi chấp nhận lời mời');
      message.success(`Đã chấp nhận lời mời từ ${request.username}`);
      setFriendRequests((prev) => prev.filter((req) => req.userId !== request.userId));
      setFriends((prev) => [...prev, request]);
    } catch (error) {
      console.error('Lỗi:', error);
      message.error('Không thể chấp nhận lời mời, vui lòng thử lại');
    }
  };

  // Từ chối lời mời kết bạn
  const handleReject = async (request) => {
    try {
      const response = await fetch('http://localhost:5000/api/user/reject-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ requesterId: request.userId }),
      });
      if (!response.ok) throw new Error('Lỗi khi từ chối lời mời');
      message.success(`Đã từ chối lời mời từ ${request.username}`);
      setFriendRequests((prev) => prev.filter((req) => req.userId !== request.userId));
    } catch (error) {
      console.error('Lỗi:', error);
      message.error('Không thể từ chối lời mời, vui lòng thử lại');
    }
  };

  // Xóa bạn
  const handleRemoveFriend = (friend) => {
    Modal.confirm({
      title: 'Xóa bạn',
      content: `Bạn có chắc chắn muốn xóa ${friend.username} khỏi danh sách bạn bè?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await fetch('http://localhost:5000/api/user/remove-friend', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ friendId: friend.userId }),
          });
          if (!response.ok) throw new Error('Lỗi khi xóa bạn');
          message.success(`Đã xóa ${friend.username} khỏi danh sách bạn bè`);
          setFriends((prev) => prev.filter((f) => f.userId !== friend.userId));
        } catch (error) {
          console.error('Lỗi:', error);
          message.error('Không thể xóa bạn, vui lòng thử lại');
        }
      },
    });
  };

  // Nhắn tin
  const handleMessage = (friend) => {
    setSelectedUser(friend);
    onCancel(); // Đóng modal sau khi chọn nhắn tin
  };

  return (
    <>
   
   <Button type="text" onClick={showModal} icon={<SearchOutlined />}>
              </Button>
     <Modal

      title="Danh sách bạn bè"
      visible={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      open={isModalOpen} 
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
    >
     
        {/* Phần danh sách lời mời kết bạn */}
        <Typography.Title level={5}>Danh sách lời mời kết bạn</Typography.Title>
        {friendRequests.length > 0 ? (
          <List
            dataSource={friendRequests}
            renderItem={(request) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => handleAccept(request)}
                    style={{ marginRight: 8 }}
                  >
                    Chấp nhận
                  </Button>,
                  <Button
                    icon={<UserDeleteOutlined />}
                    onClick={() => handleReject(request)}
                    style={{ background: '#f0f0f0', borderColor: '#d9d9d9' }}
                  >
                    Từ chối
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={request.avatarUrl || 'https://randomuser.me/api/portraits/men/1.jpg'} />}
                  title={request.username}
                  description={<Text type="secondary">Đã gửi lời mời kết bạn</Text>}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description="Hiện tại chưa có lời mời kết bạn nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: '20px 0' }}
          />
        )}

        <Divider />

        {/* Phần danh sách bạn bè */}
        <Typography.Title level={5}>Danh sách bạn bè</Typography.Title>
        {friends.length > 0 ? (
          <List
            dataSource={friends}
            renderItem={(friend) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    icon={<MessageOutlined />}
                    onClick={() => handleMessage(friend)}
                    style={{ marginRight: 8 }}
                  >
                    Nhắn tin
                  </Button>,
                  <Button
                    danger
                    icon={<UserDeleteOutlined />}
                    onClick={() => handleRemoveFriend(friend)}
                  >
                    Xóa bạn
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={friend.avatarUrl || 'https://randomuser.me/api/portraits/men/1.jpg'} />}
                  title={friend.username}
                  description={<Text type="secondary">Bạn bè</Text>}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description="Hiện tại chưa có bạn bè nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: '20px 0' }}
          />
        )}
 
    </Modal>
    </>
   
  );
};

export default ListFriendModal;