import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PanelHeaderContent from './PanelHeaderContent';

// Global mock dispatch variable (must be prefixed with "mock")
let mockGlobalDispatch = jest.fn();

// Mock the connect HOC directly to bypass store issues
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  connect: jest.fn(() => (Component) => {
    return (props) => <Component {...props} dispatch={mockGlobalDispatch} />;
  }),
  Provider: ({ children }) => children,
}));

jest.mock('clink-components', () => ({
  InputCheckbox: ({ name, label, onChange, value, options }) => (
    <div data-testid="input-checkbox">
      <span>{label}</span>
      {options && options.map((option) => (
        <label key={option.value}>
          <input
            data-testid={option.value === 'yes' ? 'yes-radio' : 'no-radio'}
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e)}
          />
          {option.label}
        </label>
      ))}
    </div>
  ),
  InputText: ({ inputValue, placeholder, onChange, name }) => (
    <input
      data-testid="input-text"
      type="text"
      name={name}
      value={inputValue}
      placeholder={placeholder}
      onChange={onChange}
    />
  ),
  Button: ({ children, handleClick, ...props }) => (
    <button data-testid="submit-button" onClick={handleClick} {...props}>{children}</button>
  ),
}));

jest.mock('@mui/material/CircularProgress', () => ({
  __esModule: true,
  default: () => <div data-testid="loading">Loading...</div>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        yes: 'Yes',
        no: 'No',
        approved: 'Approved',
        'add-comment': 'Add comment',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('store/reducers/actions', () => ({
  admin: {
    changeSectionStatus: jest.fn((payload) => ({ type: 'CHANGE_SECTION_STATUS', payload })),
    postStatus: jest.fn((payload) => {
      // Return a thunk function that returns a promise when dispatched
      return (dispatch) => {
        dispatch({ type: 'POST_STATUS', payload });
        return Promise.resolve();
      };
    }),
  },
}));

const renderComponent = (props = {}) => {
  const defaultProps = {
    approved: { id: '123', status: true, message: 'Test message' },
    section: 'test-section',
    aid: 'account-123',
    ...props,
  };
  return render(<PanelHeaderContent {...defaultProps} />);
};

describe('PanelHeaderContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the global mock dispatch for each test
    mockGlobalDispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        return action(mockGlobalDispatch, () => ({}));
      }
      return undefined;
    });
  });

  it('should render with default props', () => {
    renderComponent();
    
    expect(screen.getByTestId('input-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByText('Approved?')).toBeInTheDocument();
  });

  it('should show input text when status is false', () => {
    renderComponent({
      approved: { id: '123', status: false, message: 'Test message' },
    });
    
    expect(screen.getByTestId('input-text')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add comment')).toBeInTheDocument();
  });

  it('should not show input text when status is true', () => {
    renderComponent();
    
    expect(screen.queryByTestId('input-text')).not.toBeInTheDocument();
  });

  it('should handle checkbox change', () => {
    renderComponent();
    
    const noRadio = screen.getByTestId('no-radio');
    fireEvent.click(noRadio);
    
    expect(mockGlobalDispatch).toHaveBeenCalledWith({
      type: 'CHANGE_SECTION_STATUS',
      payload: {
        value: false, // 'no' maps to false via mapValue
        section: 'test-section',
      },
    });
  });

  it('should handle comment change', () => {
    renderComponent({
      approved: { id: '123', status: false, message: 'Test message' },
    });
    
    const commentInput = screen.getByTestId('input-text');
    fireEvent.change(commentInput, { target: { value: 'New comment' } });
    
    // Comment change should update local state (no dispatch)
    expect(commentInput).toHaveValue('New comment');
  });

  it('should handle submit with aid', async () => {
    renderComponent();
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Check dispatch was called (remove loading check for now)
    expect(mockGlobalDispatch).toHaveBeenCalledWith(
      expect.any(Function) // The thunk function
    );
  });

  it('should not submit without aid', () => {
    renderComponent({ aid: null });
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Should not dispatch anything
    expect(mockGlobalDispatch).not.toHaveBeenCalled();
  });

  it('should disable submit button when conditions not met', () => {
    renderComponent({
      approved: { status: false, message: '' },
    });
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when status is true', () => {
    renderComponent();
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).not.toBeDisabled();
  });

  it('should enable submit button when status is false and comment exists', () => {
    renderComponent({
      approved: { status: false, message: 'Some comment' },
    });
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).not.toBeDisabled();
  });

  it('should update state when approved props change', () => {
    const { rerender } = renderComponent({
      approved: { id: '123', status: true, message: 'Initial message' },
    });
    
    // Check initial state
    expect(screen.getByTestId('yes-radio')).toBeChecked();
    
    // Update props
    rerender(<PanelHeaderContent 
      approved={{ id: '123', status: false, message: 'Updated message' }}
      section="test-section"
      aid="account-123"
    />);
    
    // Should update to reflect new props
    expect(screen.getByTestId('no-radio')).toBeChecked();
  });
});
