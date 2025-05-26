import { Typography } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineFileOpen } from "react-icons/md";

const { Title, Text } = Typography;


// Thành phần hiển thị tin nhắn
const MessageContent = ({ msg}) => {
  return (
    <div style={{ maxWidth: '300px', margin: '5px' }}>
      {msg.type === 'text' && (
        <Text>{msg.content}</Text>
      )}
      {msg.type === 'image' && (
        <img
          src={msg.fileUrl}
          alt="Shared_Image"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
          }}
          onError={(e) => {
            console.error('Lỗi tải ảnh:', msg.fileUrl);
          }}
        />
      )}
      {msg.type === 'video' && (
        <video
          src={msg.fileUrl}
          controls
          style={{
            maxWidth: '100%',
            maxHeight: '200px',
            borderRadius: '8px',
          }}
          onError={(e) => {
            console.error('Lỗi tải video:', msg.fileUrl);
          }}
        />
      )}
      {msg.type === 'file' && (


          <a 
            href={msg.fileUrl} 
            download 
            style={{ textDecoration: 'none', color: '#000' , display: 'flex', alignItems: 'center',padding: '10px', borderRadius: '5px' }}
          >
              File đính kèm
            <MdOutlineFileOpen style={{ fontSize: '24px', color: '#fff' }} />
          </a>
   
     
      )}
    </div>
  );
};

export default MessageContent;