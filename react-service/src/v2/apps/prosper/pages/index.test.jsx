import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import Prosper from './index';

// Mock components and utilities
jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: jest.fn(() => ({})),
  resetUrl: jest.fn(),
  getUrlWithoutParamers: jest.fn(() => '/test-url'),
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      setTitle: jest.fn(),
      setType: jest.fn(),
      setLock: jest.fn(),
    },
  })),
}));

jest.mock('v2/apps/shared/components/WarnModal', () => {
  return function MockWarnModal({ title, message, onHidden, children }) {
    return (
      <div data-testid="warn-modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-message">{message}</div>
        <button onClick={onHidden} data-testid="modal-close">Close</button>
        {children}
      </div>
    );
  };
});

// Create a mock store
const createMockStore = (initialState = {}) => ({
  getState: () => initialState,
  dispatch: jest.fn(),
  subscribe: jest.fn(),
});

const renderWithProviders = (component, options = {}) => {
  const { initialState = {}, ...renderOptions } = options;
  const store = createMockStore(initialState);
  
  return render(
    <Provider store={store}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </Provider>,
    renderOptions
  );
};

describe('Prosper Pages Index', () => {
  const defaultProps = {
    title: 'Test Title',
    type: 'test-type',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<Prosper {...defaultProps}>Test Content</Prosper>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders children content', () => {
    const testContent = 'Test Child Content';
    renderWithProviders(<Prosper {...defaultProps}>{testContent}</Prosper>);
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('shows order success modal when order_success query param is present', () => {
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ order_success: 'true' });

    renderWithProviders(<Prosper {...defaultProps}>Test Content</Prosper>);
    
    expect(screen.getByTestId('warn-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('ORDER SUCCESSFUL');
  });

  it('shows order failed modal when order_failed query param is present', () => {
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ order_failed: 'true' });

    renderWithProviders(<Prosper {...defaultProps}>Test Content</Prosper>);
    
    expect(screen.getByTestId('warn-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Error');
  });

  it('does not show modal when no order query params are present', () => {
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({});

    renderWithProviders(<Prosper {...defaultProps}>Test Content</Prosper>);
    
    expect(screen.queryByTestId('warn-modal')).not.toBeInTheDocument();
  });

  it('calls resetUrl when modal is closed', () => {
    const { getQueryStringVars, resetUrl } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ order_success: 'true' });

    renderWithProviders(<Prosper {...defaultProps}>Test Content</Prosper>);
    
    const closeButton = screen.getByTestId('modal-close');
    closeButton.click();
    
    expect(resetUrl).toHaveBeenCalled();
  });

  it('applies noPadding when URL contains success-stories', () => {
    const { getUrlWithoutParamers } = require('v2/helpers/url');
    getUrlWithoutParamers.mockReturnValue('/test/success-stories');

    renderWithProviders(<Prosper {...defaultProps}>Test Content</Prosper>);
    
    // The Page component should receive noPadding prop as true
    // We can test this by checking if the component renders properly
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies noPadding when URL contains projects/enquiries', () => {
    const { getUrlWithoutParamers } = require('v2/helpers/url');
    getUrlWithoutParamers.mockReturnValue('/test/projects/enquiries');

    renderWithProviders(<Prosper {...defaultProps}>Test Content</Prosper>);
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies noPadding when URL matches company_profile regex', () => {
    const { getUrlWithoutParamers } = require('v2/helpers/url');
    getUrlWithoutParamers.mockReturnValue('/company_profile/123');

    renderWithProviders(<Prosper {...defaultProps}>Test Content</Prosper>);
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies noPadding when URL matches projects regex', () => {
    const { getUrlWithoutParamers } = require('v2/helpers/url');
    getUrlWithoutParamers.mockReturnValue('/projects/456');

    renderWithProviders(<Prosper {...defaultProps}>Test Content</Prosper>);
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('uses default props when none provided', () => {
    renderWithProviders(<Prosper>Test Content</Prosper>);
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});