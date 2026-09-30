import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WarnModal from './WarnModal';

// Mock clink-components
jest.mock('clink-components', () => ({
  Modal: ({ children, externalOpen, onHidden, render: renderProp, className }) => {
    return externalOpen ? (
      <div data-testid="modal" className={className} onClick={onHidden}>
        {renderProp ? renderProp() : children}
      </div>
    ) : null;
  },
  ModalContent: ({ children, className }) => (
    <div data-testid="modal-content" className={className}>
      {children}
    </div>
  ),
}));

// Mock prosper styled components
jest.mock('v2/apps/prosper/shared/styled', () => ({
  StyledModalContent: ({ children, className }) => (
    <div data-testid="styled-modal-content" className={className}>
      {children}
    </div>
  ),
  StyledH1: ({ children }) => (
    <h1 data-testid="styled-h1">{children}</h1>
  ),
  StyledTokenModalText: ({ children }) => (
    <div data-testid="styled-token-text">{children}</div>
  ),
}));

describe('WarnModal Component', () => {
  const defaultProps = {
    title: 'Test Warning',
    message: 'This is a test warning message',
    open: true,
    onHidden: jest.fn(),
    className: 'test-class',
    theme: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing with all props', () => {
    render(<WarnModal {...defaultProps} />);
    
    const modal = screen.getByTestId('modal');
    const title = screen.getByText('Test Warning');
    const message = screen.getByText('This is a test warning message');
    
    expect(modal).toBeInTheDocument();
    expect(title).toBeInTheDocument();
    expect(message).toBeInTheDocument();
  });

  test('does not render when open is false', () => {
    render(<WarnModal {...defaultProps} open={false} />);
    
    const modal = screen.queryByTestId('modal');
    expect(modal).not.toBeInTheDocument();
  });

  test('renders with default props when optional props are not provided', () => {
    render(<WarnModal />);
    
    const modal = screen.getByTestId('modal');
    const defaultTitle = screen.getByText('Error');
    const defaultMessage = screen.getByText('There was an error when sending the instruction/ncr');
    
    expect(modal).toBeInTheDocument();
    expect(defaultTitle).toBeInTheDocument();
    expect(defaultMessage).toBeInTheDocument();
  });

  test('renders with normal theme by default', () => {
    render(<WarnModal {...defaultProps} />);
    
    const modalContent = screen.getByTestId('modal-content');
    const title = screen.getByRole('heading', { level: 1 });
    const message = screen.getByText(defaultProps.message);
    
    expect(modalContent).toBeInTheDocument();
    expect(modalContent).toHaveClass('center');
    expect(title).toBeInTheDocument();
    expect(message.parentElement).toHaveClass('center');
  });

  test('renders with prosper theme when theme is prosper', () => {
    render(<WarnModal {...defaultProps} theme="prosper" />);
    
    const styledModalContent = screen.getByTestId('styled-modal-content');
    const styledTitle = screen.getByTestId('styled-h1');
    const styledMessage = screen.getByTestId('styled-token-text');
    
    expect(styledModalContent).toBeInTheDocument();
    expect(styledModalContent).toHaveClass('packages-modal-content');
    expect(styledTitle).toBeInTheDocument();
    expect(styledTitle).toHaveTextContent('Test Warning');
    expect(styledMessage).toBeInTheDocument();
    expect(styledMessage).toHaveTextContent('This is a test warning message');
  });

  test('renders with custom className', () => {
    const customClass = 'custom-warn-modal';
    render(<WarnModal {...defaultProps} className={customClass} />);
    
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveClass(`warn-modal ${customClass}`);
  });

  test('renders with empty className when not provided', () => {
    render(<WarnModal {...defaultProps} className="" />);
    
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveClass('warn-modal ');
  });

  test('calls onHidden when modal is clicked', () => {
    const mockOnHidden = jest.fn();
    render(<WarnModal {...defaultProps} onHidden={mockOnHidden} />);
    
    const modal = screen.getByTestId('modal');
    modal.click();
    
    expect(mockOnHidden).toHaveBeenCalledTimes(1);
  });

  test('renders with custom title and message', () => {
    const customTitle = 'Custom Warning Title';
    const customMessage = 'This is a custom warning message';
    
    render(
      <WarnModal
        {...defaultProps}
        title={customTitle}
        message={customMessage}
      />
    );
    
    const title = screen.getByText(customTitle);
    const message = screen.getByText(customMessage);
    
    expect(title).toBeInTheDocument();
    expect(message).toBeInTheDocument();
  });

  test('renders with empty title and message', () => {
    render(<WarnModal {...defaultProps} title="" message="" />);
    
    const modal = screen.getByTestId('modal');
    expect(modal).toBeInTheDocument();
    
    // The h1 and message div should still be present but empty
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('');
  });

  test('modal content receives correct className in both themes', () => {
    // Test normal theme
    const { rerender } = render(<WarnModal {...defaultProps} />);
    let modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('center');

    // Test prosper theme
    rerender(<WarnModal {...defaultProps} theme="prosper" />);
    modalContent = screen.getByTestId('styled-modal-content');
    expect(modalContent).toHaveClass('packages-modal-content');
  });

  test('renders with different theme values', () => {
    const themes = [null, '', 'other', 'prosper'];
    
    themes.forEach(theme => {
      const { unmount } = render(<WarnModal {...defaultProps} theme={theme} />);
      
      const modal = screen.getByTestId('modal');
      expect(modal).toBeInTheDocument();
      
      if (theme === 'prosper') {
        expect(screen.getByTestId('styled-modal-content')).toBeInTheDocument();
      } else {
        expect(screen.getByTestId('modal-content')).toBeInTheDocument();
      }
      
      unmount();
    });
  });

  test('uses default onHidden function when none provided', () => {
    // Test the default onHidden function (no-op)
    render(
      <WarnModal
        title="Test"
        message="Test message"
        open={true}
      />
    );
    
    const modal = screen.getByTestId('modal');
    
    // This should not throw an error when clicked, testing the default no-op function
    expect(() => modal.click()).not.toThrow();
  });
});