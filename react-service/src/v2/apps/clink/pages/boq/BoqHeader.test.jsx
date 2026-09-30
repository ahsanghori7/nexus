import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { BoqHeader } from './BoqHeader';

// Mock the navigation hooks
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Mock lodash isEqual
jest.mock('lodash/isEqual', () => jest.fn((a, b) => JSON.stringify(a) === JSON.stringify(b)));

// Mock components that might cause issues
jest.mock('./add', () => {
  return function Add({ navigateAfterAdding }) {
    return (
      <div data-testid="add-component">
        <button onClick={() => navigateAfterAdding(123)} data-testid="navigate-after-adding">
          Add Component
        </button>
      </div>
    );
  };
});

jest.mock('./add/Empty', () => {
  return function Empty({ hasEntities }) {
    return (
      <div data-testid="empty-component">
        Empty Component {hasEntities ? 'with entities' : 'without entities'}
      </div>
    );
  };
});

jest.mock('./add/Tab', () => ({
  __esModule: true,
  default: function AddTab({ handleTabClick, sx }) {
    return (
      <div data-testid="add-tab" style={sx}>
        <button onClick={() => handleTabClick('add')}>Add Tab</button>
      </div>
    );
  },
  ADD_LABEL: 'Add',
}));

jest.mock('./summary/Tab', () => ({
  __esModule: true,
  default: function SummaryTab({ handleTabClick, sx }) {
    return (
      <div data-testid="summary-tab" style={sx}>
        <button onClick={() => handleTabClick('summary')}>Summary Tab</button>
      </div>
    );
  },
  SUMMARY_LABEL: 'Summary',
}));

jest.mock('./summary', () => {
  return function Summary({ theme, navigate }) {
    return (
      <div data-testid="summary-component">
        Summary Component {theme}
        <button onClick={() => navigate('test')}>Navigate</button>
      </div>
    );
  };
});

jest.mock('v2/apps/shared/components/Loading', () => {
  return function Loading({ status }) {
    return <div data-testid="loading-component">Loading: {status}</div>;
  };
});

jest.mock('v2/apps/clink/pages/orders/subcontractors/modal', () => {
  return function Modal({ open, setOpen }) {
    return open ? (
      <div data-testid="modal-component">
        Modal
        <button onClick={() => setOpen(false)} data-testid="modal-close">
          Close
        </button>
        <button onClick={open.handleAccept} data-testid="modal-accept">
          Accept
        </button>
      </div>
    ) : null;
  };
});

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      generateBoqWithAI: jest.fn(),
    },
  }),
}));

jest.mock('v2/apps/clink/pages/boq/smart-builder/SmartBoqBuilderModal', () => {
  return function SmartBoqBuilderModal() {
    return null;
  };
});

jest.mock('./container', () => ({
  __esModule: true,
  default: function MockBoqContainer({ enable }) {
    return (
      <div data-testid="tab-boq-container" data-enable={String(enable)}>
        mock
      </div>
    );
  },
}));

const mockBoqTab = (label, tid, entityId) => ({
  label,
  tid,
  entity: { id: entityId, tender: { id: tid, label } },
  slug: 'test-slug',
  theme: {},
  units: [],
  projectStatuses: [],
});

const renderBoqHeader = (props = {}) => {
  const defaultProps = {
    data: null,
    tabsArray: [],
    currentTender: null,
    slug: 'test-slug',
    myRef: { current: { click: jest.fn() } },
    entities: [],
    reset: jest.fn(),
    hasEntities: false,
    loading: null,
    dispatch: jest.fn(() => Promise.resolve()),
    contextType: 'clink',
    ...props,
  };

  return render(
    <MemoryRouter>
      <BoqHeader {...defaultProps} />
    </MemoryRouter>
  );
};

