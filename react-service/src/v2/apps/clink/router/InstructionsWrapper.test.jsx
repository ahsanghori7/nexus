import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key, // Simple mock that returns the key
}));

jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: jest.fn(() => ({ type: 'test-instruction' })),
}));

jest.mock('v2/apps/clink/pages/form-instruction', () => {
  return function MockFormInstruction() {
    return <div data-testid="form-instruction">Form Instruction Component</div>;
  };
});

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
    PROJECT_BREADCRUMBS: [{ name: 'project-breadcrumb' }],
    WITH_PROJECT: { name: 'with-project', rest: 'project-rest' },
  };
});

import routerConfig from './InstructionsWrapper';

// Extract the component from the router config for testing
const InstructionsWrapper = routerConfig.element.type;

describe('clink/router/InstructionsWrapper', () => {
  // Arrange → Act → Assert

  beforeEach(() => {
    // Reset mocks before each test
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ type: 'test-instruction' });
  });

  it('should render without crashing', () => {
    // Arrange & Act
    render(<InstructionsWrapper />);

    // Assert
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('form-instruction')).toBeInTheDocument();
  });

  it('should render with correct title based on type', () => {
    // Arrange & Act
    render(<InstructionsWrapper />);

    // Assert
    expect(screen.getByTestId('title')).toHaveTextContent('Edit test-instruction');
  });

  it('should handle type with dashes by replacing them with underscores in breadcrumbs', () => {
    // Arrange
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ type: 'test-instruction-with-dashes' });

    // Act
    render(<InstructionsWrapper />);

    // Assert
    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs.textContent).toContain('test_instruction_with_dashes');
  });

  it('should include project breadcrumbs in layout', () => {
    // Arrange & Act
    render(<InstructionsWrapper />);

    // Assert
    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs.textContent).toContain('project-breadcrumb');
  });

  it('should include type-specific breadcrumb with translated name', () => {
    // Arrange & Act
    render(<InstructionsWrapper />);

    // Assert
    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs.textContent).toContain('test-instruction');
  });

  it('should export correct router configuration', () => {
    // Arrange & Act
    const config = routerConfig;

    // Assert
    expect(config).toHaveProperty('path', 'project/:slug/form_instruction');
    expect(config).toHaveProperty('element');
    expect(config.element.type).toBe(InstructionsWrapper);
  });

  it('should handle empty type gracefully', () => {
    // Arrange
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ type: '' });

    // Act
    render(<InstructionsWrapper />);

    // Assert
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('title')).toHaveTextContent('Edit');
  });

  it('should create snapshot of component', () => {
    // Arrange & Act
    const { container } = render(<InstructionsWrapper />);

    // Assert
    expect(container.firstChild).toMatchSnapshot();
  });
});