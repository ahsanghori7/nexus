import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Flexi from 'v2/apps/admin/pages/prosper/Accounts/change-subscription-modal/Flexi';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `translated-${key}`),
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  Button: ({ children, type, layout, color, disabled, ...props }) => (
    <button 
      data-testid="mock-button"
      data-type={type}
      data-layout={layout}
      data-color={color}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
  Form: ({ children, render, onSubmit, defaultValues, method, disableUntilValid, ...props }) => {
    // Create a simple mock form hook
    const mockFormHook = {
      formState: { errors: {}, isValid: true },
      register: jest.fn(),
      control: {},
      setValue: jest.fn(),
    };

    return (
      <form 
        data-testid="mock-form"
        data-method={method}
        data-disable-until-valid={disableUntilValid}
        onSubmit={(e) => {
          e.preventDefault();
          if (onSubmit) {
            onSubmit(defaultValues);
          }
        }}
        {...props}
      >
        {typeof render === 'function' ? render(mockFormHook) : children}
      </form>
    );
  },
  InputFormControlled: ({ 
    control, 
    setValue, 
    autoComplete, 
    label, 
    errors, 
    register, 
    placeholder, 
    name, 
    type, 
    rules 
  }) => {
    const inputProps = {
      'data-testid': 'mock-input',
      'data-name': name,
      'data-type': type,
      'data-label': label,
      defaultValue: 10,
      onChange: (e) => {
        if (rules?.onChange) {
          rules.onChange(e);
        }
      }
    };
    
    if (placeholder !== undefined) {
      inputProps.placeholder = placeholder;
    }
    
    return <input {...inputProps} />;
  },
}));

// Mock styled components
jest.mock('./Mui.styled', () => ({
  MuiFormSubscription: ({ children }) => (
    <div data-testid="mui-form-subscription">{children}</div>
  ),
  MuiInputData: ({ children }) => (
    <div data-testid="mui-input-data">{children}</div>
  ),
  MuiSaveBtnContainer: ({ children }) => (
    <div data-testid="mui-save-btn-container">{children}</div>
  ),
}));

describe('Flexi', () => {
  const mockSubscription = {
    id: 1,
    label: 'Flexi Plan',
  };

  const mockModalProps = {
    handleClose: jest.fn(),
  };

  const mockHandleConfirm = jest.fn();

  const defaultProps = {
    subscription: mockSubscription,
    placeholder: 'Enter tokens',
    modalProps: mockModalProps,
    handleConfirm: mockHandleConfirm,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<Flexi {...defaultProps} />);

    expect(screen.getByTestId('mui-form-subscription')).toBeInTheDocument();
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
  });

  it('should render form with correct props', () => {
    render(<Flexi {...defaultProps} />);

    const form = screen.getByTestId('form-content');
    expect(form).toHaveAttribute('data-method', 'PATCH');
    expect(form).toHaveAttribute('data-disable-until-valid', 'true');
  });

  it('should render input field with correct props', () => {
    render(<Flexi {...defaultProps} />);

    const input = screen.getByTestId('mock-input');
    expect(input).toHaveAttribute('data-name', 'flexiTokens');
    expect(input).toHaveAttribute('data-type', 'number');
    expect(input).toHaveAttribute('data-label', 'translated-tokens');
    expect(input).toHaveAttribute('placeholder', 'Enter tokens');
  });

  it('should render save button with correct props', () => {
    render(<Flexi {...defaultProps} />);

    const button = screen.getByTestId('flexi-button-save');
    expect(button).toHaveAttribute('data-type', 'submit');
    expect(button).toHaveAttribute('data-layout', 'square');
    expect(button).toHaveAttribute('data-color', 'blueButton');
    expect(button).toHaveTextContent('translated-save');
  });

  it('should call handleConfirm and modal close on form submit', async () => {
    render(<Flexi {...defaultProps} />);

    const form = screen.getByTestId('form-content');
    fireEvent.submit(form);

    expect(mockHandleConfirm).toHaveBeenCalledWith(mockSubscription, { tokens: 10 });
    expect(mockModalProps.handleClose).toHaveBeenCalled();
  });

  it('should not call handleConfirm if not provided', () => {
    render(<Flexi {...defaultProps} handleConfirm={undefined} />);

    const form = screen.getByTestId('form-content');
    fireEvent.submit(form);

    expect(mockModalProps.handleClose).toHaveBeenCalled();
  });

  it('should render with mui styled components', () => {
    render(<Flexi {...defaultProps} />);

    expect(screen.getByTestId('mui-form-subscription')).toBeInTheDocument();
    expect(screen.getByTestId('mui-input-data')).toBeInTheDocument();
    expect(screen.getByTestId('mui-save-btn-container')).toBeInTheDocument();
  });

  it('should handle missing placeholder', () => {
    render(<Flexi {...defaultProps} placeholder={undefined} />);

    const input = screen.getByTestId('mock-input');
    expect(input).not.toHaveAttribute('placeholder');
  });

  it('should work with different subscription data', () => {
    const differentSubscription = {
      id: 2,
      label: 'Different Plan',
    };

    render(<Flexi {...defaultProps} subscription={differentSubscription} />);

    const form = screen.getByTestId('form-content');
    fireEvent.submit(form);

    expect(mockHandleConfirm).toHaveBeenCalledWith(differentSubscription, { tokens: 10 });
  });
});