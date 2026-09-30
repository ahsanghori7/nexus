import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import '@testing-library/jest-dom';
import CompanyOffering from './index';

// Mock clink-components
jest.mock('clink-components', () => ({
  Button: ({ children, handleClick, disabled, ...props }) => (
    <button onClick={handleClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Panel: ({ children, headerContent }) => (
    <div data-testid="panel">
      <div data-testid="panel-header">{headerContent}</div>
      <div data-testid="panel-content">{children}</div>
    </div>
  ),
}));

// Mock MUI components
jest.mock('@mui/material/Autocomplete', () => {
  return function MockAutocomplete({ label, value, options, onChange, renderInput }) {
    return (
      <div data-testid="autocomplete">
        <label>{label}</label>
        <input
          value={Array.isArray(value) ? value.map(v => v.label || v).join(', ') : ''}
          onChange={(e) => onChange && onChange(e, [])}
          placeholder="Search..."
        />
        {renderInput && renderInput({ InputProps: {} })}
      </div>
    );
  };
});

jest.mock('@mui/material/TextField', () => {
  return function MockTextField(props) {
    return <input {...props} data-testid="textfield" />;
  };
});

jest.mock('@mui/material/CircularProgress', () => {
  return function MockCircularProgress(props) {
    return <div data-testid="loading" {...props}>Loading...</div>;
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock context
jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchAttrRegions: jest.fn(),
      fetchAttrTrades: jest.fn(),
      fetchAttrProjectType: jest.fn(),
    },
  }),
}));

// Mock subscription helper
jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isRegional: jest.fn(() => false),
  }));
});

// Mock lodash
jest.mock('lodash/uniqBy', () => (array) => array || []);

// Mock styled components
jest.mock('../Theme.styled', () => ({
  StyledWithMarginAndLoader: ({ children, className }) => (
    <div className={className} data-testid="styled-margin-loader">{children}</div>
  ),
  StyledWrapper: ({ children }) => (
    <div data-testid="styled-wrapper">{children}</div>
  ),
}));

jest.mock('./styled', () => ({
  StyledOfferingColumns: ({ children, ...props }) => (
    <div {...props} data-testid="offering-column">{children}</div>
  ),
}));

describe('CompanyOffering', () => {
  const mockStore = createStore(() => ({
    attributes: {
      regions: [],
      trades: [],
      projectType: [],
      loading1: false,
      loading2: false,
      loading3: false,
    },
    subcontractor: null,
  }));

  const defaultProps = {
    id: 'test-id',
    data: {
      trades: [],
      regions: [],
      types: [],
    },
    contextType: 'prosper',
    selectOption: jest.fn(),
    handleOnSubmit: jest.fn(),
    loading: false,
  };

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <CompanyOffering {...defaultProps} {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('panel')).toBeInTheDocument();
    });

    it('renders the header content', () => {
      renderComponent();
      expect(screen.getByText('profile-company-offering')).toBeInTheDocument();
    });

    it('renders trades autocomplete', () => {
      renderComponent();
      const autocompletes = screen.getAllByTestId('autocomplete');
      expect(autocompletes.length).toBeGreaterThan(0);
    });

    it('renders save button', () => {
      renderComponent();
      expect(screen.getByText('save')).toBeInTheDocument();
    });
  });

  describe('Context Type Handling', () => {
    it('renders styled columns for prosper context', () => {
      renderComponent({ contextType: 'prosper' });
      const offeringColumns = screen.getAllByTestId('offering-column');
      expect(offeringColumns.length).toBe(3); // trades, regions, types
    });

    it('handles non-prosper context type', () => {
      renderComponent({ contextType: 'other' });
      expect(screen.getByTestId('panel')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when loading is true', () => {
      renderComponent({ loading: true });
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('does not show loading spinner when loading is false', () => {
      renderComponent({ loading: false });
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  describe('Button Disabled State', () => {
    it('disables save button when data is empty', () => {
      renderComponent({
        data: {
          trades: [],
          regions: [],
          types: [],
        },
      });
      const saveButton = screen.getByText('save');
      expect(saveButton).toBeDisabled();
    });

    it('enables save button when data is present', () => {
      renderComponent({
        data: {
          trades: [{ label: 'trade1' }],
          regions: [{ label: 'region1' }],
          types: [{ label: 'type1' }],
        },
      });
      const saveButton = screen.getByText('save');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Props Handling', () => {
    it('handles selectOption prop correctly', () => {
      const mockSelectOption = jest.fn();
      renderComponent({ selectOption: mockSelectOption });
      expect(screen.getByTestId('panel')).toBeInTheDocument();
    });

    it('handles handleOnSubmit prop correctly', () => {
      const mockHandleOnSubmit = jest.fn();
      renderComponent({ handleOnSubmit: mockHandleOnSubmit });
      expect(screen.getByTestId('panel')).toBeInTheDocument();
    });
  });
});