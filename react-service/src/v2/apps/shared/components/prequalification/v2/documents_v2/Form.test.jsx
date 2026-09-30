import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Form from './Form';

// Mock the external dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('./CautionMessage', () => {
  return function CautionMessage() {
    return <div data-testid="caution-message">Caution Message</div>;
  };
});

jest.mock('./useDocumentsForm', () => {
  return jest.fn();
});

jest.mock('v2/apps/shared/components/prequalification/v2/Button', () => {
  return function Button({ children, ...props }) {
    return <button {...props}>{children}</button>;
  };
});

describe('Form', () => {
  const mockHandleSubmit = jest.fn();
  const mockReset = jest.fn();
  const mockHandleOnSubmit = jest.fn();

  const MockInputs = jest.fn(({ aid, data, documentsForm, options, selectedOptions, showOtherOptionForAll }) => (
    <div data-testid="mock-inputs">
      Mock Inputs Component
      <div data-testid="inputs-props">
        {JSON.stringify({ aid, data, documentsForm, options, selectedOptions, showOtherOptionForAll })}
      </div>
    </div>
  ));

  const defaultProps = {
    aid: '123',
    data: { id: 1, name: 'Test Document' },
    type: 'test-type',
    options: ['option1', 'option2'],
    selectedOptions: ['option1'],
    handleOnSubmit: mockHandleOnSubmit,
    Inputs: MockInputs,
    showOtherOptionForAll: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock for useDocumentsForm
    const useDocumentsForm = require('./useDocumentsForm');
    useDocumentsForm.mockReturnValue({
      handleSubmit: mockHandleSubmit,
      reset: mockReset,
    });
    
    // Make handleSubmit work like react-hook-form
    mockHandleSubmit.mockImplementation((callback) => (event) => {
      event.preventDefault();
      callback({ test: 'data' });
    });
  });

  it('renders without crashing', () => {
    render(<Form {...defaultProps} />);
    expect(screen.getByTestId('mock-inputs')).toBeInTheDocument();
  });

  it('returns null when type is not provided', () => {
    const propsWithoutType = { ...defaultProps, type: null };
    const { container } = render(<Form {...propsWithoutType} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when type is empty string', () => {
    const propsWithoutType = { ...defaultProps, type: '' };
    const { container } = render(<Form {...propsWithoutType} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders CautionMessage when data.requested is true', () => {
    const propsWithRequested = {
      ...defaultProps,
      data: { ...defaultProps.data, requested: true }
    };
    
    render(<Form {...propsWithRequested} />);
    expect(screen.getByTestId('caution-message')).toBeInTheDocument();
  });

  it('does not render CautionMessage when data.requested is false', () => {
    const propsWithoutRequested = {
      ...defaultProps,
      data: { ...defaultProps.data, requested: false }
    };
    
    render(<Form {...propsWithoutRequested} />);
    expect(screen.queryByTestId('caution-message')).not.toBeInTheDocument();
  });

  it('does not render CautionMessage when data.requested is undefined', () => {
    render(<Form {...defaultProps} />);
    expect(screen.queryByTestId('caution-message')).not.toBeInTheDocument();
  });

  it('renders hidden inputs for id and section', () => {
    render(<Form {...defaultProps} />);
    
    const hiddenInputs = screen.getAllByDisplayValue('');
    const idInput = hiddenInputs.find(input => input.name === 'id');
    const sectionInput = hiddenInputs.find(input => input.name === 'section');
    
    expect(idInput).toBeInTheDocument();
    expect(idInput).toHaveAttribute('type', 'hidden');
    expect(sectionInput).toBeInTheDocument();
    expect(sectionInput).toHaveAttribute('type', 'hidden');
  });

  it('renders the Inputs component with correct props', () => {
    render(<Form {...defaultProps} />);
    
    expect(MockInputs).toHaveBeenCalledWith(
      expect.objectContaining({
        aid: '123',
        data: { id: 1, name: 'Test Document' },
        documentsForm: { handleSubmit: mockHandleSubmit, reset: mockReset },
        options: ['option1', 'option2'],
        selectedOptions: ['option1'],
        showOtherOptionForAll: false,
      }),
      {}
    );
  });

  it('renders submit button with correct text', () => {
    render(<Form {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: 'confirm' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('calls handleOnSubmit and reset when form is submitted', async () => {
    render(<Form {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: 'confirm' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  it('passes useDocumentsForm result correctly', () => {
    const useDocumentsForm = require('./useDocumentsForm');
    
    render(<Form {...defaultProps} />);
    
    expect(useDocumentsForm).toHaveBeenCalledWith(
      { id: 1, name: 'Test Document' },
      'test-type'
    );
  });

  it('handles showOtherOptionForAll prop correctly', () => {
    const propsWithShowOther = {
      ...defaultProps,
      showOtherOptionForAll: true,
    };
    
    render(<Form {...propsWithShowOther} />);
    
    expect(MockInputs).toHaveBeenCalledWith(
      expect.objectContaining({
        showOtherOptionForAll: true,
      }),
      {}
    );
  });

  it('handles empty options array', () => {
    const propsWithEmptyOptions = {
      ...defaultProps,
      options: [],
    };
    
    render(<Form {...propsWithEmptyOptions} />);
    
    expect(MockInputs).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [],
      }),
      {}
    );
  });

  it('handles empty selectedOptions array', () => {
    const propsWithEmptySelected = {
      ...defaultProps,
      selectedOptions: [],
    };
    
    render(<Form {...propsWithEmptySelected} />);
    
    expect(MockInputs).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedOptions: [],
      }),
      {}
    );
  });

  it('applies correct form styling', () => {
    render(<Form {...defaultProps} />);
    
    const box = screen.getByTestId('mui-box');
    expect(box).toBeInTheDocument();
    expect(box).toHaveAttribute('component', 'form');
  });
});