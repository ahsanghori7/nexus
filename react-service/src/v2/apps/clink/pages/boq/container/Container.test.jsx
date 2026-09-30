import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import Container from './index';

// Mock dependencies
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      updateEntity: jest.fn((entity, data) => {
        return (dispatch) => {
          dispatch({ type: 'UPDATE_ENTITY', entity, data });
          return Promise.resolve({ type: 'UPDATE_ENTITY', entity, data });
        };
      }),
      fetchBoQList: jest.fn(() => (dispatch) => Promise.resolve({ type: 'FETCH_BOQ_LIST' })),
      setEditingMode: jest.fn(() => (dispatch) => Promise.resolve({ type: 'SET_EDITING_MODE' })),
    },
  })),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('v2/helpers/url', () => ({
  goToNewTab: jest.fn(),
}));

jest.mock('v2/hooks/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar: jest.fn(),
    closeSnackbar: jest.fn(),
    snackbar: { open: false, message: '', severity: 'info' },
  }),
}));

jest.mock('v2/apps/clink/pages/boq/upload', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, title, description, transform }) => (
      React.createElement('div', { 'data-testid': 'upload-component' },
        React.createElement('h3', { 'data-testid': 'upload-title' }, title),
        React.createElement('p', { 'data-testid': 'upload-description' }, description),
        transform && React.createElement('span', { 'data-testid': 'upload-transform' }, transform),
        children
      )
    ),
    UploadModal: ({ handleClick, setModal, modal, ButtonModal, children }) => {
      const [localModal, setLocalModal] = React.useState(modal || false);
      const currentModal = modal !== undefined ? modal : localModal;
      const currentSetModal = setModal || setLocalModal;
      
      return React.createElement('div', { 'data-testid': 'upload-modal' },
        React.createElement('div', { 
          onClick: handleClick || (() => currentSetModal(!currentModal))
        }, ButtonModal && React.createElement(ButtonModal, {
          handleButtonClick: handleClick || (() => currentSetModal(!currentModal))
        })),
        currentModal && children
      );
    },
    UploadButton: ({ startIcon, buttonContent, handleButtonClick }) => (
      React.createElement('button', { 
        'data-testid': 'upload-button', 
        onClick: handleButtonClick
      }, buttonContent)
    ),
    updateFunc: jest.fn((entity, dispatchFunc) => {
      return (entries = null) => {
        if (entity && dispatchFunc) {
          const defaultEntries = [
            { budget_rate: '100', budget_total: '500', quantity: '5' }
          ];
          const newEntries = entries?.length ? entries : defaultEntries;
          const data = {
            notes: {
              id: null,
              text: '',
            },
            entries: newEntries,
          };
          return dispatchFunc(entity, data);
        }
      }
    }),
  };
});

jest.mock('v2/apps/clink/pages/boq/smart-builder/SmartBoqBuilderCard', () => {
  const React = require('react');
  return function SmartBoqBuilderCard({ onOpen, disabled }) {
    return React.createElement(
      'button',
      {
        type: 'button',
        'data-testid': 'smart-boq-card',
        disabled,
        onClick: onOpen,
      },
      'smart-boq-card'
    );
  };
});

jest.mock('v2/apps/clink/pages/boq/start-from-scratch/StartFromScratchCard', () => {
  const React = require('react');
  return function StartFromScratchCard({ onStart, disabled }) {
    return React.createElement(
      'button',
      {
        type: 'button',
        'data-testid': 'start-from-scratch-card',
        disabled,
        onClick: onStart,
      },
      'boq-start-from-scratch'
    );
  };
});

