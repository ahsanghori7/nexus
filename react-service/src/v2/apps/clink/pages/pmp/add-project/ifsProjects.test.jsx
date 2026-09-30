import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

import {
  mockConstants,
  mockAttributes,
  mockDispatch,
  mockContext,
} from 'v2/apps/clink/pages/pmp/add-project/mocks/add-project-setup';

const mockSetProjectName = jest.fn();
const mockSetProjectReference = jest.fn();
const mockSetGroup = jest.fn();
const mockSetErrors = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  connect: (mapStateToProps) => (Component) => (props) => {
    const state = {
      constants: mockConstants,
      attributes: props.attributes || mockAttributes,
      clinkAccount: props.clinkAccount || {
        features: [],
        featureFlags: { asiteFolders: false, ifs: false },
      },
      account: props.account || { groups: [] },
      project: {
        ifsProjects: props.ifsProjects || {
          records: [],
          total: 0,
          page: 1,
          search: '',
          loading: false,
          loadingMore: false,
          error: null,
        },
      },
    };
    const mappedProps = mapStateToProps ? mapStateToProps(state) : {};
    return <Component {...mappedProps} {...props} dispatch={mockDispatch} />;
  },
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('v2/services/clinkHelpers', () => ({
  postData: jest.fn(),
}));

jest.mock('lodash/debounce', () => (fn) => {
  const debounced = (...args) => fn(...args);
  debounced.cancel = jest.fn();
  return debounced;
});

