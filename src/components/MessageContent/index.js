// import { Typography } from 'antd';
// import React from 'react';
// import { MdOutlineFileOpen } from 'react-icons/md';

// const { Text } = Typography;

// const MessageContent = ({ msg }) => {
//   return (
//     <div style={{ maxWidth: '300px', margin: '5px' }}>
//       {msg.isRecalled ? (
//         <Text type="secondary" italic>
//           Tin nhắn đã bị thu hồi
//         </Text>
//       ) : (
//         <>
//           {msg.type === 'text' && msg.content && (
//             <Text>{msg.content}</Text>
//           )}
//           {msg.type === 'image' && msg.fileUrl && (
//             <img
//               src={msg.fileUrl}
//               alt="Shared_Image"
//               style={{
//                 maxWidth: '100%',
//                 maxHeight: '100%',
//                 objectFit: 'contain',
//                 borderRadius: '8px',
//               }}
//               onError={(e) => {
//                 console.error('Lỗi tải ảnh:', msg.fileUrl);
//                 e.target.alt = 'Không thể tải ảnh';
//               }}
//             />
//           )}
//           {msg.type === 'video' && msg.fileUrl && (
//             <video
//               src={msg.fileUrl}
//               controls
//               style={{
//                 maxWidth: '100%',
//                 maxHeight: '200px',
//                 borderRadius: '8px',
//               }}
//               onError={(e) => {
//                 console.error('Lỗi tải video:', msg.fileUrl);
//               }}
//             />
//           )}
//           {msg.type === 'file' && msg.fileUrl && (
//             <a
//               href={msg.fileUrl}
//               download
//               style={{
//                 textDecoration: 'none',
//                 color: '#000',
//                 display: 'flex',
//                 alignItems: 'center',
//                 padding: '10px',
//                 borderRadius: '5px',
//               }}
//             >
//               File đính kèm
//               <MdOutlineFileOpen style={{ fontSize: '24px', color: '#fff' }} />
//             </a>
//           )}
//           {!msg.content && !msg.fileUrl && (
//             <Text type="secondary">Tin nhắn không có nội dung</Text>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default MessageContent;

import { Typography } from 'antd';
import React from 'react';
import { MdOutlineFileOpen } from 'react-icons/md';

const { Text } = Typography;

const MessageContent = ({ msg, onMediaLoad }) => {
  const handleMediaLoad = (type) => {
    if (onMediaLoad) {
      onMediaLoad();
      console.log(`${type} đã tải xong: ${msg.fileUrl}`);
    }
  };

  const handleMediaError = (type, error) => {
    console.error(`Lỗi tải ${type}: ${msg.fileUrl}`, error);
  };

  return (
    <div style={{ maxWidth: '300px', margin: '5px' }}>
      {msg.isRecalled ? (
        <Text type="secondary" italic>
          Tin nhắn đã bị thu hồi
        </Text>
      ) : (
        <>
          {msg.type === 'text' && msg.content && (
            <Text>{msg.content}</Text>
          )}
          {msg.type === 'image' && msg.fileUrl && (
            <img
              src={msg.fileUrl}
              alt="Shared_Image"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
              onLoad={() => handleMediaLoad('Hình ảnh')}
              onError={(e) => {
                handleMediaError('Hình ảnh', e);
                e.target.alt = 'Không thể tải ảnh';
              }}
            />
          )}
          {msg.type === 'video' && msg.fileUrl && (
            <video
              src={msg.fileUrl}
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                borderRadius: '8px',
              }}
              onLoadedMetadata={() => handleMediaLoad('Video')}
              onError={(e) => handleMediaError('Video', e)}
            />
          )}
          {msg.type === 'file' && msg.fileUrl && (
            <a
              href={msg.fileUrl}
              download
              style={{
                textDecoration: 'none',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                borderRadius: '5px',
              }}
            >
              File đính kèm
              <MdOutlineFileOpen style={{ fontSize: '24px', color: '#fff' }} />
            </a>
          )}
          {!msg.content && !msg.fileUrl && (
            <Text type="secondary">Tin nhắn không có nội dung</Text>
          )}
        </>
      )}
    </div>
  );
};

export default MessageContent;