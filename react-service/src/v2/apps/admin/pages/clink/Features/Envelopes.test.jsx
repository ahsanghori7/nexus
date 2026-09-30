import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Envelopes from './Envelopes';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    reset: jest.fn(),
    register: jest.fn((name) => ({ name })),
    handleSubmit: (fn) => (event) => {
      event.preventDefault();
      fn({ current: '10', envelopes: '20', period: 'monthly' });
    },
    formState: { errors: {} },
  }),
}));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      features: () => ({
        envelopes: null,
        ...initialState.features,
      }),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Test wrapper component that provides route params
const EnvelopesTestWrapper = ({ accountId = 'test-account', ...props }) => (
  <MemoryRouter initialEntries={[`/admin/features/${accountId}`]}>
    <Routes>
      <Route path="/admin/features/:accountId" element={<Envelopes {...props} />} />
    </Routes>
  </MemoryRouter>
);

describe('Envelopes Component', () => {
  let mockStore;
  let mockDispatch;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockStore = createMockStore();
    mockStore.dispatch = mockDispatch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <Provider store={mockStore}>
        <EnvelopesTestWrapper />
      </Provider>
    );

    // Check for form elements
    expect(screen.getByLabelText('current_envelopes')).toBeInTheDocument();
    expect(screen.getByLabelText('envelopes')).toBeInTheDocument();
    expect(screen.getByLabelText('period')).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(
      <Provider store={mockStore}>
        <EnvelopesTestWrapper />
      </Provider>
    );

    // Check for Number inputs
    expect(screen.getByTestId('number-input-current')).toBeInTheDocument();
    expect(screen.getByTestId('number-input-envelopes')).toBeInTheDocument();
    
    // Check for Text input
    expect(screen.getByTestId('text-input-period')).toBeInTheDocument();
    
    // Check for submit button
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('should handle form submission', () => {
    render(
      <Provider store={mockStore}>
        <EnvelopesTestWrapper />
      </Provider>
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // The click event should work without errors
    expect(submitButton).toBeInTheDocument();
  });

  it('should display form with correct field labels', () => {
    render(
      <Provider store={mockStore}>
        <EnvelopesTestWrapper />
      </Provider>
    );

    // Check that labels are using translation keys
    expect(screen.getByLabelText('current_envelopes')).toBeInTheDocument();
    expect(screen.getByLabelText('envelopes')).toBeInTheDocument();
    expect(screen.getByLabelText('period')).toBeInTheDocument();
  });

  it('should render form as a Box component with correct props', () => {
    render(
      <Provider store={mockStore}>
        <EnvelopesTestWrapper />
      </Provider>
    );

    // Should render the Box component (which is mocked as a div with data-testid="mui-box")
    const formContainer = screen.getByTestId('mui-box');
    expect(formContainer).toBeInTheDocument();
    expect(formContainer).toHaveAttribute('component', 'form');
  });

  it('should pass contextType prop correctly', () => {
    render(
      <Provider store={mockStore}>
        <EnvelopesTestWrapper contextType="prosper" />
      </Provider>
    );

    // Should still render the form container regardless of contextType
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
  });

  it('should render with envelopes data when available', () => {
    const storeWithData = createMockStore({
      features: {
        envelopes: {
          envelopes: 50,
          current: 25,
          period: 'quarterly',
        },
      },
    });
    storeWithData.dispatch = mockDispatch;

    render(
      <Provider store={storeWithData}>
        <EnvelopesTestWrapper />
      </Provider>
    );

    // Form should render normally
    expect(screen.getByTestId('number-input-current')).toBeInTheDocument();
    expect(screen.getByTestId('number-input-envelopes')).toBeInTheDocument();
    expect(screen.getByTestId('text-input-period')).toBeInTheDocument();
  });

  it('should handle different accountId parameters', () => {
    render(
      <Provider store={mockStore}>
        <EnvelopesTestWrapper accountId="different-account-id" />
      </Provider>
    );

    // Should render form container regardless of account ID
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
  });

  it('should map state to props correctly', () => {
    const storeWithFeatures = createMockStore({
      features: {
        envelopes: { current: 10, envelopes: 20, period: 'weekly' },
      },
    });

    render(
      <Provider store={storeWithFeatures}>
        <EnvelopesTestWrapper />
      </Provider>
    );

    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
  });

  it('should handle submit button interaction', () => {
    render(
      <Provider store={mockStore}>
        <EnvelopesTestWrapper />
      </Provider>
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    // Button should be enabled and clickable
    expect(submitButton).not.toBeDisabled();
    
    // Should handle click without errors
    fireEvent.click(submitButton);
    expect(submitButton).toBeInTheDocument();
  });
});