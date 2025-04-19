import React, { use, useEffect, useState } from 'react';
import { Avatar, Button, Form, Input, message, Modal } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
const { Title, Text } = Typography;
const SearchUserModel = ({ setSelectedUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [email, setEmail] = useState(''); // State để lưu email người dùng tìm kiếm
    const [form] = Form.useForm();
    const [user, setUser] = useState(null); // State để lưu thông tin người dùng tìm kiếm
    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = async () => {
        const values = await form.validateFields(); // Validate và lấy giá trị từ Form
        setEmail(values.email); // Lưu email vào state
        await searchUserByEmail(values.email); // Gọi hàm tìm kiếm người dùng theo email
        form.resetFields(); // Đặt lại các trường trong Form
    };
    const handleCancel = () => {
        setEmail(''); // Đặt lại email khi đóng modal
        setUser(null); // Đặt lại thông tin người dùng khi đóng modal
        setIsModalOpen(false);
    };
    const handleSendMessage = () => {
        setIsModalOpen(false); // Đóng modal sau khi gửi tin nhắn
    
        setSelectedUser(user); // Gửi thông tin người dùng đã tìm kiếm cho component cha
    }
    // hàm gọi api tìm kiếm người dùng theo email trả về người dùng
    const searchUserByEmail = async (email) => {
        try {
            const response = await fetch(`http://localhost:5000/api/user/search/${email}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },

            });
            if (!response.ok) { 
                throw new Error('Lỗi khi tìm kiếm người dùng', response.statusText);
            }
            const data = await response.json();
            // nếu có userId trả về thì call api lấy thông tin người dùng 
            if (data.userId) {
               
                const userResponse = await fetch(`http://localhost:5000/api/user/getUserById/${encodeURIComponent(data.userId)}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },

                });
                if (!userResponse.ok) {
                    throw new Error('Lỗi khi lấy thông tin người dùng', userResponse.statusText);
                }
                const userData = await userResponse.json();
                setUser(userData); // Lưu thông tin người dùng vào state
            }else{
                setUser(null); // Nếu không tìm thấy người dùng, đặt lại state user
            }   

        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }

    return (
        <>
            <Button type="text" onClick={showModal} icon={<SearchOutlined />}>
            </Button>
            <Modal title="Nhập email người dùng cần tìm" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <div>
                    <Form
                        form={form}
                        name="searchUser"
                        layout="vertical"
                        initialValues={{ email: '' }} // Giá trị khởi tạo cho Form
                        onFinish={handleOk} // Gọi handleOk khi submit Form
                    >
                        <Form.Item name="email" label="Email">
                            <Input type="email" placeholder="Nhập email người dùng" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" onClick={handleOk} style={{ width: '100%' }}>
                                Tìm kiếm
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
                <div className='search-user-result'>

                    {/* nếu có người dùng thì hiển thị nếu ko hiển thị text không tim thấy người dùng */}

                    {user && (
                        <div style={{ textAlign: 'center', padding: '20px 0', border: '1px solid #f0f0f0' }}>
                            <Avatar
                                size={80}
                                src={user?.avatarUrl}
                                icon={!user?.avatarUrl && <UserOutlined />}
                                style={{ marginBottom: 16 }}
                            />
                            <Title level={4} style={{ marginBottom: 8 }}>
                                {user?.username || 'Người dùng'}
                            </Title>
                            <Text type="secondary">{user?.email || 'Không có email'}</Text>
                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
                                <Button
                                    onClick={""}
                                    style={{ backgroundColor: '#f0f2f5', border: 'none' }}
                                >
                                    Kết bạn
                                </Button>
                                <Button type="primary" onClick={handleSendMessage} style={{ backgroundColor: '#1890ff', border: 'none' }}>
                                    Nhắn tin
                                </Button>
                            </div>
                        </div>
                    )
                    }
                  
                </div>
            </Modal>
        </>
    );
};
export default SearchUserModel;