import React, { useState } from "react";
import { Avatar, Button, Descriptions, message, Modal, Upload } from "antd";
import { EditOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import { data } from "react-router-dom";

const ModalProfile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [profile, setProfile] = useState(userProfile); // Trạng thái thông tin người dùng
  const [file, setFile] = useState(null); // File ảnh được chọn
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // Xử lý khi chọn file ảnh
  const handleBeforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Bạn chỉ có thể tải lên file ảnh!");
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      // setAvatar(e.target.result); // Hiển thị preview của ảnh
    };
    reader.readAsDataURL(file);
    setFile(file); // Lưu file để gửi lên server
    return false; // Ngăn upload tự động
  };
  // Xử lý cập nhật avatar
  const handleUpdateAvatar = async () => {
    if (!file) {
      message.warning("Vui lòng chọn ảnh trước khi cập nhật!");
      return;
    }
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      // Gửi ảnh lên server (giả lập)
      const response = await fetch(
        "http://localhost:5000/api/user/update-avatar",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        message.success("Cập nhật avatar thành công!");
        const data = await response.json();
        setUser((prevUser) => ({ ...prevUser, avatar: data.avatarUrl })); // Cập nhật avatar mới
        setFile(null); // Reset file sau khi cập nhật
      } else {
        message.error("Cập nhật avatar thất bại!");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật avatar!");
    }
  };
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onClick={showModal}
      >
        <UserOutlined
          style={{ fontSize: "16px", marginRight: "5px" }}
        ></UserOutlined>
        <p>Quản lý tài khoản</p>
      </div>

      <Modal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        title="Thông tin tài khoản"
        footer={null}
        width={400}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 16,
            marginTop: 16,
          }}
        >
          <Avatar
            src={
             user.avatarUrl || "https://www.gravatar.com/avatar/"
            }
            size={64}
            style={{ marginRight: 16 }}
          />
          {/* Upload avatar mới */}
          <div>
            <Upload
              beforeUpload={handleBeforeUpload}
              showUploadList={false}
              accept="image/*"
            >
              <div
                style={{
                  width: 17,
                  height: 17,
                  borderRadius: 20,
                  backgroundColor: "#fff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "absolute",
                  left: "65px",
                  top: "110px",
                  cursor: "pointer",
                  zIndex: 1,
                  padding: 5,
                  border: "1px solid #ddd",
                }}
              >
                <UploadOutlined style={{ fontSize: 16 }} />
              </div>
            </Upload>

            <Title
              Title
              level={5}
              style={{
                margin: 0,
                fontSize: "19px",
                fontWeight: "500",
                color: "#333",
              }}
            >
              {user.username}
            </Title>
          </div>
        </div>
        {/* Thông tin cá nhân */}
        <Title level={5} style={{ marginBottom: 16 }}>
          Thông tin cá nhân
        </Title>

        <Descriptions column={1} bordered>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {user.isVerified ? <>đã xác thực</> : <>chưa xác thực</>}
          </Descriptions.Item>
        </Descriptions>

        {/* Nút Cập nhật */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {file && (
            <Button type="primary" onClick={handleUpdateAvatar}>
              Cập nhật avatar
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
};
export default ModalProfile;
