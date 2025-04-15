// ResetPasswordPage.js
import React, { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import "./resetpassword.css"
const ResetPasswordPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams(); // Sử dụng useSearchParams để lấy token từ URL
  // lấy token từ url 
  const token = searchParams.get('token'); // Giả sử token được truyền qua query string như ?token=abc123
  // Hàm xử lý khi submit form
  const onFinish = async (values) => {
    setLoading(true);
    const newPassword = values.newPassword;
    const confirmPassword = values.confirmPassword;

    try {
   
      // Gửi yêu cầu đặt lại mật khẩu đến server
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });
      if (response.ok) {
        message.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại!');
        // Chuyển hướng người dùng về trang login sau 2 giây
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Validate xác nhận mật khẩu
  const validateConfirmPassword = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue('newPassword') === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
    },
  });

  return (
    <div className="reset-password-container">
      <Card className="reset-password-card" title="Đặt lại mật khẩu">
        <Form
          form={form}
          name="reset_password"
          onFinish={onFinish}
          layout="vertical"
          style={{ maxWidth: 400 }}
        >
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              {
                required: true,
                message: 'Vui lòng nhập mật khẩu mới!',
              },
              {
                min: 6,
                message: 'Mật khẩu phải có ít nhất 6 ký tự!',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu mới"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['newPassword']}
            rules={[
              {
                required: true,
                message: 'Vui lòng xác nhận mật khẩu!',
              },
              validateConfirmPassword,
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Xác nhận mật khẩu"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;