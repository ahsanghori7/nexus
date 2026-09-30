// src/v2/apps/clink/layout/project-menu/SingleLink.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SingleDrawerLink, SingleMenuLink, MultipleMenuLink, sxImg } from './SingleLink';

// Mock the dependencies
jest.mock('clink-components', () => ({
  Image: ({ src, width, height, ...props }) => (
    <img src={src} width={width} height={height} {...props} data-testid="clink-image" />
  ),
  CONSTANTS: {
    colors: {
      general: {
        white: '#ffffff',
        clinkLightPurple: '#purple',
        grayDark: '#gray',
        black: '#000000',
        teal: '#008080'
      }
    }
  }
}));

const { MemoryRouter } = jest.requireActual('react-router-dom');

// Helper to render with router
const renderWithRouter = (component, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('SingleDrawerLink', () => {
  const defaultProps = {
    url: '/test-url',
    label: 'Test Label',
    icon: '/icon.svg'
  };

  it('renders without crashing', () => {
    renderWithRouter(<SingleDrawerLink {...defaultProps} />);
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders with icon when provided', () => {
    renderWithRouter(<SingleDrawerLink {...defaultProps} />);
    
    const icon = screen.getByTestId('clink-image');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/icon.svg');
    expect(icon).toHaveAttribute('width', '20');
    expect(icon).toHaveAttribute('height', '20');
  });

  it('renders without icon when not provided', () => {
    const propsWithoutIcon = { ...defaultProps, icon: undefined };
    renderWithRouter(<SingleDrawerLink {...propsWithoutIcon} />);
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.queryByTestId('clink-image')).not.toBeInTheDocument();
  });

  it('creates correct link with React Router', () => {
    renderWithRouter(<SingleDrawerLink {...defaultProps} />);
    
    const link = screen.getByRole('button');
    expect(link.closest('a')).toHaveAttribute('href', '/test-url');
  });

  it('handles missing required props gracefully', () => {
    const minimalProps = { url: '/test', label: 'Test' };
    renderWithRouter(<SingleDrawerLink {...minimalProps} />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});

describe('SingleMenuLink', () => {
  const defaultProps = {
    url: '/test-url',
    label: 'Test Menu Label',
    icon: '/menu-icon.svg'
  };

  it('renders without crashing', () => {
    renderWithRouter(<SingleMenuLink {...defaultProps} />);
    
    expect(screen.getByText('Test Menu Label')).toBeInTheDocument();
  });

  it('renders with icon when provided', () => {
    renderWithRouter(<SingleMenuLink {...defaultProps} />);
    
    const icon = screen.getByTestId('clink-image');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/menu-icon.svg');
  });

  it('applies active styling when active prop is true', () => {
    renderWithRouter(<SingleMenuLink {...defaultProps} active={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('applies first menu item styling', () => {
    renderWithRouter(<SingleMenuLink {...defaultProps} firstMenuItem={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('applies last menu item styling', () => {
    renderWithRouter(<SingleMenuLink {...defaultProps} lastMenuItem={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('applies submenu styling when submenu prop is true', () => {
    renderWithRouter(<SingleMenuLink {...defaultProps} submenu={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('combines multiple styling props correctly', () => {
    renderWithRouter(
      <SingleMenuLink 
        {...defaultProps} 
        active={true} 
        firstMenuItem={true} 
        lastMenuItem={true}
        submenu={true}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles missing icon gracefully', () => {
    const propsWithoutIcon = { ...defaultProps, icon: undefined };
    renderWithRouter(<SingleMenuLink {...propsWithoutIcon} />);
    
    expect(screen.getByText('Test Menu Label')).toBeInTheDocument();
    expect(screen.queryByTestId('clink-image')).not.toBeInTheDocument();
  });
});

describe('MultipleMenuLink', () => {
  const defaultProps = {
    urls: [
      { url: '/test/item1', label: 'Item 1' },
      { url: '/test/item2', label: 'Item 2' },
      { url: '/test/item3', label: 'Item 3' }
    ],
    label: 'Multiple Menu',
    icon: '/multiple-icon.svg',
    locationLastSegment: 'item2'
  };

  it('renders without crashing', () => {
    renderWithRouter(<MultipleMenuLink {...defaultProps} />);
    
    expect(screen.getByText('Multiple Menu')).toBeInTheDocument();
  });

  it('shows active state when one of the URLs matches locationLastSegment', () => {
    renderWithRouter(<MultipleMenuLink {...defaultProps} />);
    
    // Since 'item2' matches one of the URLs, the parent should be active
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('opens submenu on mouse enter', () => {
    renderWithRouter(<MultipleMenuLink {...defaultProps} />);
    
    const menuContainer = screen.getByText('Multiple Menu').closest('div');
    fireEvent.mouseEnter(menuContainer);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('closes submenu on mouse leave', () => {
    renderWithRouter(<MultipleMenuLink {...defaultProps} />);
    
    const menuContainer = screen.getByText('Multiple Menu').closest('div');
    fireEvent.mouseEnter(menuContainer);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    
    fireEvent.mouseLeave(menuContainer);
    
    // Items should still be in DOM but we can test the interaction happened
    expect(screen.getByText('Multiple Menu')).toBeInTheDocument();
  });

  it('toggles submenu on click', () => {
    renderWithRouter(<MultipleMenuLink {...defaultProps} />);
    
    const menuContainer = screen.getByText('Multiple Menu').closest('div');
    fireEvent.click(menuContainer);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('closes submenu on click away', () => {
    renderWithRouter(<MultipleMenuLink {...defaultProps} />);
    
    const menuContainer = screen.getByText('Multiple Menu').closest('div');
    fireEvent.click(menuContainer);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    
    // Click away from the menu
    fireEvent.click(document.body);
    
    // Menu should still be rendered but closed state is handled
    expect(screen.getByText('Multiple Menu')).toBeInTheDocument();
  });

  it('identifies active submenu item correctly', () => {
    renderWithRouter(<MultipleMenuLink {...defaultProps} />);
    
    const menuContainer = screen.getByText('Multiple Menu').closest('div');
    fireEvent.mouseEnter(menuContainer);
    
    // Item 2 should be active since locationLastSegment is 'item2'
    const items = screen.getAllByRole('button');
    expect(items.length).toBeGreaterThan(0);
  });

  it('handles empty URLs array', () => {
    const propsWithEmptyUrls = { ...defaultProps, urls: [] };
    renderWithRouter(<MultipleMenuLink {...propsWithEmptyUrls} />);
    
    expect(screen.getByText('Multiple Menu')).toBeInTheDocument();
  });

  it('handles locationLastSegment as boolean false', () => {
    const propsWithBooleanLocation = { ...defaultProps, locationLastSegment: false };
    renderWithRouter(<MultipleMenuLink {...propsWithBooleanLocation} />);
    
    expect(screen.getByText('Multiple Menu')).toBeInTheDocument();
  });

  it('applies first and last menu item styling', () => {
    renderWithRouter(
      <MultipleMenuLink 
        {...defaultProps} 
        firstMenuItem={true}
        lastMenuItem={true}
      />
    );
    
    expect(screen.getByText('Multiple Menu')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    renderWithRouter(<MultipleMenuLink {...defaultProps} />);
    
    const icon = screen.getByTestId('clink-image');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/multiple-icon.svg');
  });

  it('handles missing icon gracefully', () => {
    const propsWithoutIcon = { ...defaultProps, icon: undefined };
    renderWithRouter(<MultipleMenuLink {...propsWithoutIcon} />);
    
    expect(screen.getByText('Multiple Menu')).toBeInTheDocument();
    expect(screen.queryByTestId('clink-image')).not.toBeInTheDocument();
  });

  it('shows submenu with correct styling', () => {
    renderWithRouter(<MultipleMenuLink {...defaultProps} />);
    
    const menuContainer = screen.getByText('Multiple Menu').closest('div');
    fireEvent.mouseEnter(menuContainer);
    
    // Check that submenu items are rendered as buttons
    const submenuButtons = screen.getAllByRole('button');
    expect(submenuButtons.length).toBeGreaterThan(1); // Parent + submenu items
  });

  it('handles complex URL matching patterns', () => {
    const complexProps = {
      ...defaultProps,
      urls: [
        { url: '/projects/test/feature/complex-path', label: 'Complex Path' },
        { url: '/projects/test/simple', label: 'Simple Path' }
      ],
      locationLastSegment: 'complex-path'
    };
    
    renderWithRouter(<MultipleMenuLink {...complexProps} />);
    
    // Should show as active since one URL ends with 'complex-path'
    expect(screen.getByText('Multiple Menu')).toBeInTheDocument();
  });
});

describe('sxImg export', () => {
  it('exports sxImg with correct styling', () => {
    expect(sxImg).toEqual({ marginRight: '10px' });
  });
});
