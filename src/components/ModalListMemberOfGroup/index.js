import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  List,
  Avatar,
  Typography,
  Space,
  Dropdown,
  Menu,
  message,
} from "antd";
import {
  UserAddOutlined,
  DeleteOutlined,
  CrownOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { fetchListGroup } from "../../services/groupService";
import { getUserInfo } from "../../services/userService";
import GroupAddMember from "../ModalAddMember";

const { Title, Text } = Typography;

// Component Modal hiển thị danh sách thành viên của nhóm
const ModalListMemberOfGroup = ({
  visible,
  onClose,
  groupId,
  currentUserId,
  socket,
  fetchConversations,
  currentUser,
}) => {
  // State lưu trữ danh sách thành viên
  const [members, setMembers] = useState([]);
  // State lưu trữ thông tin nhóm hiện tại
  const [currentGroup, setCurrentGroup] = useState(null);
  // State kiểm tra người dùng hiện tại có phải là admin không
  const [isAdmin, setIsAdmin] = useState(false);
  // State kiểm tra người dùng hiện tại có phải là phó nhóm không
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [isGroupAddMemberVisible, setIsGroupAddMemberVisible] = useState(false);

  // Hàm lấy danh sách nhóm của người dùng
  const getListGroups = async () => {
    try {
      const result = await fetchListGroup();
      if (result) {
        const group = result.find((group) => group.groupId === groupId);
        if (group) {
          setCurrentGroup(group);
          setMembers(group.members || []);
          // Kiểm tra vai trò của người dùng hiện tại
          const currentMember = group.members.find(
            (member) => member.userId === currentUserId
          );
          setIsAdmin(currentMember?.role === "admin");
          setIsSubAdmin(currentMember?.role === "co-admin");
          // lấy danh sách thông tin người dùng
          const memberPromises = group.members.map(async (member) => {
            const userInfo = await getUserInfo(member.userId);
            return {
              ...member,
              username: userInfo?.username || "Không rõ",
              avatarUrl: userInfo?.avatarUrl || "",
            };
          });
          const memberDetails = await Promise.all(memberPromises);
          setMembers(memberDetails);
          console.log("Danh sách thành viên nhóm:", memberDetails);
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhóm:", error);
      message.error("Không thể lấy danh sách nhóm.");
    }
  };

  // Effect chạy khi modal hiển thị hoặc groupId thay đổi
  useEffect(() => {
    if (visible && groupId) {
      getListGroups();
    }
  }, [visible, groupId]);

  // Effect lắng nghe sự kiện từ socket
  useEffect(() => {
    if (!socket || !groupId || !currentUserId) return;

    // Lắng nghe sự kiện người dùng hiện tại được bổ nhiệm làm admin
    socket.on(`groupOwnerChanged_${currentUserId}`, (data) => {
      message.success(`Bạn đã được bổ nhiệm làm chủ nhóm: ${data.groupName}`);
      setIsAdmin(true);
      setIsSubAdmin(false);
      getListGroups(); // Cập nhật danh sách nhóm
    });

    // Lắng nghe sự kiện rời nhóm thành công
    socket.on(`group:leaveSuccess`, (data) => {
      message.success("Bạn đã rời nhóm thành công");
      fetchConversations();
      onClose(); // Đóng modal sau khi rời nhóm
    });

    // Lắng nghe sự kiện người dùng được bổ nhiệm làm phó nhóm
    socket.on(`coAdminAssigned`, (data) => {
      if (data.userId === currentUserId) {
        message.success("Bạn đã được bổ nhiệm làm phó nhóm!");
        setIsSubAdmin(true);
      }
      getListGroups(); // Cập nhật danh sách nhóm
    });

    // Lắng nghe sự kiện cập nhật thành viên nhóm
    socket.on(`groupMemberUpdated_${groupId}`, (data) => {
      if (data.type === "member_removed") {

        setMembers((prev) =>
          prev.filter((member) => member.userId !== data.userId)
        );
       
      } else if (data.type === "role_updated") {
        setMembers((prev) =>
          prev.map((member) =>
            member.userId === data.userId
              ? {
                  ...member,
                  role: data.group.members.find((m) => m.userId === data.userId)
                    .role,
                }
              : member
          )
        );
        setCurrentGroup((prev) => ({
          ...prev,
          members: data.group.members,
        }));
      } else if (data.type === "owner_changed") {
        message.info(`Đã cập nhật quyền sở hữu nhóm`);
        setMembers((prev) =>
          prev.map((member) =>
            member.userId === data.userId
              ? { ...member, role: "admin" }
              : {
                  ...member,
                  role: member.role === "admin" ? "member" : member.role,
                }
          )
        );
        setCurrentGroup((prev) => ({
          ...prev,
          ownerId: data.userId,
          members: data.group.members,
        }));
      }
      else if(data.type === "member_added") {
        const newMember = data.group.members.find(
          (member) => member.userId === data.userId
        );
        if (newMember) {
          setMembers((prev) => [...prev, newMember]);
          setCurrentGroup((prev) => ({
            ...prev,
            members: [...prev.members, newMember],
          }));
        }
      }
    });

    // Lắng nghe sự kiện bị xóa khỏi nhóm
    socket.on(`removedFromGroup_${currentUserId}`, (data) => {
      fetchConversations();
      onClose();
    });

    // Lắng nghe sự kiện nhóm bị giải tán
    socket.on(`groupDisbanded_${currentUserId}`, (data) => {
      message.success(`Nhóm ${data.groupName} đã bị giải tán`);
      fetchConversations();
      onClose();
    });

    // Cleanup listeners
    return () => {
      socket.off(`groupOwnerChanged_${currentUserId}`);
      socket.off(`group:leaveSuccess`);
      socket.off(`coAdminAssigned`);
      socket.off(`groupMemberUpdated_${groupId}`);
      socket.off(`removedFromGroup_${currentUserId}`);
      socket.off(`groupDisbanded_${currentUserId}`);
    };
  }, [socket, groupId, currentUserId, fetchConversations, onClose]);

  // Hàm xử lý khi rời nhóm
  const handleLeaveGroup = () => {
    socket.emit("group:leave", {
      groupId: groupId,
      userId: currentUserId,
    });
  };

  // Hàm xử lý khi thêm thành viên
  const handleAddMember = () => {
    setIsGroupAddMemberVisible(true);
  };

  // Hàm xử lý khi xóa thành viên
  const handleRemoveMember = (memberId) => {
    if (!isAdmin && !isSubAdmin) {
      message.error(
        "Chỉ trưởng nhóm hoặc phó nhóm mới có quyền xóa thành viên"
      );
      return;
    }
    if (memberId === currentUserId) {
      message.error("Vui lòng sử dụng nút 'Rời nhóm' để rời khỏi nhóm");
      return;
    }
    socket.emit("removeMember", {
      groupId,
      userId: currentUserId,
      memberIdToRemove: memberId,
    });
    socket.on("memberRemoved", (data) => {
      message.success(data.message);
    });
    socket.once("error", (data) => {
      message.error(data.message);
    });
  };

  // Hàm xử lý khi bổ nhiệm phó nhóm
  const handleAppointSubAdmin = (member) => {
    if (!isAdmin) {
      message.error("Chỉ trưởng nhóm mới có quyền bổ nhiệm phó nhóm");
      return;
    }
    socket.emit("assignCoAdmin", {
      groupId,
      userId: currentUserId,
      newAdminId: member.userId,
    });
    socket.once("coAdminAssigned", (data) => {
      message.success(`Đã bổ nhiệm thành viên ${data.username} làm phó nhóm`);
    });
    socket.once("error", (data) => {
      message.error(data.message);
    });
  };


  // Giao diện của modal
  return (
    <Modal
      title="Thông tin nhóm"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div className="group-info-container">
        <div
          className="group-name-container"
          style={{ marginBottom: "16px", textAlign: "center" }}
        >
          <Title level={4} className="group-name">
            {currentGroup?.name || "Tên nhóm"}
          </Title>
        </div>
        <div className="group-admin-info">
          <Text strong>Chủ nhóm: </Text>
          <Text>
            {currentGroup?.members.find((member) => member.role === "admin")
              ?.username || "Chưa được chỉ định"}
          </Text>
        </div>
      </div>

      <div className="members-list-container">
        <Title level={5}>Thành viên</Title>
        <List
          dataSource={members}
          renderItem={(member) => (
            <List.Item key={member.userId}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 0",
                }}
              >
                <Space size="middle">
                  <Avatar src={member.avatarUrl} size={40} />
                  <Text strong style={{ fontSize: 16 }}>
                    {member.username}
                  </Text>
                  {member.role === "admin" && (
                    <Text strong style={{ color: "#ff4d4f" }}>
                      Trưởng nhóm
                    </Text>
                  )}
                  {member.role === "co-admin" && (
                    <Text strong style={{ color: "#faad14" }}>
                      Phó nhóm
                    </Text>
                  )}
                </Space>
                {/* Hiển thị dropdown cho admin hoặc sub-admin, trừ chính người dùng hoặc admin */}
                {(isAdmin || isSubAdmin) &&
                  member.userId !== currentUserId &&
                 (
                    <Dropdown
                      trigger={["click"]}
                      overlay={
                        <Menu>
                          <Menu.Item
                            key="appoint-sub-admin"
                            onClick={() => handleAppointSubAdmin(member)}
                            icon={<UserSwitchOutlined />}
                            disabled={!isAdmin || member.role === "co-admin"}
                          >
                            Bổ nhiệm phó nhóm
                          </Menu.Item>
                          <Menu.Item
                            key="remove-member"
                            danger
                            onClick={() => handleRemoveMember(member.userId)}
                            icon={<DeleteOutlined />}
                          >
                            Xóa thành viên
                          </Menu.Item>
                        </Menu>
                      }
                    >
                      <Button icon={<UserSwitchOutlined />} type="text" />
                    </Dropdown>
                  )}
              </div>
            </List.Item>
          )}
        />
      </div>
      <div
        className="actions-button"
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleAddMember}
          disabled={!isAdmin && !isSubAdmin}
        >
          Thêm thành viên
        </Button>
        {isAdmin && (
          <Button
            type="primary"
            danger
            onClick={() => {
              Modal.confirm({
                title: "Xác nhận giải tán nhóm",
                content: "Bạn có chắc chắn muốn giải tán nhóm này không?",
                onOk: () => {
                  socket.emit("group:disband", {
                    groupId,
                    userId: currentUserId,
                  });
                },
              });
            }}
          >
            Giải tán nhóm
          </Button>
        )}
        <Button danger onClick={handleLeaveGroup}>
          Rời nhóm
        </Button>
      </div>
      <GroupAddMember
        visible={isGroupAddMemberVisible}
        onCancel={() => setIsGroupAddMemberVisible(false)}
        groupId={currentGroup?.groupId}
        currentUser={currentUser}
        socket={socket}
        onMemberAdded={""}
        setMembers={setMembers}
      />
    </Modal>
  );
};

export default ModalListMemberOfGroup;
