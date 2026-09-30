import PHPGloblals, { PHPAppClinkGloblals } from './index';

describe('PHPGloblals', () => {
  // Store the original global object properties
  const originalGlobal = {};
  
  beforeEach(() => {
    // Store original properties before each test
    originalGlobal.reactData = global.reactData;
    // Clean up global state
    delete global.reactData;
  });

  afterEach(() => {
    // Restore original properties after each test
    global.reactData = originalGlobal.reactData;
  });

  test('should return reactData when it exists in global scope', () => {
    // Arrange: Mock the global reactData
    const mockReactData = {
      csfr: 123,
      user: { id: 1, name: 'Test User' }
    };
    global.reactData = mockReactData;

    // Act: Call the function
    const result = PHPGloblals();

    // Assert: Should return the mock data
    expect(result).toEqual(mockReactData);
  });

  test('should return empty object when reactData is not defined', () => {
    // Arrange: Ensure reactData is not defined
    delete global.reactData;

    // Act: Call the function
    const result = PHPGloblals();

    // Assert: Should return empty object
    expect(result).toEqual({});
  });

  test('should return empty object when reactData access throws error', () => {
    // Arrange: Set up a scenario where accessing reactData throws
    Object.defineProperty(global, 'reactData', {
      get: () => {
        throw new Error('Access denied');
      },
      configurable: true
    });

    // Act: Call the function
    const result = PHPGloblals();

    // Assert: Should return empty object due to error handling
    expect(result).toEqual({});

    // Cleanup
    delete global.reactData;
  });

  test('should handle null reactData', () => {
    // Arrange
    global.reactData = null;

    // Act
    const result = PHPGloblals();

    // Assert
    expect(result).toBeNull();
  });

  test('should handle undefined reactData', () => {
    // Arrange
    global.reactData = undefined;

    // Act
    const result = PHPGloblals();

    // Assert
    expect(result).toBeUndefined();
  });
});

describe('PHPAppClinkGloblals', () => {
  // Store the original global object properties
  const originalGlobal = {};
  
  beforeEach(() => {
    // Store original properties before each test
    originalGlobal.config = global.config;
    // Clean up global state
    delete global.config;
  });

  afterEach(() => {
    // Restore original properties after each test
    global.config = originalGlobal.config;
  });

  test('should return config when it exists in global scope', () => {
    // Arrange: Mock the global config
    const mockConfig = {
      someKey: 'someValue',
      appName: 'Test App',
      version: '1.0.0'
    };
    global.config = mockConfig;

    // Act: Call the function
    const result = PHPAppClinkGloblals();

    // Assert: Should return the mock config
    expect(result).toEqual(mockConfig);
  });

  test('should return empty object when config is not defined', () => {
    // Arrange: Ensure config is not defined
    delete global.config;

    // Act: Call the function
    const result = PHPAppClinkGloblals();

    // Assert: Should return empty object
    expect(result).toEqual({});
  });

  test('should return empty object when config access throws error', () => {
    // Arrange: Set up a scenario where accessing config throws
    Object.defineProperty(global, 'config', {
      get: () => {
        throw new Error('Config access denied');
      },
      configurable: true
    });

    // Act: Call the function
    const result = PHPAppClinkGloblals();

    // Assert: Should return empty object due to error handling
    expect(result).toEqual({});

    // Cleanup
    delete global.config;
  });

  test('should handle null config', () => {
    // Arrange
    global.config = null;

    // Act
    const result = PHPAppClinkGloblals();

    // Assert
    expect(result).toBeNull();
  });

  test('should handle undefined config', () => {
    // Arrange
    global.config = undefined;

    // Act
    const result = PHPAppClinkGloblals();

    // Assert
    expect(result).toBeUndefined();
  });
});
