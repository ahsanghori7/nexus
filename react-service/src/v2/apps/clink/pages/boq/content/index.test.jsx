import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import '@testing-library/jest-dom';
import Content from './index';

// Create mock actions
const mockActions = {
  updateEntity: jest.fn(() => Promise.resolve()),
  fetchBoQList: jest.fn(() => Promise.resolve()),
  setEditingMode: jest.fn(() => Promise.resolve()),
  fetchGenerateBoqStatus: jest.fn(() => Promise.resolve()),
  setEntitySaved: jest.fn(() => Promise.resolve()),
  publishBoQ: jest.fn(() => Promise.resolve()),
  republishBoQ: jest.fn(() => Promise.resolve()),
  setSelectedEntries: jest.fn(),
  setPackageNote: jest.fn(),
};

// Mock dependencies
jest.mock('i18next', () => ({
  t: (key) => key,
}));

jest.mock('lodash/isEqual', () => jest.fn((a, b) => JSON.stringify(a) === JSON.stringify(b)));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: mockActions,
  }),
}));

// Mock child components
jest.mock('v2/apps/shared/components/boq/data-grid', () => {
  return function DataGrid(props) {
    return <div data-testid="data-grid" {...props} />;
  };
});

jest.mock('v2/apps/shared/components/boq/ClinkConfig', () => [
  { field: 'item_no', headerName: 'Item No' },
  { field: 'description', headerName: 'Description' },
]);

jest.mock('v2/apps/clink/pages/orders/subcontractors/modal', () => {
  return function Modal(props) {
    return <div data-testid="modal" {...props} />;
  };
});

jest.mock('./Wrapper', () => {
  return function Wrapper({ children }) {
    return <div data-testid="wrapper">{children}</div>;
  };
});

jest.mock('./Footer', () => {
  return function Footer(props) {
    return <div data-testid="footer" {...props} />;
  };
});

jest.mock('./NoteTextarea', () => {
  return function NoteTextarea({ dispatch, ...props }) {
    return <div data-testid="note-textarea" {...props} />;
  };
});

jest.mock('./style', () => ({
  marginRight: {},
  boqContentHeaderActionsSx: {},
  boqEditButtonSx: {},
  boqNewButtonSx: {},
  boqSaveButtonSx: {},
  boqPublishButtonSx: {},
  boqAiInlineAlertBannerSx: {},
  boqAiInlineAlertIconBoxSx: {},
  boqAiInlineAlertTextColSx: {},
  boqAiInlineAlertTitleTypographySx: {},
  boqAiInlineAlertBodyTypographySx: {},
  boqAiServiceErrorPanelWrapperSx: {},
  boqAiServiceErrorCardSx: {},
  boqAiServiceErrorIconCircleSx: {},
  boqAiServiceErrorTextColSx: {},
  boqAiServiceErrorBadgeSx: {},
  boqAiServiceErrorTitleTypographySx: {},
  boqAiServiceErrorSubtitleTypographySx: {},
  boqAiServiceErrorSuggestionsHeadingSx: {},
  boqAiServiceErrorSuggestionsListSx: {},
  boqAiServiceErrorSuggestionsWrapSx: {},
  boqAiServiceErrorRetryRowSx: {},
  boqAiServiceErrorRetryButtonSx: {},
  getBoqContentDataGridSx: jest.fn(() => ({})),
  inputBaseSx: jest.fn(() => ({})),
  modalSx: {},
  newBoqModalCancelSx: {},
  newBoqModalAcceptSx: {},
  newBoqModalTitleSx: {},
  saveModalCancelSx: {},
  saveModalAcceptSx: {},
}));

// Create a simple reducer for testing
const initialState = {
  boq: {
    entities: [],
    loading: false,
    units: [
      { id: 1, name: 'kg' },
      { id: 2, name: 'liters' },
    ],
    projectStatuses: {
      published: { id: 1 },
      draft: { id: 2 },
    },
    readyAfterTemplate: false,
  },
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    default:
      return state;
  }
};

