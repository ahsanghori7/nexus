import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SupplyChain from './index';

jest.mock('v1/global', () => {});
jest.mock('v1/supply-chain-v2/public/styles/index.scss', () => {}); 

jest.mock('@mui/material', () => ({
  Box: ({ children, ...props }) => <div {...props}>{children}</div>,
  Typography: ({ children, ...props }) => <span {...props}>{children}</span>,
  FormControl: ({ children, ...props }) => <div {...props}>{children}</div>,
  Autocomplete: ({ renderInput, ...props }) =>
    renderInput ? renderInput({ inputProps: {}, InputProps: {} }) : null,
  TextField: ({ ...props }) => <input {...props} />,
  Chip: ({ label, onDelete, ...props }) => (
    <span {...props}>{label}</span>
  ),
  Checkbox: ({ checked, onChange, ...props }) => (
    <input type="checkbox" checked={checked} onChange={onChange} {...props} />
  ),
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Select: ({ children, ...props }) => <select {...props}>{children}</select>,
  MenuItem: ({ children, value, ...props }) => (
    <option value={value} {...props}>{children}</option>
  ),
  Skeleton: ({ ...props }) => <div {...props} />,
  Stack: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

jest.mock('v2/constants/colors', () => ({
  clinkBlack: '#000',
  clinkGreenHover: '#4cc0ad',
  clinkLightGray: '#ccc',
  mutedGray: '#999',
}));

jest.mock('react-bootstrap/Alert', () =>
  function MockAlert({ children }) {
    return <div role="alert">{children}</div>;
  },
);

jest.mock('v2/apps/shared/components/demo-button', () => () => null);

jest.mock('v1/global/components/general-ui/Buttons', () =>
  function MockGreenButton({ label, handleClick, onClick }) {
    return <button onClick={handleClick || onClick}>{label}</button>;
  },
);

jest.mock('../../../global/components/layout/panel', () =>
  function MockPanel({ children, header, extra, className }) {
    return (
      <div className={className}>
        {extra}
        {header}
        {children}
      </div>
    );
  },
);

jest.mock('../../services', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    filterRepeatValues: (arr) => arr || [],
  })),
  dedupeAttributeOptions: (options) => options || [],
}));

jest.mock('./header', () => ({
  SubcontractorModal: () => <button>Add subcontractor</button>,
}));

jest.mock('./Container', () => () => <div data-testid="mock-container" />);

jest.mock('./Search', () => () => <div data-testid="mock-search" />);

jest.mock('v2/apps/shared/components/InfoModal', () => () => null);

jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: jest.fn().mockResolvedValue(new Blob()),
}));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchAll: jest.fn().mockReturnValue({ type: 'FETCH_ALL' }),
      addData: jest.fn().mockReturnValue({ type: 'ADD_DATA' }),
      editData: jest.fn().mockReturnValue({ type: 'EDIT_DATA' }),
      removeData: jest.fn().mockReturnValue({ type: 'REMOVE_DATA' }),
      setTerm: jest.fn().mockReturnValue({ type: 'SET_TERM' }),
      setPaginationRowsPerPage: jest.fn().mockReturnValue({ type: 'SET_PER_PAGE' }),
      setOffset: jest.fn().mockReturnValue({ type: 'SET_OFFSET' }),
      setOrder: jest.fn().mockReturnValue({ type: 'SET_ORDER' }),
      setDesc: jest.fn().mockReturnValue({ type: 'SET_DESC' }),
      setPaginationPage: jest.fn().mockReturnValue({ type: 'SET_PAGE' }),
      resetProject: jest.fn().mockReturnValue({ type: 'RESET' }),
      resetQuotesTender: jest.fn().mockReturnValue({ type: 'RESET' }),
      restartOrders: jest.fn().mockReturnValue({ type: 'RESET' }),
      restartProcurement: jest.fn().mockReturnValue({ type: 'RESET' }),
      setBreadcrumbs: jest.fn().mockReturnValue({ type: 'RESET' }),
      setProjectName: jest.fn().mockReturnValue({ type: 'RESET' }),
      setSlug: jest.fn().mockReturnValue({ type: 'RESET' }),
      getPrequalificationStatuses: jest.fn().mockReturnValue({ type: 'FETCH' }),
      fetchAttrRegions: jest.fn().mockReturnValue({ type: 'FETCH' }),
      fetchAttrTrades: jest.fn().mockReturnValue({ type: 'FETCH' }),
    },
  }),
}));

