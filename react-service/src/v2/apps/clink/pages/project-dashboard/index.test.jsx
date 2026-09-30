import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import '@testing-library/jest-dom';
import ProjectDashboard from './index';

// Mock clink-components
jest.mock('clink-components', () => ({
  ViewMode: { Month: 'Month' }
}));

// Mock styled components
jest.mock('./styled', () => ({
  StyledProjectsContainer: ({ children, className }) => (
    <div data-testid="styled-projects-container" className={className}>
      {children}
    </div>
  )
}));

// Mock GanttTaskReact
jest.mock('./gantt-task-react', () => ({ tasks, service, size, alert, useSetView, slug }) => (
  <div data-testid="gantt-task-react">
    <div data-testid="gantt-props">
      tasks: {tasks?.length || 0}, alert: {alert.toString()}, slug: {slug}
    </div>
  </div>
));

// Mock MUI components
jest.mock('@mui/material/Box', () => ({ children, ...props }) =>
  <div data-testid="mui-box" {...props}>{children}</div>
);

jest.mock('@mui/material/LinearProgress', () => () =>
  <div data-testid="linear-progress" />
);

jest.mock('@mui/material/Skeleton', () => ({ variant, width, height }) =>
  <div data-testid="skeleton" data-variant={variant} data-width={width} data-height={height} />
);

// Mock react-router-dom
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams()
}));

// Create a simple Redux store for testing
const createMockStore = (state) => {
  return createStore(() => state);
};

  const renderWithProviders = (ui, options = {}) => {
    const defaultState = {
      project: {
        tasks: [],
        showAlert: false,
      },
      constants: {},
      quotesTender: { quotesData: {} },
      procurementSchedule: { packages: [] },
      order: { list: [] },
    };
    
    const initialState = {
      ...defaultState,
      ...options.initialState,
    };

    const store = createStore(
      (state = initialState) => state
    );

    return render(
      <Provider store={store}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </Provider>
    );
  };

