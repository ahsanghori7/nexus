import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProsperModal, { StyledModalContent } from './Modal';

// Mock the styled component to avoid import issues
jest.mock('./styled', () => ({
  StyledModalContent: ({ children, ...props }) => (
    <div data-testid="styled-modal-content" {...props}>
      {children}
    </div>
  ),
}));

describe('ProsperModal', () => {
  it('renders without crashing', () => {
    render(<ProsperModal />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('renders with default open button when no openButton prop provided', () => {
    render(<ProsperModal />);
    expect(screen.getByTestId('modal-trigger')).toBeInTheDocument();
    // The default button should contain the text "Open"
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders with custom open button', () => {
    const CustomButton = <button>Custom Open Button</button>;
    render(<ProsperModal openButton={CustomButton} />);
    expect(screen.getByText('Custom Open Button')).toBeInTheDocument();
  });

  it('passes correct className to Modal component', () => {
    render(<ProsperModal />);
    fireEvent.click(screen.getByTestId('modal-trigger'));
    
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveClass('action-required-modal');
  });

  it('opens modal when trigger is clicked', () => {
    const mockRender = jest.fn(() => <div>Modal Content</div>);
    render(<ProsperModal render={mockRender} />);
    
    // Modal should not be visible initially
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    
    // Click to open modal
    fireEvent.click(screen.getByTestId('modal-trigger'));
    
    // Modal should now be visible
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(mockRender).toHaveBeenCalled();
  });

  it('calls render function with modal props when opened', () => {
    const mockRender = jest.fn(() => <div>Rendered Content</div>);
    render(<ProsperModal render={mockRender} />);
    
    // Open the modal
    fireEvent.click(screen.getByTestId('modal-trigger'));
    
    // Verify render function was called with expected props
    expect(mockRender).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        handleOpen: expect.any(Function),
        handleClose: expect.any(Function),
      })
    );
  });

  it('renders the content returned by render function', () => {
    const renderFunction = () => <div data-testid="custom-content">Custom Modal Content</div>;
    render(<ProsperModal render={renderFunction} />);
    
    // Open the modal
    fireEvent.click(screen.getByTestId('modal-trigger'));
    
    // Check that the custom content is rendered
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Modal Content')).toBeInTheDocument();
  });
});

describe('StyledModalContent export', () => {
  it('exports StyledModalContent', () => {
    expect(StyledModalContent).toBeDefined();
  });

  it('renders StyledModalContent component', () => {
    render(<StyledModalContent data-testid="styled-content">Test Content</StyledModalContent>);
    expect(screen.getByTestId('styled-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});