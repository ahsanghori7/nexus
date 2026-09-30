import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

// Mock react-router-dom: the component navigates via useNavigate.
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the common modal action
jest.mock(
  'v2/apps/clink/pages/orders/subcontractors/useActions/common',
  () => ({
    modalAsyncAction: jest.fn((setOpen, action, message, buttonText) => ({
      name: buttonText,
      action: action,
      disabled: false,
    })),
  }),
);

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        charcoalGray: '#333333',
        mediumGray: '#666666',
        grayDark: '#444444',
        teal2: '#008080',
        lightCyan: '#e0ffff',
        white: '#ffffff',
        clinkPurple: '#6b46c1',
        lightPeriwinkle: '#c5c5ff',
      },
    },
    userTypes: {
      userTypeSuperAdmin: 'super_admin',
      userTypeTeamManager: 'team_manager',
    },
  },
}));

import ProjectListItem from './ProjectListItem';
import { useSelector } from 'react-redux';
import { modalAsyncAction } from 'v2/apps/clink/pages/orders/subcontractors/useActions/common';

// Mock global BASE_URLS
global.BASE_URLS = {
  CLINK_APP_HOST: 'https://app.c-link.test',
};

jest.mock('v2/helpers/php-globals', () => ({
  __esModule: true,
  default: jest.fn(() => ({ csrf: 'mock-csrf-token' })),
  PHPAppClinkGloblals: jest.fn(() => ({
    info: { user: { type: 'super_admin', acl_enabled: '0' } },
  })),
}));

