import React from 'react';
import { Form, Input, Button, Typography, Row, Col, message } from 'antd';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { AiOutlineMail } from "react-icons/ai";
import './LoginPage.css'; // File CSS tùy chỉnh

const { Title, Text, Link } = Typography;

const LoginPage = () => {
  const onFinish = (values) => {
    console.log('Received values of form: ', values);
    const email = values.email; // Lấy giá trị email từ form
    const password = values.password; // Lấy giá trị mật khẩu từ form

    
    // Gọi API đăng nhập với emal và mật khẩu
    const fetchLogin = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token); // Lưu token vào localStorage

          message.success('Đăng nhập thành công!'); // Hiển thị thông báo thành công
          // Chuyển hướng đến trang chính sau khi đăng nhập thành công
          window.location.href = '/'; // Thay đổi đường dẫn đến trang chính của bạn
        } else {
          console.error('Login failed:', response.statusText);
          // Xử lý lỗi đăng nhập tại đây
          const errorData = await response.json();
          if (errorData.message) {
            message.error(errorData.message); // Hiển thị thông báo lỗi từ server
          } else {
            message.error('Đăng nhập thất bại!'); // Thông báo lỗi chung
          }
        }
      } catch (error) {
        console.error('Error during login:', error);
      }
    }
    fetchLogin(); // Gọi hàm đăng nhập
  };

  return (
    <div className="login-container">
      <Row justify="center" align="middle" className="login-row">
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          {/* Logo Zalo */}
          <div className="logo">
            <Title level={2} style={{ color: '#0068FF', textAlign: 'center' }}>
              Zalo
            </Title>
            <Text style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
              Đăng nhập tài khoản Zalo <br /> để kết nối với ứng dụng Zalo.me
            </Text>
          </div>

          {/* Form đăng nhập */}
          <div className="login-form">
            <Title level={4} style={{ textAlign: 'center' }}>
              Đăng nhập tài khoản
            </Title>
            <Form
              name="login_form"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              layout="vertical"
            >
              {/* Trường số điện thoại */}
              <Form.Item
                name="email"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              >
                <Input
                  prefix={<AiOutlineMail />}
                  placeholder="Email"
                  size="large"
                />
              </Form.Item>

              {/* Trường mật khẩu */}
              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Mật khẩu"
                  size="large"
                />
              </Form.Item>

              {/* Nút đăng nhập */}
              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large">
                  Đăng nhập
                </Button>
              </Form.Item>

              {/* Liên kết quên mật khẩu và đăng ký */}
              <Form.Item>
                <Link
                  style={{ display: 'block', textAlign: 'center', marginBottom: 8 }}
                  href="#"
                >
                  Quên mật khẩu
                </Link>
                <Link
                  style={{ display: 'block', textAlign: 'center' }}
                  href="/register"
                >
                  Chưa có tài khoản? Đăng ký
                </Link>
              </Form.Item>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;