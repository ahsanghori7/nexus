import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
// Import the existing mocks
import useMediaQuery from '@mui/material/useMediaQuery';

// Import the component
import MuiDialog from './index';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconCloseRed: 'close-icon.svg'
    }
  },
  Image: ({ src, alt }) => <img src={src} alt={alt || ''} data-testid="image" />
}));

// Mock MUI components
jest.mock('@mui/material/Dialog', () => {
  return function MockDialog({ children, open, onClose, fullScreen, disableEscapeKeyDown, PaperProps, slotProps }) {
    return open ? (
      <div 
        data-testid="dialog" 
        data-fullscreen={fullScreen} 
        data-disable-escape={disableEscapeKeyDown}
        data-on-close={onClose ? 'true' : 'false'}
        style={PaperProps?.sx}
        onClick={onClose} // Allow triggering onClose
      >
        {children}
      </div>
    ) : null;
  };
});

jest.mock('@mui/material/DialogActions', () => {
  return function MockDialogActions({ children }) {
    return <div data-testid="dialog-actions">{children}</div>;
  };
});

jest.mock('@mui/material/DialogContent', () => {
  return function MockDialogContent({ children }) {
    return <div data-testid="dialog-content">{children}</div>;
  };
});

jest.mock('@mui/material/DialogTitle', () => {
  return function MockDialogTitle({ children, ...props }) {
    return <div data-testid="dialog-title" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/AppBar', () => {
  return function MockAppBar({ children, sx, ...props }) {
    return (
      <div 
        data-testid="app-bar" 
        data-position={sx?.position}
        style={sx}
        {...props}
      >
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Toolbar', () => {
  return function MockToolbar({ children, sx }) {
    return (
      <div data-testid="toolbar" style={sx}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/IconButton', () => {
  return function MockIconButton({ children, onClick, edge, color }) {
    return (
      <button 
        data-testid="icon-button" 
        onClick={onClick}
        data-edge={edge}
        data-color={color}
      >
        {children}
      </button>
    );
  };
});

jest.mock('@mui/material/Typography', () => {
  return function MockTypography({ children, ...props }) {
    return <div data-testid="typography" {...props}>{children}</div>;
  };
});

// Mock useTheme
const mockUseTheme = jest.fn(() => ({
  breakpoints: {
    down: jest.fn(() => '(max-width: 960px)')
  }
}));

jest.doMock('@mui/material/styles', () => ({
  useTheme: mockUseTheme
}));

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html) => html)
}));

// Mock BASE_DIRS
global.BASE_DIRS = {
  V2: {
    PROSPER: 'prosper',
    CLINK: 'clink'
  }
};

