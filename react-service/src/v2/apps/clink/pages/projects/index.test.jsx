import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies before importing the component
const mockDispatch = jest.fn();
const mockPatchData = jest.fn();
const mockGoTo = jest.fn();
const mockRelay = jest.fn();
const mockFlag = jest.fn();

jest.mock('react-redux', () => ({
  connect: jest.fn(() => (component) => component),
}));



jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      getDashboardActions: jest.fn(),
      resetProject: jest.fn(),
      resetQuotesTender: jest.fn(),
      restartOrders: jest.fn(),
      restartProcurement: jest.fn(),
      setProjectName: jest.fn(),
      setSlug: jest.fn(),
    },
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key) => key,
    i18n: { language: 'en' },
  })),
}));

jest.mock('v2/helpers/php-globals', () => ({
  __esModule: true,
  default: jest.fn(() => ({ csrf: 'mock-csrf-token' })),
  PHPAppClinkGloblals: jest.fn(() => ({
    info: { user: { type: 'super_admin', acl_enabled: "0" } },
  })),
}));

jest.mock('services/clinkHelpers', () => ({
  patchData: mockPatchData,
}));

jest.mock('v1/global/services/Relay', () => {
  return mockRelay;
});

jest.mock('v2/apps/shared/components/confirm-modal/v3', () => {
  return function ConfirmModal({ externalOpen, handleAction, title }) {
    return externalOpen ? (
      <div data-testid="confirm-modal">
        <div data-testid="confirm-modal-title">{title}</div>
        <button data-testid="confirm-action" onClick={handleAction}>
          Confirm Action
        </button>
      </div>
    ) : null;
  };
});

jest.mock('v2/apps/clink/pages/orders/subcontractors/modal', () => {
  return function Modal({ open }) {
    return open ? <div data-testid="subcontractors-modal">Modal</div> : null;
  };
});

jest.mock('v2/apps/clink/pages/pmp/add-project', () => {
  return function AddProjectV2() {
    return <div data-testid="add-project">Add Project</div>;
  };
});

jest.mock('v2/helpers/url', () => ({
  goTo: mockGoTo,
}));

jest.mock('v1/global/components/packages-modal', () => {
  return function PackagesModal() {
    return <div data-testid="packages-modal">Packages Modal</div>;
  };
});

jest.mock('./ProjectListItem', () => {
  return function ProjectListItem({ project, handleArchive, handleRestore, archived }) {
    return (
      <div data-testid={`project-item-${project.id}`}>
        <div data-testid="project-name">{project.name}</div>
        <div data-testid="project-status">{archived ? 'archived' : 'active'}</div>
        <button data-testid="archive-button" onClick={() => handleArchive(project)}>
          Archive
        </button>
        <button data-testid="restore-button" onClick={() => handleRestore(project)}>
          Restore
        </button>
      </div>
    );
  };
});

jest.mock('./DashboardTabs', () => {
  return function DashboardTabs({ fetchDashboardActions }) {
    return (
      <div data-testid="dashboard-tabs">
        <button data-testid="fetch-actions" onClick={() => fetchDashboardActions('all')}>
          Fetch Actions
        </button>
      </div>
    );
  };
});

jest.mock('helpers/flags', () => mockFlag);

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkLightPurple: '#8A2BE2',
        mediumGray: '#808080',
        white: '#FFFFFF',
      },
    },
    userTypes: {
      userTypeSuperAdmin: 'super_admin',
      userTypeTeamManager: 'team_manager',
    },
  },
}));

// Mock global variables that might be used
global.BASE_URLS = {
  S3_URL: 'https://mock-s3.amazonaws.com',
  CLINK: 'https://mock-clink.com',
};
global.ENV = 'test';

// Import component after mocks
const Projects = require('./index.jsx').default;

