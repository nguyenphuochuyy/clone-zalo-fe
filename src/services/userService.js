const getUserInfo = async (userId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/user/getUserById/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) {
      console.error('Lỗi khi lấy thông tin người dùng:', response.statusText);
      return;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
  }
}

export{
  getUserInfo,
}