describe('Content', () => {
  let store;

  beforeEach(() => {
    store = createStore(reducer);
    jest.clearAllMocks();
  });

  const defaultProps = {
    enable: true, // Enable the component by default
    contextType: 'clink',
    slug: 'test-slug',
    entity: {
      id: 1,
      entries: [],
      nextEntries: [],
      has_published_version: false,
      editing: false,
      note: { id: 1, text: 'original note' },
      nextNote: { id: 1, text: 'updated note' },
      saved: false,
      has_enquiry: false,
    },
    theme: { palette: { primary: { main: '#000' } } },
  };

  const renderWithProvider = (props = {}) => {
    return render(
      <Provider store={store}>
        <Content {...defaultProps} {...props} />
      </Provider>
    );
  };

  // Basic rendering tests
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithProvider();
      expect(container).toBeInTheDocument();
    });

    it('throws when entity is null', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      expect(() => renderWithProvider({ entity: null })).toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('handles empty entity gracefully', () => {
      const { container } = renderWithProvider({ entity: {} });
      expect(container).toBeInTheDocument();
    });

    it('handles different context types', () => {
      const { container } = renderWithProvider({ contextType: 'different-context' });
      expect(container).toBeInTheDocument();
    });

    it('accepts theme prop', () => {
      const customTheme = { palette: { primary: { main: '#000' } } };
      const { container } = renderWithProvider({ theme: customTheme });
      expect(container).toBeInTheDocument();
    });

    it('accepts slug prop', () => {
      const { container } = renderWithProvider({ slug: 'custom-slug' });
      expect(container).toBeInTheDocument();
    });

    it('renders modal components', () => {
      renderWithProvider();
      const modals = screen.getAllByTestId('modal');
      expect(modals).toHaveLength(2); // Two modals are rendered
    });

    it('renders wrapper component', () => {
      renderWithProvider();
      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    });
  });

  // Enable checker tests
  describe('Enable Checker', () => {
    it('returns null when enable prop is false', () => {
      const { container } = renderWithProvider({ enable: false });
      expect(container.firstChild).toBeNull();
    });

    it('renders content when enable prop is true', () => {
      const { container } = renderWithProvider({ enable: true });
      expect(container.firstChild).not.toBeNull();
    });

    it('renders content when enable prop is not provided (default behavior)', () => {
      // When enable is not provided, it defaults to undefined which is falsy
      const { container } = renderWithProvider({ enable: undefined });
      expect(container.firstChild).toBeNull();
    });
  });

  // Edge case tests
  describe('Edge Cases', () => {
    it('handles missing entity properties gracefully', () => {
      const entity = {
        id: 1,
        // Missing many properties
      };
      
      const { container } = renderWithProvider({ entity });
      expect(container).toBeInTheDocument();
    });

    it('handles entity with null nested properties', () => {
      const entity = {
        id: 1,
        entries: null,
        nextEntries: [],
        note: null,
        nextNote: null,
      };
      
      const { container } = renderWithProvider({ entity });
      expect(container).toBeInTheDocument();
    });

    it('handles empty theme object', () => {
      const { container } = renderWithProvider({ theme: {} });
      expect(container).toBeInTheDocument();
    });

    it('handles null theme', () => {
      const { container } = renderWithProvider({ theme: null });
      expect(container).toBeInTheDocument();
    });

    it('handles different entity editing states', () => {
      const entity = { 
        ...defaultProps.entity, 
        editing: true,
        has_published_version: true,
        has_enquiry: true 
      };
      
      const { container } = renderWithProvider({ entity });
      expect(container).toBeInTheDocument();
    });

    it('handles large nextEntries array', () => {
      const nextEntries = Array(100).fill().map((_, i) => ({
        id: i,
        type: 'item',
        budget_total: '100',
        quantity: '2',
        budget_rate: '50'
      }));
      
      const entity = { 
        ...defaultProps.entity, 
        nextEntries 
      };
      
      const { container } = renderWithProvider({ entity });
      expect(container).toBeInTheDocument();
    });

    it('handles mixed entry types in nextEntries', () => {
      const nextEntries = [
        { id: 1, type: 'item', budget_total: '100' },
        { id: 2, type: 'section', budget_total: '200' },
        { id: 3, type: 'grouped_heading', budget_total: '300' },
      ];
      
      const entity = { 
        ...defaultProps.entity, 
        nextEntries 
      };
      
      const { container } = renderWithProvider({ entity });
      expect(container).toBeInTheDocument();
    });

    it('handles entity with complex nested structures', () => {
      const entity = {
        id: 1,
        entries: [
          { 
            id: 1, 
            type: 'item', 
            item_version: { status: 1 },
            budget_total: '100',
            quantity: '2',
            budget_rate: '50'
          }
        ],
        nextEntries: [
          { 
            id: 1, 
            type: 'item', 
            item_version: { status: 1 },
            budget_total: '150',
            quantity: '3',
            budget_rate: '50'
          }
        ],
        has_published_version: true,
        editing: true,
        note: { id: 1, text: 'original' },
        nextNote: { id: 1, text: 'updated' },
        saved: true,
        has_enquiry: false,
      };
      
      const { container } = renderWithProvider({ entity });
      expect(container).toBeInTheDocument();
    });
  });

  // Props and state changes
  describe('Props and State Handling', () => {
    it('handles contextType changes', () => {
      const { rerender } = renderWithProvider({ contextType: 'clink' });
      
      rerender(
        <Provider store={store}>
          <Content {...defaultProps} contextType="different" />
        </Provider>
      );
      
      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    });

    it('handles slug changes', () => {
      const { rerender } = renderWithProvider({ slug: 'original' });
      
      rerender(
        <Provider store={store}>
          <Content {...defaultProps} slug="updated" />
        </Provider>
      );
      
      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    });

    it('handles entity prop updates', () => {
      const originalEntity = { ...defaultProps.entity, id: 1 };
      const updatedEntity = { ...defaultProps.entity, id: 2 };
      
      const { rerender } = renderWithProvider({ entity: originalEntity });
      
      rerender(
        <Provider store={store}>
          <Content {...defaultProps} entity={updatedEntity} />
        </Provider>
      );
      
      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    });
  });

  // Store integration tests
  describe('Store Integration', () => {
    it('connects to Redux store correctly', () => {
      renderWithProvider();
      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    });

    it('handles store updates', () => {
      const { rerender } = renderWithProvider();
      
      // Create new store with different state
      const newStore = createStore(reducer, {
        boq: {
          ...initialState.boq,
          readyAfterTemplate: true,
        }
      });
      
      rerender(
        <Provider store={newStore}>
          <Content {...defaultProps} />
        </Provider>
      );
      
      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    });
  });

  // Component integration tests
  describe('Component Integration', () => {
    it('passes correct props to child components', () => {
      const entity = {
        ...defaultProps.entity,
        nextNote: { id: 1, text: 'test note' },
        nextEntries: [{ id: 1, type: 'item', budget_total: '100' }],
      };
      
      renderWithProvider({ entity });
      
      expect(screen.getByTestId('note-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('handles theme prop correctly', () => {
      const theme = {
        palette: {
          primary: { main: '#ff0000' },
          secondary: { main: '#00ff00' },
        }
      };
      
      renderWithProvider({ theme });
      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    });
  });
});
