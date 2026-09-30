import validateImageDimensions, { allowedTypes } from './validateImageDimensions';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'unsupported-format': 'Unsupported format'
    };
    return translations[key] || key;
  })
}));

describe('validateImageDimensions', () => {
  // Mock FileReader
  const mockFileReader = {
    readAsDataURL: jest.fn(),
    onload: null,
    onerror: null,
    result: 'data:image/jpeg;base64,fake-image-data'
  };

  // Mock Image
  const mockImage = {
    onload: null,
    onerror: null,
    src: '',
    width: 0,
    height: 0
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock FileReader constructor
    global.FileReader = jest.fn(() => mockFileReader);
    
    // Mock Image constructor
    global.Image = jest.fn(() => mockImage);
  });

  afterEach(() => {
    // Clean up
    delete global.FileReader;
    delete global.Image;
  });

  describe('allowedTypes export', () => {
    it('should export allowed types array', () => {
      expect(allowedTypes).toEqual(['image/jpg', 'image/jpeg']);
    });
  });

  describe('file validation', () => {
    it('should reject when no file is provided', async () => {
      await expect(validateImageDimensions(null, 100, 100, 500, 500))
        .rejects
        .toThrow('No file selected');
    });

    it('should reject when file type is not allowed', async () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      
      await expect(validateImageDimensions(file, 100, 100, 500, 500))
        .rejects
        .toThrow('Unsupported format');
    });

    it('should reject when FileReader fails', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      const promise = validateImageDimensions(file, 100, 100, 500, 500);
      
      // Simulate FileReader error
      mockFileReader.onerror();
      
      await expect(promise).rejects.toThrow('Error reading file. Please try again.');
    });

    it('should reject when image fails to load', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      const promise = validateImageDimensions(file, 100, 100, 500, 500);
      
      // Simulate FileReader success
      mockFileReader.onload({ target: { result: 'fake-data-url' } });
      
      // Simulate Image error
      mockImage.onerror();
      
      await expect(promise).rejects.toThrow('Failed to load image. Please try again.');
    });
  });

  describe('dimension validation', () => {
    const setupValidImage = (width, height, fileSize = 1024) => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: fileSize });
      
      const promise = validateImageDimensions(file, 100, 100, 500, 500);
      
      // Simulate FileReader success
      mockFileReader.onload({ target: { result: 'fake-data-url' } });
      
      // Set image dimensions
      mockImage.width = width;
      mockImage.height = height;
      
      return { promise, file };
    };

    it('should reject when image is too small', async () => {
      const { promise } = setupValidImage(50, 50);
      
      // Simulate Image load success
      mockImage.onload();
      
      await expect(promise).rejects.toThrow('Image is too small. Minimum dimensions are 100x100 pixels.');
    });

    it('should reject when image is too large', async () => {
      const { promise } = setupValidImage(600, 600);
      
      // Simulate Image load success
      mockImage.onload();
      
      await expect(promise).rejects.toThrow('Image is too large. Maximum dimensions are 500x500 pixels.');
    });

    it('should resolve with image data when dimensions are valid', async () => {
      const { promise } = setupValidImage(200, 200, 2048);
      
      // Simulate Image load success
      mockImage.onload();
      
      const result = await promise;
      expect(result).toEqual({
        width: 200,
        height: 200,
        size: 2 // 2048 bytes / 1024 = 2 KB
      });
    });

    it('should handle minimum boundary dimensions', async () => {
      const { promise } = setupValidImage(100, 100, 1024);
      
      // Simulate Image load success
      mockImage.onload();
      
      const result = await promise;
      expect(result).toEqual({
        width: 100,
        height: 100,
        size: 1
      });
    });

    it('should handle maximum boundary dimensions', async () => {
      const { promise } = setupValidImage(500, 500, 1024);
      
      // Simulate Image load success
      mockImage.onload();
      
      const result = await promise;
      expect(result).toEqual({
        width: 500,
        height: 500,
        size: 1
      });
    });
  });

  describe('file processing', () => {
    it('should call FileReader.readAsDataURL with the file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      validateImageDimensions(file, 100, 100, 500, 500);
      
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });

    it('should set image src from FileReader result', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const dataUrl = 'data:image/jpeg;base64,test-data';
      
      validateImageDimensions(file, 100, 100, 500, 500);
      
      // Simulate FileReader success
      mockFileReader.onload({ target: { result: dataUrl } });
      
      expect(mockImage.src).toBe(dataUrl);
    });
  });
});