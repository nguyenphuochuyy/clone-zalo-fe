const listFriendIds = async (group) => {
  try {
    const response = await fetch('http://localhost:5000/api/group-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(group),
    });
    if (!response.ok) {
      console.error('Lỗi khi tạo nhóm:', response.statusText);
      return;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi tạo nhóm:', error);
  }
}
const fetchListGroup = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/groups/my-groups', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) {
      console.error('Lỗi khi lấy danh sách nhóm:', response.statusText);
      return;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhóm:', error);
  }
}
const getListMemberOfGroup = async (groupId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/group-chat/${groupId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) {
      console.error('Lỗi khi lấy danh sách thành viên nhóm:', response.statusText);
      return;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thành viên nhóm:', error);
  }
}
export{
  listFriendIds,
  getListMemberOfGroup,
  fetchListGroup,
}