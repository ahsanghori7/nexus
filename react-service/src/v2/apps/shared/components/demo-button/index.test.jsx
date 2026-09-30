import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import DemoButton from './index';

// Mock the flag helper
jest.mock('v2/helpers/flags', () => {
  return jest.fn((flagName) => {
    if (flagName === 'DEMO_FEATURE') {
      return [123, 456]; // Mock account IDs that have demo feature enabled
    }
    return null;
  });
});

// Mock the SVG imports
jest.mock('./ifs-logo-white-small.svg', () => 'IFS_LOGO');
jest.mock('./Asite-Logo-3-small-2-cropped.svg', () => 'ASITE_LOGO');

// Mock MUI icons
jest.mock('@mui/icons-material/Download', () => {
  return function DownloadIcon() {
    return <span data-testid="download-icon">download</span>;
  };
});

// Create a simple reducer for testing
const testReducer = (state = {}, action) => state;

// Helper function to create a store with initial state
const createTestStore = (initialState = {}) => createStore(testReducer, initialState);

const TestWrapper = ({ children, store }) => (
  <Provider store={store}>
    {children}
  </Provider>
);

describe('DemoButton', () => {
  const mockClinkAccount = { id: 123 };
  const mockHandleClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const store = createTestStore({ clinkAccount: mockClinkAccount });
    render(
      <TestWrapper store={store}>
        <DemoButton handleClick={mockHandleClick} />
      </TestWrapper>
    );
  });

  it('returns null when account is not in demo feature flag', () => {
    const store = createTestStore({ clinkAccount: { id: 999 } }); // ID not in demo feature list
    const { container } = render(
      <TestWrapper store={store}>
        <DemoButton handleClick={mockHandleClick} />
      </TestWrapper>
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('returns null when clinkAccount is undefined', () => {
    const store = createTestStore({ clinkAccount: undefined });
    const { container } = render(
      <TestWrapper store={store}>
        <DemoButton handleClick={mockHandleClick} />
      </TestWrapper>
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders IFS button by default', () => {
    const store = createTestStore({ clinkAccount: mockClinkAccount });
    render(
      <TestWrapper store={store}>
        <DemoButton handleClick={mockHandleClick} />
      </TestWrapper>
    );

    expect(screen.getByText('Import/Update')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('MuiButton-contained');
  });

  it('renders IFS2 button with download icon', () => {
    const store = createTestStore({ clinkAccount: mockClinkAccount });
    render(
      <TestWrapper store={store}>
        <DemoButton type="ifs2" handleClick={mockHandleClick} />
      </TestWrapper>
    );

    expect(screen.getByText('Download Excel')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('MuiButton-contained');
  });

  it('renders IFS3 button', () => {
    const store = createTestStore({ clinkAccount: mockClinkAccount });
    render(
      <TestWrapper store={store}>
        <DemoButton type="ifs3" handleClick={mockHandleClick} />
      </TestWrapper>
    );

    expect(screen.getByText('Approval Workflow')).toBeInTheDocument();
  });

  it('renders ASite button with outlined variant', () => {
    const store = createTestStore({ clinkAccount: mockClinkAccount });
    render(
      <TestWrapper store={store}>
        <DemoButton type="asite" handleClick={mockHandleClick} />
      </TestWrapper>
    );

    expect(screen.getByText('ASite Import')).toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button).toHaveClass('MuiButton-outlined');
  });

  it('renders operational button', () => {
    const store = createTestStore({ clinkAccount: mockClinkAccount });
    render(
      <TestWrapper store={store}>
        <DemoButton type="operational" handleClick={mockHandleClick} />
      </TestWrapper>
    );

    expect(screen.getByText('Delivery Guide')).toBeInTheDocument();
  });

  it('returns null for invalid button type', () => {
    const store = createTestStore({ clinkAccount: mockClinkAccount });
    const { container } = render(
      <TestWrapper store={store}>
        <DemoButton type="invalid" handleClick={mockHandleClick} />
      </TestWrapper>
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('calls handleClick when button is clicked', () => {
    const store = createTestStore({ clinkAccount: mockClinkAccount });
    render(
      <TestWrapper store={store}>
        <DemoButton handleClick={mockHandleClick} />
      </TestWrapper>
    );

    const button = screen.getByText('Import/Update');
    fireEvent.click(button);
    
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it('works without handleClick prop', () => {
    const store = createTestStore({ clinkAccount: mockClinkAccount });
    render(
      <TestWrapper store={store}>
        <DemoButton />
      </TestWrapper>
    );

    const button = screen.getByText('Import/Update');
    fireEvent.click(button);
    
    // Should not throw an error
    expect(button).toBeInTheDocument();
  });

  it('works with account id as string', () => {
    const store = createTestStore({ clinkAccount: { id: '123' } });
    render(
      <TestWrapper store={store}>
        <DemoButton handleClick={mockHandleClick} />
      </TestWrapper>
    );

    expect(screen.getByText('Import/Update')).toBeInTheDocument();
  });
});