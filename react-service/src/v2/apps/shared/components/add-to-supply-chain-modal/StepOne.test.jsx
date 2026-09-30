import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Step1 from './StepOne';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock context
const mockActions = {
  checkCompany: jest.fn(),
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

describe('Step1 Component', () => {
  const mockOnNext = jest.fn();
  const mockOnCancel = jest.fn();
  const mockDispatch = jest.fn();
  const mockAccount = {
    id: 1,
    name: 'Test Account',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <Step1
        onNext={mockOnNext}
        onCancel={mockOnCancel}
        dispatch={mockDispatch}
        account={mockAccount}
      />
    );
    
    expect(screen.getByText('add-to-supply-chain-step1-title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go-back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use-this-company/i })).toBeInTheDocument();
  });

  it('disables "Use this company" button when company name is empty', () => {
    render(
      <Step1
        onNext={mockOnNext}
        onCancel={mockOnCancel}
        dispatch={mockDispatch}
        account={mockAccount}
      />
    );
    
    const useCompanyButton = screen.getByRole('button', { name: /use-this-company/i });
    expect(useCompanyButton).toBeDisabled();
  });

  it('enables "Use this company" button when company name is filled', () => {
    render(
      <Step1
        onNext={mockOnNext}
        onCancel={mockOnCancel}
        dispatch={mockDispatch}
        account={mockAccount}
      />
    );
    
    const companyNameInput = screen.getByLabelText(/Company name/i);
    fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
    
    const useCompanyButton = screen.getByRole('button', { name: /use-this-company/i });
    expect(useCompanyButton).not.toBeDisabled();
  });

  it('calls onCancel when Go Back is clicked', () => {
    render(
      <Step1
        onNext={mockOnNext}
        onCancel={mockOnCancel}
        dispatch={mockDispatch}
        account={mockAccount}
      />
    );
    
    const goBackButton = screen.getByRole('button', { name: /go-back/i });
    fireEvent.click(goBackButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls API and passes data to next step', async () => {
    mockDispatch.mockResolvedValue({
      payload: {
        data: null,
      },
    });

    render(
      <Step1
        onNext={mockOnNext}
        onCancel={mockOnCancel}
        dispatch={mockDispatch}
        account={mockAccount}
      />
    );
    
    const companyNameInput = screen.getByLabelText(/Company name/i);
    fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
    
    const useCompanyButton = screen.getByRole('button', { name: /use-this-company/i });
    fireEvent.click(useCompanyButton);
    
    // Wait for the API call and next step
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith({
        companyName: 'Test Company',
        companyReg: '',
        existingRecord: null,
      });
    });
  });

  it('pre-fills data from initialData', () => {
    const initialData = {
      companyName: 'Existing Company',
      companyReg: '12345678',
    };
    
    render(
      <Step1
        onNext={mockOnNext}
        onCancel={mockOnCancel}
        dispatch={mockDispatch}
        account={mockAccount}
        initialData={initialData}
      />
    );
    
    const companyNameInput = screen.getByLabelText(/Company name/i);
    const companyRegInput = screen.getByLabelText(/Company reg/i);
    
    expect(companyNameInput).toHaveValue('Existing Company');
    expect(companyRegInput).toHaveValue('12345678');
  });

  it('shows error when API returns error message', async () => {
    mockDispatch.mockResolvedValue({
      payload: {
        message: 'Company already exists in supply chain',
      },
    });

    render(
      <Step1
        onNext={mockOnNext}
        onCancel={mockOnCancel}
        dispatch={mockDispatch}
        account={mockAccount}
      />
    );
    
    // Fill company name
    const companyNameInput = screen.getByLabelText(/Company name/i);
    fireEvent.change(companyNameInput, { target: { value: 'Existing Company' } });
    
    const useCompanyButton = screen.getByRole('button', { name: /use-this-company/i });
    fireEvent.click(useCompanyButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Company already exists in supply chain')).toBeInTheDocument();
    });
    
    // Typing again should clear the error
    fireEvent.change(companyNameInput, { target: { value: 'Another Company' } });
    expect(screen.queryByText('Company already exists in supply chain')).not.toBeInTheDocument();
  });
});