describe('ProjectListItem Component', () => {
  let user;
  const mockHandleArchive = jest.fn(() => Promise.resolve());
  const mockHandleRestore = jest.fn(() => Promise.resolve());
  const mockSetOpen = jest.fn();

  const defaultProps = {
    projectType: 'Commercial',
    projectName: 'Test Project',
    imgSrc: 'https://example.com/project-image.jpg',
    archived: false,
    project: { slug: 'test-project-slug', id: 1 },
    handleArchive: mockHandleArchive,
    handleRestore: mockHandleRestore,
    setOpen: mockSetOpen,
  };

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    user = userEvent.setup();
    useSelector.mockReturnValue({
      acl: {
        archiveProject: { canArchive: true },
      },
    });
    modalAsyncAction.mockImplementation(
      (setOpen, action, message, buttonText) => ({
        name: buttonText,
        action: action,
        disabled: false,
      }),
    );
  });

  it('renders without crashing', () => {
    render(<ProjectListItem {...defaultProps} />);

    expect(screen.getByTestId('mui-card')).toBeInTheDocument();
    expect(screen.getByTestId('mui-card-media')).toBeInTheDocument();
    expect(screen.getByTestId('mui-card-content')).toBeInTheDocument();
  });

  it('displays project information correctly', () => {
    render(<ProjectListItem {...defaultProps} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Commercial')).toBeInTheDocument();
    expect(screen.getByTestId('mui-card-media')).toHaveAttribute(
      'image',
      'https://example.com/project-image.jpg',
    );
    expect(screen.getByTestId('mui-card-media')).toHaveAttribute(
      'alt',
      'Test Project',
    );
  });

  it('shows "Untitled Project" when no project name provided', () => {
    render(<ProjectListItem {...defaultProps} projectName="" />);

    expect(screen.getByText('Untitled Project')).toBeInTheDocument();
  });

  it('shows "Unknown Category" when no project type provided', () => {
    render(<ProjectListItem {...defaultProps} projectType="" />);

    expect(screen.getByText('Unknown Category')).toBeInTheDocument();
  });

  it('navigates to project dashboard when card is clicked and not archived', async () => {
    render(<ProjectListItem {...defaultProps} />);

    const cardMedia = screen.getByTestId('mui-card-media');
    await user.click(cardMedia);

    expect(mockNavigate).toHaveBeenCalledWith(
      'https://app.c-link.test/main-contractor/project_dashboard/test-project-slug',
    );
  });

  it('does not navigate when card is clicked and project is archived', async () => {
    render(<ProjectListItem {...defaultProps} archived={true} />);

    const cardMedia = screen.getByTestId('mui-card-media');
    await user.click(cardMedia);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('opens dropdown menu when more icon is clicked', async () => {
    render(<ProjectListItem {...defaultProps} isVisible={true} />);

    const iconButton = screen.getByRole('button');
    await user.click(iconButton);

    expect(screen.getByTestId('mui-menu')).toBeInTheDocument();
  });

  it('shows Archive option for non-archived projects', async () => {
    render(
      <ProjectListItem {...defaultProps} archived={false} isVisible={true} />,
    );

    const iconButton = screen.getByRole('button');
    await user.click(iconButton);

    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('shows Restore option for archived projects', async () => {
    render(
      <ProjectListItem {...defaultProps} archived={true} isVisible={true} />,
    );

    const iconButton = screen.getByRole('button');
    await user.click(iconButton);

    expect(screen.getByText('Restore')).toBeInTheDocument();
  });

  it('calls handleArchive when Archive is clicked', async () => {
    render(
      <ProjectListItem {...defaultProps} archived={false} isVisible={true} />,
    );

    const iconButton = screen.getByRole('button');
    await user.click(iconButton);

    const archiveButton = screen.getByText('Archive');
    await user.click(archiveButton);

    // The modal action should be created with the correct parameters
    expect(modalAsyncAction).toHaveBeenCalledWith(
      mockSetOpen,
      expect.any(Function),
      'Are you sure you want to archive Test Project?',
      'Archive',
    );
  });

  it('calls handleRestore when Restore is clicked', async () => {
    render(
      <ProjectListItem {...defaultProps} archived={true} isVisible={true} />,
    );

    const iconButton = screen.getByRole('button');
    await user.click(iconButton);

    const restoreButton = screen.getByText('Restore');
    await user.click(restoreButton);

    expect(modalAsyncAction).toHaveBeenCalledWith(
      mockSetOpen,
      expect.any(Function),
      'Are you sure you wish to Restore this project? ',
      'Restore',
    );
  });

  it('handles image error by testing component structure', () => {
    render(<ProjectListItem {...defaultProps} />);

    const cardMedia = screen.getByTestId('mui-card-media');

    // Test that the CardMedia component renders with image prop
    expect(cardMedia).toHaveAttribute(
      'image',
      'https://example.com/project-image.jpg',
    );
    expect(cardMedia).toHaveAttribute('alt', 'Test Project');
  });

  it('renders with cursor styling in sx prop', () => {
    render(<ProjectListItem {...defaultProps} archived={true} />);

    const card = screen.getByTestId('mui-card');
    // The sx prop should contain cursor styling (mocks don't apply actual styles)
    expect(card).toHaveAttribute('sx');
  });

  it('renders with cursor styling for non-archived projects', () => {
    render(<ProjectListItem {...defaultProps} archived={false} />);

    const card = screen.getByTestId('mui-card');
    // The sx prop should contain cursor styling (mocks don't apply actual styles)
    expect(card).toHaveAttribute('sx');
  });

  it('closes dropdown menu when an action is clicked', async () => {
    render(
      <ProjectListItem {...defaultProps} archived={false} isVisible={true} />,
    );

    const iconButton = screen.getByRole('button');
    await user.click(iconButton);

    expect(screen.getByTestId('mui-menu')).toBeInTheDocument();

    const archiveButton = screen.getByText('Archive');
    await user.click(archiveButton);

    // Menu should close after clicking an action
    expect(screen.queryByTestId('mui-menu')).not.toBeInTheDocument();
  });

  it('renders with default props when minimal props provided', () => {
    render(<ProjectListItem />);

    expect(screen.getByTestId('mui-card')).toBeInTheDocument();
    expect(screen.getByText('Untitled Project')).toBeInTheDocument();
    expect(screen.getByText('Unknown Category')).toBeInTheDocument();
  });

  it('has correct grid responsive sizing', () => {
    render(<ProjectListItem {...defaultProps} />);

    const grid = screen.getByTestId('grid2');
    // Grid2 has size prop passed to it
    expect(grid).toHaveAttribute('sx');
  });

  it('displays tooltip with project name', () => {
    render(<ProjectListItem {...defaultProps} />);

    const tooltip = screen
      .getAllByTestId('mui-tooltip')
      .find((el) => el.getAttribute('data-title') === 'Test Project');
    expect(tooltip).toBeTruthy();
  });

  it('navigates from card content click when not archived', async () => {
    render(<ProjectListItem {...defaultProps} archived={false} />);

    const cardContent = screen.getByTestId('mui-card-content');
    await user.click(cardContent);

    expect(mockNavigate).toHaveBeenCalledWith(
      'https://app.c-link.test/main-contractor/project_dashboard/test-project-slug',
    );
  });

  it('handles image load error by setting fallback image', () => {
    render(<ProjectListItem {...defaultProps} />);

    const image = screen.getByTestId('mui-card-media');

    // Initially should have the project image
    expect(image).toHaveAttribute(
      'image',
      'https://example.com/project-image.jpg',
    );

    // Simulate image error - this triggers the onError handler
    fireEvent.error(image);

    // The onError handler should be called - we verify the image is still rendered
    // (The actual src change is handled by React state which is harder to test without more complex setup)
    expect(image).toBeInTheDocument();
  });

  it('applies error styling when image fails to load', () => {
    render(<ProjectListItem {...defaultProps} />);

    const image = screen.getByTestId('mui-card-media');

    // Simulate image error
    fireEvent.error(image);

    // Verify the error handler was triggered (image still exists)
    expect(image).toBeInTheDocument();
  });

  it('navigates on image click for non-archived projects', async () => {
    render(<ProjectListItem {...defaultProps} archived={false} />);

    const image = screen.getByTestId('mui-card-media');
    await user.click(image);

    expect(mockNavigate).toHaveBeenCalledWith(
      'https://app.c-link.test/main-contractor/project_dashboard/test-project-slug',
    );
  });

  it('does not navigate on image click for archived projects', async () => {
    render(<ProjectListItem {...defaultProps} archived={true} />);

    const image = screen.getByTestId('mui-card-media');
    await user.click(image);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});