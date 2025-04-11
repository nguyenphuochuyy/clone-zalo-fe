import React, { useState } from 'react';
import {  Button, Form, Input, message, Modal, } from 'antd';
import {
    EditOutlined,

  UserOutlined,
} from '@ant-design/icons';
import Title from 'antd/es/typography/Title';
import { data } from 'react-router-dom';
import { TbLockPassword } from "react-icons/tb";
const ModalForgetPassword = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
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
        const { email } = values;
    
        try {
          // Gửi yêu cầu đến API để gửi link reset password (giả lập)
          const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
    
          const data = await response.json();
    
          if (response.ok) {
            message.success('Link đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra email của bạn.');
            setIsModalOpen(false);
            form.resetFields();
          } else {
            message.error(data.message || 'Có lỗi xảy ra khi gửi link đặt lại mật khẩu!');
          }
        } catch (error) {
          message.error('Có lỗi xảy ra! Vui lòng thử lại sau.');
        }
      }; 
  return (
    <>
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}} onClick={showModal}>
          <p>Quên mật khẩu</p>
    </div>
      <Modal open={isModalOpen} onOk={handleOk} onCancel={handleCancel} title="Thông tin tài khoản"
        footer={null}
        width={400}
    >
    
        <div>
            <Title level={5} style={{ margin: 0 , fontSize: '19px' , fontWeight: '500' , color: '#333' }}>
                Quên mật khẩu
            </Title>
        </div>
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="email"
            label="Email đã đăng ký"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input placeholder="Nhập email đã đăng ký" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Gửi link đặt lại mật khẩu
            </Button>
          </Form.Item>
        </Form>
     
      </Modal>
    </>
  );
};
export default ModalForgetPassword;