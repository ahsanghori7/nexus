import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Regional from 'v2/apps/admin/pages/prosper/Accounts/change-subscription-modal/Regional';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `translated-${key}`),
}));

// Mock MUI components
jest.mock('@mui/material/Autocomplete', () => ({ 
  sx, 
  filterSelectedOptions, 
  options, 
  label, 
  onChange, 
  renderInput,
  ...props 
}) => (
  <div 
    data-testid="mock-autocomplete"
    data-label={label}
    data-sx={JSON.stringify(sx)}
    data-filter-selected-options={filterSelectedOptions}
    {...props}
  >
    <select 
      data-testid="autocomplete-select"
      onChange={(e) => {
        const selectedOption = options.find(opt => opt.id === e.target.value);
        if (onChange) onChange(e, selectedOption);
      }}
    >
      <option value="">Select...</option>
      {options.map(option => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
    {renderInput && renderInput({ placeholder: 'Mock input params' })}
  </div>
));

jest.mock('@mui/material/TextField', () => ({ placeholder, fullWidth, ...params }) => (
  <input 
    data-testid="mock-text-field"
    placeholder={placeholder}
    data-full-width={fullWidth}
    {...params}
  />
));

// Mock styled components
jest.mock('./Mui.styled', () => ({
  MuiFormSubscription: ({ children }) => (
    <div data-testid="mui-form-subscription">{children}</div>
  ),
  MuiSaveBtnContainer: ({ children }) => (
    <div data-testid="mui-save-btn-container">{children}</div>
  ),
  MuiSaveBtn: ({ children, handleClick, disabled }) => (
    <button 
      data-testid="mui-save-btn"
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

describe('Regional', () => {
  const mockSubscription = {
    id: 1,
    label: 'Regional Plan',
  };

  const mockOptions = [
    { id: 'us', label: 'United States' },
    { id: 'eu', label: 'Europe' },
    { id: 'asia', label: 'Asia' },
  ];

  const mockModalProps = {
    handleClose: jest.fn(),
  };

  const mockHandleConfirm = jest.fn();

  const defaultProps = {
    subscription: mockSubscription,
    options: mockOptions,
    placeholder: 'Select region',
    modalProps: mockModalProps,
    handleConfirm: mockHandleConfirm,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<Regional {...defaultProps} />);

    expect(screen.getByTestId('mui-form-subscription')).toBeInTheDocument();
    expect(screen.getByTestId('regional-input-region')).toBeInTheDocument();
    expect(screen.getByTestId('mui-save-btn')).toBeInTheDocument();
  });

  it('should render autocomplete with correct props', () => {
    render(<Regional {...defaultProps} />);

    const autocomplete = screen.getByTestId('regional-input-region');
    expect(autocomplete).toHaveAttribute('data-label', 'translated-region');
    expect(autocomplete).toHaveAttribute('data-sx', '{"width":"100%"}');
    expect(autocomplete).toHaveAttribute('data-filter-selected-options', 'true');
  });

  it('should render options in autocomplete', () => {
    render(<Regional {...defaultProps} />);

    const select = screen.getByTestId('autocomplete-select');
    const options = select.querySelectorAll('option');
    
    expect(options).toHaveLength(4); // 1 default + 3 options
    expect(options[1]).toHaveTextContent('United States');
    expect(options[2]).toHaveTextContent('Europe');
    expect(options[3]).toHaveTextContent('Asia');
  });

  it('should render save button with correct text', () => {
    render(<Regional {...defaultProps} />);

    const saveBtn = screen.getByTestId('mui-save-btn');
    expect(saveBtn).toHaveTextContent('translated-save');
  });

  it('should disable save button initially', () => {
    render(<Regional {...defaultProps} />);

    const saveBtn = screen.getByTestId('mui-save-btn');
    expect(saveBtn).toBeDisabled();
  });

  it('should enable save button when region is selected', () => {
    render(<Regional {...defaultProps} />);

    const select = screen.getByTestId('autocomplete-select');
    fireEvent.change(select, { target: { value: 'us' } });

    const saveBtn = screen.getByTestId('mui-save-btn');
    expect(saveBtn).not.toBeDisabled();
  });

  it('should call handleConfirm and modal close on save', () => {
    render(<Regional {...defaultProps} />);

    // Select a region first
    const select = screen.getByTestId('autocomplete-select');
    fireEvent.change(select, { target: { value: 'us' } });

    // Click save
    const saveBtn = screen.getByTestId('mui-save-btn');
    fireEvent.click(saveBtn);

    expect(mockHandleConfirm).toHaveBeenCalledWith(mockSubscription, { region: [{ id: 'us' }] });
    expect(mockModalProps.handleClose).toHaveBeenCalled();
  });

  it('should not call handleConfirm if not provided', () => {
    render(<Regional {...defaultProps} handleConfirm={undefined} />);

    // Select a region first
    const select = screen.getByTestId('autocomplete-select');
    fireEvent.change(select, { target: { value: 'us' } });

    // Click save
    const saveBtn = screen.getByTestId('mui-save-btn');
    fireEvent.click(saveBtn);

    expect(mockModalProps.handleClose).toHaveBeenCalled();
  });

  it('should handle empty options array', () => {
    render(<Regional {...defaultProps} options={[]} />);

    const select = screen.getByTestId('autocomplete-select');
    const options = select.querySelectorAll('option');
    
    expect(options).toHaveLength(1); // Only the default option
  });

  it('should handle null options', () => {
    render(<Regional {...defaultProps} options={null} />);

    const autocomplete = screen.getByTestId('regional-input-region');
    expect(autocomplete).toBeInTheDocument();
  });

  it('should render text field with placeholder', () => {
    render(<Regional {...defaultProps} />);

    const textField = screen.getByTestId('mock-text-field');
    expect(textField).toHaveAttribute('placeholder', 'Select region');
    expect(textField).toHaveAttribute('data-full-width', 'true');
  });

  it('should handle region deselection', () => {
    render(<Regional {...defaultProps} />);

    const select = screen.getByTestId('autocomplete-select');
    
    // Select a region
    fireEvent.change(select, { target: { value: 'us' } });
    let saveBtn = screen.getByTestId('mui-save-btn');
    expect(saveBtn).not.toBeDisabled();

    // Deselect (empty value)
    fireEvent.change(select, { target: { value: '' } });
    saveBtn = screen.getByTestId('mui-save-btn');
    expect(saveBtn).toBeDisabled();
  });

  it('should work with different subscription data', () => {
    const differentSubscription = {
      id: 2,
      label: 'Different Plan',
    };

    render(<Regional {...defaultProps} subscription={differentSubscription} />);

    // Select a region first
    const select = screen.getByTestId('autocomplete-select');
    fireEvent.change(select, { target: { value: 'eu' } });

    // Click save
    const saveBtn = screen.getByTestId('mui-save-btn');
    fireEvent.click(saveBtn);

    expect(mockHandleConfirm).toHaveBeenCalledWith(differentSubscription, { region: [{ id: 'eu' }] });
  });
});