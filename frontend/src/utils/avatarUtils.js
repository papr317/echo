const getAvatarUrl = (relativePath) => {
  if (!relativePath) {
    return undefined; // Or a default avatar image path
  }
  // Assuming your Django backend is running on http://localhost:8000
  // and serves media files under /media/
  return `http://localhost:8000${relativePath}`;
};

export default getAvatarUrl;
