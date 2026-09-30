import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key, // Simple mock that returns the key
}));

jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: jest.fn(() => ({ slug: 'test-slug' })),
}));

jest.mock('v2/apps/clink/pages/supply-chain-profile', () => {
  return function MockSupplyChain() {
    return <div data-testid="supply-chain">Supply Chain Component</div>;
  };
});

jest.mock('v2/apps/clink/layout', () => {
  const MockLayout = ({ children, breadCrumbItems, title, companyName }) => (
    <div data-testid="layout">
      <div data-testid="title">{title}</div>
      <div data-testid="breadcrumbs">{JSON.stringify(breadCrumbItems)}</div>
      <div data-testid="company-name">{companyName ? 'true' : 'false'}</div>
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

import routerConfig from './SPWrapper';

// Extract the component from the router config for testing
const SPWrapper = routerConfig.element.type;

describe('clink/router/SPWrapper', () => {
  // Arrange → Act → Assert

  it('should render without crashing', () => {
    // Arrange & Act
    render(<SPWrapper />);

    // Assert
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('supply-chain')).toBeInTheDocument();
  });

  it('should render with correct title', () => {
    // Arrange & Act
    render(<SPWrapper />);

    // Assert
    expect(screen.getByTestId('title')).toHaveTextContent('supply-chain');
  });

  it('should render with company name enabled', () => {
    // Arrange & Act
    render(<SPWrapper />);

    // Assert
    expect(screen.getByTestId('company-name')).toHaveTextContent('true');
  });

  it('should render with project breadcrumbs when slug is present', () => {
    // Arrange
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ slug: 'test-slug' });

    // Act
    render(<SPWrapper />);

    // Assert
    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toBeInTheDocument();
    expect(breadcrumbs.textContent).toContain('project-breadcrumb');
  });

  it('should render with supply chain breadcrumbs when no slug', () => {
    // Arrange
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ slug: undefined });

    // Act
    render(<SPWrapper />);

    // Assert
    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toBeInTheDocument();
    expect(breadcrumbs.textContent).toContain('supply-chain');
  });

  it('should export correct router configuration', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toHaveProperty('path', 'supply_chain/:id');
    expect(config).toHaveProperty('element');
    expect(config.element.type).toBe(SPWrapper);
  });

  it('should create snapshot of component', () => {
    // Arrange & Act
    const { container } = render(<SPWrapper />);

    // Assert
    expect(container.firstChild).toMatchSnapshot();
  });
});