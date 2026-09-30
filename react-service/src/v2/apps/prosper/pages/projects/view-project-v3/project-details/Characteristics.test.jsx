import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Characteristics from './Characteristics';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock moment
jest.mock('moment', () => {
  const mockMoment = {
    format: jest.fn(() => '4th December 2021'),
  };
  return jest.fn(() => mockMoment);
});

// Mock lodash capitalize
jest.mock('lodash/capitalize', () => jest.fn((str) => str.charAt(0).toUpperCase() + str.slice(1)));

describe('Characteristics', () => {
  const mockProject = {
    id: 123,
    region: 'Sydney',
    type: 'Residential',
    start: '2021-12-04',
    end: '2021-11-19',
    phase: 'Planning',
  };

  const mockDistance = [
    {
      project_id: 123,
      distance: {
        text: '15.2 km',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<Characteristics project={mockProject} />);
      expect(screen.getByText('Characteristics')).toBeInTheDocument();
    });

    it('should render title correctly', () => {
      render(<Characteristics project={mockProject} />);
      expect(screen.getByText('Characteristics')).toBeInTheDocument();
    });

    it('should render all project characteristics', () => {
      render(<Characteristics project={mockProject} />);
      
      // Check if Item components are rendered by checking for characteristic values
      expect(screen.getByText('Sydney')).toBeInTheDocument();
      expect(screen.getByText('Residential')).toBeInTheDocument();
      expect(screen.getByText('Planning')).toBeInTheDocument();
    });
  });

  describe('props handling', () => {
    it('should handle missing project props with defaults', () => {
      const incompleteProject = {
        id: 456,
      };
      render(<Characteristics project={incompleteProject} />);
      
      // Should render default values
      expect(screen.getAllByText('*****')).toHaveLength(3); // region, type, phase defaults
    });

    it('should handle custom gridSx prop', () => {
      const customSx = { marginTop: 2 };
      render(<Characteristics project={mockProject} gridSx={customSx} />);
      
      // Component should render without errors with custom sx
      expect(screen.getByText('Characteristics')).toBeInTheDocument();
    });

    it('should handle empty distance array', () => {
      render(<Characteristics project={mockProject} distance={[]} />);
      
      // Should render without distance info
      expect(screen.getByText('Characteristics')).toBeInTheDocument();
      expect(screen.queryByText('15.2 km')).not.toBeInTheDocument();
    });

    it('should render distance when matching project id', () => {
      render(<Characteristics project={mockProject} distance={mockDistance} />);
      
      expect(screen.getByText('15.2 km')).toBeInTheDocument();
    });

    it('should not render distance when project id does not match', () => {
      const differentDistance = [
        {
          project_id: 999,
          distance: {
            text: '20.0 km',
          },
        },
      ];
      
      render(<Characteristics project={mockProject} distance={differentDistance} />);
      
      expect(screen.queryByText('20.0 km')).not.toBeInTheDocument();
    });
  });

  describe('date formatting', () => {
    it('should format start and end dates correctly', () => {
      render(<Characteristics project={mockProject} />);
      
      // Both dates should be formatted the same way due to mock
      const formattedDates = screen.getAllByText('4th December 2021');
      expect(formattedDates).toHaveLength(2); // start and end dates
    });
  });

  describe('component structure', () => {
    it('should render Grid container with correct structure', () => {
      const { container } = render(<Characteristics project={mockProject} />);
      
      // Check for Grid containers in the DOM
      const gridElements = container.querySelectorAll('.MuiGrid-root');
      expect(gridElements.length).toBeGreaterThan(0);
    });

    it('should render Typography for title', () => {
      render(<Characteristics project={mockProject} />);
      
      const titleElement = screen.getByText('Characteristics');
      expect(titleElement.tagName.toLowerCase()).toBe('div'); // MUI Typography renders as div by default
    });
  });

  describe('conditional rendering', () => {
    it('should render distance item only when distance data exists for project', () => {
      const { rerender } = render(
        <Characteristics project={mockProject} distance={[]} />
      );
      
      // Should not render distance initially
      expect(screen.queryByText('15.2 km')).not.toBeInTheDocument();
      
      // Re-render with distance data
      rerender(<Characteristics project={mockProject} distance={mockDistance} />);
      
      // Should render distance now
      expect(screen.getByText('15.2 km')).toBeInTheDocument();
    });

    it('should handle multiple distance entries and filter by project id', () => {
      const multipleDistances = [
        {
          project_id: 999,
          distance: { text: '10.0 km' },
        },
        {
          project_id: 123,
          distance: { text: '15.2 km' },
        },
        {
          project_id: 456,
          distance: { text: '25.0 km' },
        },
      ];
      
      render(<Characteristics project={mockProject} distance={multipleDistances} />);
      
      // Should only show distance for matching project id
      expect(screen.getByText('15.2 km')).toBeInTheDocument();
      expect(screen.queryByText('10.0 km')).not.toBeInTheDocument();
      expect(screen.queryByText('25.0 km')).not.toBeInTheDocument();
    });
  });

  describe('default props', () => {
    it('should handle undefined project gracefully', () => {
      const emptyProject = {};
      render(<Characteristics project={emptyProject} />);
      
      expect(screen.getByText('Characteristics')).toBeInTheDocument();
    });

    it('should use default gridSx when not provided', () => {
      render(<Characteristics project={mockProject} />);
      
      expect(screen.getByText('Characteristics')).toBeInTheDocument();
    });

    it('should use default distance array when not provided', () => {
      render(<Characteristics project={mockProject} />);
      
      // Should render without crashing
      expect(screen.getByText('Characteristics')).toBeInTheDocument();
    });
  });
});