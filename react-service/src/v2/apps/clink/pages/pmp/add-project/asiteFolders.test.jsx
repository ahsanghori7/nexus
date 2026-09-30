import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

import {
  mockConstants,
  mockAttributes,
  mockAccount,
  mockDispatch,
  mockContext,
} from 'v2/apps/clink/pages/pmp/add-project/mocks/add-project-setup';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  connect: (mapStateToProps) => (Component) => (props) => {
    const state = {
      constants: mockConstants,
      attributes: props.attributes || mockAttributes,
      account: props.account || mockAccount,
      clinkAccount: props.clinkAccount || { features: [], featureFlags: {} },
      account: { groups: [] },
      project: {
        ifsProjects: {
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

jest.mock('./Panel', () => ({ handleClick }) => (
  <div data-testid="panel" onClick={handleClick}>
    Add new project panel
  </div>
));

jest.mock('./hooks', () => () => ({
  useProjectName: ['', jest.fn()],
  useProjectReference: ['', jest.fn()],
  useLocation: ['', jest.fn()],
  useType: ['', jest.fn()],
  useGroup: ['', jest.fn()],
  useErrors: [[], jest.fn()],
  handleAddProject: jest.fn(),
  resetForm: jest.fn(),
}));

import AddNewProjectV2 from './index';

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <AddNewProjectV2 {...props} />
    </BrowserRouter>,
  );
};

describe('AddNewProjectV2 - Asite Folders Integration', () => {
  const mockClinkAccountWithFeature = {
    id: '1',
    name: 'Test Account',
    features: [{ id: '9', name: 'ASITE_FOLDERS' }],
    featureFlags: {
      asiteFolders: true,
      accountGroup: true,
    },
  };

  const mockClinkAccountWithoutFeature = {
    id: '1',
    name: 'Test Account',
    features: [],
    featureFlags: {
      asiteFolders: false,
      accountGroup: true,
    },
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
    {
      id: '142353545$$XyZ123',
      name: '02 - Design Documents',
      uri: 'https://dmsak.asite.com/api/workspace/2225710$$QQYS8m/folder/142353545$$XyZ123/firstpage_doclist',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext.actions.fetchAttrRegions.mockClear();
    mockContext.actions.fetchConstants.mockClear();
    mockContext.actions.fetchAsiteFolders.mockClear();
    mockContext.actions.addProject.mockClear();

    const useContextMock = require('hooks/context').useContext;
    useContextMock.mockReturnValue(mockContext);
  });

  describe('Feature Flag Detection', () => {
    it('should detect ASITE_FOLDERS feature in account features', () => {
      const attributesWithFolders = {
        ...mockAttributes,
        asiteFolders: mockAsiteFolders,
      };

      renderComponent({
        clinkAccount: mockClinkAccountWithFeature,
        attributes: attributesWithFolders,
      });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.getByLabelText(/asite-folder/i)).toBeInTheDocument();
    });

    it('should not show dropdown when feature is not in account features', () => {
      renderComponent({ clinkAccount: mockClinkAccountWithoutFeature });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.queryByLabelText(/asite-folder/i)).not.toBeInTheDocument();
    });

    it('should handle account with empty features array', () => {
      const accountWithEmptyFeatures = {
        ...mockClinkAccountWithoutFeature,
        features: [],
      };

      renderComponent({ clinkAccount: accountWithEmptyFeatures });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.queryByLabelText(/asite-folder/i)).not.toBeInTheDocument();
    });

    it('should handle account with null features', () => {
      const accountWithNullFeatures = {
        ...mockClinkAccountWithoutFeature,
        features: null,
      };

      renderComponent({ clinkAccount: accountWithNullFeatures });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.queryByLabelText(/asite-folder/i)).not.toBeInTheDocument();
    });

    it('should handle undefined clinkAccount', () => {
      renderComponent({ clinkAccount: undefined });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.queryByLabelText(/asite-folder/i)).not.toBeInTheDocument();
    });
  });

  describe('Asite Folders Dropdown', () => {
    it('should render autocomplete for asite folders', () => {
      const attributesWithFolders = {
        ...mockAttributes,
        asiteFolders: mockAsiteFolders,
      };

      renderComponent({
        clinkAccount: mockClinkAccountWithFeature,
        attributes: attributesWithFolders,
      });

      fireEvent.click(screen.getByTestId('panel'));
      
      const input = screen.getByLabelText(/asite-folder/i);
      expect(input).toBeInTheDocument();
    });

    it('should handle empty asite folders array', () => {
      const attributesWithEmptyFolders = {
        ...mockAttributes,
        asiteFolders: [],
      };

      renderComponent({
        clinkAccount: mockClinkAccountWithFeature,
        attributes: attributesWithEmptyFolders,
      });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.getByLabelText(/asite-folder/i)).toBeInTheDocument();
    });

    it('should render searchable input for asite folders', () => {
      const attributesWithFolders = {
        ...mockAttributes,
        asiteFolders: mockAsiteFolders,
      };

      renderComponent({
        clinkAccount: mockClinkAccountWithFeature,
        attributes: attributesWithFolders,
      });

      fireEvent.click(screen.getByTestId('panel'));

      const input = screen.getByLabelText(/asite-folder/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('API Calls', () => {
    it('should call fetchAsiteFolders only when feature is enabled', () => {
      renderComponent({ clinkAccount: mockClinkAccountWithFeature });

      expect(mockContext.actions.fetchAsiteFolders).toHaveBeenCalledTimes(1);
    });

    it('should not call fetchAsiteFolders when feature is disabled', () => {
      renderComponent({ clinkAccount: mockClinkAccountWithoutFeature });

      expect(mockContext.actions.fetchAsiteFolders).not.toHaveBeenCalled();
    });

    it('should call fetchAsiteFolders after feature flag changes', () => {
      const { rerender } = renderComponent({
        clinkAccount: mockClinkAccountWithoutFeature,
      });

      expect(mockContext.actions.fetchAsiteFolders).not.toHaveBeenCalled();

      rerender(
        <BrowserRouter>
          <AddNewProjectV2
            clinkAccount={mockClinkAccountWithFeature}
            dispatch={mockDispatch}
          />
        </BrowserRouter>,
      );

      expect(mockContext.actions.fetchAsiteFolders).toHaveBeenCalled();
    });
  });

  describe('Integration with Other Form Fields', () => {
    it('should render asite folder dropdown at the top before project name', () => {
      const attributesWithFolders = {
        ...mockAttributes,
        asiteFolders: mockAsiteFolders,
      };

      renderComponent({
        clinkAccount: mockClinkAccountWithFeature,
        attributes: attributesWithFolders,
      });

      fireEvent.click(screen.getByTestId('panel'));

      const asiteFolderField = screen.getByLabelText(/asite-folder/i);
      const projectNameField = screen.getByLabelText(/project-name/i);
      const typeField = screen.getByLabelText(/type/i);

      expect(asiteFolderField).toBeInTheDocument();
      expect(projectNameField).toBeInTheDocument();
      expect(typeField).toBeInTheDocument();
    });

    it('should maintain other form fields when asite folder dropdown is present', () => {
      const attributesWithFolders = {
        ...mockAttributes,
        asiteFolders: mockAsiteFolders,
      };

      renderComponent({
        clinkAccount: mockClinkAccountWithFeature,
        attributes: attributesWithFolders,
      });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.getByLabelText(/project-name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project-reference/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/label-location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/asite-folder/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/group/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed folder data gracefully', () => {
      const attributesWithMalformedFolders = {
        ...mockAttributes,
        asiteFolders: [
          { id: '1' },
          { name: 'Incomplete Folder' },
          null,
          undefined,
        ],
      };

      const { container } = renderComponent({
        clinkAccount: mockClinkAccountWithFeature,
        attributes: attributesWithMalformedFolders,
      });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.getByLabelText(/asite-folder/i)).toBeInTheDocument();
    });

    it('should handle feature name case sensitivity', () => {
      const accountWithLowercaseFeature = {
        id: '1',
        name: 'Test Account',
        features: [{ id: '9', name: 'asite_folders' }],
      };

      renderComponent({ clinkAccount: accountWithLowercaseFeature });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.queryByLabelText(/asite-folder/i)).not.toBeInTheDocument();
    });

    it('should handle multiple matching features', () => {
      const accountWithDuplicateFeatures = {
        id: '1',
        name: 'Test Account',
        features: [
          { id: '9', name: 'ASITE_FOLDERS' },
          { id: '10', name: 'ASITE_FOLDERS' },
        ],
        featureFlags: {
          asiteFolders: true, // Add this line
        },
      };

      const attributesWithFolders = {
        ...mockAttributes,
        asiteFolders: mockAsiteFolders,
      };

      renderComponent({
        clinkAccount: accountWithDuplicateFeatures,
        attributes: attributesWithFolders,
      });

      fireEvent.click(screen.getByTestId('panel'));

      expect(screen.getByLabelText(/asite-folder/i)).toBeInTheDocument();
    });
  });
});