describe('BoqHeader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ tid: null });
  });

  it('renders without crashing', () => {
    renderBoqHeader();
    expect(screen.getByTestId('summary-tab')).toBeInTheDocument();
    expect(screen.getByTestId('add-tab')).toBeInTheDocument();
  });

  it('shows loading state when loading message is provided', () => {
    renderBoqHeader({
      loading: { message: 'Loading data...' },
    });
    expect(screen.getByTestId('loading-component')).toHaveTextContent('Loading: Loading data...');
  });

  it('renders tabs when tabsArray is provided', () => {
    const tabsArray = [
      mockBoqTab('Tab 1', 1, 101),
      mockBoqTab('Tab 2', 2, 102),
    ];
    renderBoqHeader({ tabsArray, hasEntities: true });
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  it('handles summary tab click', () => {
    renderBoqHeader({ hasEntities: true });
    
    const summaryButton = screen.getByText('Summary Tab');
    fireEvent.click(summaryButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/main-contractor/project/test-slug/boq/summary');
  });

  it('handles add tab click', () => {
    const myRef = { current: { click: jest.fn() } };
    renderBoqHeader({ myRef });
    
    const addButton = screen.getByText('Add Tab');
    fireEvent.click(addButton);
    
    expect(myRef.current.click).toHaveBeenCalled();
  });

  it('shows summary component when hasEntities is true and extraTabValue is summary', () => {
    mockUseParams.mockReturnValue({ tid: 'summary' });
    renderBoqHeader({ hasEntities: true });
    
    expect(screen.getByTestId('summary-component')).toBeInTheDocument();
  });

  it('shows empty component when hasEntities is false', () => {
    renderBoqHeader({ hasEntities: false });
    
    expect(screen.getByTestId('empty-component')).toHaveTextContent('without entities');
  });

  it('renders Add component when data is provided', () => {
    const data = { id: 1, name: 'Test Data' };
    renderBoqHeader({ data });
    
    expect(screen.getByTestId('add-component')).toBeInTheDocument();
  });

  it('handles navigateAfterAdding', () => {
    const data = { id: 1, name: 'Test Data' };
    renderBoqHeader({ data });
    
    const navigateButton = screen.getByTestId('navigate-after-adding');
    fireEvent.click(navigateButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/main-contractor/project/test-slug/boq/123');
  });

  it('sets scroll properties for many tabs', () => {
    const tabsArray = Array.from({ length: 6 }, (_, i) =>
      mockBoqTab(`Tab ${i + 1}`, i + 1, 200 + i)
    );
    
    renderBoqHeader({ tabsArray, hasEntities: true });
    
    // Should render all tabs despite having many
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 6')).toBeInTheDocument();
  });

  it('renders tab content when entities are present and no extraTabValue', () => {
    const tabsArray = [mockBoqTab('Tab 1', 1, 10)];
    const entities = [
      { tender: { id: 1 }, tender_id: 1 },
    ];
    
    renderBoqHeader({ 
      tabsArray, 
      entities, 
      hasEntities: true,
      currentTender: { id: 1 },
    });
    
    const panel = screen.getByTestId('tab-boq-container');
    expect(panel).toHaveAttribute('data-enable', 'true');
  });

  it('handles different parameter scenarios', () => {
    // Test various parameter combinations
    mockUseParams.mockReturnValue({ tid: 'add' });
    const { rerender } = renderBoqHeader({ hasEntities: false });
    expect(screen.getByTestId('empty-component')).toBeInTheDocument();
    
    // Test with different tender param
    mockUseParams.mockReturnValue({ tid: 'summary' });
    rerender(
      <MemoryRouter>
        <BoqHeader 
          data={null}
          tabsArray={[]}
          currentTender={null}
          slug="test-slug"
          myRef={{ current: { click: jest.fn() } }}
          entities={[]}
          reset={jest.fn()}
          hasEntities={true}
          loading={null}
        />
      </MemoryRouter>
    );
    expect(screen.getByTestId('summary-component')).toBeInTheDocument();
  });

  it('handles entities and currentTender relationship', () => {
    const entities = [
      { tender: { id: 1 }, tender_id: 1 },
      { tender: { id: 2 }, tender_id: 2 },
    ];
    const currentTender = { id: 1 };
    
    renderBoqHeader({ 
      entities, 
      currentTender,
      hasEntities: true,
    });
    
    expect(screen.getByTestId('summary-tab')).toBeInTheDocument();
  });

  it('handles empty states correctly', () => {
    renderBoqHeader({
      tabsArray: [],
      entities: [],
      currentTender: null,
      hasEntities: false,
    });
    
    expect(screen.getByTestId('empty-component')).toBeInTheDocument();
  });
});