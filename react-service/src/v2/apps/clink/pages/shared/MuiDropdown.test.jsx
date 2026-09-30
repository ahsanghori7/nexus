import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MuiDropdown from './MuiDropdown';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // Just return the key as the translation
  }),
}));

// Mock MUI components
jest.mock('@mui/material/IconButton', () => {
  return function MockIconButton({ children, onClick, ...props }) {
    return (
      <button data-testid="mui-icon-button" onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

jest.mock('@mui/material/Popper', () => {
  return function MockPopper({ children, open, ...props }) {
    return open ? <div data-testid="mui-popper" {...props}>{children}</div> : null;
  };
});

jest.mock('@mui/material/Paper', () => {
  return function MockPaper({ children }) {
    return <div data-testid="mui-paper">{children}</div>;
  };
});

jest.mock('@mui/material/MenuList', () => {
  return function MockMenuList({ children }) {
    return <ul data-testid="mui-menu-list">{children}</ul>;
  };
});

jest.mock('@mui/material/MenuItem', () => {
  return function MockMenuItem({ children, onClick, disabled, ...props }) {
    return (
      <li data-testid="mui-menu-item" onClick={onClick} data-disabled={disabled} {...props}>
        {children}
      </li>
    );
  };
});

jest.mock('@mui/material/ClickAwayListener', () => {
  return function MockClickAwayListener({ children, onClickAway }) {
    return <div data-testid="click-away-listener" data-onclickaway={!!onClickAway}>{children}</div>;
  };
});

jest.mock('@mui/icons-material/MoreVert', () => {
  return function MockMoreVertIcon() {
    return <span data-testid="more-vert-icon">⋮</span>;
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkLightPurple: '#e0e0e0',
      },
    },
  },
}));

describe('MuiDropdown (DropdownButton)', () => {
  const mockAction1 = jest.fn();
  const mockAction2 = jest.fn();
  
  const defaultOptions = [
    { id: '1', name: 'Option 1', action: mockAction1 },
    { id: '2', name: 'Option 2', action: mockAction2 },
  ];

  beforeEach(() => {
    mockAction1.mockClear();
    mockAction2.mockClear();
  });

  it('renders without crashing', () => {
    render(<MuiDropdown options={defaultOptions} />);
    
    expect(screen.getByTestId('mui-icon-button')).toBeInTheDocument();
    expect(screen.getByTestId('more-vert-icon')).toBeInTheDocument();
  });

  it('renders with default MoreVert icon when no triggerButton provided', () => {
    render(<MuiDropdown options={defaultOptions} />);
    
    expect(screen.getByTestId('more-vert-icon')).toBeInTheDocument();
  });

  it('renders with custom trigger button', () => {
    const CustomButton = <span data-testid="custom-trigger">Custom</span>;
    render(<MuiDropdown triggerButton={CustomButton} options={defaultOptions} />);
    
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    expect(screen.queryByTestId('more-vert-icon')).not.toBeInTheDocument();
  });

  it('does not show dropdown menu initially', () => {
    render(<MuiDropdown options={defaultOptions} />);
    
    expect(screen.queryByTestId('mui-popper')).not.toBeInTheDocument();
  });

  it('opens dropdown menu when trigger button is clicked', () => {
    render(<MuiDropdown options={defaultOptions} />);
    
    const triggerButton = screen.getByTestId('mui-icon-button');
    fireEvent.click(triggerButton);
    
    expect(screen.getByTestId('mui-popper')).toBeInTheDocument();
    expect(screen.getByTestId('mui-paper')).toBeInTheDocument();
    expect(screen.getByTestId('mui-menu-list')).toBeInTheDocument();
  });

  it('renders all menu options when open', () => {
    render(<MuiDropdown options={defaultOptions} />);
    
    const triggerButton = screen.getByTestId('mui-icon-button');
    fireEvent.click(triggerButton);
    
    expect(screen.getAllByTestId('mui-menu-item')).toHaveLength(2);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('closes dropdown when trigger button is clicked again', () => {
    render(<MuiDropdown options={defaultOptions} />);
    
    const triggerButton = screen.getByTestId('mui-icon-button');
    
    // Open
    fireEvent.click(triggerButton);
    expect(screen.getByTestId('mui-popper')).toBeInTheDocument();
    
    // Close
    fireEvent.click(triggerButton);
    expect(screen.queryByTestId('mui-popper')).not.toBeInTheDocument();
  });

  it('executes option action and closes dropdown when option is clicked', () => {
    render(<MuiDropdown options={defaultOptions} />);
    
    const triggerButton = screen.getByTestId('mui-icon-button');
    fireEvent.click(triggerButton);
    
    const option1 = screen.getByText('Option 1');
    fireEvent.click(option1);
    
    expect(mockAction1).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('mui-popper')).not.toBeInTheDocument();
  });

  it('handles disabled options correctly', () => {
    const optionsWithDisabled = [
      { id: '1', name: 'Enabled Option', action: mockAction1 },
      { id: '2', name: 'Disabled Option', action: mockAction2, disabled: true },
    ];
    
    render(<MuiDropdown options={optionsWithDisabled} />);
    
    const triggerButton = screen.getByTestId('mui-icon-button');
    fireEvent.click(triggerButton);
    
    const disabledOption = screen.getByText('Disabled Option');
    expect(disabledOption.closest('[data-testid="mui-menu-item"]')).toHaveAttribute('data-disabled', 'true');
  });

  it('handles options without id correctly (uses name as key)', () => {
    const optionsWithoutId = [
      { name: 'Option Without ID', action: mockAction1 },
    ];
    
    render(<MuiDropdown options={optionsWithoutId} />);
    
    const triggerButton = screen.getByTestId('mui-icon-button');
    fireEvent.click(triggerButton);
    
    expect(screen.getByText('Option Without ID')).toBeInTheDocument();
  });

  it('handles empty options array', () => {
    render(<MuiDropdown options={[]} />);
    
    const triggerButton = screen.getByTestId('mui-icon-button');
    fireEvent.click(triggerButton);
    
    expect(screen.getByTestId('mui-popper')).toBeInTheDocument();
    expect(screen.queryByTestId('mui-menu-item')).not.toBeInTheDocument();
  });

  it('has proper aria attributes', () => {
    render(<MuiDropdown options={defaultOptions} />);
    
    const triggerButton = screen.getByTestId('mui-icon-button');
    expect(triggerButton).toHaveAttribute('aria-label', 'more');
    expect(triggerButton).toHaveAttribute('aria-controls', 'dropdown-menu');
    expect(triggerButton).toHaveAttribute('aria-haspopup', 'true');
  });

  it('matches snapshot', () => {
    const { container } = render(<MuiDropdown options={defaultOptions} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});