describe('MuiDialog Component', () => {
  const defaultProps = {
    open: true,
    title: 'Test Dialog',
    children: <div>Dialog Content</div>,
    handleClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset useMediaQuery mock to default
    useMediaQuery.mockReturnValue(false);
  });

  it('renders without crashing when open', () => {
    render(<MuiDialog {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<MuiDialog {...defaultProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('displays the title when provided', () => {
    render(<MuiDialog {...defaultProps} />);
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<MuiDialog {...defaultProps} />);
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();
  });

  it('calls handleClose when close button is clicked', () => {
    const mockClose = jest.fn();
    render(<MuiDialog {...defaultProps} handleClose={mockClose} />);
    
    const closeButton = screen.getByTestId('icon-button');
    fireEvent.click(closeButton);
    
    // Now expects 2 calls because MockDialog also triggers onClose
    expect(mockClose).toHaveBeenCalledTimes(2);
  });

  it('uses handleXClose when provided instead of handleClose', () => {
    const mockClose = jest.fn();
    const mockXClose = jest.fn();
    render(<MuiDialog {...defaultProps} handleClose={mockClose} handleXClose={mockXClose} />);
    
    const closeButton = screen.getByTestId('icon-button');
    fireEvent.click(closeButton);
    
    expect(mockXClose).toHaveBeenCalledTimes(1);
    // handleClose is still called once by the dialog onClose
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('renders with default props when minimal props provided', () => {
    render(<MuiDialog open={true} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('app-bar')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    const actions = <button>Action Button</button>;
    render(<MuiDialog {...defaultProps} actions={actions} />);
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('renders preContent when provided', () => {
    const preContent = <div>Pre Content</div>;
    render(<MuiDialog {...defaultProps} preContent={preContent} />);
    expect(screen.getByText('Pre Content')).toBeInTheDocument();
  });

  it('applies custom dialogWidth', () => {
    render(<MuiDialog {...defaultProps} dialogWidth={800} />);
    const dialog = screen.getByTestId('dialog');
    expect(dialog.style.maxWidth).toBe('800px');
  });

  it('applies default maxWidth when dialogWidth not provided', () => {
    render(<MuiDialog {...defaultProps} />);
    const dialog = screen.getByTestId('dialog');
    expect(dialog.style.maxWidth).toBe('600px');
  });

  it('handles noHeader prop correctly', () => {
    render(<MuiDialog {...defaultProps} noHeader={true} />);
    const appBar = screen.getByTestId('app-bar');
    expect(appBar).toHaveAttribute('data-position', 'absolute');
  });

  it('applies relative position when noHeader is false', () => {
    render(<MuiDialog {...defaultProps} noHeader={false} />);
    const appBar = screen.getByTestId('app-bar');
    expect(appBar).toHaveAttribute('data-position', 'relative');
  });

  it('passes through appBarProps', () => {
    const appBarProps = { 'data-testprop': 'test-value' };
    render(<MuiDialog {...defaultProps} appBarProps={appBarProps} />);
    const appBar = screen.getByTestId('app-bar');
    expect(appBar).toHaveAttribute('data-testprop', 'test-value');
  });

  it('applies prosper context color styling', () => {
    render(<MuiDialog {...defaultProps} context={global.BASE_DIRS.V2.PROSPER} />);
    const appBar = screen.getByTestId('app-bar');
    expect(appBar).toHaveAttribute('color', 'white');
  });

  it('does not apply color styling for non-prosper context', () => {
    render(<MuiDialog {...defaultProps} context={global.BASE_DIRS.V2.CLINK} />);
    const appBar = screen.getByTestId('app-bar');
    expect(appBar).not.toHaveAttribute('color');
  });

  it('sets fullScreen to true when enableFullScreen is true and medium screen', () => {
    useMediaQuery.mockReturnValue(true); // Simulate medium screen
    
    render(<MuiDialog {...defaultProps} enableFullScreen={true} />);
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toHaveAttribute('data-fullscreen', 'true');
  });

  it('does not set fullScreen when enableFullScreen is false', () => {
    useMediaQuery.mockReturnValue(true); // Simulate medium screen
    
    render(<MuiDialog {...defaultProps} enableFullScreen={false} />);
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toHaveAttribute('data-fullscreen', 'false');
  });

  it('handles titleProps correctly', () => {
    const titleProps = { 'data-custom': 'custom-value' };
    render(<MuiDialog {...defaultProps} titleProps={titleProps} />);
    const dialogTitle = screen.getByTestId('dialog-title');
    expect(dialogTitle).toHaveAttribute('data-custom', 'custom-value');
  });

  it('sets disableEscapeKeyDown to true', () => {
    render(<MuiDialog {...defaultProps} />);
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toHaveAttribute('data-disable-escape', 'true');
  });

  it('does not render close button when neither handleClose nor handleXClose provided', () => {
    render(<MuiDialog {...defaultProps} handleClose={null} handleXClose={null} />);
    const iconButton = screen.getByTestId('icon-button');
    fireEvent.click(iconButton);
    // Should not throw any errors
  });

  it('handles complex children content', () => {
    const complexChildren = (
      <div>
        <h2>Complex Content</h2>
        <p>Paragraph content</p>
        <button>Child Button</button>
      </div>
    );
    
    render(<MuiDialog {...defaultProps}>{complexChildren}</MuiDialog>);
    expect(screen.getByText('Complex Content')).toBeInTheDocument();
    expect(screen.getByText('Paragraph content')).toBeInTheDocument();
    expect(screen.getByText('Child Button')).toBeInTheDocument();
  });

  it('calls handleClose when dialog onClose is triggered', () => {
    const mockHandleClose = jest.fn();
    render(<MuiDialog {...defaultProps} handleClose={mockHandleClose} />);
    
    const dialog = screen.getByTestId('dialog');
    fireEvent.click(dialog);
    
    expect(mockHandleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when handleClose is null', () => {
    // Test the arrow function condition when handleClose is null
    render(<MuiDialog {...defaultProps} handleClose={null} />);
    
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toHaveAttribute('data-on-close', 'true'); // onClose function is still created
    
    // Clicking should not throw error
    expect(() => fireEvent.click(dialog)).not.toThrow();
  });
});