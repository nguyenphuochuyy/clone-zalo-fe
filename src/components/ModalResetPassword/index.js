import React, { useState } from 'react';
import {  Button, Form, Input, message, Modal, } from 'antd';
import { RiLockPasswordLine } from "react-icons/ri";
import {
    EditOutlined,

  UserOutlined,
} from '@ant-design/icons';
import Title from 'antd/es/typography/Title';
import { data } from 'react-router-dom';
import { TbLockPassword } from "react-icons/tb";
const ModalResetPassword = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loadings, setLoadings] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
    //submit form
    const handleSubmit = async (values) => {
        const currentPassword = values.currentPassword;
        const newPassword = values.newPassword;
        setLoadings(true);
        try {
          // Gửi yêu cầu đến API để cập nhật mật khẩu
          const response = await fetch('http://localhost:5000/api/user/update-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({currentPassword, newPassword}) 
          
          })
          const data = await response.json();
          if (response.ok) {
            // Xử lý thành công thông báo thành công sau 2 giây thì chuyển hướng về trang đăng nhập
            setLoadings(false);
            message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại!');
            localStorage.removeItem('token'); // Xóa token khỏi localStorage
            setIsModalOpen(false);
            form.resetFields();
            setTimeout(() => {
              window.location.href = '/login'; // Chuyển hướng đến trang đăng nhập
            }, 3000);
          } else {
            message.error(data.message || 'Có lỗi xảy ra khi gửi link đặt lại mật khẩu!');
          }
        } catch (error) {
          message.error('Có lỗi xảy ra! Vui lòng thử lại sau.');
        }
      }; 
  return (
    <>
    
     <div style={{display: 'flex', alignItems: 'center'}} onClick={showModal}>
          <RiLockPasswordLine style={{fontSize : '16px' , marginRight : '5px'}} ></RiLockPasswordLine>
          <p>Đổi mật khẩu</p>
        </div>
      <Modal open={isModalOpen} onOk={handleOk} onCancel={handleCancel} 
        footer={null}
        width={400}
    >
        <div>
            <Title level={5} style={{ margin: 0 , fontSize: '19px' , fontWeight: '500' , color: '#333' }}>
                Đổi mật khẩu
            </Title>
        </div>
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="currentPassword"
            label="Mật hiện tại"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới"  />
          </Form.Item>
          {/* xác nhận mật khẩu mới */}
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu mới" /> 
          </Form.Item>
          <Form.Item>
            <Button loading = {loadings} type="primary" htmlType="submit" block>
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
     
      </Modal>
    </>
  );
};
export default ModalResetPassword;