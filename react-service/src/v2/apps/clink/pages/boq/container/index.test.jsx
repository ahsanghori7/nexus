import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import '@testing-library/jest-dom';
import Container, { buildGenerateBoqFormData } from './index';

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

jest.mock('v2/helpers/url', () => ({
  goToNewTab: jest.fn(),
}));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      updateEntity: jest.fn(() => Promise.resolve()),
      fetchBoQList: jest.fn(() => Promise.resolve()),
      setEditingMode: jest.fn(() => Promise.resolve()),
      fetchGenerateBoqStatus: jest.fn(() => Promise.resolve()),
    },
  }),
}));

// Mock child components
jest.mock('v2/apps/clink/pages/boq/upload', () => ({
  __esModule: true,
  default: ({ title, description, children, transform }) => (
    <div data-testid="upload-component" data-transform={transform}>
      <div>{title}</div>
      <div>{description}</div>
      {children}
    </div>
  ),
  UploadModal: ({ children, handleClick, ButtonModal }) => (
    <div data-testid="upload-modal">
      <ButtonModal handleButtonClick={handleClick} />
      {children}
    </div>
  ),
  UploadButton: ({ buttonContent, handleButtonClick, startIcon }) => (
    <button onClick={handleButtonClick} data-testid="upload-button">
      {startIcon && <span data-testid="button-icon" />}
      {buttonContent}
    </button>
  ),
  updateFunc: jest.fn(() => jest.fn()),
}));

jest.mock('v2/apps/clink/pages/boq/upload/file-content', () => {
  return function UploadModalContent(props) {
    return <div data-testid="upload-modal-content" {...props} />;
  };
});

jest.mock('v2/apps/clink/pages/boq/content', () => {
  return function Content(props) {
    return <div data-testid="content-component" {...props} />;
  };
});

jest.mock('v2/apps/clink/pages/boq/smart-builder/SmartBoqBuilderCard', () => {
  return function SmartBoqBuilderCard({ onOpen, disabled }) {
    return (
      <button type="button" data-testid="smart-boq-card" disabled={disabled} onClick={onOpen}>
        smart-boq-card
      </button>
    );
  };
});

jest.mock('v2/apps/clink/pages/boq/start-from-scratch/StartFromScratchCard', () => {
  return function StartFromScratchCard({ onStart, disabled }) {
    return (
      <button
        type="button"
        data-testid="start-from-scratch-card"
        disabled={disabled}
        onClick={onStart}
      >
        start-from-scratch-card
      </button>
    );
  };
});

jest.mock('v2/hooks/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar: jest.fn(),
    closeSnackbar: jest.fn(),
    snackbar: { open: false, message: '', severity: 'info' },
  }),
}));

jest.mock('./containerStyles', () => ({
  cardItemProps: {},
  creationCardPaperProps: {},
  Container: ({ children }) => <div data-testid="main-container">{children}</div>,
}));

jest.mock('v2/apps/clink/pages/tender-analysis/styled/mui', () => ({
  Item: ({ children, itemProps, paperProps }) => (
    <div data-testid="item-component" data-item-props={JSON.stringify(itemProps)}>
      {children}
    </div>
  ),
}));

// Create a simple reducer for testing
const initialState = {
  boq: {
    entities: [],
    loading: false,
    units: [],
    // Default to a "known" AI status so tests that assert the cards UI don't
    // hit the AI rehydration skeleton by default.
    aiGenerationById: { 1: { status: 'NOT_FOUND' } },
    uiLoading: { boqList: false, updateEntityById: {}, newBoqResetById: {}, aiPollById: {} },
    aiRehydrationSkippedById: {},
    aiGetPollStickyById: {},
  },
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    default:
      return state;
  }
};