jest.mock('@mui/material/Autocomplete', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({
      options = [],
      value,
      onChange,
      onInputChange,
      getOptionLabel,
      renderInput,
      renderOption,
      slotProps,
    }) => (
      <div data-testid="ifs-autocomplete">
        {renderInput({
          InputProps: {
            inputProps: {
              'aria-label': 'ifs-project',
              value: value ? getOptionLabel(value) : '',
              onChange: (e) => onInputChange?.(e, e.target.value, 'input'),
            },
          },
          onChange: (e) => onInputChange?.(e, e.target.value, 'input'),
          value: value ? getOptionLabel(value) : '',
        })}
        <ul data-testid="ifs-options" {...(slotProps?.listbox || {})}>
          {options.map((option) => {
            const label = getOptionLabel(option);
            if (renderOption) {
              return renderOption(
                {
                  key: option.id,
                  onClick: () => onChange?.(null, option),
                  'data-testid': `ifs-option-${option.id}`,
                },
                option,
              );
            }
            return (
              <li key={option.id}>
                <button
                  type="button"
                  data-testid={`ifs-option-${option.id}`}
                  onClick={() => onChange?.(null, option)}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ),
  };
});

jest.mock('./Panel', () => ({ handleClick }) => (
  <div data-testid="panel" onClick={handleClick}>
    Add new project panel
  </div>
));

jest.mock('./hooks', () => () => ({
  useProjectName: ['', mockSetProjectName],
  useProjectReference: ['', mockSetProjectReference],
  useLocation: ['', jest.fn()],
  useType: ['', jest.fn()],
  useGroup: ['', mockSetGroup],
  useErrors: [[], mockSetErrors],
  handleAddProject: jest.fn(),
}));

import AddNewProjectV2, { getIfsOptionLabel } from './index';

const mockClinkAccountWithIfs = {
  id: '1',
  name: 'Test Account',
  features: [{ id: '10', name: 'IFS' }],
  featureFlags: {
    asiteFolders: false,
    ifs: true,
  },
};

const mockClinkAccountWithIfsAndGroup = {
  id: '1',
  name: 'Test Account',
  features: [{ id: '10', name: 'IFS' }],
  featureFlags: {
    asiteFolders: false,
    ifs: true,
    accountGroup: true,
  },
};

const mockClinkAccountWithoutIfs = {
  id: '1',
  name: 'Test Account',
  features: [],
  featureFlags: {
    asiteFolders: false,
    ifs: false,
  },
};

const mockIfsRecord = {
  id: 7,
  external_id: 'IFS-PRJ-0042',
  project_code: 'MCL-0042',
  project_name: 'Riverside Depot Refurbishment',
  business_unit_code: '10',
  business_unit_name: 'London',
};

const mockIfsProjects = {
  records: [mockIfsRecord],
  total: 1,
  page: 1,
  search: '',
  loading: false,
  loadingMore: false,
  error: null,
};

const renderComponent = (props = {}) =>
  render(
    <BrowserRouter>
      <AddNewProjectV2 {...props} />
    </BrowserRouter>,
  );

describe('AddNewProjectV2 - IFS Projects Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContext.actions.fetchAttrRegions.mockClear();
    mockContext.actions.fetchConstants.mockClear();
    mockContext.actions.fetchIfsProjects.mockClear();
    mockContext.actions.resetIfsProjects.mockClear();
    mockContext.actions.addProject.mockClear();

    require('hooks/context').useContext.mockReturnValue(mockContext);
  });

  describe('getIfsOptionLabel', () => {
    it('formats project_code - project_name - business unit', () => {
      expect(getIfsOptionLabel(mockIfsRecord)).toBe(
        'MCL-0042 - Riverside Depot Refurbishment - 10 - London',
      );
    });

    it('omits missing parts and returns empty for null', () => {
      expect(
        getIfsOptionLabel({
          project_code: 'CODE-1',
          project_name: 'Only Name',
        }),
      ).toBe('CODE-1 - Only Name');
      expect(getIfsOptionLabel(null)).toBe('');
      expect(getIfsOptionLabel(undefined)).toBe('');
    });
  });

  describe('Feature flag', () => {
    it('shows IFS dropdown and fetches page 1 when flag is on and modal opens', () => {
      renderComponent({
        clinkAccount: mockClinkAccountWithIfs,
        ifsProjects: mockIfsProjects,
      });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.getByLabelText(/ifs-project/i)).toBeInTheDocument();
      expect(mockContext.actions.fetchIfsProjects).toHaveBeenCalledWith({
        search: '',
        page: 1,
        per_page: 15,
      });
    });

    it('hides IFS dropdown and does not fetch when flag is off', () => {
      renderComponent({ clinkAccount: mockClinkAccountWithoutIfs });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.queryByLabelText(/ifs-project/i)).not.toBeInTheDocument();
      expect(mockContext.actions.fetchIfsProjects).not.toHaveBeenCalled();
    });
  });

  describe('Selection', () => {
    it('fills project name from project_name and reference from external_id', () => {
      renderComponent({
        clinkAccount: mockClinkAccountWithIfs,
        ifsProjects: mockIfsProjects,
      });

      fireEvent.click(screen.getByTestId('panel'));
      fireEvent.click(screen.getByTestId('ifs-option-7'));

      expect(mockSetProjectName).toHaveBeenCalledWith(
        'Riverside Depot Refurbishment',
      );
      expect(mockSetProjectReference).toHaveBeenCalledWith('MCL-0042');
    });

    it('populates Group from business_unit_name when an IFS project is selected', () => {
      renderComponent({
        clinkAccount: mockClinkAccountWithIfsAndGroup,
        ifsProjects: mockIfsProjects,
      });

      fireEvent.click(screen.getByTestId('panel'));
      fireEvent.click(screen.getByTestId('ifs-option-7'));

      expect(mockSetGroup).toHaveBeenCalledWith('London');
    });

    it('disables Group when an IFS project is selected', () => {
      renderComponent({
        clinkAccount: mockClinkAccountWithIfsAndGroup,
        ifsProjects: mockIfsProjects,
      });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.getByTestId('add-project-group-select')).not.toBeDisabled();

      fireEvent.click(screen.getByTestId('ifs-option-7'));

      expect(screen.getByTestId('add-project-group-select')).toBeDisabled();
    });
  });

  describe('Cancel / reset', () => {
    it('resets IFS catalogue state when modal is cancelled', () => {
      renderComponent({
        clinkAccount: mockClinkAccountWithIfs,
        ifsProjects: mockIfsProjects,
      });

      fireEvent.click(screen.getByTestId('panel'));
      fireEvent.click(screen.getByText('cancel'));

      expect(mockContext.actions.resetIfsProjects).toHaveBeenCalled();
    });
  });

  describe('Search', () => {
    it('dispatches fetchIfsProjects when the user types a search term', async () => {
      renderComponent({
        clinkAccount: mockClinkAccountWithIfs,
        ifsProjects: mockIfsProjects,
      });

      fireEvent.click(screen.getByTestId('panel'));
      mockContext.actions.fetchIfsProjects.mockClear();

      fireEvent.change(screen.getByLabelText(/ifs-project/i), {
        target: { value: 'riverside' },
      });

      await waitFor(() => {
        expect(mockContext.actions.fetchIfsProjects).toHaveBeenCalledWith({
          search: 'riverside',
          page: 1,
          per_page: 15,
        });
      });
    });
  });

  describe('Error / empty states', () => {
    it('shows load error helper text when catalogue fetch failed', () => {
      renderComponent({
        clinkAccount: mockClinkAccountWithIfs,
        ifsProjects: {
          ...mockIfsProjects,
          records: [],
          error: 'Failed to load IFS projects',
        },
      });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.getByText('ifs-project-load-error')).toBeInTheDocument();
    });
  });

  describe('Pagination scroll', () => {
    it('loads the next page when listbox scrolls near the bottom', () => {
      renderComponent({
        clinkAccount: mockClinkAccountWithIfs,
        ifsProjects: {
          ...mockIfsProjects,
          total: 50,
          page: 1,
          records: Array.from({ length: 15 }, (_, i) => ({
            ...mockIfsRecord,
            id: i + 1,
            external_id: `EXT-${i + 1}`,
          })),
        },
      });

      fireEvent.click(screen.getByTestId('panel'));
      mockContext.actions.fetchIfsProjects.mockClear();

      const listbox = screen.getByTestId('ifs-options');
      Object.defineProperty(listbox, 'scrollTop', { value: 200, configurable: true });
      Object.defineProperty(listbox, 'clientHeight', { value: 100, configurable: true });
      Object.defineProperty(listbox, 'scrollHeight', { value: 320, configurable: true });
      fireEvent.scroll(listbox);

      expect(mockContext.actions.fetchIfsProjects).toHaveBeenCalledWith({
        search: '',
        page: 2,
        per_page: 15,
      });
    });
  });
});
