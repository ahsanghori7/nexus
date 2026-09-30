import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Step2 from './StepTwo';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock react-redux
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: jest.fn(),
}));

// Mock context
const mockActions = {
  fetchAttrRegions: jest.fn(),
  fetchAttrTrades: jest.fn(),
  addToSupplyChain: jest.fn(),
};
jest.mock('v2/hooks/context', () => ({
  useContext: () => ({
    actions: mockActions,
  }),
}));

// Mock useSnackbar
const mockShowSnackbar = jest.fn();
jest.mock('v2/hooks/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar: mockShowSnackbar,
  }),
}));

describe('Step2 Component', () => {
  const mockOnBack = jest.fn();
  const mockOnCancel = jest.fn();
  
  const mockTrades = [
    { id: 1, name: 'Plumbing', label: 'Plumbing' },
    { id: 2, name: 'Electrical', label: 'Electrical' },
  ];
  
  const mockLocations = [
    { id: 1, name: 'London', label: 'London' },
    { id: 2, name: 'Manchester', label: 'Manchester' },
  ];
  
  const mockFormData = {
    companyName: 'Test Company',
    companyReg: '12345',
  };

  const mockAccount = {
    id: 1,
    name: 'Test Account',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { useSelector } = require('react-redux');
    useSelector.mockImplementation((selector) => {
      return selector({
        attributes: {
          trades: mockTrades,
          regions: mockLocations,
        },
      });
    });
  });

  it('renders correctly', () => {
    render(
      <Step2
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        formData={mockFormData}
        account={mockAccount}
      />
    );
    
    expect(screen.getByText('add-to-supply-chain-step2-subtitle')).toBeInTheDocument();
    expect(screen.getByLabelText(/Company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });

  it('pre-fills company data from Step 1', () => {
    render(
      <Step2
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        formData={mockFormData}
        account={mockAccount}
      />
    );
    
    const companyNameInput = screen.getByLabelText(/Company name/i);
    expect(companyNameInput).toHaveValue('Test Company');
  });

  it('disables Add button when required fields are empty', () => {
    render(
      <Step2
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        formData={mockFormData}
        account={mockAccount}
      />
    );
    
    const addButton = screen.getByRole('button', { name: /Add/i });
    // Button is disabled when required fields are empty
    expect(addButton).toBeDisabled();
  });

  it('calls onBack when Go Back is clicked', () => {
    render(
      <Step2
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        formData={mockFormData}
        account={mockAccount}
      />
    );
    
    const goBackButton = screen.getByRole('button', { name: /go-back/i });
    fireEvent.click(goBackButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('disables button with invalid email format', async () => {
    render(
      <Step2
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        formData={mockFormData}
        account={mockAccount}
      />
    );
    
    // Fill in all required fields except email is invalid
    const firstNameInput = screen.getByTestId('input-text-field-first_name');
    const lastNameInput = screen.getByTestId('input-text-field-last_name');
    const emailInput = screen.getByTestId('input-email-field-email');
    const addressInput = screen.getByTestId('input-text-field-address');
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(addressInput, { target: { value: '123 Main St' } });
    
    // Button should still be disabled because email is invalid
    const addButton = screen.getByRole('button', { name: /Add/i });
    expect(addButton).toBeDisabled();
  });

  it('pre-fills existing record data', () => {
    const formDataWithExisting = {
      ...mockFormData,
      existingRecord: {
        name: 'Existing Co',
        number: '99999',
        user: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
        },
        mobile: '1234567890',
        address: '123 Main St',
        trades: [1],
        locations: [1],
      },
    };
    
    render(
      <Step2
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        formData={formDataWithExisting}
        account={mockAccount}
      />
    );
    
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
  });

  it('button remains disabled when required fields are missing', async () => {
    render(
      <Step2
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        formData={mockFormData}
        account={mockAccount}
      />
    );
    
    // Initially button should be disabled
    const addButton = screen.getByRole('button', { name: /Add/i });
    expect(addButton).toBeDisabled();
    
    // Fill only some fields
    const firstNameInput = screen.getByLabelText(/First name/i);
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    
    // Button should still be disabled as not all required fields are filled
    await waitFor(() => {
      expect(addButton).toBeDisabled();
    });
  });
});

