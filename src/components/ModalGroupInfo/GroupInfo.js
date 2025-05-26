
import React, { useEffect, useState } from "react";
import { Modal, List, Avatar, Button, message, Typography, Popconfirm } from "antd";
import { UserAddOutlined, DeleteOutlined, CloseCircleOutlined } from "@ant-design/icons";
import GroupAddMember from "./GroupAddMember";

const { Title, Text } = Typography;

const GroupInfo = ({ visible, onCancel, group, currentUser, socket, onGroupUpdate, setSelectedConversation }) => {
  const [groupDetails, setGroupDetails] = useState(null);
  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy chi tiết nhóm và thông tin username của thành viên
  const fetchGroupDetails = async () => {
    if (!group || !currentUser) {
      console.error("Thiếu group hoặc currentUser:", { group, currentUser });
      return;
    }
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/groups/my-groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
      }
      const groups = await response.json();
      const groupData = groups.find((g) => g.groupId === group.groupId);

      if (!groupData) {
        throw new Error("Nhóm không tồn tại");
      }

      // Đảm bảo members là mảng
      const members = Array.isArray(groupData.members) ? groupData.members : [];

      const membersWithDetails = await Promise.all(
        members.map(async (member) => {
          try {
            const userResponse = await fetch(`http://localhost:5000/api/users/getUserById/${member.userId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (!userResponse.ok) {
              throw new Error(`Lỗi khi lấy thông tin người dùng ${member.userId}`);
            }
            const userData = await userResponse.json();
            return {
              ...member,
              username: userData.username || userData.email || member.email || "Unknown User",
              avatarUrl: userData.avatarUrl || "https://up-load-file-tranquocanh.s3.amazonaws.com/default-avatar.png",
            };
          } catch (error) {
            console.error(`Lỗi khi lấy thông tin người dùng ${member.userId}:`, error.message);
            return {
              ...member,
              username: member.email || "Unknown User",
              avatarUrl: "https://up-load-file-tranquocanh.s3.amazonaws.com/default-avatar.png",
            };
          }
        })
      );

      setGroupDetails({
        ...groupData,
        members: membersWithDetails,
      });
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết nhóm:", error.message);
      message.error("Không thể tải thông tin nhóm, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchGroupDetails();
    }
  }, [group, visible]);

  // Xử lý Socket.IO cho cập nhật thời gian thực
  useEffect(() => {
    if (!socket || !group || !visible) return;

    socket.on(`groupMemberUpdated_${group.groupId}`, async (data) => {
      console.log("Nhận sự kiện groupMemberUpdated, groupId:", group.groupId, "data:", data);
      try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
          message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          return;
        }

        // Đảm bảo data.group.members là mảng
        const members = Array.isArray(data.group.members) ? data.group.members : [];

        const membersWithDetails = await Promise.all(
          members.map(async (member) => {
            try {
              const userResponse = await fetch(`http://localhost:5000/api/users/getUserById/${member.userId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              if (!userResponse.ok) {
                throw new Error(`Lỗi khi lấy thông tin người dùng ${member.userId}`);
              }
              const userData = await userResponse.json();
              return {
                ...member,
                username: userData.username || userData.email || member.email || "Unknown User",
                avatarUrl: userData.avatarUrl || "https://up-load-file-tranquocanh.s3.amazonaws.com/default-avatar.png",
              };
            } catch (error) {
              console.error(`Lỗi khi lấy thông tin người dùng ${member.userId}:`, error.message);
              return {
                ...member,
                username: member.email || "Unknown User",
                avatarUrl: "https://up-load-file-tranquocanh.s3.amazonaws.com/default-avatar.png",
              };
            }
          })
        );

        setGroupDetails((prev) => ({
          ...prev,
          members: membersWithDetails,
          ownerId: data.group.ownerId,
        }));
        onGroupUpdate();
        if (data.type === "member_removed" && data.userId === currentUser.userId) {
          message.info("Bạn đã bị xóa khỏi nhóm");
          setSelectedConversation(null);
          onCancel();
        }
      } catch (error) {
        console.error("Lỗi khi xử lý cập nhật thành viên:", error.message);
        message.error("Không thể cập nhật danh sách thành viên");
      }
    });

    socket.on(`groupDisbanded_${currentUser.userId}`, (data) => {
      console.log("Nhận sự kiện groupDisbanded, data:", data);
      if (data.groupId === group.groupId) {
        message.info(`Nhóm ${data.groupName} đã bị giải tán`);
        setSelectedConversation(null);
        onCancel();
        onGroupUpdate();
      }
    });

    socket.on(`groupOwnerChanged_${currentUser.userId}`, (data) => {
      console.log("Nhận sự kiện groupOwnerChanged, data:", data);
      if (data.groupId === group.groupId) {
        message.info(`Bạn đã được chọn làm trưởng nhóm của ${data.groupName}`);
        fetchGroupDetails();
      }
    });

    return () => {
      socket.off(`groupMemberUpdated_${group.groupId}`);
      socket.off(`groupDisbanded_${currentUser.userId}`);
      socket.off(`groupOwnerChanged_${currentUser.userId}`);
    };
  }, [socket, group, currentUser, onGroupUpdate, setSelectedConversation]);

  const handleAddMember = () => {
    if (!currentUser || !socket) {
      message.error("Vui lòng đăng nhập và kết nối server để thêm thành viên");
      return;
    }
    console.log("Mở modal thêm thành viên");
    setIsAddMemberVisible(true);
  };

  const handleRemoveMember = (memberId, username, role) => {
    if (!socket || !currentUser) {
      message.error("Vui lòng đăng nhập và kết nối server để xóa thành viên");
      return;
    }
    if (!isAdmin && !isCoAdmin) {
      message.error("Bạn không có quyền xóa thành viên");
      return;
    }
    if (isCoAdmin && !isAdmin && memberId === groupDetails.ownerId) {
      message.error("Phó nhóm không được phép xóa trưởng nhóm");
      return;
    }
    console.log("Xóa thành viên, memberId:", memberId, "username:", username, "role:", role);
    socket.emit("removeMember", {
      groupId: group.groupId,
      userId: currentUser.userId,
      memberIdToRemove: memberId,
    }, (response) => {
      if (response.error) {
        console.error("Lỗi khi xóa thành viên:", response.error);
        message.error(response.error.message);
      } else {
        message.success(`Đã xóa ${username} ${role === "co-admin" ? "(phó nhóm)" : ""} khỏi nhóm`);
      }
    });
  };

  const handleDisbandGroup = () => {
    if (!socket || !currentUser || !isAdmin) {
      message.error("Chỉ trưởng nhóm mới có quyền giải tán nhóm");
      return;
    }
    console.log("Giải tán nhóm, groupId:", group.groupId);
    socket.emit("group:disband", {
      groupId: group.groupId,
      userId: currentUser.userId,
    }, (response) => {
      if (response.error) {
        console.error("Lỗi khi giải tán nhóm:", response.error);
        message.error(response.error.message);
      } else {
        message.success("Nhóm đã được giải tán thành công");
        setSelectedConversation(null);
        onCancel();
      }
    });
  };

  const handleLeaveGroup = () => {
    if (!socket || !currentUser) {
      message.error("Vui lòng đăng nhập và kết nối server để rời nhóm");
      return;
    }
    console.log("Rời nhóm, groupId:", group.groupId, "userId:", currentUser.userId);
    onCancel();
    socket.emit("group:leave", {
      groupId: group.groupId,
      userId: currentUser.userId,
    }, (response) => {
      if (response.error) {
        console.error("Lỗi khi rời nhóm:", response.error);
        message.error(response.error.message || "Không thể rời nhóm, vui lòng thử lại");
      } else {
        message.success("Rời nhóm thành công");
        setSelectedConversation(null);
        onGroupUpdate();
      }
    });
  };

  const handleAssignCoAdmin = (memberId, username) => {
    if (!socket || !currentUser || !isAdmin) {
      message.error("Chỉ trưởng nhóm mới có quyền gán phó nhóm");
      return;
    }
    console.log("Gán phó nhóm, memberId:", memberId, "username:", username);
    socket.emit("assignCoAdmin", {
      groupId: group.groupId,
      userId: currentUser.userId,
      newAdminId: memberId,
    }, (response) => {
      if (response.error) {
        console.error("Lỗi khi gán phó nhóm:", response.error);
        message.error(response.error.message);
      } else {
        message.success(`Đã gán ${username} làm phó nhóm`);
      }
    });
  };

  const isAdmin = groupDetails?.ownerId === currentUser?.userId;
  const isCoAdmin = groupDetails?.members?.some(
    (m) => m.userId === currentUser?.userId && m.role === "co-admin"
  );

  const ownerUsername = groupDetails?.members?.find(m => m.userId === groupDetails.ownerId)?.username || "Unknown User";

  return (
    <Modal
      title={`Thông tin nhóm: ${group?.name || "Nhóm"}`}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Title level={4}>Tên nhóm: {groupDetails?.name}</Title>
          <Text>Trưởng nhóm: {ownerUsername}</Text>
          <div style={{ marginTop: 16 }}>
            <Title level={5}>Danh sách thành viên ({groupDetails?.members?.length || 0})</Title>
            {(isAdmin || isCoAdmin) && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={handleAddMember}
                style={{ marginBottom: 16 }}
              >
                Thêm thành viên
              </Button>
            )}
            <List
              dataSource={Array.isArray(groupDetails?.members) ? groupDetails.members : []}
              renderItem={(member) => (
                <List.Item
                  actions={
                    (isAdmin || isCoAdmin) && member.userId !== groupDetails.ownerId && member.userId !== currentUser.userId
                      ? [
                          isAdmin && (
                            <Popconfirm
                              title={`Gán ${member.username} làm phó nhóm?`}
                              onConfirm={() => handleAssignCoAdmin(member.userId, member.username)}
                              okText="Có"
                              cancelText="Không"
                            >
                              <Button type="link">Gán phó nhóm</Button>
                            </Popconfirm>
                          ),
                          <Popconfirm
                            title={`Xóa ${member.username} khỏi nhóm?`}
                            onConfirm={() => handleRemoveMember(member.userId, member.username, member.role)}
                            okText="Có"
                            cancelText="Không"
                          >
                            <Button type="link" danger>
                              Xóa
                            </Button>
                          </Popconfirm>,
                        ]
                      : []
                  }
                >
                  <List.Item.Meta
                    avatar={<Avatar src={member.avatarUrl} />}
                    title={member.username}
                    description={member.role === "admin" ? "Trưởng nhóm" : member.role === "co-admin" ? "Phó nhóm" : "Thành viên"}
                  />
                </List.Item>
              )}
            />
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            {isAdmin && (
              <Popconfirm
                title="Bạn có chắc muốn giải tán nhóm? Hành động này không thể hoàn tác."
                onConfirm={handleDisbandGroup}
                okText="Có"
                cancelText="Không"
              >
                <Button type="danger" icon={<DeleteOutlined />}>
                  Giải tán nhóm
                </Button>
              </Popconfirm>
            )}
            <Popconfirm
              title="Bạn có chắc muốn rời nhóm?"
              onConfirm={handleLeaveGroup}
              okText="Có"
              cancelText="Không"
            >
              <Button icon={<CloseCircleOutlined />}>Rời nhóm</Button>
            </Popconfirm>
          </div>
        </>
      )}
      <GroupAddMember
        visible={isAddMemberVisible}
        onCancel={() => setIsAddMemberVisible(false)}
        groupId={group?.groupId}
        currentUser={currentUser}
        socket={socket}
        onMemberAdded={fetchGroupDetails}
      />
    </Modal>
  );
};

export default GroupInfo;
