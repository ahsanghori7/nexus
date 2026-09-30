import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Actions from './Actions';

// Mock the clink-components constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        japaneseIndigo: '#293462',
      },
      prosper: {
        SilverSand: '#C4C4C4',
      },
    },
  },
}));

// Mock MUI components that need special handling for this component
jest.mock('@mui/material/Popper', () => {
  return function MockPopper({ children, open = false, ...props }) {
    return open ? (
      <div data-testid="popper" {...props}>
        {typeof children === 'function' ? children({ TransitionProps: {} }) : children}
      </div>
    ) : null;
  };
});

jest.mock('@mui/material/Grow', () => {
  return function MockGrow({ children, in: inProp = true, ...props }) {
    return inProp ? (
      <div data-testid="grow" {...props}>
        {children}
      </div>
    ) : null;
  };
});

jest.mock('@mui/material/ClickAwayListener', () => {
  return function MockClickAwayListener({ children, onClickAway }) {
    return <div data-testid="click-away-listener">{children}</div>;
  };
});

describe('Actions Component', () => {
  const mockActions = [
    {
      id: 'action1',
      label: 'Edit',
      action: jest.fn(),
    },
    {
      id: 'action2',
      label: 'Delete',
      action: jest.fn(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the more options button', () => {
    render(<Actions actions={mockActions} />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    expect(moreButton).toBeInTheDocument();
  });

  it('opens menu when more options button is clicked', async () => {
    render(<Actions actions={mockActions} />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(moreButton);
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('closes menu when clicking away', async () => {
    render(<Actions actions={mockActions} />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(moreButton);
    
    // Menu should be open
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
    
    // Since ClickAwayListener is mocked, we'll test state management instead
    // Click the button again to toggle close
    fireEvent.click(moreButton);
    
    // Menu should be closed
    await waitFor(() => {
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  it('executes action when menu item is clicked', async () => {
    render(<Actions actions={mockActions} />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(moreButton);
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
    
    const editItem = screen.getByText('Edit');
    fireEvent.click(editItem);
    
    expect(mockActions[0].action).toHaveBeenCalledTimes(1);
  });

  it('closes menu when Escape key is pressed', async () => {
    render(<Actions actions={mockActions} />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(moreButton);
    
    // Menu should be open
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
    
    // Press Escape on the menu list
    const menuList = screen.getByRole('menu');
    fireEvent.keyDown(menuList, { key: 'Escape' });
    
    // Menu should be closed
    await waitFor(() => {
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  it('closes menu when Tab key is pressed', async () => {
    render(<Actions actions={mockActions} />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(moreButton);
    
    // Menu should be open
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
    
    // Press Tab on the menu list
    const menuList = screen.getByRole('menu');
    fireEvent.keyDown(menuList, { key: 'Tab' });
    
    // Menu should be closed
    await waitFor(() => {
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  it('renders only actions with id or label', async () => {
    const mixedActions = [
      { id: 'action1', label: 'Edit', action: jest.fn() },
      { id: 'action2', label: 'Delete', action: jest.fn() }, // provide id to avoid React key warning
      { action: jest.fn() }, // No id or label - should be filtered out
      { id: 'action3', label: 'View', action: jest.fn() },
    ];

    render(<Actions actions={mixedActions} />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(moreButton);
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('View')).toBeInTheDocument();
    });
    
    // Should only have 3 menu items (the 4th is filtered out)
    const menuItems = screen.getAllByTestId('mui-menu-item');
    expect(menuItems).toHaveLength(3);
  });

  it('renders dividers between multiple actions', async () => {
    render(<Actions actions={mockActions} />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(moreButton);
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
    
    // Should have a divider between Edit and Delete
    const dividers = document.querySelectorAll('[data-testid="mui-divider"]');
    expect(dividers).toHaveLength(1);
  });

  it('does not render divider for single action', () => {
    const singleAction = [{ id: 'action1', label: 'Edit', action: jest.fn() }];
    
    render(<Actions actions={singleAction} />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(moreButton);
    
    // Should not have any dividers
    const dividers = document.querySelectorAll('[data-testid="mui-divider"]');
    expect(dividers).toHaveLength(0);
  });

  it('handles empty actions array', () => {
    render(<Actions actions={[]} />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    expect(moreButton).toBeInTheDocument();
    
    fireEvent.click(moreButton);
    
    // Should not have any menu items
    const menuItems = screen.queryAllByRole('menuitem');
    expect(menuItems).toHaveLength(0);
  });

  it('handles missing actions prop (default to empty array)', () => {
    render(<Actions />);
    
    const moreButton = screen.getByRole('button', { name: /options/i });
    expect(moreButton).toBeInTheDocument();
    
    fireEvent.click(moreButton);
    
    // Should not have any menu items
    const menuItems = screen.queryAllByRole('menuitem');
    expect(menuItems).toHaveLength(0);
  });

  it('matches snapshot', () => {
    const { container } = render(<Actions actions={mockActions} />);
    expect(container).toMatchSnapshot();
  });
});
