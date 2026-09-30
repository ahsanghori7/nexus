import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import '@testing-library/jest-dom';
import Menu from './Menu';

// Mock dependencies
jest.mock('services/clinkHelpers', () => ({
  fetchData: jest.fn(),
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      changeCompliance: jest.fn(),
    },
  })),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isExternal: jest.fn(() => false),
  }));
});

jest.mock('v1/global/helpers/getPrequalDoc', () => jest.fn());
jest.mock('v1/global/services/Relay', () => jest.fn());
jest.mock('services/httpHelper', () => jest.fn());
jest.mock('v2/helpers/url', () => ({
  goToNewTab: jest.fn(),
}));

// Create mock store
const createMockStore = () => {
  return createStore(() => ({}));
};

describe('Menu', () => {
  const mockQuoteInfo = {
    id: 123,
    tender_id: 456,
    compliant: 1,
    subcontractor: {
      id: 789,
      type_id: 2,
      name: 'Test Subcontractor',
    },
  };

  const mockEntity = { id: 101 };
  const mockPid = 202;
  const mockStore = createMockStore();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithStore = (component) => {
    return render(
      <Provider store={mockStore}>
        {component}
      </Provider>
    );
  };

  it('renders menu button', () => {
    renderWithStore(
      <Menu
        quoteInfo={mockQuoteInfo}
        pid={mockPid}
        entity={mockEntity}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens menu when button is clicked', () => {
    renderWithStore(
      <Menu
        quoteInfo={mockQuoteInfo}
        pid={mockPid}
        entity={mockEntity}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('mui-menu')).toBeInTheDocument();
  });

  it('displays menu options when opened', () => {
    renderWithStore(
      <Menu
        quoteInfo={mockQuoteInfo}
        pid={mockPid}
        entity={mockEntity}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('view-prequalification-document')).toBeInTheDocument();
    expect(screen.getByText('mark-as-non-compliant')).toBeInTheDocument();
    expect(screen.getByText('download-quote-revision')).toBeInTheDocument();
  });

  it('shows correct compliance toggle text when compliant', () => {
    renderWithStore(
      <Menu
        quoteInfo={mockQuoteInfo}
        pid={mockPid}
        entity={mockEntity}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('mark-as-non-compliant')).toBeInTheDocument();
  });

  it('shows correct compliance toggle text when non-compliant', () => {
    const nonCompliantQuote = { ...mockQuoteInfo, compliant: 0 };
    
    renderWithStore(
      <Menu
        quoteInfo={nonCompliantQuote}
        pid={mockPid}
        entity={mockEntity}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('mark-as-compliant')).toBeInTheDocument();
  });

  it('closes menu when option is clicked', () => {
    renderWithStore(
      <Menu
        quoteInfo={mockQuoteInfo}
        pid={mockPid}
        entity={mockEntity}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const menuItem = screen.getByText('view-prequalification-document');
    fireEvent.click(menuItem);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('handles missing subcontractor', () => {
    const quoteWithoutSubcontractor = { ...mockQuoteInfo, subcontractor: {} };
    
    renderWithStore(
      <Menu
        quoteInfo={quoteWithoutSubcontractor}
        pid={mockPid}
        entity={mockEntity}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    renderWithStore(
      <Menu
        quoteInfo={{
          id: 123,
          subcontractor: {
            id: 1,
            type_id: 2
          }
        }}
        pid={0}
        entity={{}}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});