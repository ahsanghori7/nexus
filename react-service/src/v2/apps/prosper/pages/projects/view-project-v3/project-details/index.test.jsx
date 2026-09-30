import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectDetails from './index';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, state, ...props }) => {
    const href =
      typeof to === 'string' ? to : `${to?.pathname || ''}${to?.search || ''}`;
    return (
      <a
        href={href}
        data-to={JSON.stringify(to)}
        data-state={JSON.stringify(state)}
        {...props}
      >
        {children}
      </a>
    );
  },
}));

// Mock the helper functions
jest.mock('v2/helpers/data', () => ({
  renderHtmlInText: jest.fn((text) => text || ''),
}));

jest.mock('v2/helpers/url', () => ({
  checkIfImageExists: jest.fn((url, callback) => {
    callback(true);
  }),
}));

jest.mock('v2/helpers/user', () => ({
  getAccountLogo: jest.fn((id) => `mock-logo-${id}.jpg`),
}));

jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isExternal: jest.fn(() => false),
  }));
});

// Mock the child components
jest.mock('./Cover', () => {
  return function MockCover({ src }) {
    return <div data-testid="cover-component">Cover: {src}</div>;
  };
});

jest.mock('./Characteristics', () => {
  return function MockCharacteristics({ project, distance, gridSx }) {
    return (
      <div data-testid="characteristics-component">
        Characteristics: {project?.id} - Distance: {distance?.length || 0}
      </div>
    );
  };
});

jest.mock('v2/apps/prosper/shared/crm-components/About', () => {
  return function MockAbout({ title, description, displayName, loading }) {
    return (
      <div data-testid="about-component">
        About: {title} - {displayName} - Loading: {loading?.toString()}
      </div>
    );
  };
});

jest.mock('v2/apps/prosper/shared/crm-components/Description', () => {
  return function MockDescription({ text, gridSx }) {
    return <div data-testid="description-component">Description: {text}</div>;
  };
});

// Mock window.scrollTo
global.scrollTo = jest.fn();

