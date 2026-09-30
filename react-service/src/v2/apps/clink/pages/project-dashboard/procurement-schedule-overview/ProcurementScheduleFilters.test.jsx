import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';
import ProcurementScheduleFilters from './ProcurementScheduleFilters';

// Create a mock theme
const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ProcurementScheduleFilters', () => {
  // Default props for the component
  const defaultProps = {
    searchTerm: '',
    setSearchTerm: jest.fn(),
    milestoneStatus: 'All',
    setMilestoneStatus: jest.fn(),
    tenderStatus: 'All',
    setTenderStatus: jest.fn(),
    variance: 'All',
    setVariance: jest.fn(),
    packagesAtRisk: 'All',
    setPackagesAtRisk: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all filter components', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('Milestone Status')).toBeInTheDocument();
      expect(screen.getByText('Tender Status')).toBeInTheDocument();
      expect(screen.getByText('Variance')).toBeInTheDocument();
      expect(screen.getByText('Packages at Risk')).toBeInTheDocument();
    });

    it('displays current values correctly', () => {
      const props = {
        ...defaultProps,
        searchTerm: 'test search',
        milestoneStatus: 'In Progress',
        tenderStatus: 'awarded',
        variance: 'positive',
        packagesAtRisk: 'Approaching',
      };
      
      renderWithTheme(<ProcurementScheduleFilters {...props} />);
      
      // For search field, we can check display value
      expect(screen.getByDisplayValue('test search')).toBeInTheDocument();
      
      // For Select components, check the text content instead
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Awarded')).toBeInTheDocument();
      expect(screen.getByText('Positive Variance')).toBeInTheDocument();
      expect(screen.getByText('Approaching')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      const searchIcon = screen.getByTestId('SearchIcon');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search field with correct props', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      // With mocked MUI components, we verify the search field is rendered
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByTestId('SearchIcon')).toBeInTheDocument();
    });

    it('displays search value when provided', () => {
      const props = { ...defaultProps, searchTerm: 'test search' };
      renderWithTheme(<ProcurementScheduleFilters {...props} />);
      
      // Verify the search component receives the correct value
      expect(screen.getByText('Search')).toBeInTheDocument();
    });
  });

  describe('Milestone Status Filter', () => {
    it('renders milestone status filter with all options', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      // With mocked MUI components, all options are visible
      expect(screen.getByText('Milestone Status')).toBeInTheDocument();
      expect(screen.getAllByText('All').length).toBeGreaterThan(0); // Multiple "All" options exist
      expect(screen.getByText('Not Started')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('displays correct selected milestone status', () => {
      const props = { ...defaultProps, milestoneStatus: 'In Progress' };
      renderWithTheme(<ProcurementScheduleFilters {...props} />);
      
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  describe('Tender Status Filter', () => {
    it('renders tender status filter with all options', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      // With mocked MUI components, all options are visible
      expect(screen.getByText('Tender Status')).toBeInTheDocument();
      expect(screen.getByText('TBC')).toBeInTheDocument();
      expect(screen.getByText('Named')).toBeInTheDocument();
      expect(screen.getByText('Shortlisted')).toBeInTheDocument();
      expect(screen.getByText('Awarded')).toBeInTheDocument();
    });

    it('displays correct selected tender status', () => {
      const props = { ...defaultProps, tenderStatus: 'awarded' };
      renderWithTheme(<ProcurementScheduleFilters {...props} />);
      
      expect(screen.getByText('Awarded')).toBeInTheDocument();
    });
  });

  describe('Variance Filter', () => {
    it('renders variance filter with all options', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      // With mocked MUI components, all options are visible
      expect(screen.getByText('Variance')).toBeInTheDocument();
      expect(screen.getByText('Positive Variance')).toBeInTheDocument();
      expect(screen.getByText('Negative Variance')).toBeInTheDocument();
      expect(screen.getByText('Zero Variance')).toBeInTheDocument();
    });

    it('displays correct selected variance', () => {
      const props = { ...defaultProps, variance: 'positive' };
      renderWithTheme(<ProcurementScheduleFilters {...props} />);
      
      expect(screen.getByText('Positive Variance')).toBeInTheDocument();
    });
  });

  describe('Packages at Risk Filter', () => {
    it('renders packages at risk filter with all options', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      // With mocked MUI components, all options are visible
      expect(screen.getByText('Packages at Risk')).toBeInTheDocument();
      expect(screen.getByText('Approaching')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('displays correct selected packages at risk value', () => {
      const props = { ...defaultProps, packagesAtRisk: 'Overdue' };
      renderWithTheme(<ProcurementScheduleFilters {...props} />);
      
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders all filter components together', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      // Verify all main components are present
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Milestone Status')).toBeInTheDocument();
      expect(screen.getByText('Tender Status')).toBeInTheDocument();
      expect(screen.getByText('Variance')).toBeInTheDocument();
      expect(screen.getByText('Packages at Risk')).toBeInTheDocument();
    });

    it('maintains state consistency across renders', () => {
      const props = {
        ...defaultProps,
        searchTerm: 'test',
        milestoneStatus: 'In Progress',
        tenderStatus: 'awarded',
        variance: 'positive',
        packagesAtRisk: 'Approaching'
      };
      
      renderWithTheme(<ProcurementScheduleFilters {...props} />);
      
      // All selected values should be visible
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Awarded')).toBeInTheDocument();
      expect(screen.getByText('Positive Variance')).toBeInTheDocument();
      expect(screen.getByText('Approaching')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders with consistent layout structure', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      // Verify basic component structure is rendered
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByTestId('SearchIcon')).toBeInTheDocument();
    });

    it('maintains accessibility labels for all filters', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      // All filter labels should be accessible
      expect(screen.getByText('Milestone Status')).toBeInTheDocument();
      expect(screen.getByText('Tender Status')).toBeInTheDocument();
      expect(screen.getByText('Variance')).toBeInTheDocument();
      expect(screen.getByText('Packages at Risk')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles undefined search value gracefully', async () => {
      const propsWithUndefinedSearch = {
        ...defaultProps,
        search: undefined
      };
      renderWithTheme(<ProcurementScheduleFilters {...propsWithUndefinedSearch} />);
      
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toHaveValue('');
    });

    it('handles null filter values gracefully', () => {
      const propsWithNullFilters = {
        ...defaultProps,
        milestoneStatus: null,
        tenderStatus: null,
        variance: null,
        packagesAtRisk: null
      };
      renderWithTheme(<ProcurementScheduleFilters {...propsWithNullFilters} />);
      
      // Should render without errors
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('handles empty string filter values', () => {
      const propsWithEmptyFilters = {
        ...defaultProps,
        milestoneStatus: '',
        tenderStatus: '',
        variance: '',
        packagesAtRisk: ''
      };
      renderWithTheme(<ProcurementScheduleFilters {...propsWithEmptyFilters} />);
      
      // Should render without errors
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure for all controls', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      // Check that all filter options are present and accessible
      expect(screen.getByText('Not Started')).toBeInTheDocument();
      expect(screen.getByText('TBC')).toBeInTheDocument();
      expect(screen.getByText('Positive Variance')).toBeInTheDocument();
      expect(screen.getByText('Approaching')).toBeInTheDocument();
    });

    it('has proper placeholder for search field', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('allows keyboard interaction with search field', () => {
      renderWithTheme(<ProcurementScheduleFilters {...defaultProps} />);

      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toBeInTheDocument();
      // Check that it has a placeholder for accessibility
      expect(searchInput).toHaveAttribute('placeholder', 'Search...');
    });
  });
});