jest.mock('react-redux', () => {
  const mockDispatch = jest.fn().mockReturnValue({
    unwrap: () => Promise.resolve(),
  });
  return {
    connect: (mapStateToProps) => (Component) => {
      const mockState = {
        clinkAccount: { user: { type_id: 1, id: 1 } },
        prequalificationV2: { statuses: [] },
        supplyChain: {
          data: [],
          info: { total: 5 },
          loading: false,
          error: null,
          term: '',
          paginationPage: 0,
          desc: 0,
          order: 'company',
          paginationRowsPerPage: 10,
          offset: 0,
        },
        attributes: { regions: [], trades: [] },
      };
      return (props) =>
        Component({ ...props, ...mapStateToProps(mockState), dispatch: mockDispatch });
    },
  };
});

describe('SupplyChain Page', () => {
  it('renders root element with data-testid="supply-chain-page"', () => {
    render(<SupplyChain />);
    expect(screen.getByTestId('supply-chain-page')).toBeInTheDocument();
  });

  it('renders download dropdown with data-testid="supply-chain-download-select"', () => {
    render(<SupplyChain />);
    expect(screen.getByTestId('supply-chain-download-select')).toBeInTheDocument();
  });

  it('renders sort dropdown with data-testid="supply-chain-sort-select"', () => {
    render(<SupplyChain />);
    expect(screen.getByTestId('supply-chain-sort-select')).toBeInTheDocument();
  });

  it('renders filter toggle button with data-testid="supply-chain-filter-button"', () => {
    render(<SupplyChain />);
    expect(screen.getByTestId('supply-chain-filter-button')).toBeInTheDocument();
  });

  it('renders results count with data-testid="supply-chain-results-count"', () => {
    render(<SupplyChain />);
    const count = screen.getByTestId('supply-chain-results-count');
    expect(count).toBeInTheDocument();
    expect(count).toHaveTextContent('5 results');
  });

  it('does not render clear-filters button when no filters are selected', () => {
    render(<SupplyChain />);
    expect(screen.queryByTestId('supply-chain-clear-filters-button')).not.toBeInTheDocument();
  });

  it('does not render filters container before filter button is clicked', () => {
    render(<SupplyChain />);
    expect(screen.queryByTestId('supply-chain-filters-container')).not.toBeInTheDocument();
  });

  describe('when filter panel is expanded', () => {
    beforeEach(() => {
      render(<SupplyChain />);
      fireEvent.click(screen.getByTestId('supply-chain-filter-button'));
    });

    it('renders filters container with data-testid="supply-chain-filters-container"', () => {
      expect(screen.getByTestId('supply-chain-filters-container')).toBeInTheDocument();
    });

    it('renders activation status filter with data-testid="supply-chain-filter-activation-status"', () => {
      expect(screen.getByTestId('supply-chain-filter-activation-status')).toBeInTheDocument();
    });

    it('renders PQQ status filter with data-testid="supply-chain-filter-pqq-status"', () => {
      expect(screen.getByTestId('supply-chain-filter-pqq-status')).toBeInTheDocument();
    });

    it('renders trade type filter with data-testid="supply-chain-filter-trade-type"', () => {
      expect(screen.getByTestId('supply-chain-filter-trade-type')).toBeInTheDocument();
    });

    it('renders location filter with data-testid="supply-chain-filter-location"', () => {
      expect(screen.getByTestId('supply-chain-filter-location')).toBeInTheDocument();
    });
  });
});
