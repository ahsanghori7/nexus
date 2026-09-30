import React from 'react';
import '@testing-library/jest-dom';

// Mock the dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key, // Simple mock that returns the key
}));

jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn(() => 'http://test-host/company-assets'),
}));

jest.mock('v2/apps/clink/layout', () => {
  const MockLayout = ({ children, breadCrumbItems, title }) => (
    <div data-testid="layout">
      <div data-testid="title">{title}</div>
      <div data-testid="breadcrumbs">{JSON.stringify(breadCrumbItems)}</div>
      {children}
    </div>
  );

  return {
    __esModule: true,
    default: MockLayout,
  };
});

jest.mock('v2/helpers/php-globals', () => ({
  PHPAppClinkGloblals: () => ({
    info: {
      user: {
        acl_enabled: 0,
        type: 'super_admin',
      },
    },
  }),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    userTypes: {
      userTypeAdministrator: 'administrator',
      userTypeTeamAdmin: 'team_admin',
      userTypeTeamManager: 'team_manager',
      userTypeSuperAdmin: 'super_admin',
    },
  },
}));

jest.mock('v1/company-assets/components/Page', () => {
  return function MockCompanyAssets() {
    return <div data-testid="company-assets">Company Assets Component</div>;
  };
});

jest.mock('v1/company-assets/components/Templates', () => {
  return function MockTemplates({ typeAsset, tenderTemplate }) {
    return (
      <div data-testid="templates">
        <span data-testid="type-asset">{typeAsset}</span>
        <span data-testid="tender-template">{tenderTemplate}</span>
      </div>
    );
  };
});

jest.mock('v1/company-assets/components/Packages', () => {
  return function MockPackages({ title, subtitle, helpText, type, editUrl }) {
    return (
      <div data-testid="packages">
        <span data-testid="title">{title}</span>
        <span data-testid="subtitle">{subtitle}</span>
        <span data-testid="help-text">{helpText}</span>
        <span data-testid="type">{type}</span>
        <span data-testid="edit-url">{editUrl}</span>
      </div>
    );
  };
});

jest.mock('v1/company-assets/components/ScopeOfWorks/Form', () => {
  return function MockScopeOfWorksForm() {
    return <div data-testid="scope-of-works-form">Scope of Works Form</div>;
  };
});

// Mock global variables
global.BASE_URLS = {
  COMPANY_ASSETS: '/main-contractor/company-assets',
};

import routerConfig from './company-assets';

describe('clink/router/v1/company-assets', () => {
  // Arrange → Act → Assert

  it('should export a router configuration array', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toBeDefined();
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('should have correct number of routes', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toHaveLength(8); // Based on the routes in the file
  });

  it('should contain main company assets route', () => {
    // Arrange & Act
    const config = routerConfig;
    const mainRoute = config.find(route => route.path === '/company-assets');

    // Assert
    expect(mainRoute).toBeDefined();
    expect(mainRoute).toHaveProperty('element');
  });

  it('should contain order templates route', () => {
    // Arrange & Act
    const config = routerConfig;
    const orderTemplatesRoute = config.find(route =>
      route.path === '/company-assets/order-templates'
    );

    // Assert
    expect(orderTemplatesRoute).toBeDefined();
    expect(orderTemplatesRoute).toHaveProperty('element');
  });

  it('should contain letter of intent route', () => {
    // Arrange & Act
    const config = routerConfig;
    const letterOfIntentRoute = config.find(route =>
      route.path === '/company-assets/letter-of-intent'
    );

    // Assert
    expect(letterOfIntentRoute).toBeDefined();
    expect(letterOfIntentRoute).toHaveProperty('element');
  });

  it('should contain tender templates route', () => {
    // Arrange & Act
    const config = routerConfig;
    const tenderTemplatesRoute = config.find(route =>
      route.path === '/company-assets/tender-templates'
    );

    // Assert
    expect(tenderTemplatesRoute).toBeDefined();
    expect(tenderTemplatesRoute).toHaveProperty('element');
  });

  it('should contain schedule of attendances route', () => {
    // Arrange & Act
    const config = routerConfig;
    const scheduleRoute = config.find(route =>
      route.path === '/company-assets/schedule-of-attendances'
    );

    // Assert
    expect(scheduleRoute).toBeDefined();
    expect(scheduleRoute).toHaveProperty('element');
  });

  it('should contain scope of works routes', () => {
    // Arrange & Act
    const config = routerConfig;
    const scopeOfWorksRoute = config.find(route =>
      route.path === '/company-assets/scope-of-works'
    );
    const scopeOfWorksDetailRoute = config.find(route =>
      route.path === '/company-assets/scope-of-works/:templateId'
    );

    // Assert
    expect(scopeOfWorksRoute).toBeDefined();
    expect(scopeOfWorksDetailRoute).toBeDefined();
    expect(scopeOfWorksRoute).toHaveProperty('element');
    expect(scopeOfWorksDetailRoute).toHaveProperty('element');
  });

  it('should have all routes with proper structure', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    config.forEach((route) => {
      expect(route).toHaveProperty('path');
      expect(route).toHaveProperty('element');
      expect(typeof route.path).toBe('string');
    });
  });

  it('should create snapshot of router configuration', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toMatchSnapshot();
  });

  it('should call getUrl with correct parameters', () => {
    // Arrange
    const { getUrl } = require('v2/helpers/url');

    // Act
    // Import triggers the getUrl call

    // Assert
    expect(getUrl).toHaveBeenCalledWith('CLINK_APP_HOST', '/main-contractor/company-assets');
  });
});