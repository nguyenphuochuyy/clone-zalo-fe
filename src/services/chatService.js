const fetchListGroups = async () => {
   try{
    const response = await fetch("http://localhost:5000/api/group/list", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Gửi token trong header
      },
    });
    if (response.status === 200) {
      const data = await response.json();
      return data; // Trả về dữ liệu nhóm
    } else {
      console.error("Lỗi khi lấy danh sách nhóm:", response.statusText);
    }
   }catch (error) {
    console.error("Lỗi khi lấy danh sách nhóm:", error); // In lỗi nếu có
   }
}
const fetchRecallMessage = async (conversationId, timestamp) => {
  try {
    const response = await fetch("http://localhost:5000/api/chat/recall", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Gửi token trong header
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId,
        timestamp,
      }),
    });
    if (response.status === 200) {
      const data = await response.json();
      return data; 
    } else {
      console.error("Lỗi khi lấy danh sách nhóm:", response.statusText);
    }
   }catch (error) {
    console.error("Lỗi khi lấy danh sách nhóm:", error); // In lỗi nếu có
   }
}
const fetchGroupMessage = async (groupId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/group-chat/${groupId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!response.ok) throw new Error("Lỗi");
      const data = await response.json();
      return data;
    } catch (error) {
      console.log("Lỗi khi lấy danh sách nhóm:", error);
    
      
    }
}

  // Lấy danh sách nhóm của người dùng
  const fetchListGroup = async () => {
    const response = await fetch(`http://localhost:5000/api/groups/my-groups`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) {
      console.log(" Lỗi khi lấy danh sách nhóm :", response.statusText);
      
      return;
    }
    const data = await response.json();
    return data;
  };
 // lấy danh sách bạn bè của người dùng
 const getListFriends = async () => {
    const friendResponse = await fetch('http://localhost:5000/api/friend/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    if (!friendResponse.ok) {
      console.log('Lỗi khi lấy danh sách bạn bè:', friendResponse.statusText);
      return;
    }
    const friendData = await friendResponse.json();
    return friendData;
 }
 // tạo tin nhắn mới 
 const createMessage = async (formData) => {
  const response = await fetch('http://localhost:5000/api/chat/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      senderId : formData.senderId,
      receiverId: formData.receiverId,
      content: formData.content,
      type: formData.type,
      isRead : formData.isRead,
      timestamp: formData.timestamp,
    }),
  });
  
  if (!response.ok) {
    console.error('Lỗi khi tạo tin nhắn:', response.statusText);
    return;
  }
  const data = await response.json();
  return data;
 }
export {
  fetchListGroups,
  fetchRecallMessage,
  fetchGroupMessage,
  fetchListGroup,
  getListFriends,
  createMessage
}