import React, { useState, useEffect, use } from 'react';
import { Modal, Input, Button, List, Checkbox, Avatar, Typography, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getListFriends } from '../../services/chatService';


const { Title } = Typography;

// Component tạo modal để người dùng có thể tạo nhóm chat mới
const ModalCreateGroup = ({ visible, onCancel, onCreateGroup, friendsList = [], loading = false , socket }) => {
  // Các state quản lý việc tạo nhóm
  const [groupName, setGroupName] = useState(''); // Tên nhóm
  const [selectedFriends, setSelectedFriends] = useState([]); // Danh sách bạn bè đã chọn
  const [searchText, setSearchText] = useState(''); // Từ khóa tìm kiếm
  const [filteredFriends, setFilteredFriends] = useState([]); // Danh sách bạn bè đã lọc theo tìm kiếm
  const [friends, setFriends] = useState([]); // Danh sách bạn bè


 useEffect(() => {
    fetchFriends();
    
 }, [visible]);
  // hàm lấy danh sách bạn bè
  const fetchFriends = async () => {
    const response = await getListFriends();
    if (response) {
      setFriends(response.friends);
    } else {
      console.log('Lỗi khi lấy danh sách bạn bè');
    }
  }
  // Xử lý khi người dùng thay đổi tên nhóm
  const handleGroupNameChange = (e) => {
    setGroupName(e.target.value);
  };

  // Xử lý khi người dùng nhập từ khóa tìm kiếm
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  // Xử lý chọn/bỏ chọn bạn bè để thêm vào nhóm
  const handleSelectFriend = (friend) => {
    if (selectedFriends.some(f => f.userId === friend.userId)) {
      setSelectedFriends(selectedFriends.filter(f => f.userId !== friend.userId));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  // Xử lý tạo nhóm mới và đóng modal
  const handleCreateGroup = () => {
    const listFriendIds = selectedFriends.map(friend => friend.userId);
    // dùng socket để gửi thông tin nhóm mới
    socket.emit('createGroup', {
      name: groupName,
      memberIds: listFriendIds,
      avatarUrl: selectedFriends[0].avatarUrl || '',
    })

  };

  return (
    <Modal
      title="Tạo nhóm mới"
      open={visible}
      onCancel={onCancel}
      width={500}
      footer={[
        <Button key="back" onClick={onCancel}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedFriends.length === 0}
        >
          Tạo nhóm
        </Button>
      ]}
    >
      <div className="create-group-content">
        {/* Phần nhập tên nhóm */}
        <div className="group-name-section">
          <Input
            placeholder="Nhập tên nhóm"
            value={groupName}
            onChange={handleGroupNameChange}
            className="group-name-input"
          />
        </div>
        
        {/* Phần chọn bạn bè để thêm vào nhóm */}
        <div className="friends-list-section">
          <Title level={5}>Chọn bạn bè</Title>
          <Input
            placeholder="Tìm kiếm bạn bè"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleSearchChange}
            className="search-friend-input"
            style={{ marginBottom: 16 }}
          />
          
          {/* Hiển thị trạng thái loading, không có bạn bè, hoặc danh sách bạn bè */}
          {loading ? (
            <div className="friends-loading" style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin />
            </div>
          ) : friends.length === 0 ? (
            <Empty description="Không tìm thấy bạn bè" />
          ) : (
            <div className="friends-list" style={{ maxHeight: '300px', overflow: 'auto' }}>
              <List
                itemLayout="horizontal"
                dataSource={friends}
                renderItem={friend => (
                  <List.Item
                    onClick={() => handleSelectFriend(friend)}
                    className="friend-item"
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                    style={{display: 'flex', alignItems: 'center'}}
                      avatar={<Avatar src={friend.avatarUrl} />}
                      title={friend.username}
                    />
                    {/* <Checkbox checked={selectedFriends.some(f => f.id === friend.id)} /> */}
                    <Checkbox
                      checked={selectedFriends.some(f => f.userId === friend.userId)}
                      onChange={() => handleSelectFriend(friend)}
                      style={{ marginLeft: 'auto' }}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
          
          {/* Hiển thị thông tin về số bạn bè đã chọn */}
          {selectedFriends.length > 0 && (
            <div className="selected-friends-info" style={{ marginTop: 16, textAlign: 'right' }}>
              Đã chọn {selectedFriends.length} người bạn
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ModalCreateGroup;