describe('Container', () => {
  let store;

  beforeEach(() => {
    store = createStore(reducer);
  });

  const defaultProps = {
    entity: null,
    slug: 'test-slug',
    contextType: 'clink',
    theme: {},
    units: [],
    enable: true,
  };

  const renderWithProvider = (props = {}, preloadedState = null) => {
    if (preloadedState) {
      store = createStore(reducer, preloadedState);
    }
    return render(
      <Provider store={store}>
        <Container {...defaultProps} {...props} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderWithProvider();
    expect(screen.getByTestId('main-container')).toBeInTheDocument();
  });

  it('renders Content component when entity has entries', () => {
    const entityWithEntries = {
      id: 1,
      entries: [{ id: 1, name: 'Test Entry' }],
    };

    renderWithProvider({ entity: entityWithEntries });
    
    expect(screen.getByTestId('content-component')).toBeInTheDocument();
    expect(screen.queryByText('boq-upload-item-list')).not.toBeInTheDocument();
  });

  it('renders creation options when entity has no entries', () => {
    const entityWithoutEntries = {
      id: 1,
      entries: [],
    };

    renderWithProvider({ entity: entityWithoutEntries });
    
    expect(screen.getByTestId('smart-boq-card')).toBeInTheDocument();
    expect(screen.getByTestId('start-from-scratch-card')).toBeInTheDocument();
    expect(screen.queryByText('boq-upload-item-list')).not.toBeInTheDocument();
    expect(screen.queryByText('boq-quick-upload')).not.toBeInTheDocument();
  });

  it('renders creation options when entity is null', () => {
    renderWithProvider({ entity: null });
    
    expect(screen.getByTestId('smart-boq-card')).toBeInTheDocument();
    expect(screen.getByTestId('start-from-scratch-card')).toBeInTheDocument();
    expect(screen.queryByText('boq-upload-item-list')).not.toBeInTheDocument();
  });

  it('passes correct props to Content component', () => {
    const entityWithEntries = {
      id: 1,
      entries: [{ id: 1, name: 'Test Entry' }],
    };

    const props = {
      entity: entityWithEntries,
      contextType: 'test-context',
      theme: { test: 'theme' },
      slug: 'test-slug',
      enable: true,
    };

    renderWithProvider(props);
    
    const contentComponent = screen.getByTestId('content-component');
    expect(contentComponent).toBeInTheDocument();
  });

  it('renders start from scratch card', () => {
    const entityWithoutEntries = {
      id: 1,
      entries: [],
    };

    renderWithProvider({ entity: entityWithoutEntries });
    
    expect(screen.getByTestId('smart-boq-card')).toBeInTheDocument();
    expect(screen.getByTestId('start-from-scratch-card')).toBeInTheDocument();
  });

  it('delegates Smart BoQ Builder open to the page-level handler', () => {
    const onOpenSmartBoqBuilder = jest.fn();
    const entityWithoutEntries = {
      id: 1,
      entries: [],
      tender: { label: '3D Modelling' },
    };

    renderWithProvider({
      entity: entityWithoutEntries,
      onOpenSmartBoqBuilder,
    });

    fireEvent.click(screen.getByTestId('smart-boq-card'));
    expect(onOpenSmartBoqBuilder).toHaveBeenCalledWith(entityWithoutEntries);
  });

  it('shows AI rehydration skeleton when SUCCESS has no cached result (refetch ai/generate-boq)', () => {
    const entityWithoutEntries = { id: 17, tender_id: 17, entries: [], nextEntries: [] };
    renderWithProvider(
      { entity: entityWithoutEntries },
      {
        boq: {
          aiGenerationById: {
            17: { status: 'SUCCESS', result: null },
          },
          aiRehydrationSkippedById: {},
          aiGetPollStickyById: {},
          uiLoading: { boqList: false, updateEntityById: {}, newBoqResetById: {}, aiPollById: {} },
        },
      }
    );
    expect(screen.getByTestId('boq-ai-page-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('boq-upload-item-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('content-component')).not.toBeInTheDocument();
  });

  it('shows content view when AI is SUCCESS and has a result', () => {
    const entityWithoutEntries = { id: 17, tender_id: 17, entries: [], nextEntries: [] };
    renderWithProvider(
      { entity: entityWithoutEntries },
      {
        boq: {
          aiGenerationById: {
            17: { status: 'SUCCESS', result: { entries: [] } },
          },
        },
      }
    );
    expect(screen.getByTestId('content-component')).toBeInTheDocument();
  });

  it('shows content view when AI is FAILURE', () => {
    const entityWithoutEntries = { id: 17, tender_id: 17, entries: [], nextEntries: [] };
    renderWithProvider(
      { entity: entityWithoutEntries },
      {
        boq: {
          aiGenerationById: {
            17: { status: 'FAILURE' },
          },
        },
      }
    );
    expect(screen.getByTestId('content-component')).toBeInTheDocument();
  });
});

describe('buildGenerateBoqFormData', () => {
  // packageId is also sent as the URL path segment by generateBoqWithAI's thunk
  // (`ai/generate-boq/${packageId}` in asyncThunk.js) — package_id here is the
  // duplicate form field the QSAI-bound payload also expects.
  const file = new File(['abc'], 'boq.xlsx');

  it('always sends boq_files/package_name/package_id/processing_type', () => {
    const formData = buildGenerateBoqFormData({
      file,
      packageName: 'Groundworks Package',
      packageId: 196,
    });

    expect(formData.get('boq_files')).toBe(file);
    expect(formData.has('boq_files[]')).toBe(false);
    expect(formData.get('package_name')).toBe('Groundworks Package');
    expect(formData.get('package_id')).toBe('196');
    expect(formData.get('processing_type')).toBe('NORMALISATION');
    expect(JSON.parse(formData.get('selected_sheets'))).toEqual([]);
  });

  it('sends selected_sheets as a JSON array when sheets are provided', () => {
    const formData = buildGenerateBoqFormData({
      file,
      selectedSheets: ['Bill 1', 'Bill 2'],
      packageName: 'Groundworks Package',
      packageId: 196,
    });

    expect(JSON.parse(formData.get('selected_sheets'))).toEqual(['Bill 1', 'Bill 2']);
  });

  it('sends selected_sheets as an empty JSON array when no sheets are provided', () => {
    const formData = buildGenerateBoqFormData({
      file,
      selectedSheets: [],
      packageName: 'Groundworks Package',
      packageId: 196,
    });

    expect(JSON.parse(formData.get('selected_sheets'))).toEqual([]);
  });
});