import React, { useEffect, useState } from "react";
import { Modal, List, Avatar, Button, message, Checkbox, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

const GroupAddMember = ({ visible, onCancel, groupId, currentUser, socket, onMemberAdded }) => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách bạn bè
  const fetchFriends = async () => {
    if (!currentUser) {
      console.error("Không có currentUser:", currentUser);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token, vui lòng đăng nhập lại");
      }
      const response = await fetch(`http://localhost:5000/api/friend/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const friendList = Array.isArray(data.friends) ? data.friends : [];
      console.log("Danh sách bạn bè từ API:", data);
      console.log("friendList:", friendList);
      setFriends(friendList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bạn bè:", error);
      message.error("Không thể tải danh sách bạn bè, vui lòng thử lại");
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchFriends();
    }
  }, [visible, currentUser]);

  const handleSelectFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleAddMembers = () => {
    if (!socket || !currentUser || selectedFriends.length === 0) {
      message.error("Vui lòng chọn ít nhất một bạn bè để thêm");
      return;
    }

    selectedFriends.forEach((friendId) => {
      const friend = friends.find((f) => f.userId === friendId);
      if (!friend) {
        message.error(`Không tìm thấy thông tin bạn bè với ID ${friendId}`);
        return;
      }
      socket.emit(
        "group:join",
        {
          groupId,
          userEmail: friend.email,
          addedBy: currentUser.userId,
        },
        (response) => {
          if (response.error) {
            console.error("Lỗi khi thêm thành viên:", response.error);
            message.error(response.error.message || "Không thể thêm thành viên");
          } else {
            message.success(`Đã thêm ${response.userEmail} vào nhóm`);
            onMemberAdded();
          }
        }
      );
    });
    setSelectedFriends([]);
    onCancel();
  };

  return (
    <Modal
      title="Thêm thành viên vào nhóm"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleAddMembers}
          disabled={selectedFriends.length === 0 || loading}
        >
          Thêm
        </Button>,
      ]}
      width={500}
      style={{ top: 20 }}
    >
      <style jsx>{`
        .friend-list {
          max-height: 400px;
          overflow-y: auto;
          padding: 0 8px;
        }
        .friend-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          margin: 8px 0;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        .friend-item:hover {
          background-color: #f5f5f5;
        }
        .friend-item .ant-checkbox-wrapper {
          margin-right: 12px;
        }
        .friend-item .ant-avatar {
          flex-shrink: 0;
        }
        .friend-info {
          flex: 1;
          margin-left: 12px;
          overflow: hidden;
        }
        .friend-name {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .friend-email {
          font-size: 12px;
          color: #888;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .no-friends {
          text-align: center;
          padding: 24px;
          color: #888;
        }
        .loading {
          text-align: center;
          padding: 24px;
        }
      `}</style>
      {loading ? (
        <div className="loading">
          <Text>Đang tải...</Text>
        </div>
      ) : friends.length === 0 ? (
        <div className="no-friends">
          <Text>Không có bạn bè nào để hiển thị</Text>
        </div>
      ) : (
        <div className="friend-list">
          <List
            dataSource={Array.isArray(friends) ? friends : []}
            renderItem={(friend) => (
              <div className="friend-item">
                <Checkbox
                  checked={selectedFriends.includes(friend.userId)}
                  onChange={() => handleSelectFriend(friend.userId)}
                />
                <Avatar
                  size={40}
                  icon={<UserOutlined />}
                  src={friend.avatarUrl}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <div className="friend-info">
                  <div className="friend-name">{friend.username || friend.email}</div>
                  <div className="friend-email">{friend.email}</div>
                </div>
              </div>
            )}
          />
        </div>
      )}
    </Modal>
  );
};

export default GroupAddMember;
