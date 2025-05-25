import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Spin, message, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';


const { Title, Text } = Typography;

const VerifyTokenPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Lấy token từ query params
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const verifyToken = async () => {
        console.log('token', token);
        
      if (!token) {
        setStatus('error');
        message.error('Token không hợp lệ.');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/auth/verify-email?token=${token}`)
        const data = await response.json();
        if (response.ok) {
          setStatus('success');
          message.success('Xác thực tài khoản thành công! Bạn có thể đăng nhập.');
          setTimeout(() => navigate('/login'), 3000); // Chuyển hướng sau 3 giây
        } else {
          setStatus('error');
          message.error(data.message || 'Xác thực thất bại. Vui lòng thử lại.');
        }
      } catch (error) {
        setStatus('error');
        message.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="verify-token-container">
      <Row justify="center" align="middle" className="verify-token-row">
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <div className="logo">
            <Title level={2} style={{ color: '#0068FF', textAlign: 'center' }}>
              Zalo
            </Title>
            <Text style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
              Xác thực tài khoản Zalo
            </Text>
          </div>

          <div className="verify-token-box">
            <div style={{ textAlign: 'center' }}>
              {status === 'loading' && (
                <>
                  <Spin size="large" />
                  <Title level={4} style={{ marginTop: 16 }}>
                    Đang xác thực tài khoản...
                  </Title>
                </>
              )}
              {status === 'success' && (
                <>
                  <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
                  <Title level={4}>Xác thực thành công!</Title>
                  <Text>Bạn sẽ được chuyển hướng đến trang đăng nhập...</Text>
                </>
              )}
              {status === 'error' && (
                <>
                  <CloseCircleOutlined style={{ fontSize: 64, color: '#f5222d', marginBottom: 16 }} />
                  <Title level={4}>Xác thực thất bại</Title>
                  <Text>Vui lòng thử lại hoặc liên hệ hỗ trợ.</Text>
                  <div style={{ marginTop: 24 }}>
                    <Button type="primary" onClick={() => navigate('/register')}>
                      Quay lại đăng ký
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default VerifyTokenPage;