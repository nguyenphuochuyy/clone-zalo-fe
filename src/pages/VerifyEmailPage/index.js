import React from 'react';
import { Typography, Row, Col, Button } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';


const { Title, Text } = Typography;

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your-email@example.com';

  return (
    <div className="verify-email-container">
      <Row justify="center" align="middle" className="verify-email-row">
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <div className="logo">
            <Title level={2} style={{ color: '#0068FF', textAlign: 'center' }}>
              Zalo
            </Title>
            <Text style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
              Xác thực tài khoản Zalo
            </Text>
          </div>

          <div className="verify-email-box">
            <div style={{ textAlign: 'center' }}>
              <MailOutlined style={{ fontSize: 64, color: '#0068FF', marginBottom: 16 }} />
              <Title level={4}>Kiểm tra email của bạn</Title>
              <Text>
                Chúng tôi đã gửi một email xác thực đến <strong>{email}</strong>. <br />
                Vui lòng kiểm tra hộp thư (hoặc thư rác) và nhấp vào liên kết để kích hoạt tài khoản.
              </Text>
              <div style={{ marginTop: 24 }}>
                <Button type="primary" onClick={() => navigate('/login')}>
                  Quay lại đăng nhập
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default VerifyEmailPage;