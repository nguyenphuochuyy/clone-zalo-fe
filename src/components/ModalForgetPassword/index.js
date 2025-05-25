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
const ModalForgetPassword = () => {
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
        const email = values.email;
        setLoadings(true);
        try {
          // Gửi yêu cầu đến API để đặt lại mật khẩu
          const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
        
            },
            body: JSON.stringify({email}) 
          
          })
          const data = await response.json();
          if (response.ok) {
            // Xử lý thành công thông báo thành công sau 2 giây thì chuyển hướng về trang đăng nhập
            setLoadings(false);
            message.success('Chúng t tôi đã gửi link đặt lại mật khẩu đến email của bạn ,  Vui lòng kiểm tra email!');
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
          <a>Quên mật khẩu</a>
        </div>
      <Modal open={isModalOpen} onOk={handleOk} onCancel={handleCancel} 
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
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
            ]}
          >
            <Input placeholder="Nhập email" prefix={<UserOutlined />} />
          </Form.Item>
        
 
          <Form.Item>
            <Button loading = {loadings} type="primary" htmlType="submit" block>
              Lấy lại mật khẩu
            </Button>
          </Form.Item>
        </Form>
     
      </Modal>
    </>
  );
};
export default ModalForgetPassword;