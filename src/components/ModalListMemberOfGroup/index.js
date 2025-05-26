
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
  currentUser
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
        // message.info(`Thành viên ${data.userEmail} đã bị xóa khỏi nhóm.`);
        setMembers((prev) =>
          prev.filter((member) => member.userId !== data.userId)
        );
        setCurrentGroup((prev) => ({
          ...prev,
          members: prev.members.filter((member) => member.userId !== data.userId),
        }));
      } else if (data.type === "role_updated") {
        setMembers((prev) =>
          prev.map((member) =>
            member.userId === data.userId
              ? { ...member, role: data.group.members.find(m => m.userId === data.userId).role }
              : member
          )
        );
        setCurrentGroup((prev) => ({
          ...prev,
          members: data.group.members,
        }));
      } else if (data.type === "owner_changed") {
        message.info(
          `Trưởng nhóm mới: ${data.userEmail}`
        );
        setMembers((prev) =>
          prev.map((member) =>
            member.userId === data.userId
              ? { ...member, role: "admin" }
              : { ...member, role: member.role === "admin" ? "member" : member.role }
          )
        );
        setCurrentGroup((prev) => ({
          ...prev,
          ownerId: data.userId,
          members: data.group.members,
        }));
      }
    });

    // Lắng nghe sự kiện bị xóa khỏi nhóm
    socket.on(`removedFromGroup_${currentUserId}`, (data) => {
      fetchConversations();
      onClose();
    });

    // Lắng nghe sự kiện nhóm bị giải tán
    socket.on(`groupDisbanded_${currentUserId}`, (data) => {
      message.warning(`Nhóm ${data.groupName} đã bị giải tán`);
      fetchConversations();
      onClose();
    });
    // lắng nghe sự kiện được thêm vào nhóm
    

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
      message.error("Chỉ trưởng nhóm hoặc phó nhóm mới có quyền xóa thành viên");
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
      message.success(`Đã xóa thành viên ${data.userId} thành công`);
    });
    socket.once("error", (data) => {
      message.error(data.message);
    });
  };

  // Hàm xử lý khi bổ nhiệm phó nhóm
  const handleAppointSubAdmin = (memberId) => {
    if (!isAdmin) {
      message.error("Chỉ trưởng nhóm mới có quyền bổ nhiệm phó nhóm");
      return;
    }
    socket.emit("assignCoAdmin", {
      groupId,
      userId: currentUserId,
      newAdminId: memberId,
    });
    socket.once("coAdminAssigned", (data) => {
      message.success(`Đã bổ nhiệm thành viên ${data.userId} làm phó nhóm`);
    });
    socket.once("error", (data) => {
      message.error(data.message);
    });
  };

  // Hàm xử lý khi bổ nhiệm trưởng nhóm
  const handleAppointAdmin = (memberId) => {
    if (!isAdmin) {
      message.error("Chỉ trưởng nhóm mới có quyền bổ nhiệm trưởng nhóm mới");
      return;
    }
    if (memberId === currentUserId) {
      message.error("Bạn đã là trưởng nhóm");
      return;
    }
    Modal.confirm({
      title: "Xác nhận bổ nhiệm trưởng nhóm",
      content: "Bạn có chắc chắn muốn chuyển giao quyền trưởng nhóm? Bạn sẽ trở thành thành viên thường sau khi thực hiện hành động này.",
      onOk: () => {
        socket.once("groupOwnerChanged", (data) => {
          message.success(`Đã bổ nhiệm thành viên ${data.userId} làm trưởng nhóm mới`);
        });
        socket.once("error", (data) => {
          message.error(data.message);
        });
      },
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
                  <Avatar src={member.avatar} size={40} />
                  <Text strong style={{ fontSize: 16 }}>
                    {member.username}
                  </Text>
                  {member.role === "admin" && (
                    <CrownOutlined
                      style={{ color: "gold", fontSize: 18 }}
                      title="Chủ nhóm"
                    />
                  )}
                  {member.role === "co-admin" && (
                    <UserSwitchOutlined
                      style={{ color: "#1890ff", fontSize: 18 }}
                      title="Phó nhóm"
                    />
                  )}
                </Space>
                {/* Hiển thị dropdown cho admin hoặc sub-admin, trừ chính người dùng hoặc admin */}
                {(isAdmin || isSubAdmin) && member.userId !== currentUserId && member.role !== "admin" && (
                  <Dropdown
                    trigger={["click"]}
                    overlay={
                      <Menu>
                        <Menu.Item
                          key="appoint-sub-admin"
                          onClick={() => handleAppointSubAdmin(member.userId)}
                          icon={<UserSwitchOutlined />}
                          disabled={!isAdmin} // Chỉ admin được bổ nhiệm phó nhóm
                        >
                          Bổ nhiệm phó nhóm
                        </Menu.Item>
                        <Menu.Item
                          key="appoint-admin"
                          onClick={() => handleAppointAdmin(member.userId)}
                          icon={<CrownOutlined />}
                      
                        >
                          Bổ nhiệm trưởng nhóm
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
          disabled= {!isAdmin && !isSubAdmin}
        >
          Thêm thành viên
        </Button>
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
      />
    </Modal>
  );
};

export default ModalListMemberOfGroup;
