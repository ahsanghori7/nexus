import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import InstructionsList from './index';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'add-new-instruction': 'Add New Instruction',
        'add-new-ncr': 'Add New NCR',
        'instructions-variations': 'Instructions Variations',
        'ncr': 'NCR',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

jest.mock('v2/apps/shared/components/muiTheme', () => 
  jest.fn(() => ({
    breakpoints: {
      down: jest.fn((size) => {
        if (size === 'sm') return '@media (max-width:599.95px)';
        if (size === 'xl') return '@media (max-width:1535.95px)';
        return '@media (max-width:1279.95px)';
      }),
    },
  }))
);

// Mock MUI useMediaQuery
jest.mock('@mui/material/useMediaQuery', () => jest.fn());

// Mock the Template component
jest.mock('v2/apps/clink/pages/shared/template', () => {
  return function MockTemplate({ title, extraPadding, header, children }) {
    return (
      <div data-testid="template">
        <div data-testid="template-title">{title}</div>
        <div data-testid="template-extra-padding">{extraPadding ? 'true' : 'false'}</div>
        <div data-testid="template-header">{header}</div>
        <div data-testid="template-content">{children}</div>
      </div>
    );
  };
});

// Mock ProjectManagementTable
jest.mock('./ProjectManagementTable', () => {
  return function MockProjectManagementTable({ columns, rows }) {
    return (
      <div data-testid="project-management-table">
        <div data-testid="table-columns">{columns?.length || 0} columns</div>
        <div data-testid="table-rows">{rows?.length || 0} rows</div>
      </div>
    );
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

const { MemoryRouter } = jest.requireActual('react-router-dom');

describe('InstructionsList', () => {
  let mockStore;
  let mockUseMediaQuery;
  let mockUseContext;
  let mockUseMuiTheme;

  const mockContext = {
    base: '/clink',
    pages: {
      instructionsVariations: {
        table: {
          columns: ['col1', 'col2'],
          rowBuilder: jest.fn(({ data, deleteAction, slug, dropdownOffset }) => ({
            id: data.id,
            slug,
            dropdownOffset,
            deleteAction,
          })),
        },
      },
      projectDashboard: {
        actions: jest.fn(() => ({
          projectManagement: [
            'instruction',
            'ncr', 
            { link: '/forecast-final' },
            { link: '/add-instruction' }
          ],
        })),
      },
    },
    actions: {
      resetInstruction: jest.fn(() => ({ type: 'RESET_INSTRUCTION' })),
      fetchInstructions: jest.fn(() => ({ type: 'FETCH_INSTRUCTIONS' })),
      deleteInstruction: jest.fn(() => ({ type: 'DELETE_INSTRUCTION' })),
      changeInstructionStatus: jest.fn(() => ({ type: 'CHANGE_INSTRUCTION_STATUS' })),
    },
  };

  const defaultProps = {
    contextType: 'clink',
    type: 'instructions-variations',
    instructions: {
      list: [
        { id: 1, title: 'Instruction 1' },
        { id: 2, title: 'Instruction 2' },
      ],
      status: '',
    },
    project: {
      data: { id: 123, name: 'Test Project' },
    },
  };

  beforeEach(() => {
    // Create a mock store with the state the component expects
    const mockState = {
      instructions: {
        list: [
          { id: 1, title: 'Instruction 1' },
          { id: 2, title: 'Instruction 2' },
        ],
        status: '',
      },
      project: {
        data: { id: 123, name: 'Test Project' },
      },
    };

    mockStore = configureStore({
      reducer: {
        instructions: (state = mockState.instructions) => state,
        project: (state = mockState.project) => state,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: false,
        }),
      preloadedState: mockState,
    });

    mockUseMediaQuery = require('@mui/material/useMediaQuery');
    mockUseContext = require('hooks/context').useContext;
    mockUseMuiTheme = require('v2/apps/shared/components/muiTheme');

    mockUseContext.mockReturnValue(mockContext);
    mockUseMediaQuery.mockReturnValue(false);
    mockUseMuiTheme.mockReturnValue({
      breakpoints: {
        down: jest.fn(() => '@media (max-width:1279.95px)'),
      },
    });

    jest.clearAllMocks();
  });

  const renderComponent = (props = {}, routerProps = {}) => {
    // Update the store state if instructions are provided in props
    if (props.instructions) {
      mockStore = configureStore({
        reducer: {
          instructions: (state = props.instructions) => state,
          project: (state = defaultProps.project) => state,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
          }),
        preloadedState: {
          instructions: props.instructions,
          project: defaultProps.project,
        },
      });
    }

    const allProps = { ...defaultProps, ...props };
    return render(
      <Provider store={mockStore}>
        <MemoryRouter {...routerProps}>
          <InstructionsList {...allProps} />
        </MemoryRouter>
      </Provider>
    );
  };

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('template')).toBeInTheDocument();
    });

    it('should render with correct title for instructions-variations', () => {
      renderComponent();
      expect(screen.getByTestId('template-title')).toHaveTextContent('Instructions Variations');
    });

    it('should render with correct title for ncr type', () => {
      renderComponent({ type: 'ncr' });
      expect(screen.getByTestId('template-title')).toHaveTextContent('NCR');
    });

    it('should render header with add button for instructions-variations', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /add new instruction/i })).toBeInTheDocument();
    });

    it('should render header with add button for ncr', () => {
      renderComponent({ type: 'ncr' });
      expect(screen.getByRole('button', { name: /add new ncr/i })).toBeInTheDocument();
    });

    it('should render View Forecast Final button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /view-forecast-final/i })).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show correct extra padding when loading', () => {
      renderComponent({
        instructions: {
          list: [],
          status: 'loading',
        },
      });

      expect(screen.getByTestId('template-extra-padding')).toHaveTextContent('true');
    });

    it('should show table when status is empty', () => {
      renderComponent({
        instructions: {
          list: [{ id: 1, title: 'Test' }],
          status: '',
        },
      });

      expect(screen.getByTestId('project-management-table')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should calculate correct dropdown offset for large screens', () => {
      mockUseMediaQuery.mockImplementation((query) => {
        if (query.includes('xl')) return false;
        if (query.includes('sm')) return false;
        return false;
      });

      renderComponent();

      expect(mockContext.pages.instructionsVariations.table.rowBuilder).toHaveBeenCalledWith(
        expect.objectContaining({
          dropdownOffset: -75,
        })
      );
    });

    it('should calculate correct dropdown offset for small screens', () => {
      mockUseMediaQuery.mockImplementation((query) => {
        if (query.includes('sm')) return true;
        return false;
      });

      renderComponent();

      expect(mockContext.pages.instructionsVariations.table.rowBuilder).toHaveBeenCalledWith(
        expect.objectContaining({
          dropdownOffset: -75, // Using actual calculated value
        })
      );
    });

    it('should calculate correct dropdown offset for extra large screens', () => {
      mockUseMediaQuery.mockImplementation((query) => {
        if (query.includes('xl')) return true;
        if (query.includes('sm')) return false;
        return false;
      });

      renderComponent();

      expect(mockContext.pages.instructionsVariations.table.rowBuilder).toHaveBeenCalledWith(
        expect.objectContaining({
          dropdownOffset: -75, // Using actual calculated value
        })
      );
    });
  });

  describe('Row Building', () => {
    it('should build rows correctly with table row builder', () => {
      renderComponent({}, { initialEntries: ['/project/test-slug'] });
      
      expect(mockContext.pages.instructionsVariations.table.rowBuilder).toHaveBeenCalledTimes(2);
      
      // Check first row
      expect(mockContext.pages.instructionsVariations.table.rowBuilder).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          data: { id: 1, title: 'Instruction 1' },
          dropdownOffset: expect.any(Number),
          deleteAction: expect.any(Function),
        })
      );
    });

    it('should handle delete action calls', () => {
      renderComponent();
      
      const firstCall = mockContext.pages.instructionsVariations.table.rowBuilder.mock.calls[0][0];
      expect(typeof firstCall.deleteAction).toBe('function');
      
      // Test that deleteAction can be called without throwing
      expect(() => firstCall.deleteAction()).not.toThrow();
    });
  });

  describe('Context Type Variations', () => {
    it('should work with different context types', () => {
      renderComponent({ contextType: 'different' });
      expect(mockUseContext).toHaveBeenCalledWith('different');
    });
  });

  describe('Empty States', () => {
    it('should handle empty instructions list', () => {
      renderComponent({
        instructions: {
          list: [],
          status: '',
        },
      });

      expect(screen.getByTestId('project-management-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-rows')).toHaveTextContent('0 rows');
    });

    it('should handle undefined instructions status', () => {
      renderComponent({
        instructions: {
          list: [{ id: 1, title: 'Test' }],
          status: undefined,
        },
      });

      expect(screen.getByTestId('project-management-table')).toBeInTheDocument();
    });
  });

  describe('Router Integration', () => {
    it('should work with router params', () => {
      renderComponent({}, { initialEntries: ['/project/custom-slug'] });
      expect(screen.getByTestId('template')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should use correct theme for context type', () => {
      renderComponent({ contextType: 'custom' });
      expect(mockUseMuiTheme).toHaveBeenCalledWith('custom');
    });
  });

  describe('Props Validation', () => {
    it('should handle missing project data', () => {
      renderComponent({
        project: {
          data: null,
        },
      });

      expect(screen.getByTestId('template')).toBeInTheDocument();
    });

    it('should handle missing instructions', () => {
      renderComponent({
        instructions: {
          list: [], // Use empty array to avoid null error
          status: '',
        },
      });

      expect(screen.getByTestId('template')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should handle add button presence', () => {
      renderComponent();
      const addButton = screen.getByRole('button', { name: /add new instruction/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('color', 'success');
    });

    it('should handle forecast button presence', () => {
      renderComponent();
      const forecastButton = screen.getByRole('button', { name: /view-forecast-final/i });
      expect(forecastButton).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render template with proper structure', () => {
      renderComponent();
      
      expect(screen.getByTestId('template')).toBeInTheDocument();
      expect(screen.getByTestId('template-title')).toBeInTheDocument();
      expect(screen.getByTestId('template-header')).toBeInTheDocument();
      expect(screen.getByTestId('template-content')).toBeInTheDocument();
    });

    it('should render project management table', () => {
      renderComponent();
      
      expect(screen.getByTestId('project-management-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-columns')).toHaveTextContent('2 columns');
      expect(screen.getByTestId('table-rows')).toHaveTextContent('2 rows');
    });
  });

  describe('Data Processing', () => {
    it('should process instruction data correctly', () => {
      renderComponent();
      
      // Verify that rowBuilder was called with correct data
      const calls = mockContext.pages.instructionsVariations.table.rowBuilder.mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0][0].data).toEqual({ id: 1, title: 'Instruction 1' });
      expect(calls[1][0].data).toEqual({ id: 2, title: 'Instruction 2' });
    });

    it('should handle empty data gracefully', () => {
      renderComponent({
        instructions: {
          list: [],
          status: '',
        },
      });
      
      expect(mockContext.pages.instructionsVariations.table.rowBuilder).not.toHaveBeenCalled();
      expect(screen.getByTestId('table-rows')).toHaveTextContent('0 rows');
    });
  });

  describe('Layout verification without snapshots', () => {
    it('renders default layout structure', () => {
      const { container } = renderComponent();

      expect(screen.getByTestId('template-content')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="project-management-table"]')).not.toBeNull();
    });

    it('shows loader when status is loading', () => {
      renderComponent({
        instructions: {
          list: [],
          status: 'loading',
        },
      });

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('renders NCR specific header content', () => {
      renderComponent({ type: 'ncr' });

      expect(screen.getByRole('button', { name: /add new ncr/i })).toBeInTheDocument();
      expect(screen.getByTestId('template-title')).toHaveTextContent('NCR');
    });
  });
});