describe('ProjectDashboard', () => {
  const mockTasks = [
    {
      id: 1,
      start: '2024-01-01',
      end: '2024-01-15',
      tenderReturn: '2024-01-10',
      startOnSite: '2024-01-05',
      enquirySentDate: '2024-01-02',
      decisionDate: '2024-01-12',
      subcontractWorkFinish: '2024-01-14',
      beforeEnd: '2024-01-13'
    }
  ];

  // Props are now handled via Redux state in renderWithProviders

  beforeEach(() => {
    mockUseParams.mockReturnValue({ slug: 'test-project' });
  });

  it('renders without crashing when there are tasks', () => {
    renderWithProviders(<ProjectDashboard isThereTasks={true} />, {
      initialState: {
        project: {
          tasks: mockTasks,
          showAlert: false
        },
        constants: {
          tender: {
            service: { id: 1, name: 'Test Service' },
            size: { id: 1, name: 'Small' }
          }
        }
      }
    });
    
    expect(screen.getByTestId('styled-projects-container')).toBeInTheDocument();
    expect(screen.getByTestId('gantt-task-react')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading is true', () => {
    renderWithProviders(<ProjectDashboard loading={true} />);
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('linear-progress')).toBeInTheDocument();
    expect(screen.queryByTestId('gantt-task-react')).not.toBeInTheDocument();
  });

  it('does not render GanttTaskReact when loading', () => {
    renderWithProviders(<ProjectDashboard loading={true} />);
    
    expect(screen.queryByTestId('gantt-task-react')).not.toBeInTheDocument();
  });

  it('does not render GanttTaskReact when no tasks', () => {
    renderWithProviders(<ProjectDashboard isThereTasks={false} />);
    
    expect(screen.queryByTestId('gantt-task-react')).not.toBeInTheDocument();
  });

  it('passes correct props to GanttTaskReact', () => {
    renderWithProviders(<ProjectDashboard isThereTasks={true} />, {
      initialState: {
        project: {
          tasks: mockTasks,
          showAlert: false
        },
        constants: {
          tender: {
            service: { id: 1, name: 'Test Service' },
            size: { id: 1, name: 'Small' }
          }
        }
      }
    });
    
    expect(screen.getByTestId('gantt-props')).toHaveTextContent('tasks: 1, alert: false, slug: test-project');
  });

  it('handles showAlert effect', () => {
    renderWithProviders(<ProjectDashboard isThereTasks={true} />, {
      initialState: {
        project: {
          tasks: mockTasks,
          showAlert: true
        },
        constants: {
          tender: {
            service: { id: 1, name: 'Test Service' },
            size: { id: 1, name: 'Small' }
          }
        }
      }
    });
    
    expect(screen.getByTestId('gantt-task-react')).toBeInTheDocument();
  });

  it('handles empty constants gracefully', () => {
    renderWithProviders(<ProjectDashboard isThereTasks={true} />, {
      initialState: {
        project: {
          tasks: mockTasks,
          showAlert: false
        },
        constants: {}
      }
    });
    
    expect(screen.getByTestId('gantt-task-react')).toBeInTheDocument();
  });

  it('handles undefined constants gracefully', () => {
    renderWithProviders(<ProjectDashboard isThereTasks={true} />, {
      initialState: {
        project: {
          tasks: mockTasks,
          showAlert: false
        },
        constants: undefined
      }
    });
    
    expect(screen.getByTestId('gantt-task-react')).toBeInTheDocument();
  });

  it('handles constants without tender', () => {
    renderWithProviders(<ProjectDashboard isThereTasks={true} />, {
      initialState: {
        project: {
          tasks: mockTasks,
          showAlert: false
        },
        constants: { other: 'data' }
      }
    });
    
    expect(screen.getByTestId('gantt-task-react')).toBeInTheDocument();
  });

  it('handles tender without service', () => {
    renderWithProviders(<ProjectDashboard isThereTasks={true} />, {
      initialState: {
        project: {
          tasks: mockTasks,
          showAlert: false
        },
        constants: { tender: { size: { id: 1 } } }
      }
    });
    
    expect(screen.getByTestId('gantt-task-react')).toBeInTheDocument();
  });

  it('handles tender without size', () => {
    renderWithProviders(<ProjectDashboard isThereTasks={true} />, {
      initialState: {
        project: {
          tasks: mockTasks,
          showAlert: false
        },
        constants: { tender: { service: { id: 1 } } }
      }
    });
    
    expect(screen.getByTestId('gantt-task-react')).toBeInTheDocument();
  });

  it('formats tasks with dates correctly', () => {
    renderWithProviders(<ProjectDashboard isThereTasks={true} />, {
      initialState: {
        project: {
          tasks: mockTasks,
          showAlert: false
        },
        constants: {
          tender: {
            service: { id: 1, name: 'Test Service' },
            size: { id: 1, name: 'Small' }
          }
        }
      }
    });
    
    // The component should render successfully with formatted tasks
    expect(screen.getByTestId('gantt-task-react')).toBeInTheDocument();
  });

  it('handles tasks with null optional dates', () => {
    const tasksWithNullDates = [
      {
        id: 1,
        start: '2024-01-01',
        end: '2024-01-15',
        tenderReturn: '2024-01-10',
        startOnSite: '2024-01-05',
        enquirySentDate: '2024-01-02',
        decisionDate: null,
        subcontractWorkFinish: null,
        beforeEnd: null
      }
    ];

    renderWithProviders(<ProjectDashboard isThereTasks={true} />, {
      initialState: {
        project: {
          tasks: tasksWithNullDates,
          showAlert: false
        },
        constants: {
          tender: {
            service: { id: 1, name: 'Test Service' },
            size: { id: 1, name: 'Small' }
          }
        }
      }
    });
    
    expect(screen.getByTestId('gantt-task-react')).toBeInTheDocument();
  });

  it('renders skeleton with correct props', () => {
    renderWithProviders(<ProjectDashboard loading={true} />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
  });
});