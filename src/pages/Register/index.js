import React, { useState } from 'react';
import { Form, Input, Button, Typography, Row, Col, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { AiOutlineUser } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css'; // Custom CSS file

const { Title, Text, Link } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // State to control the loading indicator

  const onFinish = async (values) => {
    setLoading(true); // Set loading to true when the registration starts
    const { email, username, password } = values;

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          username: username,
          password: password,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        message.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
        navigate('/verify-email', { state: { email: values.email } });
      } else {
        message.error(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      message.error('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false); // Set loading back to false when the registration finishes (success or error)
    }
  };

  return (
    <div className="register-container">
      <Row justify="center" align="middle" className="register-row">
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          {/* Zalo Logo */}
          <div className="logo">
            <Title level={2} style={{ color: '#0068FF', textAlign: 'center' }}>
              Zalo
            </Title>
            <Text style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
              Đăng ký tài khoản Zalo <br /> để kết nối với ứng dụng Zalo.me
            </Text>
          </div>

          {/* Registration Form */}
          <div className="register-form">
            <Title level={4} style={{ textAlign: 'center' }}>
              Đăng ký tài khoản
            </Title>
            <Form
              name="register_form"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              layout="vertical"
            >
              {/* Email Field */}
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
              </Form.Item>
              {/* Username Field */}
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên người dùng!' },
                  {
                    min: 3,
                    message: 'Tên người dùng phải có ít nhất 3 ký tự!',
                  },
                ]}
              >
                <Input prefix={<AiOutlineUser />} placeholder="Tên người dùng" size="large" />
              </Form.Item>
              {/* Password Field */}
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Mật khẩu"
                  size="large"
                />
              </Form.Item>

              {/* Register Button */}
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading} // Bind the loading state to the button
                >
                  Đăng ký
                </Button>
              </Form.Item>

              {/* Link to Login */}
              <Form.Item>
                <Link style={{ display: 'block', textAlign: 'center' }} href="/login">
                  Đã có tài khoản? Đăng nhập
                </Link>
              </Form.Item>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default RegisterPage;