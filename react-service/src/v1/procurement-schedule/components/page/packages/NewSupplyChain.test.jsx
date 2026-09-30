import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewSupplyModal from './NewSupplyChain';

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        ruby: '#ff0000',
        white: '#ffffff',
      },
    },
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('v2/hooks/useFeatureFlag', () => () => ({
  checkFeature: jest.fn().mockReturnValue(false),
}));

jest.mock('v2/apps/shared/components/muiTheme', () => () => ({}));

jest.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }) => <>{children}</>,
}));

jest.mock('@mui/material', () => ({
  InputAdornment: ({ children }) => <div>{children}</div>,
}));

jest.mock('@mui/icons-material', () => ({
  Search: () => <span data-testid="search-icon">Search</span>,
}));

jest.mock('@mui/icons-material/Add', () => () => (
  <span data-testid="add-icon">Add</span>
));

jest.mock('v2/constants/colors', () => ({
  clinkBlack: '#000',
  clinkGreenHover: '#4cc0ad',
  clinkLightGray: '#ccc',
  mutedGray: '#999',
}));

jest.mock('v1/global/services/clink', () => ({
  __esModule: true,
  default: {
    transformToArray: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('v1/global/components/clink-alert', () => ({
  ConfirmAlert: ({ Component, props }) => <Component {...props} />,
}));

jest.mock('v1/global/components/modal', () => {
  const React = require('react');
  const { useState } = React;

  return function MockGlobalModal({
    render: renderContent,
    ShowButton,
    buttonContent,
  }) {
    const [show, setShow] = useState(false);

    return (
      <div>
        <ShowButton onClick={() => setShow(true)}>{buttonContent}</ShowButton>

        {show && renderContent({ setShow })}
      </div>
    );
  };
});

jest.mock(
  'v1/global/components/general-ui/Buttons',
  () =>
    function MockGreenButton({
      label,
      type,
      disabled,
      onClick,
      handleClick,
      className,
      ...rest
    }) {
      return (
        <button
          type={type || 'button'}
          disabled={disabled}
          onClick={onClick || handleClick}
          data-testid={rest['data-testid']}
          className={className}
        >
          {label}
        </button>
      );
    },
);

const createMockService = () => ({
  formFields: [{ options: [] }],
  setOptions: function (options) {
    this.formFields[0].options = options.map((item) => ({
      value: item.id,
      label: item.company || 'Test Company',
      id: item.id,
    }));
  },
});

const defaultProps = {
  service: createMockService(),
  packageId: 1,
  bulkUpdateProjectHistory: jest.fn().mockResolvedValue({}),
  subcontractor: [],
  packages: [101],
  supplyChain: [
    { id: 1, company: 'Company Alpha', trades: [{ id: 101 }] },
    { id: 2, company: 'Company Beta', trades: [{ id: 101 }] },
  ],
  init: jest.fn(),
  addToShortlist: jest.fn(),
  shortlistedSubcontractors: [],
};

describe('NewSupplyModal', () => {
  it('renders the trigger button', () => {
    render(<NewSupplyModal {...defaultProps} />);
    expect(screen.getByText('Add Supplier')).toBeInTheDocument();
  });

  describe('when modal is opened', () => {
    beforeEach(() => {
      render(
        <NewSupplyModal {...defaultProps} service={createMockService()} />,
      );
      fireEvent.click(screen.getByText('Add Supplier'));
    });

    it('renders search input with data-testid="supply-chain-modal-search-input"', () => {
      expect(
        screen.getByTestId('supply-chain-modal-search-input'),
      ).toBeInTheDocument();
    });

    it('renders select-all checkbox with data-testid="supply-chain-modal-select-all"', () => {
      expect(
        screen.getByTestId('supply-chain-modal-select-all'),
      ).toBeInTheDocument();
    });

    it('renders a row for each subcontractor with data-testid="supply-chain-modal-row-{id}"', () => {
      expect(
        screen.getByTestId('supply-chain-modal-row-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('supply-chain-modal-row-2'),
      ).toBeInTheDocument();
    });

    it('renders a checkbox per row with data-testid="supply-chain-modal-checkbox-{id}"', () => {
      expect(
        screen.getByTestId('supply-chain-modal-checkbox-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('supply-chain-modal-checkbox-2'),
      ).toBeInTheDocument();
    });

    it('renders go-back button with data-testid="supply-chain-modal-go-back"', () => {
      expect(
        screen.getByTestId('supply-chain-modal-go-back'),
      ).toBeInTheDocument();
    });

    it('renders add button with data-testid="supply-chain-modal-add-button"', () => {
      expect(
        screen.getByTestId('supply-chain-modal-add-button'),
      ).toBeInTheDocument();
    });

    it('add button is disabled when no subcontractor is selected', () => {
      expect(
        screen.getByTestId('supply-chain-modal-add-button'),
      ).toBeDisabled();
    });

    it('add button becomes enabled after selecting a row', () => {
      fireEvent.click(screen.getByTestId('supply-chain-modal-row-1'));
      expect(
        screen.getByTestId('supply-chain-modal-add-button'),
      ).not.toBeDisabled();
    });
  });
});
