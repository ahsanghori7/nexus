import React from 'react';
import '@testing-library/jest-dom';

// Mock the dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key, // Simple mock that returns the key
}));

jest.mock('v2/apps/clink/layout', () => {
  const MockLayout = ({ children, breadCrumbItems, title, noReact }) => (
    <div data-testid="layout">
      <div data-testid="title">{title}</div>
      <div data-testid="breadcrumbs">{JSON.stringify(breadCrumbItems)}</div>
      <div data-testid="no-react">{noReact ? 'true' : 'false'}</div>
      {children}
    </div>
  );

  return {
    __esModule: true,
    default: MockLayout,
    PROJECT_BREADCRUMBS: [{ name: 'project-breadcrumb' }],
    WITH_PROJECT: { name: 'with-project' },
  };
});

jest.mock('v1/document-creator/components/template', () => {
  return function MockTemplate() {
    return <div data-testid="template">Template Component</div>;
  };
});

// Mock global variables that are likely defined elsewhere
global.BASE_URLS = {
  DOCUMENT_CREATOR: '/document-creator',
};

import routerConfig from './document-creator';

describe('clink/router/v1/document-creator', () => {
  // Arrange → Act → Assert

  it('should export a router configuration object', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toBeDefined();
    expect(config).toHaveProperty('path', '/document-creator');
    expect(config).toHaveProperty('reactRouter', true);
    expect(config).toHaveProperty('routes');
    expect(Array.isArray(config.routes)).toBe(true);
  });

  it('should have correct number of routes', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config.routes).toHaveLength(3); // Template/tender, template/order, template routes
  });

  it('should contain template tender route', () => {
    // Arrange & Act
    const config = routerConfig;
    const templateTenderRoute = config.routes.find(route => 
      route.path === '/template/:templateId/tender/:tenderId'
    );

    // Assert
    expect(templateTenderRoute).toBeDefined();
    expect(templateTenderRoute).toHaveProperty('element');
  });

  it('should contain template order route', () => {
    // Arrange & Act
    const config = routerConfig;
    const templateOrderRoute = config.routes.find(route => 
      route.path === '/template/:templateId/order/:tenderId'
    );

    // Assert
    expect(templateOrderRoute).toBeDefined();
    expect(templateOrderRoute).toHaveProperty('element');
  });

  it('should contain basic template route', () => {
    // Arrange & Act
    const config = routerConfig;
    const templateRoute = config.routes.find(route => 
      route.path === '/template/:templateId'
    );

    // Assert
    expect(templateRoute).toBeDefined();
    expect(templateRoute).toHaveProperty('element');
  });

  it('should create snapshot of router configuration', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toMatchSnapshot();
  });

  it('should have all routes with proper structure', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    config.routes.forEach((route) => {
      expect(route).toHaveProperty('path');
      expect(route).toHaveProperty('element');
      expect(typeof route.path).toBe('string');
    });
  });
});