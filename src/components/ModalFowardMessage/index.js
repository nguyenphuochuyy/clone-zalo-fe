import React, { useState, useEffect } from "react";
import {
  Modal,
  List,
  Avatar,
  Button,
  Divider,
  Empty,
  message,
  Typography,
  Spin,
} from "antd";
import {
  UserAddOutlined,
  UserDeleteOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { fetchForwardMessage } from "../../services/chatService";

const { Text } = Typography;

const ModalFowardMessage = ({
  fowardMessageVisible,
  setFowardMessageVisible,
  message,
  socket,
  currentUser,
}) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Lấy danh sách lời mời kết bạn và bạn bè
    const fetchData = async () => {
      try {
        // Lấy danh sách bạn bè
        const friendResponse = await fetch(
          "http://localhost:5000/api/friend/list",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!friendResponse.ok) throw new Error("Lỗi khi lấy danh sách bạn bè");
        const friendData = await friendResponse.json();
        setFriends(friendData.friends || []);
      } catch (error) {
        console.error("Lỗi:", error);
        message.error("Không thể tải dữ liệu, vui lòng thử lại");
      }
    };
    fetchData();
  }, []);

  const handleFowardMessage = async (friend) => {
    console.log(message);
    // const { messageId, senderId, targetId, targetType, content, type, fileUrl, timestamp, isForwarded, originalSenderId } = data;
    const data = {
      messageId: message.messageId,
      senderId: currentUser.userId,
      targetId: friend.userId,
      targetType: "user",
      content: message.content ? message.content : null,
      type: message.type,
      fileUrl: message.fileUrl ? message.fileUrl : null,
      timestamp:  new Date().toISOString(),
      isForwarded: true,
      originalSenderId: currentUser.userId,
    };
    socket.emit("forwardMessage", data);
    setFowardMessageVisible(false);
  };

  return (
    <Modal
      title="Danh sách bạn bè"
      open={fowardMessageVisible}
      onCancel={setFowardMessageVisible}
      footer={null}
      width={600}
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
    >
      <>
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
                    onClick={() => handleFowardMessage(friend)}
                    style={{ marginRight: 8 }}
                  >
                    Chuyển tiếp
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={
                        friend.avatarUrl ||
                        "https://randomuser.me/api/portraits/men/1.jpg"
                      }
                    />
                  }
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
            style={{ margin: "20px 0" }}
          />
        )}
      </>
    </Modal>
  );
};

export default ModalFowardMessage;