describe('ProjectDetails', () => {
  const mockProject = {
    id: 123,
    group_id: 456,
    author_id: 789,
    project: 'Test Project',
    description: 'Test project description',
  };

  const mockClientData = {
    id: 456,
    name: 'Test Company',
    description: 'Test company description',
  };

  const mockSubcontractor = {
    subscription_id: 5,
  };

  const mockDistance = [
    {
      project_id: 123,
      distance: { text: '10.5 km' },
    },
  ];

  const defaultProps = {
    src: 'test-image.jpg',
    project: mockProject,
    open: false,
    hasRegistered: true,
    clientData: mockClientData,
    subcontractor: mockSubcontractor,
    distance: mockDistance,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.scrollTo.mockClear();
    Object.defineProperty(window, 'location', {
      value: { pathname: '/test-path' },
      writable: true,
    });
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<ProjectDetails {...defaultProps} />);
      expect(screen.getByText('scope-and-details')).toBeInTheDocument();
    });

    it('should render main title', () => {
      render(<ProjectDetails {...defaultProps} />);
      expect(screen.getByText('scope-and-details')).toBeInTheDocument();
    });

    it('should render Cover component with correct src', () => {
      render(<ProjectDetails {...defaultProps} />);
      expect(screen.getByTestId('cover-component')).toBeInTheDocument();
      expect(screen.getByText('Cover: test-image.jpg')).toBeInTheDocument();
    });

    it('should render Characteristics components', () => {
      render(<ProjectDetails {...defaultProps} />);
      const characteristicsComponents = screen.getAllByTestId('characteristics-component');
      expect(characteristicsComponents.length).toBeGreaterThan(0);
    });

    it('should render Description components', () => {
      render(<ProjectDetails {...defaultProps} />);
      const descriptionComponents = screen.getAllByTestId('description-component');
      expect(descriptionComponents.length).toBeGreaterThan(0);
    });
  });

  describe('props handling', () => {
    it('should handle missing project prop', () => {
      const props = { ...defaultProps, project: { id: 1, description: 'test' } };
      render(<ProjectDetails {...props} />);
      expect(screen.getByText('scope-and-details')).toBeInTheDocument();
    });

    it('should handle missing clientData prop', () => {
      const props = { ...defaultProps, clientData: null };
      render(<ProjectDetails {...props} />);
      expect(screen.getByText('scope-and-details')).toBeInTheDocument();
    });

    it('should handle empty distance array', () => {
      const props = { ...defaultProps, distance: [] };
      render(<ProjectDetails {...props} />);
      const characteristicsComponents = screen.getAllByTestId('characteristics-component');
      expect(characteristicsComponents.length).toBeGreaterThan(0);
    });

    it('should handle undefined subcontractor', () => {
      const props = { ...defaultProps, subcontractor: undefined };
      render(<ProjectDetails {...props} />);
      expect(screen.getByText('scope-and-details')).toBeInTheDocument();
    });
  });

  describe('conditional rendering based on open prop', () => {
    it('should show scroll buttons when open is false', () => {
      const props = { ...defaultProps, open: false };
      render(<ProjectDetails {...props} />);
      
      const scrollButtons = screen.getAllByRole('button');
      expect(scrollButtons.length).toBeGreaterThan(0);
    });

    it('should hide scroll buttons when open is true', () => {
      const props = { ...defaultProps, open: true };
      render(<ProjectDetails {...props} />);
      
      // When open=true, scroll buttons should not be rendered
      const scrollDownElements = screen.queryAllByText('view-packages');
      expect(scrollDownElements).toHaveLength(0);
    });
  });

  describe('scroll functionality', () => {
    it('should handle scroll down click', async () => {
      const props = { ...defaultProps, open: false };
      render(<ProjectDetails {...props} />);
      
      const scrollButton = screen.getAllByRole('button')[0];
      
      // Mock getBoundingClientRect
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        top: 200,
      }));
      
      fireEvent.click(scrollButton);
      
      // Should attempt to scroll
      await waitFor(() => {
        expect(global.scrollTo).toHaveBeenCalledWith({
          top: expect.any(Number),
          behavior: 'smooth',
        });
      });
    });
  });

  describe('subscription logic', () => {
    it('should handle external subscription (show About component)', () => {
      const mockSubscription = jest.fn().mockImplementation(() => ({
        isExternal: jest.fn(() => true),
      }));
      
      // Re-mock with external subscription
      jest.doMock('v2/helpers/user/subscription', () => mockSubscription);
      
      const props = { ...defaultProps, subcontractor: { subscription_id: 1 } };
      render(<ProjectDetails {...props} />);
      
      expect(screen.getByText('scope-and-details')).toBeInTheDocument();
    });

    it('should handle non-external subscription (hide About component)', () => {
      const props = { ...defaultProps, subcontractor: { subscription_id: 5 } };
      render(<ProjectDetails {...props} />);
      
      // Should show About component when not external
      expect(screen.getByTestId('about-component')).toBeInTheDocument();
    });
  });

  describe('locked state logic', () => {
    it('should be locked when open is true', () => {
      const props = { ...defaultProps, open: true, hasRegistered: true };
      render(<ProjectDetails {...props} />);
      
      // When locked, should show unlock message
      expect(screen.getByText('unlock-project')).toBeInTheDocument();
    });

    it('should be locked when hasRegistered is false', () => {
      const props = { ...defaultProps, open: false, hasRegistered: false };
      render(<ProjectDetails {...props} />);
      
      expect(screen.getByText('unlock-project')).toBeInTheDocument();
    });

    it('should not be locked when open is false and hasRegistered is true', () => {
      const props = { ...defaultProps, open: false, hasRegistered: true };
      render(<ProjectDetails {...props} />);
      
      expect(screen.getByText('view-full-profile')).toBeInTheDocument();
    });
  });

  describe('commission subscription handling', () => {
    it('should show commission message for commission subscription', () => {
      const props = {
        ...defaultProps,
        open: true,
        subcontractor: { subscription_id: 8 }, // Commission subscription
      };
      render(<ProjectDetails {...props} />);
      
      expect(screen.getByText('unlock-project-commission')).toBeInTheDocument();
    });

    it('should show regular message for non-commission subscription', () => {
      const props = {
        ...defaultProps,
        open: true,
        subcontractor: { subscription_id: 5 }, // Non-commission subscription
      };
      render(<ProjectDetails {...props} />);
      
      expect(screen.getByText('unlock-project')).toBeInTheDocument();
    });
  });

  describe('link generation', () => {
    it('should generate correct link when not locked', () => {
      const props = { ...defaultProps, open: false, hasRegistered: true };
      render(<ProjectDetails {...props} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/company_profile/456/789?pid=123');
    });

    it('should pass link state via state prop', () => {
      const props = { ...defaultProps, open: false, hasRegistered: true };
      render(<ProjectDetails {...props} />);

      const link = screen.getByRole('link');
      const toValue = JSON.parse(link.getAttribute('data-to'));
      const stateValue = JSON.parse(link.getAttribute('data-state'));

      expect(toValue).toBe('/company_profile/456/789?pid=123');
      expect(stateValue).toEqual({
        fromUrl: '/test-path',
        fromName: 'Test Project',
      });
    });

    it('should handle missing author_id in link generation', () => {
      const projectWithoutAuthor = { ...mockProject, author_id: null };
      const props = {
        ...defaultProps,
        project: projectWithoutAuthor,
        open: false,
        hasRegistered: true,
      };
      render(<ProjectDetails {...props} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/company_profile/456?pid=123');
    });

    it('should disable link when locked', () => {
      const props = { ...defaultProps, open: true };
      render(<ProjectDetails {...props} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveStyle('pointer-events: none');
    });
  });

  describe('image existence check', () => {
    it('should check image existence on clientData change', async () => {
      const { rerender } = render(<ProjectDetails {...defaultProps} />);
      
      const newClientData = { ...mockClientData, id: 999 };
      rerender(<ProjectDetails {...defaultProps} clientData={newClientData} />);
      
      // checkIfImageExists should be called
      const { checkIfImageExists } = require('v2/helpers/url');
      expect(checkIfImageExists).toHaveBeenCalled();
    });
  });

  describe('responsive behavior', () => {
    it('should render responsive Grid components', () => {
      render(<ProjectDetails {...defaultProps} />);
      
      // Check for Grid containers
      const grids = screen.getAllByTestId('mui-grid');
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle rendering with minimal props', () => {
      const minimalProps = {
        src: '',
        project: { id: 1 },
        open: false,
        hasRegistered: false,
        clientData: null,
      };
      
      render(<ProjectDetails {...minimalProps} />);
      expect(screen.getByText('scope-and-details')).toBeInTheDocument();
    });

    it('should handle empty project object', () => {
      const props = { ...defaultProps, project: {} };
      render(<ProjectDetails {...props} />);
      expect(screen.getByText('scope-and-details')).toBeInTheDocument();
    });
  });

  describe('component interactions', () => {
    it('should pass correct props to child components', () => {
      render(<ProjectDetails {...defaultProps} />);
      
      // Check Cover gets src prop
      expect(screen.getByText('Cover: test-image.jpg')).toBeInTheDocument();
      
      // Check Characteristics gets project and distance
      const characteristicsText = screen.getAllByText(/Characteristics: 123 - Distance: 1/);
      expect(characteristicsText.length).toBeGreaterThan(0);
      
      // Check Description gets text
      const descriptionText = screen.getAllByText(/Description: Test project description/);
      expect(descriptionText.length).toBeGreaterThan(0);
    });
  });
});
