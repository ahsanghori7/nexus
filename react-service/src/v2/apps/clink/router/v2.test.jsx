// Mock all complex dependencies
jest.mock('v2/helpers/i18n', () => ({ t: (key) => key }));
jest.mock('v2/apps/clink/pages/team-manager', () => () => null);
jest.mock('v2/apps/clink/pages/instructions-variations', () => () => null);
jest.mock('v2/apps/clink/pages/ncr', () => () => null);
jest.mock('v2/apps/clink/pages/boq', () => () => null);
jest.mock('v2/apps/clink/pages/tender-analysis', () => () => null);
jest.mock('v2/apps/clink/pages/forecast-final', () => () => null);
jest.mock('v2/apps/clink/pages/orders', () => () => null);
jest.mock('v2/apps/clink/pages/update-profile', () => () => null);
jest.mock('v2/apps/clink/pages/login', () => () => null);
jest.mock('v2/apps/clink/pages/login/reset-password', () => () => null);
jest.mock('v2/apps/clink/pages/DownloadAll', () => () => null);
jest.mock('v2/apps/clink/pages/projects', () => () => null);
jest.mock('v2/apps/clink/layout', () => ({
  __esModule: true,
  default: function _default() {
    return null;
  },
  PROJECT_BREADCRUMBS: [],
  WITH_PROJECT: {},
}));
jest.mock('./InstructionsWrapper', () => ({}));
jest.mock('./SPWrapper', () => ({}));
jest.mock('v2/apps/clink/pages/project-dashboard/project-dashboard-tabs', () => () => null);
jest.mock('v2/apps/clink/pages/sos-login', () => () => null);
jest.mock('v1/file-manager/components/page', () => () => null);

import routerConfig from './v2';

describe('clink/router/v2', () => {
  // Arrange → Act → Assert

  it('should export a router configuration array', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toBeDefined();
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('should contain login route configuration', () => {
    // Arrange & Act
    const config = routerConfig;
    const loginConfig = config.find(item => item.path === '/login');

    // Assert
    expect(loginConfig).toBeDefined();
    expect(loginConfig).toHaveProperty('reactRouter', true);
    expect(loginConfig).toHaveProperty('routes');
    expect(Array.isArray(loginConfig.routes)).toBe(true);
  });

  it('should contain auth route configuration', () => {
    // Arrange & Act
    const config = routerConfig;
    const authConfig = config.find(item => item.path === '/auth');

    // Assert
    expect(authConfig).toBeDefined();
    expect(authConfig).toHaveProperty('reactRouter', true);
    expect(authConfig).toHaveProperty('routes');
  });

  it('should contain reset password route configuration', () => {
    // Arrange & Act
    const config = routerConfig;
    const resetConfig = config.find(item => item.path === '/reset-password');

    // Assert
    expect(resetConfig).toBeDefined();
    expect(resetConfig).toHaveProperty('reactRouter', true);
  });

  it('should have all route objects with proper structure', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    config.forEach((item) => {
      expect(item).toHaveProperty('path');
      expect(typeof item.path).toBe('string');
      
      if (item.routes) {
        expect(Array.isArray(item.routes)).toBe(true);
        expect(item).toHaveProperty('reactRouter');
      }
    });
  });

  it('should create snapshot of router configuration', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toMatchSnapshot();
  });
});
