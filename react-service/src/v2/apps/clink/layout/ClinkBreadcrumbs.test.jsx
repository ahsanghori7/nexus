import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the dependencies
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkPurple: '#purple',
      },
    },
    fonts: {
      proxima: 'Proxima Nova',
    },
  },
}));

jest.mock('./project-menu', () => {
  const MockProjectMenu = () => <div data-testid="project-menu">Project Menu</div>;
  MockProjectMenu.displayName = 'ProjectMenu';
  return MockProjectMenu;
});

// Import the component after setting up mocks
import ClinkBreadcrumbs from './ClinkBreadcrumbs';

const { MemoryRouter } = jest.requireActual('react-router-dom');

// Helper to render with router
const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('ClinkBreadcrumbs', () => {
  it('renders without crashing', () => {
    renderWithRouter(<ClinkBreadcrumbs />);
    
    // Should render skeleton when not loaded
    const skeleton = screen.getByTestId('mui-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders skeleton when loaded is false', () => {
    const props = {
      items: [],
      title: 'Test Title',
      loaded: false,
    };
    
    renderWithRouter(<ClinkBreadcrumbs {...props} />);
    
    const skeleton = screen.getByTestId('mui-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('data-variant', 'rectangular');
  });

  it('renders breadcrumbs and title when loaded is true', () => {
    const props = {
      items: [
        { label: 'Home', href: '/home' },
        { label: 'Projects', href: '/projects' },
      ],
      title: 'Test Title',
      loaded: true,
    };
    
    renderWithRouter(<ClinkBreadcrumbs {...props} />);
    
    // Should not render skeleton
    expect(screen.queryByTestId('mui-skeleton')).not.toBeInTheDocument();
    
    // Should render breadcrumbs
    const breadcrumbs = screen.getByTestId('mui-breadcrumbs');
    expect(breadcrumbs).toBeInTheDocument();
    
    // Should render title
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    
    // Should render project menu
    expect(screen.getByTestId('project-menu')).toBeInTheDocument();
  });

  it('renders breadcrumb items correctly', () => {
    const props = {
      items: [
        { label: 'Home', href: '/home' },
        { label: 'Projects', href: '/projects' },
        { label: 'Current', href: '/current' },
      ],
      title: 'Test Title',
      loaded: true,
    };
    
    renderWithRouter(<ClinkBreadcrumbs {...props} />);
    
    // Should render all breadcrumb items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    
    // Should render separators
    const separators = screen.getAllByTestId('breadcrumb-separator');
    expect(separators).toHaveLength(2); // n-1 separators for n items
  });

  it('handles empty items array', () => {
    const props = {
      items: [],
      title: 'Test Title',
      loaded: true,
    };
    
    renderWithRouter(<ClinkBreadcrumbs {...props} />);
    
    // Should still render title and project menu
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByTestId('project-menu')).toBeInTheDocument();
    
    // Should render breadcrumbs container but no items
    const breadcrumbs = screen.getByTestId('mui-breadcrumbs');
    expect(breadcrumbs).toBeInTheDocument();
  });

  it('works with all valid items', () => {
    const props = {
      items: [
        { label: 'Valid', href: '/valid' },
        { label: 'Another Valid', href: '/another' },
      ],
      title: 'Test Title',
      loaded: true,
    };
    
    renderWithRouter(<ClinkBreadcrumbs {...props} />);
    
    // Should render all valid items
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Another Valid')).toBeInTheDocument();
    
    // Should render one separator (for 2 items)
    const separators = screen.getAllByTestId('breadcrumb-separator');
    expect(separators).toHaveLength(1);
  });

  it('handles noReact prop correctly', () => {
    const props = {
      items: [
        { label: 'Home', href: '/home' },
        { label: 'Projects', href: '/projects' },
      ],
      title: 'Test Title',
      loaded: true,
      noReact: true,
    };
    
    renderWithRouter(<ClinkBreadcrumbs {...props} />);
    
    // Should still render breadcrumb items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    renderWithRouter(<ClinkBreadcrumbs loaded={true} />);
    
    // Should render with empty title
    const breadcrumbs = screen.getByTestId('mui-breadcrumbs');
    expect(breadcrumbs).toBeInTheDocument();
    
    // Should render project menu
    expect(screen.getByTestId('project-menu')).toBeInTheDocument();
  });

  it('has correct component structure', () => {
    const props = {
      items: [{ label: 'Test', href: '/test' }],
      title: 'Test Title',
      loaded: true,
    };
    
    renderWithRouter(<ClinkBreadcrumbs {...props} />);
    
    // Should render breadcrumbs with aria-label
    const breadcrumbs = screen.getByTestId('mui-breadcrumbs');
    expect(breadcrumbs).toHaveAttribute('aria-label', 'breadcrumb');
  });
});
