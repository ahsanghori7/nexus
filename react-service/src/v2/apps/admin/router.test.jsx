import React from 'react';
import { render } from '@testing-library/react';

// Mock the SVG imports
jest.mock('assets/images/icons/dashboard.svg', () => 'dashboard-icon');
jest.mock('assets/images/icons/house.svg', () => 'house-icon');
jest.mock('assets/images/icons/avatar.svg', () => 'avatar-icon');

// Mock BASE_URLS global
global.BASE_URLS = {
  ADMIN_PROSPER: '/admin-prosper'
};

// Mock all the page components
jest.mock('v2/apps/admin/pages/clink', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-clink">{children}</div>
}));

jest.mock('v2/apps/admin/pages/clink/Dashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard">Dashboard</div>
}));

jest.mock('v2/apps/admin/pages/clink/Projects', () => ({
  __esModule: true,
  default: () => <div data-testid="projects">Projects</div>
}));

jest.mock('v2/apps/admin/pages/clink/Contractors', () => ({
  __esModule: true,
  default: () => <div data-testid="contractors">Contractors</div>
}));

jest.mock('v2/apps/admin/pages/clink/Accounts', () => ({
  __esModule: true,
  default: () => <div data-testid="clink-accounts">Clink Accounts</div>
}));

jest.mock('v2/apps/admin/pages/prosper', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-prosper">{children}</div>
}));

jest.mock('v2/apps/admin/pages/prosper/dashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="prosper-dashboard">Prosper Dashboard</div>
}));

jest.mock('v2/apps/admin/pages/prosper/dashboard/SupplyChain', () => ({
  __esModule: true,
  default: () => <div data-testid="supply-chain-dashboard">Supply Chain Dashboard</div>
}));

jest.mock('v2/apps/admin/pages/prosper/Accounts', () => ({
  __esModule: true,
  default: () => <div data-testid="prosper-accounts">Prosper Accounts</div>
}));

jest.mock('v2/apps/admin/pages/SearchResults', () => ({
  __esModule: true,
  default: () => <div data-testid="search-results">Search Results</div>
}));

jest.mock('v2/apps/admin/DataContent', () => ({
  __esModule: true,
  default: () => <div data-testid="data-content">Data Content</div>
}));

jest.mock('v2/apps/admin/pages/clink/CustomerHealthScore', () => ({
  __esModule: true,
  default: () => <div data-testid="customer-health-score">Customer Health Score</div>
}));

jest.mock('v2/apps/admin/pages/clink/Features', () => ({
  __esModule: true,
  default: () => <div data-testid="features">Features</div>
}));

jest.mock('v2/helpers/flags', () => ({
  __esModule: true,
  default: jest.fn(() => true)
}));

describe('Router Configuration', () => {
  // Import after mocks are set up
  let routerAdminConfig, routerProsperConfig, EXTERNAL_SUBCONTRACTOR;
  
  beforeAll(() => {
    const routerModule = require('./router');
    routerAdminConfig = routerModule.routerAdminConfig;
    routerProsperConfig = routerModule.routerProsperConfig;
    EXTERNAL_SUBCONTRACTOR = routerModule.EXTERNAL_SUBCONTRACTOR;
  });
  it('exports EXTERNAL_SUBCONTRACTOR constant', () => {
    expect(EXTERNAL_SUBCONTRACTOR).toBe(4);
  });

  it('exports routerAdminConfig with correct structure', () => {
    expect(routerAdminConfig).toBeDefined();
    expect(Array.isArray(routerAdminConfig)).toBe(true);
    expect(routerAdminConfig).toHaveLength(1);
    expect(routerAdminConfig[0]).toHaveProperty('path', '');
    expect(routerAdminConfig[0]).toHaveProperty('reactRouter', true);
    expect(routerAdminConfig[0]).toHaveProperty('routes');
    expect(Array.isArray(routerAdminConfig[0].routes)).toBe(true);
  });

  it('exports routerProsperConfig with correct structure', () => {
    expect(routerProsperConfig).toBeDefined();
    expect(Array.isArray(routerProsperConfig)).toBe(true);
    expect(routerProsperConfig).toHaveLength(1);
    expect(routerProsperConfig[0]).toHaveProperty('reactRouter', true);
    expect(routerProsperConfig[0]).toHaveProperty('routes');
    expect(Array.isArray(routerProsperConfig[0].routes)).toBe(true);
  });

  it('has admin routes with expected paths', () => {
    const routes = routerAdminConfig[0].routes;
    const routePaths = routes.map(route => route.path).filter(Boolean);
    
    expect(routePaths).toContain('dashboard');
    expect(routePaths).toContain('projects');
    expect(routePaths).toContain('contractors');
    expect(routePaths).toContain('accounts');
    expect(routePaths).toContain('search');
    expect(routePaths).toContain('accounts/:accountId');
    expect(routePaths).toContain('customer_health_score');
  });

  it('has prosper routes with expected paths', () => {
    const routes = routerProsperConfig[0].routes;
    const routePaths = routes.map(route => route.path).filter(Boolean);
    
    expect(routePaths).toContain('dashboard');
    expect(routePaths).toContain('supply-chain-dashboard');
    expect(routePaths).toContain('accounts');
    expect(routePaths).toContain('accounts/:accountId');
    expect(routePaths).toContain('search');
    expect(routePaths).toContain('supply_chain');
  });

  it('includes features routes when FEATURES flag is enabled', () => {
    const routes = routerAdminConfig[0].routes;
    const routePaths = routes.map(route => route.path).filter(Boolean);
    
    expect(routePaths).toContain('features');
    expect(routePaths).toContain('features/:accountId');
  });

  it('admin routes have proper element structure', () => {
    const routes = routerAdminConfig[0].routes;
    
    routes.forEach(route => {
      if (route.element) {
        expect(React.isValidElement(route.element)).toBe(true);
      }
    });
  });

  it('prosper routes have proper element structure', () => {
    const routes = routerProsperConfig[0].routes;
    
    routes.forEach(route => {
      if (route.element) {
        expect(React.isValidElement(route.element)).toBe(true);
      }
    });
  });
});