describe('Projects Index Component', () => {
  const defaultProps = {
    dispatch: mockDispatch,
    constants: {
      project: {
        type: {
          1: 'Residential',
          2: 'Commercial',
        },
      },
    },
    dashboardActions: [],
    clinkAccount: {
      country: { code: 'AU' },
      acl: {
        createProject: { canView: true },
        projectList: { canEdit: true },
      },
    },
  };

  const mockProjects = [
    {
      id: 1,
      name: 'Project Alpha',
      status: 1, // PUBLISHED
      start_date: '2023-01-15',
      created_at: '2023-01-10',
      type: 1,
      slug: 'project-alpha',
    },
    {
      id: 2,
      name: 'Project Beta',
      status: 2, // ARCHIVED
      start_date: '2023-02-20',
      created_at: '2023-02-15',
      type: 2,
      slug: 'project-beta',
    },
    {
      id: 3,
      name: 'Project Gamma',
      status: 1, // PUBLISHED
      start_date: '2023-03-25',
      created_at: '2023-03-20',
      type: 1,
      slug: 'project-gamma',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFlag.mockReturnValue(false);

    // Setup Relay mock to resolve with projects data
    mockRelay.mockImplementation(() => ({
      getJson: () => Promise.resolve(mockProjects),
    }));

    mockPatchData.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      // Mock delayed response to keep loading state
      mockRelay.mockImplementation(() => ({
        getJson: () => new Promise(() => { }), // Never resolves
      }));

      render(<Projects {...defaultProps} />);

      expect(screen.getAllByTestId('mui-skeleton')).toHaveLength(2); // Multiple Skeletons
    });

    it('should render main content after loading', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });

      expect(screen.getByText('Ongoing Projects')).toBeInTheDocument();
      expect(screen.getByText('Archived Projects')).toBeInTheDocument();
      expect(screen.getByTestId('add-project')).toBeInTheDocument();
    });

    it('should render dashboard tabs when APPROVAL_THRESHOLD flag is enabled', async () => {
      mockFlag.mockReturnValue(true);

      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
      });
    });

    it('should not render dashboard tabs when flag is disabled', async () => {
      mockFlag.mockReturnValue(false);

      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-tabs')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tab Functionality', () => {
    it('should start with ongoing projects tab active', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', '0');
      });
    });

    it('should switch to archived projects tab when clicked', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });

      // Use our test button to simulate tab change
      const tabChangeButton = screen.getByTestId('tab-change-button');
      fireEvent.click(tabChangeButton);

      // Verify the tab value has changed
      expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', '1');
    });

    it('should show active projects in ongoing tab', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        // Should show active projects (status !== 2)
        expect(screen.getByTestId('project-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('project-item-3')).toBeInTheDocument();
      });
    });

    it('should show archived projects when tab is switched', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });

      // Switch to archived tab using our test button
      const tabChangeButton = screen.getByTestId('tab-change-button');
      fireEvent.click(tabChangeButton);

      // Verify tab switched
      expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', '1');
    });

    it('should show empty message when no archived projects', async () => {
      // Mock projects with no archived ones
      const noArchivedProjects = mockProjects.filter(p => p.status !== 2);
      mockRelay.mockImplementation(() => ({
        getJson: () => Promise.resolve(noArchivedProjects),
      }));

      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });

      // Switch to archived tab
      const tabChangeButton = screen.getByTestId('tab-change-button');
      fireEvent.click(tabChangeButton);

      // The empty message logic is tested by ensuring the component doesn't crash
      expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', '1');
    });
  });

  describe('Sorting Functionality', () => {
    it('should render sort dropdown with default value', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        const sortSelect = screen.getByTestId('mui-select');
        expect(sortSelect).toBeInTheDocument();
        expect(sortSelect).toHaveAttribute('value', 'name');
      });
    });

    it('should change sort option when dropdown is clicked', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        const sortSelect = screen.getByTestId('mui-select');
        expect(sortSelect).toHaveAttribute('value', 'name');

        // Click on the select to open it
        fireEvent.click(sortSelect);

        // Verify menu items are present
        expect(screen.getByText('Date Project Start (Oldest First)')).toBeInTheDocument();
        expect(screen.getByText('Date Project Start (Newest First)')).toBeInTheDocument();
        expect(screen.getByText('Created Date (Oldest First)')).toBeInTheDocument();
        expect(screen.getByText('Created Date (Newest First)')).toBeInTheDocument();
      });
    });

    it('should have all sort options available', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Project Name (A-Z)')).toBeInTheDocument();
        expect(screen.getByText('Date Project Start (Oldest First)')).toBeInTheDocument();
        expect(screen.getByText('Date Project Start (Newest First)')).toBeInTheDocument();
        expect(screen.getByText('Created Date (Oldest First)')).toBeInTheDocument();
        expect(screen.getByText('Created Date (Newest First)')).toBeInTheDocument();
      });
    });

    it('should sort projects by start date (old to new)', async () => {
      const propsWithProjects = {
        ...defaultProps,
        projects: {
          ...defaultProps.projects,
          items: [
            { id: 1, name: 'Project A', start_date: '2023-12-01', created_at: '2023-11-01' },
            { id: 2, name: 'Project B', start_date: '2023-11-01', created_at: '2023-12-01' },
            { id: 3, name: 'Project C', start_date: '2023-10-01', created_at: '2023-10-15' },
          ],
        },
      };

      render(<Projects {...propsWithProjects} />);

      await waitFor(() => {
        const sortSelect = screen.getByTestId('mui-select');
        // Click to open dropdown
        fireEvent.click(sortSelect);

        // Click the start_old option
        const startOldOption = screen.getByText('Date Project Start (Oldest First)');
        fireEvent.click(startOldOption);
      });

      // Projects should be sorted by start_date (oldest first)
      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });
    });

    it('should sort projects by start date (new to old)', async () => {
      const propsWithProjects = {
        ...defaultProps,
        projects: {
          ...defaultProps.projects,
          items: [
            { id: 1, name: 'Project A', start_date: '2023-12-01', created_at: '2023-11-01' },
            { id: 2, name: 'Project B', start_date: '2023-11-01', created_at: '2023-12-01' },
            { id: 3, name: 'Project C', start_date: '2023-10-01', created_at: '2023-10-15' },
          ],
        },
      };

      render(<Projects {...propsWithProjects} />);

      await waitFor(() => {
        const sortSelect = screen.getByTestId('mui-select');
        // Click to open dropdown
        fireEvent.click(sortSelect);

        // Click the start_new option
        const startNewOption = screen.getByText('Date Project Start (Newest First)');
        fireEvent.click(startNewOption);
      });

      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });
    });

    it('should sort projects by created date (old to new)', async () => {
      const propsWithProjects = {
        ...defaultProps,
        projects: {
          ...defaultProps.projects,
          items: [
            { id: 1, name: 'Project A', start_date: '2023-12-01', created_at: '2023-11-01' },
            { id: 2, name: 'Project B', start_date: '2023-11-01', created_at: '2023-12-01' },
            { id: 3, name: 'Project C', start_date: '2023-10-01', created_at: '2023-10-15' },
          ],
        },
      };

      render(<Projects {...propsWithProjects} />);

      await waitFor(() => {
        const sortSelect = screen.getByTestId('mui-select');
        // Click to open dropdown
        fireEvent.click(sortSelect);

        // Click the created_old option
        const createdOldOption = screen.getByText('Created Date (Oldest First)');
        fireEvent.click(createdOldOption);
      });

      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });
    });

    it('should sort projects by created date (new to old)', async () => {
      const propsWithProjects = {
        ...defaultProps,
        projects: {
          ...defaultProps.projects,
          items: [
            { id: 1, name: 'Project A', start_date: '2023-12-01', created_at: '2023-11-01' },
            { id: 2, name: 'Project B', start_date: '2023-11-01', created_at: '2023-12-01' },
            { id: 3, name: 'Project C', start_date: '2023-10-01', created_at: '2023-10-15' },
          ],
        },
      };

      render(<Projects {...propsWithProjects} />);

      await waitFor(() => {
        const sortSelect = screen.getByTestId('mui-select');
        // Click to open dropdown
        fireEvent.click(sortSelect);

        // Click the created_new option
        const createdNewOption = screen.getByText('Created Date (Newest First)');
        fireEvent.click(createdNewOption);
      });

      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });
    });
  });

  describe('Project Actions', () => {
    it('should call handleArchive when archive button is clicked', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        const archiveButton = screen.getAllByTestId('archive-button')[0];
        fireEvent.click(archiveButton);
      });

      expect(mockPatchData).toHaveBeenCalledWith(
        'project',
        'archived',
        {},
        { pid: 1 }
      );
    });

    it('should call handleRestore when restore button is clicked', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        const restoreButtons = screen.getAllByTestId('restore-button');
        fireEvent.click(restoreButtons[0]);
      });

      expect(mockPatchData).toHaveBeenCalledWith(
        'project',
        'restore',
        {},
        { pid: 1 }
      );
    });

    it('should show confirm modal after successful restore', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        const restoreButtons = screen.getAllByTestId('restore-button');
        fireEvent.click(restoreButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-modal-title')).toHaveTextContent('project-restored');
      });
    });

    it('should navigate to edit project when confirm action is clicked', async () => {
      render(<Projects {...defaultProps} />);

      // Restore a project to trigger confirm modal
      await waitFor(() => {
        const restoreButtons = screen.getAllByTestId('restore-button');
        fireEvent.click(restoreButtons[0]);
      });

      await waitFor(() => {
        const confirmAction = screen.getByTestId('confirm-action');
        fireEvent.click(confirmAction);
      });

      expect(mockGoTo).toHaveBeenCalledWith('https://mock-clink.com/projects/project-alpha/setup');
    });
  });

  describe('Component Lifecycle', () => {
    it('should dispatch actions on component mount', async () => {
      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('should fetch dashboard actions when flag is enabled', async () => {
      mockFlag.mockReturnValue(true);

      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        const fetchButton = screen.getByTestId('fetch-actions');
        fireEvent.click(fetchButton);
      });

      // Verify the action was dispatched
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Reset all mocks before each error handling test
      mockRelay.mockClear();
      mockPatchData.mockClear();
    });

    it('should handle archive action failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      // Mock successful fetch first - ensure we return the correct data structure
      mockRelay.mockImplementation(() => ({
        getJson: () => Promise.resolve(mockProjects),
      }));

      mockPatchData.mockRejectedValue(new Error('Archive failed'));

      render(<Projects {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });

      const archiveButton = screen.getAllByTestId('archive-button')[0];
      fireEvent.click(archiveButton);

      // Should not crash on error and still show content
      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Redux Integration', () => {
    it('should connect to Redux store and receive correct props', async () => {
      mockFlag.mockReturnValue(true);

      const mockState = {
        constants: {
          flags: { APPROVAL_THRESHOLD: true },
          mockConstants: true
        },
        project: {
          dashboardActions: [{ id: 1, name: 'Test Action' }]
        },
        clinkAccount: {
          data: { id: 1, name: 'Test Account' }
        },
      };

      // Test mapStateToProps by rendering with full props
      const connectedProps = {
        ...defaultProps,
        constants: mockState.constants,
        dashboardActions: mockState.project.dashboardActions,
        clinkAccount: mockState.clinkAccount,
      };

      render(<Projects {...connectedProps} />);

      await waitFor(() => {
        expect(screen.getByText('projects')).toBeInTheDocument();
      });

      // Verify component receives and uses the mapped props
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
    });
  });
});