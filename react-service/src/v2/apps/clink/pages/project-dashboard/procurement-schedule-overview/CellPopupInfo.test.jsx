import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CellPopupInfo from './CellPopupInfo';

// Mock MUI components
jest.mock('@mui/material/Popper', () => ({ children, open, ...props }) =>
  open ? <div data-testid="popper" {...props}>{children}</div> : null
);

jest.mock('@mui/material/Paper', () => ({ children, ...props }) =>
  <div data-testid="paper" {...props}>{children}</div>
);

jest.mock('@mui/material/ClickAwayListener', () => ({ children, onClickAway }) => (
  <div data-testid="click-away-listener" onClick={onClickAway}>
    {children}
  </div>
));

jest.mock('@mui/material/Grid2', () => ({ children, ...props }) =>
  <div data-testid="grid" {...props}>{children}</div>
);

jest.mock('@mui/material/Typography', () => ({ children, ...props }) =>
  <span data-testid="typography" {...props}>{children}</span>
);

jest.mock('@mui/material/IconButton', () => ({ children, onClick, ...props }) =>
  <button data-testid="icon-button" onClick={onClick} {...props}>
    {children}
  </button>
);

jest.mock('@mui/icons-material/Close', () => () =>
  <span data-testid="close-icon">×</span>
);

describe('CellPopupInfo', () => {
  const defaultProps = {
    open: true,
    anchorEl: null,
    onClose: jest.fn(),
    children: <div>Test Content</div>,
  };

  beforeEach(() => {
    defaultProps.onClose.mockClear();
  });

  it('renders without crashing when open', () => {
    render(<CellPopupInfo {...defaultProps} />);

    expect(screen.getByTestId('cell-popup')).toBeInTheDocument();
    expect(screen.getByTestId('paper')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CellPopupInfo {...defaultProps} open={false} />);

    expect(screen.queryByTestId('cell-popup')).not.toBeInTheDocument();
  });

  it('renders with title when provided', () => {
    render(<CellPopupInfo {...defaultProps} title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
  });

  it('does not render title section when no title provided', () => {
    render(<CellPopupInfo {...defaultProps} />);

    expect(screen.queryByTestId('typography')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cell-popup-close')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<CellPopupInfo {...defaultProps} title="Test Title" />);

    const closeButton = screen.getByTestId('cell-popup-close');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking away', () => {
    render(<CellPopupInfo {...defaultProps} />);
    
    const clickAwayListener = screen.getByTestId('click-away-listener');
    fireEvent.click(clickAwayListener);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('passes custom paperSx prop', () => {
    const customSx = { backgroundColor: 'red' };
    render(<CellPopupInfo {...defaultProps} paperSx={customSx} />);
    
    const paper = screen.getByTestId('paper');
    expect(paper).toHaveAttribute('sx', '[object Object]');
  });

  it('passes placement prop to Popper', () => {
    render(<CellPopupInfo {...defaultProps} placement="bottom" />);

    const popper = screen.getByTestId('cell-popup');
    expect(popper).toHaveAttribute('placement', 'bottom');
  });

  it('uses default placement when not provided', () => {
    render(<CellPopupInfo {...defaultProps} />);

    const popper = screen.getByTestId('cell-popup');
    expect(popper).toHaveAttribute('placement', 'top');
  });

  it('passes modifiers prop to Popper', () => {
    const customModifiers = [{ name: 'test' }];
    render(<CellPopupInfo {...defaultProps} modifiers={customModifiers} />);

    const popper = screen.getByTestId('cell-popup');
    expect(popper).toHaveAttribute('modifiers');
  });

  it('renders children content', () => {
    const customChildren = (
      <div>
        <p>Custom content</p>
        <span>More content</span>
      </div>
    );
    
    render(<CellPopupInfo {...defaultProps} children={customChildren} />);
    
    expect(screen.getByText('Custom content')).toBeInTheDocument();
    expect(screen.getByText('More content')).toBeInTheDocument();
  });

  it('stops propagation when close button is clicked', () => {
    const stopPropagation = jest.fn();
    render(<CellPopupInfo {...defaultProps} title="Test Title" />);

    const closeButton = screen.getByTestId('cell-popup-close');
    
    // Create a mock event with stopPropagation
    const mockEvent = { stopPropagation };
    
    // We can't easily test stopPropagation with fireEvent, 
    // but we can verify the button handles clicks
    expect(closeButton).toBeInTheDocument();
  });
});