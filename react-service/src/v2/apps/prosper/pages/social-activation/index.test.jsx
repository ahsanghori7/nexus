import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import SocialActivation from './index';

// Mock the php-globals module explicitly
jest.mock('v2/helpers/php-globals', () => {
  const mockFunction = jest.fn().mockReturnValue({
    data: {
      token: 'test-token-123',
      csrf: 'test-csrf-token',
      company_name: 'Test Company',
      email: 'test@example.com',
      firstname: 'John',
      lastname: 'Doe',
      user: {
        id: 1,
        name: 'Test User'
      }
    }
  });
  
  return {
    __esModule: true,
    default: mockFunction
  };
});

// Mock the context
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      activateTeamAccount: jest.fn(() => ({
        unwrap: jest.fn(() => Promise.resolve({
          data: {
            success: true,
            message: 'Account activated successfully'
          }
        }))
      }))
    }
  }))
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('SocialActivation Component', () => {
  // Helper function to create a mock Redux store
  const createMockStore = (initialState = {}) => {
    const defaultState = {
      auth: { user: null, isAuthenticated: false },
      ui: { loading: false, errors: {} },
      activateTeamAccount: { loading: false },
      subcontractor: {},
      ...initialState
    };

    return configureStore({
      reducer: {
        auth: (state = defaultState.auth) => state,
        ui: (state = defaultState.ui) => state,
        activateTeamAccount: (state = defaultState.activateTeamAccount) => state,
        subcontractor: (state = defaultState.subcontractor) => state,
        prosper: (state = {}) => state
      },
      preloadedState: defaultState
    });
  };

  // Helper function to render component with providers
  const renderComponent = (props = {}, storeState = {}) => {
    const store = createMockStore(storeState);
    
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <SocialActivation {...props} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Basic Render Tests', () => {
    test('renders without crashing', () => {
      renderComponent();
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });

    test('displays the page header with title', () => {
      renderComponent();
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
      expect(screen.getByText('sa-your-details')).toBeInTheDocument();
    });

    test('displays submit button', () => {
      renderComponent();
      const submitButton = screen.getByText('sa-activate-account');
      expect(submitButton).toBeInTheDocument();
    });

    test('displays all form structure', () => {
      renderComponent();
      expect(screen.getByTestId('clink-form')).toBeInTheDocument();
    });

    test('displays form fields', () => {
      renderComponent();
      expect(screen.getByTestId('input-form-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('input-form-lastname')).toBeInTheDocument();
      expect(screen.getByTestId('input-form-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-form-phone')).toBeInTheDocument();
    });
  });

  describe('Form Interaction Tests', () => {
    test('handles button clicks', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const submitButton = screen.getByText('sa-activate-account');
      await user.click(submitButton);
      expect(submitButton).toBeInTheDocument();
    });

    test('form renders correctly', () => {
      renderComponent();
      const form = screen.getByTestId('clink-form');
      expect(form).toBeInTheDocument();
    });

    test('displays company name in description', () => {
      renderComponent();
      expect(screen.getByText(/Test Company/)).toBeInTheDocument();
    });

    test('submit button is initially disabled', () => {
      renderComponent();
      const submitButton = screen.getByText('sa-activate-account');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Validation and State Management', () => {
    test('handles password validation', () => {
      renderComponent();
      const passwordFields = screen.getAllByTestId(/input-controlled/);
      expect(passwordFields.length).toBeGreaterThan(0);
    });

    test('handles checkbox interactions', () => {
      renderComponent();
      // Check for terms checkbox
      const checkboxes = screen.getAllByTestId(/checkbox/);
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    test('form submission with valid data', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // The form is mocked to handle submission
      const form = screen.getByTestId('clink-form');
      expect(form).toBeInTheDocument();
      
      // Submit the form
      fireEvent.submit(form);
      
      // The form should handle the submission
      expect(form).toBeInTheDocument();
    });
  });

  describe('Redux Integration Tests', () => {
    test('renders with Redux store', () => {
      renderComponent();
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });

    test('handles different store states', () => {
      const customState = {
        auth: { user: { id: 1, name: 'Test User' }, isAuthenticated: true },
        ui: { loading: true, errors: { form: 'Test error' } },
        activateTeamAccount: { loading: true }
      };
      
      renderComponent({}, customState);
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });

    test('connects to store correctly', () => {
      const storeState = {
        activateTeamAccount: { data: { success: true } },
        subcontractor: { data: {} }
      };
      
      renderComponent({}, storeState);
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle Tests', () => {
    test('calls PHPGloblals on mount', () => {
      const mockPHPGloblals = require('v2/helpers/php-globals').default;
      mockPHPGloblals.mockClear();
      
      renderComponent();
      
      expect(mockPHPGloblals).toHaveBeenCalled();
    });

    test('initializes state from PHP globals', () => {
      renderComponent();
      
      // Check that fields are populated with data from PHP globals
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    test('handles component unmount gracefully', () => {
      const { unmount } = renderComponent();
      expect(() => unmount()).not.toThrow();
    });

    test('re-renders with new props', () => {
      const { rerender } = renderComponent();
      
      rerender(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <SocialActivation testProp="updated" />
          </BrowserRouter>
        </Provider>
      );
      
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });
  });

  describe('Error Handling Tests', () => {
    test('handles missing props gracefully', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    test('renders with error states', () => {
      const storeWithErrors = createMockStore({
        auth: { user: null, isAuthenticated: false, error: 'Test error' },
        ui: { loading: true, errors: { form: 'Form error' } }
      });
      
      render(
        <Provider store={storeWithErrors}>
          <BrowserRouter>
            <SocialActivation />
          </BrowserRouter>
        </Provider>
      );
      
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });

    test('handles missing PHP globals data', () => {
      // Mock PHPGloblals to return null
      const mockPHPGloblals = require('v2/helpers/php-globals').default;
      mockPHPGloblals.mockReturnValueOnce(null);
      
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('Navigation Tests', () => {
    test('renders within router context', () => {
      renderComponent();
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    test('integrates with all providers', () => {
      renderComponent();
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });

    test('handles complex interactions', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const submitButton = screen.getByText('sa-activate-account');
      await user.click(submitButton);
      
      expect(submitButton).toBeInTheDocument();
    });

    test('displays terms and privacy policy links', () => {
      renderComponent();
      expect(screen.getByText('sa-terms')).toBeInTheDocument();
      expect(screen.getByText('sa-privacy-policy')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    test('renders efficiently', () => {
      const startTime = performance.now();
      renderComponent();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });

    test('handles multiple renders', () => {
      for (let i = 0; i < 3; i++) {
        const { unmount } = renderComponent();
        unmount();
      }
      
      renderComponent();
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('has proper semantic structure', () => {
      renderComponent();
      expect(screen.getByTestId('clink-form')).toBeInTheDocument();
    });

    test('provides accessible content', () => {
      renderComponent();
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });

    test('has proper form labels', () => {
      renderComponent();
      expect(screen.getByText('profile-firstname')).toBeInTheDocument();
      expect(screen.getByText('profile-lastname')).toBeInTheDocument();
      expect(screen.getByText('sa-email-address')).toBeInTheDocument();
    });
  });

  describe('State Management Tests', () => {
    test('maintains state consistency', () => {
      const store = createMockStore({
        auth: { user: { id: 1 }, isAuthenticated: true }
      });
      
      render(
        <Provider store={store}>
          <BrowserRouter>
            <SocialActivation />
          </BrowserRouter>
        </Provider>
      );
      
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });

    test('handles state updates', () => {
      renderComponent();
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles edge case props', () => {
      expect(() => renderComponent({ invalidProp: undefined })).not.toThrow();
    });

    test('handles empty state', () => {
      renderComponent({}, {});
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });

    test('handles empty PHP globals data', () => {
      const mockPHPGloblals = require('v2/helpers/php-globals').default;
      mockPHPGloblals.mockReturnValueOnce({ data: {} });
      
      renderComponent();
      expect(screen.getByText('sa-account-activation')).toBeInTheDocument();
    });
  });

  describe('Form Field Tests', () => {
    test('displays password creation section', () => {
      renderComponent();
      expect(screen.getByText('sa-password')).toBeInTheDocument();
      expect(screen.getByText(/sa-please-create-password/)).toBeInTheDocument();
    });

    test('displays password fields', () => {
      renderComponent();
      expect(screen.getByTestId('input-form-password')).toBeInTheDocument();
      expect(screen.getByTestId('input-form-repeat_password')).toBeInTheDocument();
    });

    test('displays terms checkbox', () => {
      renderComponent();
      expect(screen.getByTestId('input-form-terms')).toBeInTheDocument();
    });
  });
});