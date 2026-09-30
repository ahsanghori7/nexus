import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Import mocks first
import {
  mockConstants,
  mockAttributes,
  mockAccount,
  mockDispatch,
  mockContext,
} from 'v2/apps/clink/pages/pmp/add-project/mocks/add-project-setup';

const mockClinkAccount = {
  id: '1',
  name: 'Test Account',
  features: [],
  featureFlags: {
    asiteFolders: false,
    accountGroup: true,
    ifs: false
  }
};

const mockClinkAccountWithAsiteFeature = {
  id: '1',
  name: 'Test Account',
  features: [{ id: '9', name: 'ASITE_FOLDERS' }],
  featureFlags: {
    asiteFolders: true,
    accountGroup: true,
    ifs: false
  }
};

const mockClinkAccountWithIfsFeature = {
  id: '1',
  name: 'Test Account',
  features: [{ id: '10', name: 'IFS' }],
  featureFlags: {
    asiteFolders: false,
    ifs: true
  }
};

const mockAsiteFolders = [
  {
    id: '142353541$$2iQ1gp',
    name: '00 - Information Management Documentation',
    uri: 'https://dmsak.asite.com/api/workspace/2225710$$QQYS8m/folder/142353541$$2iQ1gp/firstpage_doclist',
  },
  {
    id: '142353543$$QwMpjd',
    name: '01 - Contract Documents',
    uri: 'https://dmsak.asite.com/api/workspace/2225710$$QQYS8m/folder/142353543$$QwMpjd/firstpage_doclist',
  },
];

const mockIfsProjects = {
  records: [
    {
      id: 7,
      external_id: 'IFS-PRJ-0042',
      project_code: 'MCL-0042',
      project_name: 'Riverside Depot Refurbishment',
      business_unit_code: '10',
      business_unit_name: 'London'
    }
  ],
  total: 1,
  page: 1,
  search: '',
  loading: false,
  loadingMore: false,
  error: null
};

// Mock dependencies
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  connect: (mapStateToProps) => (Component) => (props) => {
    const state = {
      constants: mockConstants,
      attributes: props.attributes || mockAttributes,
      account: props.account || mockAccount,
      clinkAccount: props.clinkAccount || mockClinkAccount,
         project: {
        ifsProjects: props.ifsProjects || mockIfsProjects
      }
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

jest.mock('./Panel', () => ({ handleClick }) => (
  <div data-testid="panel" onClick={handleClick}>
    Add new project panel
  </div>
));

const mockSetProjectName = jest.fn();
const mockSetProjectReference = jest.fn();
const mockSetRegion = jest.fn();
const mockSetType = jest.fn();
const mockSetErrors = jest.fn();

jest.mock('./hooks', () => () => ({
  useProjectName: ['', mockSetProjectName],
  useProjectReference: ['', mockSetProjectReference],
  useLocation: ['', mockSetRegion],
  useType: ['', mockSetType],
  useGroup: ['', jest.fn()],
  useErrors: [[], mockSetErrors],
  handleAddProject: jest.fn(),
  resetForm: jest.fn(),
}));

// Import component after mocks
import AddNewProjectV2, { applyAsiteFolderSelection } from './index';

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <AddNewProjectV2 {...props} />
    </BrowserRouter>,
  );
};

