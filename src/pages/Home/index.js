import React from 'react';
import { Row, Col, Typography, Button, Image, Checkbox } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import './home.css'; 
const { Title, Text } = Typography;

const HomePage = () => {
  return (
    <div className="download-container">
  
      <div className="header">
        <Title level={3} style={{ color: '#0068FF', margin: 0 }}>
          Zalo
        </Title>
        <Text className="header-link">Đăng nhập</Text>
      </div>

    
      <div className="content">
        <Row justify="center" align="middle" className="content-row">
          <Col xs={22} sm={20} md={16} lg={12} xl={10}>
            <div className="download-box">
              <Row gutter={[32, 32]} align="middle">
                <Col xs={24} md={12}>
                  <Title level={2}>Tải Zalo PC cho máy tính</Title>
                  <Text>
                    Ứng dụng Zalo PC đã có mặt trên Windows, Mac OS, Web
                  </Text>
                  <div style={{ margin: '16px 0' }}>
                    <Checkbox checked disabled>
                      Gửi file, ảnh, video dung lượng lớn lên đến 1GB
                    </Checkbox>
                    <br />
                    <Checkbox checked disabled>
                      Đồng bộ tin nhắn với phiên bản di động
                    </Checkbox>
                    <br />
                    <Checkbox checked disabled>
                      Tiện lợi cho công việc và trao đổi công việc
                    </Checkbox>
                  </div>
                  <div className="button-group">
                    <Button
                      type="primary"
                      icon={<UserOutlined />}
                      size="large"
                      className="custom-button"
                      onClick={() => window.location.href = '/login'}
                    >
                      Đăng nhập
                    </Button>
                    <Button
                      type="default"
                      icon={<UserOutlined />}
                      size="large"
                      className="custom-button"
                      onClick={() => window.location.href = '/register'}
                    >
                      Đăng ký
                    </Button>
                  </div>
                </Col>

 
                <Col xs={24} md={12}>
                  <Image
                    src="https://stc-zaloprofile.zdn.vn/pc/v1/images/img_pc.png"
                    alt="Zalo PC"
                    preview={false}
                    style={{ width: '100%' , height: 'auto'}}
                  />
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </div>

      {/* Footer */}
      <div className="footer">
        <Text>
          © 2025 sản phẩm của nhóm 8 - CNMM - Khoa CNTT - ĐH Công Nghiệp Thành Phố Hồ Chí Minh
        </Text>
      </div>
    </div>
  );
};

export default HomePage;