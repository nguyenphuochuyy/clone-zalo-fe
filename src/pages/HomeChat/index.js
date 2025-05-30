import React, { use, useEffect, useMemo, useRef, useState } from "react";
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
  Spin,
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
  createMessage,
  fetchGroupMessage,
  fetchListGroup,
  fetchRecallMessage,
} from "../../services/chatService.js";
import ModalFowardMessage from "../../components/ModalFowardMessage/index.js";
import ModalCreateGroup from "../../components/ModalCreateGroup/index.js";
import ModalListMemberOfGroup from "../../components/ModalListMemberOfGroup/index.js";
import { sendMessageToGroup } from "../../services/groupService.js";
import { getMessageType } from "../../utils/file.js";
const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const HomeChat = ({ setIsAuthenticated, userProfile, avatar, setAvatar }) => {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState(null);
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
  const [listGroup, setListGroup] = useState([]);
  const [isFriendListModalVisible, setIsFriendListModalVisible] =
    useState(false);
  const [isModalFowardVisible, setModalFowardVisible] = useState(false);
  const [fowardMessage, setFowardMessage] = useState(null);
  const [isCreateGroupModalVisible, setIsCreateGroupModalVisible] =
    useState(false);
  const [isListMemberOfGroupModalVisible, setIsListMemberOfGroupModalVisible] =
    useState(false);
  // tạo form data
  const formData = new FormData();
  // Constants for file validation (aligned with mobile app)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const VALID_EXTENSIONS = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp", // Images
    "mp4",
    "mov",
    "avi",
    "mkv",
    "webm", // Videos
    "pdf",
    "doc",
    "docx",
    "txt", // Documents
  ];

  // Hàm xác định type dựa trên đuôi file
  const getMessageType = (file) => {
    if (!file) return "text"; // Không có file, mặc định là text

    // Lấy tên file từ object File
    const fileName = file.name || file.originFileObj?.name;
    if (!fileName) return "file"; // Nếu không có tên file, mặc định là file

    // Lấy đuôi file (extension) và chuyển thành chữ thường
    const extension = fileName.split(".").pop().toLowerCase();

    // Danh sách các đuôi file cho từng loại
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
    const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm"];

    // Xác định type dựa trên đuôi file
    if (imageExtensions.includes(extension)) {
      return "image";
    } else if (videoExtensions.includes(extension)) {
      return "video";
    } else {
      return "file";
    }
  };
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
    localStorage.removeItem("isAuthenticated");
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
    window.location.href = "/login";
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
    const isLt100M = file.size / 1024 / 1024 < 100; // Kiểm tra kích thước file < 100MB
    if (!isLt100M) {
      message.error("File phải nhỏ hơn 100MB!");
      return false;
    }
    return false; // Trả về false để không tự động tải lên
  };
  // hàm lấy danh sách các cuộc trò chuyện
  const fetchConversations = async () => {
    if (!currentUser) return;
    setLoadingConversations(true); // Bắt đầu loading
    setError(null); // Reset lỗi
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
          messages.items.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );
          const lastMessage = messages.items[0];
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
            time:
              lastMessage && lastMessage.timestamp
                ? lastMessage.timestamp
                : group.createdAt,
            unread: unreadCount,
          };
        })
      );

      const personalConversations = data.map((item) => ({
        ...item,
        isGroup: false,
        username: item.username,
        avatarUrl: item.avatarUrl || "https://randomuser.me/api/portraits",
        lastMessage: item.lastMessage,
        time: item.time,
        unread: item.unread,
      }));

      const allConversations = [
        ...personalConversations,
        ...groupConversations,
      ].sort((a, b) => new Date(b.time) - new Date(a.time));
      console.log("All conversations:", allConversations);

      setListConversation(allConversations);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", error);
      setError("Không thể tải danh sách cuộc trò chuyện, vui lòng thử lại");
    } finally {
      setLoadingConversations(false); // Kết thúc loading
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
    fetchConversations();
  }, []);

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

  const handleRecallMessage = async (msg) => {
    // kiểm tra xem có phải là tin nhắn nhóm ko
    if (msg.groupId) {
      // Thu hồi tin nhắn nhóm qua Socket.IO
      const recallData = {
        messageId: msg.messageId,
        senderId: currentUser.userId,
      };

      // Gửi sự kiện recallGroupMessage
      socketRef.current.emit("recallGroupMessage", recallData);

      // Lắng nghe lỗi từ server
      socketRef.current.once("error", (error) => {
        console.error("Lỗi từ server khi thu hồi tin nhắn nhóm:", error);
        message.error(error.message || "Không thể thu hồi tin nhắn nhóm");
      });
    } else {
      const conversationId = [currentUser.userId, selectedUser.userId]
        .sort()
        .join("#");
      const timestamp = msg.timestamp;
      try {
        const response = await fetchRecallMessage(conversationId, timestamp);
        if (response) {
          console.log("Tin nhắn đã thu hồi:", response);
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
    }
  };
  // hàm kết nối socket io
  useEffect(() => {
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
      const fetchGroups = async () => {
        try {
          const response = await fetchListGroup();
          if (!response || response.length === 0) {
            console.log("Không có nhóm nào để tham gia");
            return;
          }
          setListGroup(response);
          
        }
        catch (error) {
          console.error("Lỗi khi lấy danh sách nhóm:", error);
          message.error("Không thể tải danh sách nhóm, vui lòng thử lại");
        }
    
      }
      fetchGroups();
      if(listGroup.length > 0) {
        listGroup.slice(0, 5).forEach((group) => {
          socketRef.current.emit("joinGroup", group.groupId);
          console.log(`Đã gửi yêu cầu tham gia phòng cho nhóm: ${group.groupId}`);
        })
      }
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
        console.log("Nhận tin nhắn mới:", message);
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
      console.log("Tin nhắn đã thu hồi:", message);
      setMessages((prevMessages) => {
        return prevMessages.map((msg) =>
          msg.messageId === message.messageId
            ? {
                ...msg,
                content: "Tin nhắn đã thu hồi",
                isRecalled: true,
                type: "text",
              }
            : msg
        );
      });
      fetchConversations();
    });

    // SỰ KIỆN GROUP
    // lắng nghe sự kiện tạo nhóm mới
    socketRef.current.on(`newGroup_${currentUser.userId}`, (group) => {
      if (group.ownerId !== currentUser.userId) {
        message.success("Bạn đã được thêm vào nhóm mới");
        socketRef.current.emit("joinGroup", group.groupId);    
      }
      setListGroupMessages((prevGroups) => {
        const existingGroup = prevGroups.find(
          (g) => g.groupId === group.groupId
        );
        if (existingGroup) {
          return prevGroups; // Không thêm nhóm đã tồn tại
        }
        return [
          ...prevGroups,
          {
            isGroup: true,
            groupId: group.groupId,
            username: group.name,
            avatarUrl:
              group.avatarUrl ||
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQydtPSKH6Z1xihd05ogcAWa_-P06vbF0wtUQ&s",
            lastMessage: "",
            time: group.createdAt,
            unread: 0,
          },
        ];
      });
      fetchConversations();
    });
    // Lắng nghe sự kiện nhận tin nhắn nhóm
    socketRef.current.on("receiveGroupMessage", (message) => {
      if (!message || !message.groupId || !message.timestamp) {
        console.error("Tin nhắn không hợp lệ:", message);
        return;
      }
      console.log("Nhận tin nhắn nhóm mới:", message);
      
      if (
        selectedUser &&
        selectedUser.isGroup &&
        selectedUser.groupId === message.groupId
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
        markMessagesAsRead(message.groupId);
      } else {
        setPendingMessages((prev) => {
          if (!prev.some((msg) => msg.messageId === message.messageId)) {
            return [...prev, message];
          }
          return prev;
        });
      
      }
      fetchConversations();
    });
    // Lắng nghe phản hồi groupMessageRecalled
    socketRef.current.on("groupMessageRecalled", (recalledMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.messageId === recalledMessage.messageId
            ? {
                ...msg,
                content: "Tin nhắn đã thu hồi",
                isRecalled: true,
                type: "text",
              }
            : msg
        )
      );
    });
    // lắng nghe sự kiện giải tán nhóm
    socketRef.current.on(`groupDisbanded_${currentUser.userId}`, (groupId , groupName) => {
      console.log(`Nhóm ${groupName} đã bị giải tán`);
      setListGroupMessages((prevGroups) =>
        prevGroups.filter((group) => group.groupId !== groupId)
      );
      // Nếu người dùng đang ở trong nhóm bị giải tán, chuyển về cuộc trò chuyện khác
      if (selectedUser && selectedUser.groupId === groupId) {
        setSelectedUser(null);
        setMessages([]);
      }
      fetchConversations();
    });

    // Cleanup listener
    return () => {
      socketRef.current.off("joinGroup");
      socketRef.current.off(`receiveMessage_${currentUser.userId}`);
      socketRef.current.off(`messageRecalled_${currentUser.userId}`);
      socketRef.current.off("receiveGroupMessage");
      socketRef.current.disconnect();
    };
  }, [selectedUser]);

  // useEffect để join/leave group room khi selectedUser thay đổi
  useEffect(() => {
    if (socketRef.current && selectedUser && selectedUser.isGroup) {
      socketRef.current.emit("joinGroup", selectedUser.groupId);
      console.log(
        `Đã gửi yêu cầu tham gia phòng cho nhóm: ${selectedUser.groupId}`
      );
    }
    // Thêm logic "leaveGroup" trong cleanup function
    return () => {
      if (socketRef.current && selectedUser && selectedUser.isGroup) {
        socketRef.current.emit("leaveGroup", selectedUser.groupId);
      }
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
      };
      try {
        const formData = new FormData();
        formData.append("senderId", newMessage.senderId);
        formData.append("receiverId", newMessage.receiverId);
        formData.append("content", newMessage.content || "");
        if (fileList.length > 0) {
          formData.append("file", fileList[0].originFileObj);
          formData.append("type", getMessageType(fileList[0]));
        }
        formData.append("timestamp", newMessage.timestamp);
        formData.append("isRead", newMessage.isRead);
        const response = await fetch("http://localhost:5000/api/chat/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });
        if (response.ok) {
          const result = await response.json();
          socketRef.current.emit("sendMessage", result);
        }
      } catch (error) {
        message.error("Không thể gửi tin nhắn, vui lòng thử lại");
      }
      setMessageInput("");
      setFileList([]);
      fetchConversations();
    } else {
      // Gửi tin nhắn nhóm qua HTTP POST
      const formData = new FormData();
      formData.append("groupId", selectedUser.groupId);
      formData.append("content", messageInput || "");
      if (fileList.length > 0) {
        formData.append("file", fileList[0].originFileObj);
        formData.append("type", getMessageType(fileList[0]));
      } else {
        formData.append("type", "text");
      }
      formData.append("senderId", currentUser.userId);
      formData.append("timestamp", new Date().toISOString());

      const response = await fetch("http://localhost:5000/api/group-chat/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi gửi tin nhắn nhóm");
      }
      const result = await response.json();
    }
    setMessageInput("");
    setFileList([]);
    await fetchConversations();
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
              src={
                currentUser?.avatarUrl ||
                "https://randomuser.me/api/portraits/men/1.jpg"
              }
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
                background: "#EBECF0",
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
                      alignItems: "flex-end",
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
                            ? "#E5F1FF"
                            : "#fff",
                        color:
                          msg.senderId === userProfile.userId ? "#fff" : "#000",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                        position: "relative",
                        marginLeft:
                          msg.senderId !== userProfile.userId ? "10px" : "0",
                        marginRight:
                          msg.senderId === userProfile.userId ? "10px" : "0",
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
                              color:
                                msg.senderId === userProfile.userId
                                  ? "#fff"
                                  : "#888",
                            }}
                          />
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
                setMessage={setMessages}
              />
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
