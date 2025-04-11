import React from 'react';
import { Form, Input, Button, Typography, Row, Col ,message} from 'antd';
import { LockOutlined, PhoneOutlined, MailOutlined , } from '@ant-design/icons';
import { AiOutlineUser } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css'; // File CSS tùy chỉnh

const { Title, Text, Link } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();
  const onFinish = (values) => {
    const email = values.email;
    const username = values.username;
    const password = values.password;
    const fetchDataForRegister = async () => {
      const response = await fetch(' http://localhost:5000/api/auth/register', {
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
      if(response.ok) {
   
        message.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
        navigate('/verify-email', { state: { email: values.email } });
      }
      else{
        message.error(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    }
    fetchDataForRegister();

  };
  


  return (
    <div className="register-container">
      <Row justify="center" align="middle" className="register-row">
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          {/* Logo Zalo */}
          <div className="logo">
            <Title level={2} style={{ color: '#0068FF', textAlign: 'center' }}>
              Zalo
            </Title>
            <Text style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
              Đăng ký tài khoản Zalo <br /> để kết nối với ứng dụng Zalo.me
            </Text>
          </div>

          {/* Form đăng ký */}
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
              {/* Trường số điện thoại */}
             
              {/* Trường email */}
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email"
                  size="large"
                />
              </Form.Item>
              {/* Trường Username */}
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
                <Input
                  prefix={<AiOutlineUser /> }
                  placeholder="Tên người dùng"
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

        
              {/* Nút đăng ký */}
              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large">
                  Đăng ký
                </Button>
              </Form.Item>

              {/* Liên kết quay lại đăng nhập */}
              <Form.Item>
                <Link
                  style={{ display: 'block', textAlign: 'center' }}
                  href="/login"
                >
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