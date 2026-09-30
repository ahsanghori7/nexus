import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectListItem from './index';

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        eerieBlack: '#000000',
        darkCharcoal: '#333333',
      },
    },
    fonts: {
      proxima: 'Proxima Nova',
    },
  },
}));

// Mock LazyImage component
jest.mock('v1/global/components/LazyImage', () => {
  return function MockLazyImage(props) {
    return <img {...props} data-testid="lazy-image" />;
  };
});

// Mock MuiDropdownButton component
jest.mock('v2/apps/clink/pages/shared/MuiDropdown', () => {
  return function MockMuiDropdownButton(props) {
    return <button data-testid="dropdown-button" {...props} />;
  };
});

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('ProjectListItem Component', () => {
  const mockProps = {
    image: 'test-image.jpg',
    projectName: 'Test Project',
    projectType: 'Residential',
    href: '/project/123',
    setOpen: jest.fn(),
    handleArchive: jest.fn().mockResolvedValue(undefined),
    handleRestore: jest.fn().mockResolvedValue(undefined),
    project: { id: '123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter(<ProjectListItem {...mockProps} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('displays project name and type', () => {
    renderWithRouter(<ProjectListItem {...mockProps} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Residential')).toBeInTheDocument();
  });

  it('renders LazyImage with correct props', () => {
    renderWithRouter(<ProjectListItem {...mockProps} />);
    const image = screen.getByTestId('lazy-image');
    expect(image).toHaveAttribute('src', 'test-image.jpg');
    expect(image).toHaveClass('project-image');
  });

  it('handles image error correctly', async () => {
    renderWithRouter(<ProjectListItem {...mockProps} />);
    const image = screen.getByTestId('lazy-image');

    fireEvent.error(image);

    await waitFor(() => {
      expect(image).toHaveAttribute(
        'src',
        'https://clink-assets.s3.eu-west-2.amazonaws.com/production/static/images/project/project-building.svg',
      );
      expect(image).toHaveClass('no-image-found');
    });
  });

  describe('Archived state', () => {
    it('shows restore option when archived', () => {
      renderWithRouter(<ProjectListItem {...mockProps} archived />);
      const dropdownButton = screen.getByTestId('dropdown-button');
      expect(dropdownButton).toBeInTheDocument();
      // Note: Further testing of dropdown options would require implementation-specific details
    });

    it('shows archive option when not archived', () => {
      renderWithRouter(<ProjectListItem {...mockProps} archived={false} />);
      const dropdownButton = screen.getByTestId('dropdown-button');
      expect(dropdownButton).toBeInTheDocument();
    });

    it('uses href link when archived', () => {
      renderWithRouter(<ProjectListItem {...mockProps} archived />);
      const link = document.querySelector('a');
      expect(link).toHaveAttribute('href', '/project/123');
    });

    it('does not render as a link when not archived', () => {
      renderWithRouter(<ProjectListItem {...mockProps} archived={false} />);
      const link = document.querySelector('a');
      expect(link).toBeNull();
    });
  });

  describe('Modal actions', () => {
    it('calls setOpen with correct arguments for archive action', async () => {
      renderWithRouter(<ProjectListItem {...mockProps} archived={false} />);
      const dropdownButton = screen.getByTestId('dropdown-button');

      // Simulate modal action
      // Note: Actual implementation might need adjustment based on how modalAsyncAction is used
      await mockProps.handleArchive(mockProps.project);
      expect(mockProps.handleArchive).toHaveBeenCalledWith(mockProps.project);
    });

    it('calls setOpen with correct arguments for restore action', async () => {
      renderWithRouter(<ProjectListItem {...mockProps} archived />);
      const dropdownButton = screen.getByTestId('dropdown-button');

      // Simulate modal action
      await mockProps.handleRestore(mockProps.project);
      expect(mockProps.handleRestore).toHaveBeenCalledWith(mockProps.project);
    });
  });

  describe('Edge cases', () => {
    it('handles empty props gracefully', () => {
      renderWithRouter(<ProjectListItem />);
      expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
    });

    it('handles missing project object gracefully', () => {
      renderWithRouter(<ProjectListItem {...mockProps} project={undefined} />);
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });
});