describe('AddNewProjectV2 Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear action mocks
    mockContext.actions.fetchAttrRegions.mockClear();
    mockContext.actions.fetchConstants.mockClear();
    mockContext.actions.fetchAsiteFolders.mockClear();
    mockContext.actions.fetchIfsProjects.mockClear();
    mockContext.actions.resetIfsProjects.mockClear();
    mockContext.actions.addProject.mockClear();

    const useContextMock = require('hooks/context').useContext;
    useContextMock.mockReturnValue(mockContext);
  });

  test('renders Panel component', () => {
    renderComponent();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
    expect(screen.getByText('Add new project panel')).toBeInTheDocument();
  });

  test('renders modal when panel is clicked', () => {
    renderComponent();

    // Click on the panel to open modal
    const panel = screen.getByTestId('panel');
    fireEvent.click(panel);

    // Check if modal content is rendered
    expect(screen.getByText('add-new-project')).toBeInTheDocument();
  });

  test('renders all form fields in modal', () => {
    renderComponent();

    // Open modal
    fireEvent.click(screen.getByTestId('panel'));

    // Check for all form fields by their labels (which contain the text)
    expect(screen.getByLabelText(/project-name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project-reference/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/label-location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/group/i)).toBeInTheDocument();
  });

  test('renders Save and Cancel buttons', () => {
    renderComponent();

    // Open modal
    fireEvent.click(screen.getByTestId('panel'));

    expect(screen.getByText('save')).toBeInTheDocument();
    expect(screen.getByText('cancel')).toBeInTheDocument();
  });

  test('closes modal when Cancel button is clicked', () => {
    renderComponent();

    // Open modal
    fireEvent.click(screen.getByTestId('panel'));
    expect(screen.getByText('add-new-project')).toBeInTheDocument();

    // Click Cancel button
    const cancelButton = screen.getByText('cancel');
    fireEvent.click(cancelButton);

    // Modal should be closed (modal content not visible)
    expect(screen.queryByText('add-new-project')).not.toBeInTheDocument();
  });

  test('dispatches fetchAttrRegions and fetchConstants on mount', () => {
    renderComponent();

    expect(mockDispatch).toHaveBeenCalledWith(
      mockContext.actions.fetchAttrRegions(),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      mockContext.actions.fetchConstants(),
    );
  });

  test('does not dispatch fetchAsiteFolders when feature is not enabled', () => {
    renderComponent({ clinkAccount: mockClinkAccount });

    // Check that fetchAsiteFolders was NOT called
    expect(mockContext.actions.fetchAsiteFolders).not.toHaveBeenCalled();
  });

  test('dispatches fetchAsiteFolders when ASITE_FOLDERS feature is enabled', () => {
    renderComponent({ clinkAccount: mockClinkAccountWithAsiteFeature });

    // Check that fetchAsiteFolders was called
    expect(mockContext.actions.fetchAsiteFolders).toHaveBeenCalled();
  });

  test('renders Asite folder dropdown when feature is enabled', () => {
    const attributesWithFolders = {
      ...mockAttributes,
      asiteFolders: mockAsiteFolders,
    };

    renderComponent({
      clinkAccount: mockClinkAccountWithAsiteFeature,
      attributes: attributesWithFolders,
    });

    // Open modal
    fireEvent.click(screen.getByTestId('panel'));

    // Check for Asite folder dropdown
    expect(screen.getByLabelText(/asite-folder/i)).toBeInTheDocument();
  });

  test('does not render Asite folder dropdown when feature is disabled', () => {
    renderComponent({ clinkAccount: mockClinkAccount });

    // Open modal
    fireEvent.click(screen.getByTestId('panel'));

    // Asite folder dropdown should not be present
    expect(screen.queryByLabelText(/asite-folder/i)).not.toBeInTheDocument();
  });

  test('does not render IFS project dropdown when feature is disabled', () => {
    renderComponent({ clinkAccount: mockClinkAccount });

    fireEvent.click(screen.getByTestId('panel'));

    expect(screen.queryByLabelText(/ifs-project/i)).not.toBeInTheDocument();
  });

  test('does not render Group dropdown', () => {
    renderComponent({ clinkAccount: mockClinkAccountWithIfsFeature });

    fireEvent.click(screen.getByTestId('panel'));

    expect(screen.queryByLabelText(/select-a-group/i)).not.toBeInTheDocument();
    expect(screen.queryByText('group')).not.toBeInTheDocument();
  });

  test('renders IFS project dropdown and fetches catalogue when IFS is enabled', () => {
    renderComponent({ clinkAccount: mockClinkAccountWithIfsFeature });

    fireEvent.click(screen.getByTestId('panel'));

    expect(screen.getByLabelText(/ifs-project/i)).toBeInTheDocument();
    expect(mockContext.actions.fetchIfsProjects).toHaveBeenCalledWith({
      search: '',
      page: 1,
      per_page: 15,
    });
  });

  test('resets IFS state when cancel is clicked with IFS enabled', () => {
    renderComponent({ clinkAccount: mockClinkAccountWithIfsFeature });

    fireEvent.click(screen.getByTestId('panel'));
    fireEvent.click(screen.getByText('cancel'));

    expect(mockContext.actions.resetIfsProjects).toHaveBeenCalled();
  });

  test('clears all form fields when cancel is clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('panel'));
    fireEvent.click(screen.getByText('cancel'));

    expect(mockSetProjectName).toHaveBeenCalledWith('');
    expect(mockSetProjectReference).toHaveBeenCalledWith('');
    expect(mockSetRegion).toHaveBeenCalledWith('');
    expect(mockSetType).toHaveBeenCalledWith('');
    expect(mockSetErrors).toHaveBeenCalledWith([]);
    expect(screen.queryByText('add-new-project')).not.toBeInTheDocument();
  });

  test('does not clear form fields when modal is dismissed via onClose', () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('panel'));
    mockSetProjectName.mockClear();
    mockSetProjectReference.mockClear();
    mockSetRegion.mockClear();
    mockSetType.mockClear();
    mockSetErrors.mockClear();
    mockContext.actions.resetIfsProjects.mockClear();

    fireEvent.click(screen.getByTestId('modal-backdrop-dismiss'));

    expect(mockSetProjectName).not.toHaveBeenCalled();
    expect(mockSetProjectReference).not.toHaveBeenCalled();
    expect(mockSetRegion).not.toHaveBeenCalled();
    expect(mockSetType).not.toHaveBeenCalled();
    expect(mockContext.actions.resetIfsProjects).not.toHaveBeenCalled();
    expect(screen.queryByText('add-new-project')).not.toBeInTheDocument();
  });

  test('does not fetch IFS projects before modal is opened', () => {
    renderComponent({ clinkAccount: mockClinkAccountWithIfsFeature });

    expect(mockContext.actions.fetchIfsProjects).not.toHaveBeenCalled();
  });

  test('selecting Asite copies name and reference when IFS is disabled', () => {
    const setAsiteFolder = jest.fn();
    const setProjectName = jest.fn();
    const setProjectReference = jest.fn();

    applyAsiteFolderSelection(
      mockAsiteFolders[0],
      false,
      { setAsiteFolder, setProjectName, setProjectReference },
    );

    expect(setAsiteFolder).toHaveBeenCalledWith(mockAsiteFolders[0].id);
    expect(setProjectName).toHaveBeenCalledWith(mockAsiteFolders[0].name);
    expect(setProjectReference).toHaveBeenCalledWith(mockAsiteFolders[0].name);
  });

  test('selecting Asite does not overwrite name or reference when IFS is selected', () => {
    const setAsiteFolder = jest.fn();
    const setProjectName = jest.fn();
    const setProjectReference = jest.fn();

    applyAsiteFolderSelection(
      mockAsiteFolders[0],
      true,
      { setAsiteFolder, setProjectName, setProjectReference },
    );

    expect(setAsiteFolder).toHaveBeenCalledWith(mockAsiteFolders[0].id);
    expect(setProjectName).not.toHaveBeenCalled();
    expect(setProjectReference).not.toHaveBeenCalled();
  });

  test('modal starts closed and opens when panel is clicked', () => {
    renderComponent();

    // Modal should be closed initially
    expect(screen.queryByText('add-new-project')).not.toBeInTheDocument();

    // Click panel to open modal
    fireEvent.click(screen.getByTestId('panel'));

    // Modal should now be open
    expect(screen.getByText('add-new-project')).toBeInTheDocument();
  });

  test('renders regions and types from props', () => {
    renderComponent();

    // Open modal
    fireEvent.click(screen.getByTestId('panel'));

    // Check that at least some region/type content is rendered
    // The exact text may be inside MenuItems but the component should be functional
    expect(screen.getByLabelText(/label-location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
  });

  test('renders section labels: project-information and group', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('panel'));

    expect(screen.getByText('project-information')).toBeInTheDocument();
    // Group appears as both a section label and a field label; at least one should be present
    expect(screen.getAllByText('group').length).toBeGreaterThanOrEqual(1);
  });

  test('Save button is disabled when fields are empty (via mock returning empty strings)', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('panel'));

    const saveButton = screen.getByText('save').closest('button');
    expect(saveButton).toBeDisabled();
  });

  test('renders close (X) button in modal header', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('panel'));

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  test('closes modal when X button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('panel'));
    expect(screen.getByText('add-new-project')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText('add-new-project')).not.toBeInTheDocument();
  });

  describe('ACCOUNT_GROUP feature flag', () => {
    const mockClinkAccountWithoutGroupFeature = {
      id: '1',
      name: 'Test Account',
      features: [],
      featureFlags: {
        asiteFolders: false,
        accountGroup: false,
      },
    };

    test('renders the group section when the flag is present', () => {
      renderComponent({ clinkAccount: mockClinkAccount });
      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.getByLabelText(/select-a-group/i)).toBeInTheDocument();
    });

    test('hides the group section when the flag is absent', () => {
      renderComponent({ clinkAccount: mockClinkAccountWithoutGroupFeature });
      fireEvent.click(screen.getByTestId('panel'));

      expect(
        screen.queryByLabelText(/select-a-group/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('add-project-group-select'),
      ).not.toBeInTheDocument();
    });

    test('lists the static select-group option ahead of the real groups', () => {
      renderComponent({ clinkAccount: mockClinkAccount });
      fireEvent.click(screen.getByTestId('panel'));

      const groupField = screen
        .getByTestId('add-project-group-select')
        .closest('[data-testid="textfield"]');
      const optionLabels = Array.from(
        groupField.querySelectorAll('[data-testid="mui-menu-item"]'),
      ).map((option) => option.textContent);

      expect(optionLabels[0]).toBe('select-group');
    });

    test('defaults the group value to the static select-group option', () => {
      renderComponent({ clinkAccount: mockClinkAccount });
      fireEvent.click(screen.getByTestId('panel'));

      const groupInput = screen.getByTestId('add-project-group-select');
      const staticOption = Array.from(
        groupInput
          .closest('[data-testid="textfield"]')
          .querySelectorAll('[data-testid="mui-menu-item"]'),
      ).find((option) => option.textContent === 'select-group');

      // The empty-valued option is what an untouched form selects.
      expect(groupInput).toHaveValue('');
      expect(staticOption).toHaveAttribute('value', '');
    });

    test('keeps Group editable and populated from account groups for a non-IFS account', () => {
      renderComponent({ clinkAccount: mockClinkAccount });
      fireEvent.click(screen.getByTestId('panel'));

      const groupInput = screen.getByTestId('add-project-group-select');
      expect(groupInput).not.toBeDisabled();

      const optionLabels = Array.from(
        groupInput
          .closest('[data-testid="textfield"]')
          .querySelectorAll('[data-testid="mui-menu-item"]'),
      ).map((option) => option.textContent);

      // Options still come from the account's own groups, unaffected by IFS.
      expect(optionLabels).toContain('Group 1');
      expect(optionLabels).toContain('Group 2');
    });
  });
});
