import React, { useState, useEffect } from 'react';
import { Modal, List, Avatar, Button, Divider, Empty, message, Typography, Spin } from 'antd';
import { UserAddOutlined, UserDeleteOutlined, MessageOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ListFriendModal = ({ visible, onCancel, userProfile, setSelectedUser, socket }) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách lời mời kết bạn và bạn bè
  const fetchData = async () => {
    if (!userProfile?.userId) return;
    setLoading(true);
    try {
      // Lấy lời mời kết bạn
      const requestResponse = await fetch('http://localhost:5000/api/friend/requests/received', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!requestResponse.ok) throw new Error('Lỗi khi lấy lời mời kết bạn');
      const requestData = await requestResponse.json();
      console.log('Data fetched (requests):', requestData);
      setFriendRequests(requestData.requests || []);

      // Lấy danh sách bạn bè
      const friendResponse = await fetch('http://localhost:5000/api/friend/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!friendResponse.ok) throw new Error('Lỗi khi lấy danh sách bạn bè');
      const friendData = await friendResponse.json();
      console.log('Friend data from API:', friendData);
      setFriends(friendData.friends || []);
    } catch (error) {
      console.error('Lỗi:', error);
      message.error('Không thể tải dữ liệu, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && userProfile?.userId && socket) {
      fetchData();
    } else if (!visible) {
      setFriendRequests([]);
      setFriends([]);
      setLoading(false);
    }
  }, [visible, userProfile, socket]);

  useEffect(() => {
    if (!socket || !userProfile?.userId) return;

    console.log(`Listening for receiveFriendRequest_${userProfile.userId}`); // Log khi bắt đầu lắng nghe

    const handleReceiveFriendRequest = (request) => {
      console.log('--- HANDLE RECEIVE FRIEND REQUEST CALLED ---');
      console.log('Nhận lời mời kết bạn (Socket):', request);
      setFriendRequests((prev) => {
        if (prev.some((req) => req.requestId === request.requestId)) {
          return prev;
        }
        return [
          ...prev,
          {
            requestId: request.requestId,
            userId: request.senderId,
            username: request.senderUsername,
            email: request.senderEmail,
            avatarUrl: request.senderAvatarUrl,
            createdAt: request.createdAt,
          },
        ];
      });
      message.success(`Bạn nhận được lời mời kết bạn từ ${request.senderUsername}`);
    };

    socket.on(`receiveFriendRequest_${userProfile.userId}`, handleReceiveFriendRequest);

    return () => {
      console.log('Cleaning up receiveFriendRequest listener.'); // Log khi ngừng lắng nghe
      socket.off(`receiveFriendRequest_${userProfile.userId}`, handleReceiveFriendRequest);
    };
  }, [socket, userProfile?.userId]);

  const handleAccept = async (request) => {
    try {
      const response = await fetch('http://localhost:5000/api/friend/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ requestId: request.requestId }),
      });
      if (!response.ok) throw new Error('Lỗi khi chấp nhận lời mời');
      message.success(`Đã chấp nhận lời mời từ ${request.fromUsername}`);
      setFriendRequests((prev) => prev.filter((req) => req.requestId !== request.requestId));
      fetchData(); // Gọi lại fetchData để cập nhật danh sách bạn bè
    } catch (error) {
      console.error('Lỗi:', error);
      message.error('Không thể chấp nhận lời mời, vui lòng thử lại');
    }
  };

  const handleReject = async (request) => {
    try {
      const response = await fetch('http://localhost:5000/api/friend/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ requestId: request.requestId }),
      });
      if (!response.ok) throw new Error('Lỗi khi từ chối lời mời');
      message.success(`Đã từ chối lời mời từ ${request.fromUsername}`);
      setFriendRequests((prev) => prev.filter((req) => req.requestId !== request.requestId));
    } catch (error) {
      console.error('Lỗi:', error);
      message.error('Không thể từ chối lời mời, vui lòng thử lại');
    }
  };

  const handleRemoveFriend = (friend) => {
    Modal.confirm({
      title: 'Xóa bạn',
      content: `Bạn có chắc chắn muốn xóa ${friend.username} khỏi danh sách bạn bè?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await fetch('http://localhost:5000/api/friend/remove', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ email: friend.email }),
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

  const handleMessage = (friend) => {
    setSelectedUser(friend);
    onCancel();
  };

  return (
    <Modal
      title="Danh sách bạn bè"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
    >
      {loading ? (
        <Spin tip="Đang tải dữ liệu..." />
      ) : (
        <>
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
                    avatar={<Avatar src={request.fromAvatar || 'https://randomuser.me/api/portraits/men/1.jpg'} />}
                    title={request.fromUsername}
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
                    <Button danger icon={<UserDeleteOutlined />} onClick={() => handleRemoveFriend(friend)}>
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
        </>
      )}
    </Modal>
  );
};

export default ListFriendModal;