const getMessageType = (file) => {
  if (!file) return "text"; // Không có file, mặc định là text

  // Lấy tên file từ object File
  const fileName = file.name || file.originFileObj?.name;
  if (!fileName) return "file"; // Nếu không có tên file, mặc định là file

  // Lấy đuôi file (extension) và chuyển thành chữ thường
  const extension = fileName.split(".").pop().toLowerCase();

  // Danh sách các đuôi file cho từng loại
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
  const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm"];

  // Xác định type dựa trên đuôi file
  if (imageExtensions.includes(extension)) {
    return "image";
  } else if (videoExtensions.includes(extension)) {
    return "video";
  } else {
    return "file";
  }
};

export {
  getMessageType,
}