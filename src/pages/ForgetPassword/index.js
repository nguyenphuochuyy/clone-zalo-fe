import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import './ResetPasswordPage.css';

const { Title, Text } = Typography;

const ForgetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Lấy token từ query params
  const onFinish = async (values) => {
    const { newPassword , confirmPassword} = values;
 
    
    try {
      // Gửi yêu cầu đến API để đặt lại mật khẩu 
      const response = await fetch("http://localhost:5000/api/auth/reset-password",{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ newPassword, confirmPassword, token }), // Gửi token cùng với mật khẩu mới
      });

      const data = await response.json();
      if (response.ok) {
        message.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
        navigate('/');
      } else {
        message.error(data.message || 'Có lỗi xảy ra khi đặt lại mật khẩu!');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra! Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="reset-password-container">
      <Title level={2}>Đặt lại mật khẩu</Title>
  
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        style={{ maxWidth: 400, width: '100%' }}
      >
    
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu mới" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject('Mật khẩu xác nhận không khớp!');
              },
            }),
          ]}
        >
          <Input.Password placeholder="Xác nhận mật khẩu" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Đặt lại mật khẩu
          </Button>
        </Form.Item>

        <Form.Item>
          <Button type="link" onClick={() => navigate('/login')} block>
            Quay lại đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ForgetPasswordPage;