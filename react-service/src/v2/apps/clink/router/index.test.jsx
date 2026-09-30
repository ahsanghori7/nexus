// Mock the v1 and v2 router modules to avoid complex dependencies
jest.mock('./v1', () => [
  { path: '/mock-v1-route', element: '<div>Mock V1</div>' }
]);

jest.mock('./v2', () => [
  { path: '/mock-v2-route', element: '<div>Mock V2</div>' }
]);

import routerConfig from './index';

describe('clink/router/index', () => {
  // Arrange → Act → Assert

  it('should export a router configuration array', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toBeDefined();
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('should contain router configuration objects', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    config.forEach((routeConfig) => {
      expect(routeConfig).toBeInstanceOf(Object);
      expect(routeConfig).toHaveProperty('path');
    });
  });

  it('should combine v1 and v2 router configurations', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config.length).toBe(2); // One from v1 mock, one from v2 mock
    expect(config[0].path).toBe('/mock-v1-route');
    expect(config[1].path).toBe('/mock-v2-route');
  });

  it('should create snapshot of router configuration', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toMatchSnapshot();
  });
});