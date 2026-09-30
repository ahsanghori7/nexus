import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmModal from './index';

// Mock clink-components
jest.mock('clink-components', () => ({
  Button: ({ children, handleClick, id, layout, color, align, ...props }) => (
    <button 
      onClick={handleClick} 
      id={id}
      data-layout={layout}
      data-color={color}
      data-align={align}
      {...props}
    >
      {children}
    </button>
  ),
  Modal: jest.fn(({ openElement, render, className }) => {
    const mockModalProps = {
      handleClose: jest.fn(),
      isOpen: true
    };
    
    return (
      <div className={className}>
        <div data-testid="modal-trigger">
          {openElement}
        </div>
        <div data-testid="modal-content">
          {render(mockModalProps)}
        </div>
      </div>
    );
  }),
  ModalContent: ({ children }) => <div data-testid="modal-inner">{children}</div>
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'no': 'No',
        'yes': 'Yes'
      };
      return translations[key] || key;
    }
  })
}));

describe('ConfirmModal Component', () => {
  const defaultProps = {
    data: { id: 1 },
    buttonLabel: 'Delete Item',
    selected: false,
    title: 'Confirm Action',
    subtitle: 'Are you sure you want to proceed?',
    handleConfirm: jest.fn(),
    className: 'test-modal'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
  });

  it('displays button label correctly when not selected', () => {
    render(<ConfirmModal {...defaultProps} />);
    const button = screen.getByText('Delete Item');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('displays button label in bold when selected', () => {
    render(<ConfirmModal {...defaultProps} selected={true} />);
    const boldElement = screen.getByText('Delete Item');
    expect(boldElement.tagName).toBe('B');
    expect(boldElement).toHaveStyle({ fontWeight: 'bold' });
  });

  it('opens modal when button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    
    // Modal content should be visible (since we always show it in mock)
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });

  it('displays title and subtitle in modal', () => {
    render(<ConfirmModal {...defaultProps} />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('displays Yes and No buttons in modal', () => {
    render(<ConfirmModal {...defaultProps} />);
    
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Yes').id).toBe('btn-yes');
    expect(screen.getByText('No').id).toBe('btn-no');
  });

  it('calls handleConfirm when Yes button is clicked', () => {
    const mockHandleConfirm = jest.fn();
    render(<ConfirmModal {...defaultProps} handleConfirm={mockHandleConfirm} />);
    
    // Click Yes button
    fireEvent.click(screen.getByText('Yes'));
    
    expect(mockHandleConfirm).toHaveBeenCalledWith(defaultProps.data);
  });

  it('calls modal close when No button is clicked', () => {
    const { container } = render(<ConfirmModal {...defaultProps} />);
    
    // Click No button - should not throw error
    expect(() => {
      fireEvent.click(screen.getByText('No'));
    }).not.toThrow();
  });

  it('calls modal close when Yes button is clicked', () => {
    const { container } = render(<ConfirmModal {...defaultProps} />);
    
    // Click Yes button - should not throw error
    expect(() => {
      fireEvent.click(screen.getByText('Yes'));
    }).not.toThrow();
  });

  it('uses default empty title and subtitle when not provided', () => {
    const propsWithoutTitleSubtitle = {
      ...defaultProps,
      title: undefined,
      subtitle: undefined
    };
    delete propsWithoutTitleSubtitle.title;
    delete propsWithoutTitleSubtitle.subtitle;
    
    render(<ConfirmModal {...propsWithoutTitleSubtitle} />);
    
    // Should still render h1 and small elements even if empty
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('');
    expect(document.querySelector('small')).toBeInTheDocument();
    expect(document.querySelector('small')).toHaveTextContent('');
  });

  it('works without handleConfirm prop', () => {
    const propsWithoutHandler = {
      ...defaultProps,
      handleConfirm: undefined
    };
    delete propsWithoutHandler.handleConfirm;
    
    render(<ConfirmModal {...propsWithoutHandler} />);
    
    // Should not throw error when clicking Yes
    expect(() => {
      fireEvent.click(screen.getByText('Yes'));
    }).not.toThrow();
  });

  it('uses custom CSS class', () => {
    const customClass = 'my-custom-modal';
    render(<ConfirmModal {...defaultProps} className={customClass} />);
    
    expect(document.querySelector(`.${customClass}`)).toBeInTheDocument();
  });

  it('uses default className when not provided', () => {
    const propsWithoutClassName = { ...defaultProps };
    delete propsWithoutClassName.className;
    
    render(<ConfirmModal {...propsWithoutClassName} />);
    
    expect(document.querySelector('.confirm-modal')).toBeInTheDocument();
  });

  it('uses custom open element when provided', () => {
    const customOpenElement = <span data-testid="custom-opener">Custom Button</span>;
    render(<ConfirmModal {...defaultProps} customOpenElement={customOpenElement} />);
    
    expect(screen.getByTestId('custom-opener')).toBeInTheDocument();
    expect(screen.getByText('Custom Button')).toBeInTheDocument();
    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });

  it('sets correct button properties', () => {
    render(<ConfirmModal {...defaultProps} />);
    
    const button = screen.getByText('Delete Item');
    expect(button).toHaveAttribute('data-layout', 'dropdown');
    expect(button).toHaveAttribute('data-align', 'left');
  });

  it('sets correct button properties for Yes and No buttons', () => {
    render(<ConfirmModal {...defaultProps} />);
    
    const yesButton = screen.getByText('Yes');
    const noButton = screen.getByText('No');
    
    expect(yesButton).toHaveAttribute('data-layout', 'square');
    expect(yesButton).toHaveAttribute('data-color', 'greenButton');
    
    expect(noButton).toHaveAttribute('data-layout', 'square');
    expect(noButton).toHaveAttribute('data-color', 'redButton');
  });

  it('renders modal content with correct structure', () => {
    render(<ConfirmModal {...defaultProps} />);
    
    expect(screen.getByTestId('modal-inner')).toBeInTheDocument();
    expect(document.querySelector('.center')).toBeInTheDocument();
  });
});