jest.mock('v2/apps/clink/pages/boq/upload/file-content', () => {
  return function MockUploadModalContent({ updateEntity, setModal, units }) {
    return (
      <div data-testid="upload-modal-content">
        <p>Upload Modal Content</p>
        <button
          data-testid="update-entity-btn"
          onClick={() => updateEntity && updateEntity()}
        >
          Update Entity
        </button>
        <button
          data-testid="close-modal-btn"
          onClick={() => setModal && setModal(false)}
        >
          Close
        </button>
        <div data-testid="units-count">{units ? units.length : 0}</div>
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/boq/content', () => {
  return function MockContent({ contextType, entity, theme, slug, enable }) {
    return (
      <div data-testid="content-component">
        <div data-testid="content-context">{contextType}</div>
        <div data-testid="content-entity-id">{entity?.id}</div>
        <div data-testid="content-slug">{slug}</div>
        <div data-testid="content-enable">{enable.toString()}</div>
      </div>
    );
  };
});

// Mock store
const createMockStore = (initialState = {}, customDispatch = null) => {
  const rootReducer = (state = { boq: {}, ...initialState }, action) => {
    switch (action.type) {
      default:
        return state;
    }
  };
  const store = createStore(rootReducer, applyMiddleware(thunk));
  
  // Override dispatch if custom dispatch is provided
  if (customDispatch) {
    const originalDispatch = store.dispatch;
    store.dispatch = (action) => {
      // Call the custom dispatch (mockDispatch)
      const result = customDispatch(action);
      // Also call the original dispatch to update the store state if needed
      if (action && typeof action === 'object' && action.type) {
        originalDispatch(action);
      }
      return result;
    };
  }
  
  return store;
};

const theme = createTheme();

const defaultDispatch = jest.fn((action) => {
  // Handle thunk actions (functions)
  if (typeof action === 'function') {
    return action(defaultDispatch);
  }
  return Promise.resolve(action);
});

const defaultProps = {
  entity: null,
  slug: 'test-project',
  contextType: 'clink',
  theme: {},
  units: [
    { id: 1, name: 'meters' },
    { id: 2, name: 'pieces' },
  ],
  dispatch: defaultDispatch,
  enable: true,
};

const renderComponent = (props = {}) => {
  const { dispatch, ...otherProps } = props;
  const mergedProps = { ...defaultProps, ...otherProps };
  const packageId = mergedProps?.entity?.id;
  const store = createMockStore(
    {
      boq: {
        // Default to "known" AI state so the component doesn't render the new
        // general AI rehydration skeleton in tests that are asserting the cards UI.
        ...(packageId
          ? { aiGenerationById: { [packageId]: { status: 'NOT_FOUND' } } }
          : {}),
        uiLoading: {
          boqList: false,
          updateEntityById: {},
          newBoqResetById: {},
          aiPollById: {},
        },
        aiRehydrationSkippedById: {},
        aiGetPollStickyById: {},
      },
    },
    dispatch
  );

  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Container {...mergedProps} />
      </ThemeProvider>
    </Provider>
  );
};

describe('Container Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering with Empty Entity', () => {
    test('renders creation options when entity has no entries', () => {
      renderComponent();
      expect(screen.getByTestId('smart-boq-card')).toBeInTheDocument();
      expect(screen.getByTestId('start-from-scratch-card')).toBeInTheDocument();
      expect(screen.queryByText('boq-upload-item-list')).not.toBeInTheDocument();
      expect(screen.queryByText('step 1')).not.toBeInTheDocument();
      expect(screen.queryByText('step 2')).not.toBeInTheDocument();
    });

    test('does not render template upload section', () => {
      renderComponent();
      expect(screen.queryByText('boq-quick-upload')).not.toBeInTheDocument();
      expect(screen.queryByText('boq-template-desc')).not.toBeInTheDocument();
      expect(screen.queryByTestId('upload-button')).not.toBeInTheDocument();
    });

    test('renders start from scratch section', () => {
      renderComponent();
      expect(screen.getByTestId('start-from-scratch-card')).toBeInTheDocument();
    });
  });

  describe('Rendering with Existing Entity', () => {
    test('renders content component when entity has entries', () => {
      const entityWithEntries = {
        id: 1,
        entries: [
          { id: 1, description: 'Test item' },
        ],
      };
      renderComponent({ entity: entityWithEntries });
      
      expect(screen.getByTestId('content-component')).toBeInTheDocument();
      expect(screen.getByTestId('content-entity-id')).toHaveTextContent('1');
      expect(screen.getByTestId('content-context')).toHaveTextContent('clink');
      expect(screen.getByTestId('content-slug')).toHaveTextContent('test-project');
      expect(screen.getByTestId('content-enable')).toHaveTextContent('true');
    });

    test('passes correct props to content component', () => {
      const entityWithEntries = {
        id: 2,
        entries: [{ id: 1, description: 'Test item' }],
      };
      const props = {
        entity: entityWithEntries,
        contextType: 'prosper',
        slug: 'custom-slug',
        enable: true,
      };
      renderComponent(props);
      
      expect(screen.getByTestId('content-context')).toHaveTextContent('prosper');
      expect(screen.getByTestId('content-slug')).toHaveTextContent('custom-slug');
      expect(screen.getByTestId('content-enable')).toHaveTextContent('true');
    });

    test('does not render upload interface when entity has entries', () => {
      const entityWithEntries = {
        id: 1,
        entries: [{ id: 1, description: 'Test item' }],
      };
      renderComponent({ entity: entityWithEntries });
      
      expect(screen.queryByText('boq-upload-item-list')).not.toBeInTheDocument();
      expect(screen.queryByText('step 1')).not.toBeInTheDocument();
    });
  });

  describe('Start From Scratch', () => {
    test('handles start from scratch click', async () => {
      const mockDispatch = jest.fn((action) => {
        if (typeof action === 'function') {
          return action(mockDispatch);
        }
        return Promise.resolve(action);
      });
      const entity = { id: 1 };
      
      renderComponent({ entity, dispatch: mockDispatch });
      
      const { updateFunc } = require('v2/apps/clink/pages/boq/upload');
      fireEvent.click(screen.getByTestId('start-from-scratch-card'));
      
      expect(updateFunc).toHaveBeenCalledWith(entity, expect.any(Function));
    });

    test('handles start from scratch without entity', () => {
      renderComponent({ entity: null });
      
      const scratchButton = screen.getByTestId('start-from-scratch-card');
      fireEvent.click(scratchButton);
      
      expect(scratchButton).toBeInTheDocument();
    });
  });

  describe('Entity Updates', () => {
    test('invokes start from scratch handler when action button is clicked', async () => {
      const mockDispatch = jest.fn((action) => {
        if (typeof action === 'function') {
          return action(mockDispatch);
        }
        return Promise.resolve(action);
      });
      
      const entity = { id: 1 };
      renderComponent({ entity, dispatch: mockDispatch });
      
      const { updateFunc } = require('v2/apps/clink/pages/boq/upload');
      fireEvent.click(screen.getByTestId('start-from-scratch-card'));
      expect(updateFunc).toHaveBeenCalledWith(entity, expect.any(Function));
    });
  });

  describe('Props Variations', () => {
    test('handles different context types', () => {
      renderComponent({ contextType: 'prosper' });
      expect(screen.getByTestId('smart-boq-card')).toBeInTheDocument();
    });

    test('handles enable prop variations', () => {
      const entityWithEntries = {
        id: 1,
        entries: [{ id: 1, description: 'Test item' }],
      };
      
      // Test with enable: true
      const { rerender } = renderComponent({ 
        entity: entityWithEntries, 
        enable: true 
      });
      expect(screen.getByTestId('content-enable')).toHaveTextContent('true');
      
      // Test with enable: false
      rerender(
        <Provider store={createMockStore()}>
          <ThemeProvider theme={theme}>
            <Container {...defaultProps} entity={entityWithEntries} enable={false} />
          </ThemeProvider>
        </Provider>
      );
      expect(screen.queryByTestId('content-enable')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('handles entity with empty entries array', () => {
      const entity = { id: 1, entries: [] };
      renderComponent({ entity });
      
      expect(screen.getByTestId('smart-boq-card')).toBeInTheDocument();
      expect(screen.queryByTestId('content-component')).not.toBeInTheDocument();
    });

    test('handles entity with null entries', () => {
      const entity = { id: 1, entries: null };
      renderComponent({ entity });
      
      expect(screen.getByTestId('smart-boq-card')).toBeInTheDocument();
    });

    test('handles entity with undefined entries', () => {
      const entity = { id: 1 };
      renderComponent({ entity });
      
      expect(screen.getByTestId('smart-boq-card')).toBeInTheDocument();
    });

    test('renders content view when AI generation is ERROR (e.g. 500)', () => {
      const store = createMockStore({
        boq: {
          aiGenerationById: {
            1: { status: 'ERROR', error: 'Internal Server Error' },
          },
          aiRehydrationSkippedById: {},
        },
      });
      render(
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <Container {...defaultProps} entity={{ id: 1, entries: [] }} />
          </ThemeProvider>
        </Provider>
      );
      expect(screen.getByTestId('content-component')).toBeInTheDocument();
      expect(screen.queryByText('boq-upload-item-list')).not.toBeInTheDocument();
    });

    // Note: Error handling test removed - component doesn't currently implement error handling
    // This would be a good enhancement for the component to add .catch() to the promise chains
  });
});