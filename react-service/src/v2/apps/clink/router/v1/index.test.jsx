// Mock the dependencies to avoid complex imports
jest.mock('v2/helpers/flags', () => jest.fn(() => false));
jest.mock('v2/helpers/i18n', () => ({ t: (key) => key }));
jest.mock('v2/apps/clink/layout', () => ({
  __esModule: true,
  default: function _default() {
    return null;
  },
  PROJECT_BREADCRUMBS: [],
}));
jest.mock('./company-assets', () => {
  const mockRoutes = [];
  return {
    __esModule: true,
    default: mockRoutes,
    buildCompanyAssetsRoutes: jest.fn(() => mockRoutes),
  };
});
jest.mock('v1/supply-chain-v2/components/page', () => () => null);
jest.mock('v2/apps/clink/pages/tender-templates', () => () => null);
jest.mock('v1/tender-templates/components/Page', () => () => null);
jest.mock('v1/file-manager/components/page', () => () => null);
jest.mock('v1/procurement-schedule/components/page', () => () => null);
jest.mock('v2/apps/clink/pages/transactions', () => () => null);
jest.mock('v1/quotes-tender/components/page', () => () => null);
jest.mock('./document-creator', () => ({ path: '/document-creator' }));
jest.mock('v2/apps/clink/pages/pmp', () => () => null);

// Mock global variables
global.BASE_URLS = {
  PROJECTS: '/main-contractor',
  DOCUMENT_CREATOR: '/document-creator',
};

import routerConfig from './index';

describe('clink/router/v1/index', () => {
  // Arrange → Act → Assert

  it('should export a router configuration array', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toBeDefined();
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('should contain router objects with correct structure', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    config.forEach((item) => {
      expect(item).toHaveProperty('path');
      expect(typeof item.path).toBe('string');
      
      // Check if it has routes (for router configs) or element (for route configs)
      if (item.routes) {
        expect(Array.isArray(item.routes)).toBe(true);
        expect(item).toHaveProperty('reactRouter');
      }
    });
  });

  it('should have at least one route configuration with routes array', () => {
    // Arrange & Act
    const config = routerConfig;
    const routesConfig = config.find(item => Array.isArray(item.routes));

    // Assert
    expect(routesConfig).toBeDefined();
    expect(routesConfig.routes.length).toBeGreaterThan(0);
  });

  it('should create snapshot of router configuration', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toMatchSnapshot();
  });

  it('should use feature flag correctly for tender templates', () => {
    // Arrange
    const flag = require('v2/helpers/flags');
    
    // Act & Assert
    // The flag is called during module import, so we just verify it was called
    expect(flag).toHaveBeenCalledWith('NEW_TENDER_TEMPLATES');
  });
});
