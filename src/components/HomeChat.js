import ChatList from './ChatList.js';
import ChatWindow from './ChatWindows.js';

// component chính của trang chat khi người dùng login thành công
const { useState } = require('react');
const { Layout , Sider , Content } = require('antd');
const HomeChat = ({ chatList })=>{

    // state để lưu trữ cuộc hội thoại đã chọn
    const [selectedChat, setSelectedChat] = useState(null);
    // hàm xử lý khi người dùng chọn một cuộc hội thoại
    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
    };
    // render giao diện của trang chat
    return (
        <Layout style={{ height: '100vh' }}>
          <Sider width={300} theme="light">
            <ChatList chats={chatList} onSelectChat={handleSelectChat} />
          </Sider>
          <Content>
            {selectedChat ? (
              <ChatWindow chat={selectedChat} />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Chọn một cuộc hội thoại để bắt đầu
              </div>
            )}
          </Content>
        </Layout>
      );
}
export default HomeChat;
