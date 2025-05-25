import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Layout,
  List,
  Avatar,
  Badge,
  Typography,
  Button,
  Row,
  Col,
  Dropdown,
  Menu,
  Upload,
  Input,
  message,
  Popover,
  Modal,
} from "antd";
import {
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
} from "@ant-design/icons";
import { TbLockPassword } from "react-icons/tb";
import { Navigate } from "react-router-dom";
import ModalProfile from "../../components/ModalProfile";
import ModalForgetPassword from "../../components/ModalResetPassword";
import io from "socket.io-client";
import { notification } from "antd";
import MessageContent from "../../components/MessageContent/index.js";
import EmojiPicker from "emoji-picker-react";
import SearchUserModel from "../../components/SearchUserModel/index.js";
import ListFriendModal from "../../components/ListFriendModal/index.js";
import "./HomeChat.css";
import {
  fetchGroupMessage,
  fetchListGroup,
  fetchRecallMessage,
} from "../../services/chatService.js";
import ModalFowardMessage from "../../components/ModalFowardMessage/index.js";
import ModalCreateGroup from "../../components/ModalCreateGroup/index.js";
import ModalListMemberOfGroup from "../../components/ModalListMemberOfGroup/index.js";
const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const HomeChat = ({ setIsAuthenticated, userProfile, avatar, setAvatar }) => {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  const [listConversation, setListConversation] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false); // Thêm trạng thái kết nối
  const [listGroupMessages, setListGroupMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [listMyGroup, setListMyGroup] = useState([]);
  const [isFriendListModalVisible, setIsFriendListModalVisible] =
    useState(false);
  const [isModalFowardVisible, setModalFowardVisible] = useState(false);
  const [fowardMessage, setFowardMessage] = useState(null);
  const [isCreateGroupModalVisible, setIsCreateGroupModalVisible] =
    useState(false);
  const [isListMemberOfGroupModalVisible, setIsListMemberOfGroupModalVisible] =
    useState(false);
  const handleOpenFriendList = () => {
    setIsFriendListModalVisible(true);
  };
  const handleCloseFriendList = () => {
    setIsFriendListModalVisible(false);
  };

  const handleCancelFriendListModal = () => {
    setIsFriendListModalVisible(false);
  };

  const deletedMessages = useMemo(() => {
    return JSON.parse(localStorage.getItem("deletedMessages") || "[]");
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("avt");
    setCurrentUser(null);
    setMessages([]);
    setSelectedUser(null);
    setPendingMessages([]);
    setListConversation([]);
    setMessageInput("");
    setFileList([]);
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setIsAuthenticated(false);
    window.location.href = "/";
  };

  const handleEmojiClick = (emojiObject) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
  };

  const handleUploadChange = ({ fileList }) => {
    const filteredFileList = fileList.slice(-1).filter((file) => {
      if (file.status === "error") {
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
      message.error("File phải nhỏ hơn 5MB!");
      return false;
    }
    return false; // Trả về false để không tự động tải lên
  };
  // hàm lấy danh sách các cuộc trò chuyện
  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/${currentUser.userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      // Lấy danh sách nhóm
      const groupResponse = await fetchListGroup();

      // Lấy tin nhắn mới nhất và số lượng chưa đọc cho từng nhóm
      const groupConversations = await Promise.all(
        groupResponse.map(async (group) => {
          const messages = await fetchGroupMessage(group.groupId);
          // Sắp xếp tin nhắn theo thời gian mới nhất
          messages.items.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );
          const lastMessage = messages.items[0];
          // Đếm số tin nhắn chưa đọc cho user hiện tại
          const unreadCount = messages.items.filter(
            (msg) =>
              msg.isRead === false &&
              (Array.isArray(msg.unreadFor)
                ? msg.unreadFor.includes(currentUser.userId)
                : msg.receiverId === currentUser.userId)
          ).length;
          return {
            isGroup: true,
            groupId: group.groupId,
            username: group.name,
            avatarUrl:
              group.avatarUrl ||
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQydtPSKH6Z1xihd05ogcAWa_-P06vbF0wtUQ&s",
            lastMessage: lastMessage ? lastMessage.content : "",
            time: lastMessage ? lastMessage.timestamp : "",
            unread: unreadCount,
          };
        })
      );

      // Chuẩn hóa danh sách cuộc trò chuyện cá nhân
      const personalConversations = data.map((item) => ({
        ...item,
        isGroup: false,
        username: item.username,
        avatarUrl: item.avatarUrl || "https://randomuser.me/api/portraits",
        lastMessage: item.lastMessage,
        time: item.time,
        unread: item.unread,
      }));

      // Gộp hai danh sách và sắp xếp theo thời gian mới nhất
      const allConversations = [...personalConversations, ...groupConversations]
        // .filter((conv) => conv.lastMessage) // loại bỏ cuộc trò chuyện chưa có tin nhắn
        .sort((a, b) => new Date(b.time) - new Date(a.time));
      setListConversation(allConversations);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", error);
      message.error(
        "Không thể tải danh sách cuộc trò chuyện, vui lòng thử lại"
      );
    }
  };
  // hàm đánh dấu tin nhắn đã đọc
  const markMessagesAsRead = async (conversationId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  useEffect(() => {
    // Kiểm tra xem người dùng đã chọn có phải là nhóm không
    if (selectedUser && selectedUser.isGroup) {
      // fetch danh sách tin nhắn của nhóm được chọn
      const fetchGroupMessages = async () => {
        const result = await fetchGroupMessage(selectedUser.groupId);
        if (result) {
          // sắp xếp tin nhắn theo thời gian
          result.items.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          setMessages(result.items);
        }
      };
      fetchGroupMessages();
    }
    if (!selectedUser) return;
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/chat/messages/${selectedUser.userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(
            `Lỗi HTTP: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        const newMessages = [
          ...data,
          ...pendingMessages.filter(
            (msg) =>
              (msg.senderId === selectedUser.userId &&
                msg.receiverId === currentUser.userId) ||
              (msg.senderId === currentUser.userId &&
                msg.receiverId === selectedUser.userId)
          ),
        ].reduce((acc, msg) => {
          if (!acc.some((existing) => existing.timestamp === msg.timestamp)) {
            acc.push(msg);
          }
          return acc;
        }, []);

        newMessages.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setMessages(newMessages);

        const conversationId = [currentUser.userId, selectedUser.userId]
          .sort()
          .join("#");
        await markMessagesAsRead(conversationId);
        setPendingMessages((prev) =>
          prev.filter(
            (msg) =>
              !(
                (msg.senderId === selectedUser.userId &&
                  msg.receiverId === currentUser.userId) ||
                (msg.senderId === currentUser.userId &&
                  msg.receiverId === selectedUser.userId)
              )
          )
        );
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tin nhắn:", error);
        message.error("Không thể tải tin nhắn, vui lòng thử lại");
      }
    };

    fetchMessages();
  }, [selectedUser]);
  // hàm kết nối socket io
  const handleRecallMessage = async (msg) => {
    const conversationId = [currentUser.userId, selectedUser.userId]
      .sort()
      .join("#");
    const timestamp = msg.timestamp;
    console.log(conversationId, timestamp);

    try {
      const response = await fetchRecallMessage(conversationId, timestamp);
      if (response) {
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.timestamp === timestamp
              ? { ...message, content: "Tin nhắn đã thu hồi" }
              : message
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi thu hồi tin nhắn:", error);
      message.error("Không thể thu hồi tin nhắn, vui lòng thử lại");
    }
  };
  useEffect(() => {
    fetchConversations();
    if (!currentUser) {
      console.log("Không có currentUser, bỏ qua khởi tạo Socket.IO");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Không có token, bỏ qua khởi tạo Socket.IO");
      message.error("Token không hợp lệ, vui lòng đăng nhập lại");
      return;
    }
    socketRef.current = io("http://localhost:5000", {
      auth: { token, userId: currentUser.userId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });
    socketRef.current.on("connect", () => {
      setIsSocketConnected(true);
      console.log("Kết nối tới Socket.IO server thành công");
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Kết nối tới Socket.IO server lỗi:", error.message);
      setIsSocketConnected(false);
      message.error("Không thể kết nối tới server chat, vui lòng thử lại sau");
    });

    socketRef.current.on("disconnect", (reason) => {
      console.warn("Socket.IO ngắt kết nối:", reason);
      setIsSocketConnected(false);
      if (reason === "io server disconnect") {
        socketRef.current.connect();
      }
    });

    socketRef.current.on("error", (error) => {
      console.error("Lỗi từ server:", error.message);
      message.error(error.message);
    });
    // lắng nghe sự kiện nhận tin nhắn
    socketRef.current.on(
      `receiveMessage_${currentUser.userId}`,
      async (message) => {
        if (
          !message ||
          !message.conversationId ||
          !message.senderId ||
          !message.timestamp ||
          !message.messageId
        ) {
          console.error("Tin nhắn không hợp lệ:", message);
          return;
        }
        if (
          selectedUser &&
          (message.receiverId === selectedUser.userId ||
            message.senderId === selectedUser.userId)
        ) {
          // đánh dấu tin nhắn đã đọc
          const conversationId = [currentUser.userId, selectedUser.userId]
            .sort()
            .join("#");
          try {
            await markMessagesAsRead(conversationId);
          } catch (error) {
            console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
          }
        }
        // 1. Cập nhật danh sách tin nhắn
        setMessages((prevMessages) => [...prevMessages, message]);
        // 2. Cập nhật cuộc trò chuyện (tin nhắn cuối cùng, thời gian)
        setListConversation((prevConversations) => {
          return prevConversations.map((conv) => {
            if (
              conv.userId === message.senderId ||
              conv.userId === message.receiverId
            ) {
              return {
                ...conv,
                lastMessage: message.content,
                time: message.timestamp,
              };
            }
            return conv;
          });
        });
        // 3. Đánh dấu tin nhắn đã đọc nếu nguời nhận đang mở cuộc trò chuyện
        if (
          selectedUser &&
          (message.senderId === selectedUser.userId ||
            message.receiverId === selectedUser.userId)
        ) {
          const conversationId = [currentUser.userId, selectedUser.userId]
            .sort()
            .join("#");
          markMessagesAsRead(conversationId);
        }
        //4 . Cuối cùng, cập nhật danh sách cuộc trò chuyện
        setPendingMessages((prev) => {
          if (
            prev.some(
              (msg) =>
                msg.messageId === message.messageId ||
                (msg.timestamp === message.timestamp &&
                  msg.content === message.content)
            )
          ) {
            return prev;
          }
          return [...prev, message];
        });
        // 5. Cuối cùng, cập nhật danh sách cuộc trò chuyện
        fetchConversations();
      }
    );
    // lắng nghe sự kiện thu hồi tin nhắn
    socketRef.current.on(`messageRecalled_${currentUser.userId}`, (message) => {
      if (!message || !message.conversationId || !message.timestamp) {
        console.error("Tin nhắn không hợp lệ:", message);
        return;
      }
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.timestamp === message.timestamp
            ? { ...msg, content: "Tin nhắn đã thu hồi" }
            : msg
        )
      );
      fetchConversations();
    });

    // SỰ KIỆN GROUP
    // lắng nghe sự kiện tạo nhóm mới
    socketRef.current.on(`newGroup_${currentUser.userId}`, (group) => {
      if (group.ownerId !== currentUser.userId) {
        message.success("Bạn đã được thêm vào nhóm mới");
      }
      setListGroupMessages((prevGroups) =>
        [...prevGroups, group].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        )
      );
      fetchConversations();
    });
    // gửi socket khi người dùng chọn nhóm
    if (selectedUser && selectedUser.isGroup) {
      socketRef.current.emit("joinGroup", selectedUser.groupId);
    }
    // lắng nghe sự kiện nhận tin nhắn nhóm
    socketRef.current.on(`receiveGroupMessage`, (message) => {
      if (!message || !message.groupId || !message.timestamp) {
        console.error("Tin nhắn không hợp lệ:", message);
        return;
      }
      // nếu người dùng đang ở trong nhóm này thì cập nhật tin nhắn
      if (selectedUser && selectedUser.isGroup) {
        if (message.groupId === selectedUser.groupId) {
          setMessages((prevMessages) => [...prevMessages, message]);
          // đánh dấu tin nhắn đã đọc
          markMessagesAsRead(message.groupId);
          // cập nhật danh sách cuộc trò chuyện nhóm
          setListConversation((prevConversations) => {
            return prevConversations.map((conv) => {
              if (conv.groupId === message.groupId) {
                return {
                  ...conv,
                  lastMessage: message.content,
                  time: message.timestamp,
                };
              }
              return conv;
            });
          });
        }
        else{
          // nếu người dùng không ở trong nhóm này thì không cập nhật tin nhắn
          // nhưng vẫn cập nhật tin nhắn chờ
          setPendingMessages((prev) => {
            if (
              prev.some(
                (msg) =>
                  msg.messageId === message.messageId ||
                  (msg.timestamp === message.timestamp &&
                    msg.content === message.content)
              )
            ) {
              return prev;
            }
            return [...prev, message];
          });
        }
      }
      fetchConversations();
    });
    // Cleanup listener
    return () => {
      socketRef.current.off(`receiveMessage_${currentUser.userId}`);
      socketRef.current.off(`messageRecalled_${currentUser.userId}`);
      socketRef.current.off("receiveGroupMessage");
      socketRef.current.disconnect();
    };
  }, [selectedUser]);

  const handleSendMessage = async () => {
    if (!currentUser || !selectedUser) {
      message.error(
        "Vui lòng đăng nhập và chọn người nhận trước khi gửi tin nhắn"
      );
      return;
    }
    if (!selectedUser.isGroup) {
      const newMessage = {
        senderId: currentUser.userId,
        receiverId: selectedUser.userId,
        content: messageInput,
        type: fileList.length > 0 ? "file" : "text",
        fileUrl: fileList.length > 0 ? fileList[0].originFileObj : null,
        isRead: false,
        timestamp: new Date().toISOString(),
        conversationId: [currentUser.userId, selectedUser.userId]
          .sort()
          .join("#"),
        messageId: `${Date.now()}`,
      };
      socketRef.current.emit("sendMessage", newMessage);
      setMessageInput("");
      setFileList([]);
      fetchConversations();
    } else {
      // gửi tin nhắn nhóm
      const newMessage = {
        groupId: selectedUser.groupId,
        content: messageInput,
        type: fileList.length > 0 ? "file" : "text",
        fileUrl: fileList.length > 0 ? fileList[0].originFileObj : null,
        senderId: currentUser.userId,
        timestamp: new Date().toISOString(),
      };
      socketRef.current.emit("sendGroupMessage", newMessage);
      setMessageInput("");
      setFileList([]);
      fetchConversations();
    }
  };
  const menu = (
    <Menu>
      <Menu.Item key="1">
        <ModalProfile
          userProfile={userProfile}
          avatarContext={avatar}
          setAvatarContext={setAvatar}
        />
      </Menu.Item>
      <Menu.Item key="2">
        <ModalForgetPassword />
      </Menu.Item>
      <Menu.Item
        key="3"
        icon={<LogoutOutlined style={{ fontSize: 20 }} />}
        onClick={handleLogout}
        style={{ marginTop: 10 }}
      >
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  const emojiPickerContent = <EmojiPicker onEmojiClick={handleEmojiClick} />;
  // Handle menu item clicks

  const handleDeleteMessage = (msg) => {
    Modal.confirm({
      title: "Xóa tin nhắn",
      content:
        "Bạn có chắc chắn muốn xóa tin nhắn này? Hành động này chỉ xóa tin nhắn trên thiết bị của bạn.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        setIsDeleting(!isDeleting);
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.messageId === msg.messageId
              ? { ...message, content: "Tin nhắn đã xóa", isDeleted: true }
              : message
          )
        );
        const deletedMessages = JSON.parse(
          localStorage.getItem("deletedMessages") || "[]"
        );
        localStorage.setItem(
          "deletedMessages",
          JSON.stringify([...deletedMessages, msg])
        );
      },
    });
  };
  // Hàm đóng modal chuyển tiếp
  const handleCancelModalFowardMessage = () => {
    setModalFowardVisible(false);
  };
  // hàm mở modal chuyển tiếp
  const handleOpenModalFowardMessage = (msg) => {
    setModalFowardVisible(true);
    setFowardMessage(msg);
  };
  // hàm mở modal tạo nhóm
  const handleOpenModalCreateGroup = () => {
    setIsCreateGroupModalVisible(true);
  };
  // hàm mở modal danh sách thành viên nhóm
  const handleOpenModalListMemberOfGroup = () => {
    setIsListMemberOfGroupModalVisible(true);
  };
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={350}
        style={{ background: "#fff", borderRight: "1px solid #e8e8e8" }}
      >
        <div
          style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #e8e8e8",
          }}
        >
          <Dropdown overlay={menu} trigger={["click"]}>
            <Avatar
              src={avatar}
              style={{ cursor: "pointer", marginRight: "20px" }}
            />
          </Dropdown>
          <SearchUserModel
            style={{ fontSize: "20px" }}
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
          <ModalCreateGroup
            visible={isCreateGroupModalVisible}
            onCancel={() => setIsCreateGroupModalVisible(false)}
            userProfile={userProfile}
            setSelectedUser={setSelectedUser}
            socket={isSocketConnected ? socketRef.current : null}
          />
          <Button
            type="text"
            icon={<UserOutlined style={{ fontSize: "20px" }} />}
            onClick={handleOpenFriendList}
          />
          {/* <Button type="text" icon={<TeamOutlined style={{ fontSize: '20px' }} />} /> */}
          <Button
            type="text"
            icon={<TeamOutlined style={{ fontSize: "20px" }} />}
            onClick={handleOpenModalCreateGroup}
          />
          <Button
            type="text"
            icon={<SettingOutlined style={{ fontSize: "20px" }} />}
            onClick={handleLogout}
          />
        </div>
        <List
          itemLayout="horizontal"
          dataSource={listConversation}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e8e8e8",
                cursor: "pointer",
              }}
              onClick={() => setSelectedUser(item)}
            >
              <List.Item.Meta
                style={{ padding: "0 10px" }}
                avatar={<Avatar src={item.avatarUrl} />}
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{item.username}</span>
                    <span style={{ color: "#888", fontSize: "12px" }}>
                      {new Date(item.time).toLocaleTimeString()}
                    </span>
                  </div>
                }
                description={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text ellipsis style={{ color: "#888" }}>
                      {item.lastMessage}
                    </Text>
                    {item.unread > 0 && (
                      <Badge
                        count={item.unread}
                        style={{ backgroundColor: "#0068FF" }}
                      />
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Sider>
      <Content
        style={{ padding: "20px", background: "#f0f2f5", maxHeight: "100vh" }}
      >
        {selectedUser ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {selectedUser.isGroup ? (
              <div
                style={{
                  padding: "10px 20px",
                  borderBottom: "1px solid #e8e8e8",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={handleOpenModalListMemberOfGroup}
              >
                <Avatar
                  src={
                    selectedUser.avatarUrl ||
                    "https://randomuser.me/api/portraits/men/1.jpg"
                  }
                />
                <Title level={4} style={{ margin: "0 10px" }}>
                  {selectedUser.username}
                </Title>
              </div>
            ) : (
              <div
                style={{
                  padding: "10px 20px",
                  borderBottom: "1px solid #e8e8e8",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Avatar
                  src={
                    selectedUser.avatarUrl ||
                    "https://randomuser.me/api/portraits/men/1.jpg"
                  }
                />
                <Title level={4} style={{ margin: "0 10px" }}>
                  {selectedUser.username}
                </Title>
              </div>
            )}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                background: "#f0f2f5",
              }}
            >
              {messages.map((msg, index) =>
                deletedMessages.some(
                  (deletedMsg) => deletedMsg.messageId === msg.messageId
                ) ? null : (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.senderId === userProfile.userId
                          ? "flex-end"
                          : "flex-start",
                      marginBottom: "10px",
                      position: "relative",
                    }}
                    className="message-item"
                  >
                    <div
                      style={{
                        maxWidth: "60%",
                        padding: "10px",
                        borderRadius: "10px",
                        background:
                          msg.senderId === userProfile.userId
                            ? "#dbebff"
                            : "#fff",
                        color:
                          msg.senderId === userProfile.userId ? "#fff" : "#000",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                        position: "relative",
                      }}
                    >
                      {deletedMessages.some(
                        (deletedMsg) => deletedMsg.messageId === msg.messageId
                      ) ? (
                        <span style={{ color: "#888" }}>Tin nhắn đã xóa</span>
                      ) : (
                        <MessageContent msg={msg} />
                      )}
                      <div
                        style={{
                          fontSize: "10px",
                          marginTop: "5px",
                          opacity: 1,
                          color: "#000",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="message-actions">
                        <Dropdown
                          trigger={["click"]}
                          overlay={
                            <Menu>
                              <Menu.Item
                                key="copy"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.content);
                                  message.success("Đã sao chép tin nhắn");
                                }}
                              >
                                Sao chép tin nhắn
                              </Menu.Item>
                              <Menu.Item
                                key="forward"
                                onClick={() => {
                                  handleOpenModalFowardMessage(msg);
                                }}
                              >
                                Chuyển tiếp tin nhắn
                              </Menu.Item>

                              <Menu.Item
                                key="delete"
                                onClick={() => handleDeleteMessage(msg)}
                              >
                                Xóa tin nhắn
                              </Menu.Item>
                              {msg.senderId === currentUser.userId && (
                                <Menu.Item
                                  key="edit"
                                  onClick={() => {
                                    handleRecallMessage(msg);
                                  }}
                                >
                                  Thu hồi tin nhắn
                                </Menu.Item>
                              )}
                            </Menu>
                          }
                          placement="bottomRight"
                        >
                          <MoreOutlined
                            style={{
                              fontSize: "13px",
                              cursor: "pointer",
                              color: "#888",
                            }}
                          ></MoreOutlined>
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                )
              )}
              <ModalFowardMessage
                fowardMessageVisible={isModalFowardVisible}
                setFowardMessageVisible={handleCancelModalFowardMessage}
                message={fowardMessage}
                socket={socketRef.current}
                currentUser={currentUser}
              />
              {/* Modal danh sách thành viên nhóm */}
              <ModalListMemberOfGroup
                visible={isListMemberOfGroupModalVisible}
                onClose={() => setIsListMemberOfGroupModalVisible(false)}
                groupId={selectedUser.groupId}
                currentUserId={userProfile.userId}
                socket={socketRef.current}
                fetchConversations={fetchConversations}
                currentUser={currentUser}
              />
              <div ref={messagesEndRef} />
            </div>
            <div
              style={{
                padding: "10px",
                background: "#fff",
                borderTop: "1px solid #e8e8e8",
              }}
            >
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
                    <Button
                      icon={<UploadOutlined />}
                      loading={loading}
                      disabled={loading || !selectedUser}
                    />
                  </Upload>
                </Col>
                <Col>
                  <Popover content={emojiPickerContent} trigger="click">
                    <Button
                      icon={<SmileOutlined />}
                      disabled={loading || !selectedUser}
                    />
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
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                  />
                </Col>
              </Row>
            </div>
          </div>
        ) : (
          <Row justify="center" align="middle" style={{ textAlign: "center" }}>
            <Col>
              <Title level={3}>Chào mừng đến với Zalo !</Title>
              <Text style={{ display: "block", marginBottom: 16 }}>
                Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng{" "}
                <br />
                người thân, bạn bè được tối ưu hóa cho máy tính của bạn.
              </Text>
              <img
                src="https://chat.zalo.me/assets/quick-message-onboard.3950179c175f636e91e3169b65d1b3e2.png"
                alt="Welcome to Zalo "
                style={{ width: "100%", maxWidth: 400, marginBottom: 16 }}
              />
              <Title level={4}>Nhắn tin nhiều hơn soạn thảo ít hơn</Title>
              <Text style={{ display: "block", marginBottom: 16 }}>
                Sử dụng tin nhắn nhanh để gửi tin nhắn mà không cần mở cửa sổ
                chat
              </Text>
            </Col>
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default HomeChat;
