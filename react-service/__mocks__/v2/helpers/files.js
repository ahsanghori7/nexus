// Mock for v2/helpers/files
export const sizeFileIsCorrect = jest.fn((file, maxSize) => {
  if (!file) return false;
  // Simulate file size check
  const fileSizeInMB = file.size ? file.size / (1024 * 1024) : 1; // Default to 1MB if no size
  return fileSizeInMB <= maxSize;
});

export const formatFileSize = jest.fn((bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

export const validateFileType = jest.fn((file, allowedTypes) => {
  if (!file || !file.type) return false;
  return allowedTypes.includes(file.type);
});
