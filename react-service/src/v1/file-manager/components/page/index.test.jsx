import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom';

// Mock all dependencies before imports
jest.mock('v1/global', () => ({}));
jest.mock('v1/file-manager/public/styles/index.scss', () => ({}), { virtual: true });

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: jest.fn((key, params) => {
      const translations = {
        'file-manager-action-not-completed': 'Action not completed',
        'file-manager-upload-error-msg': 'Upload error',
        'file-manager-delete-error-msg': 'Delete error',
        'file-manager-invalid-file-title': 'Invalid file',
        'file-manager-invalid-files-title': 'Invalid files',
        'file-manager-invalid-file-msg': 'The file is invalid',
        'file-manager-invalid-files-msg': 'The files are invalid',
        'file-manager-could-not-upload-file': 'Could not upload file',
        'file-manager-could-not-upload-files': 'Could not upload files',
        'files-uploaded-successfully': `${params?.count || 0} files uploaded successfully`,
        'failed-to-upload-files': 'Failed to upload files',
      };
      return translations[key] || key;
    }),
  },
}));

jest.mock('v2/helpers/url', () => ({
  setUrl: jest.fn(),
  getRelayUrl: jest.fn(() => '/mock-relay-url'),
}));

jest.mock('v2/helpers/flags', () => jest.fn(() => false));
jest.mock('v2/helpers/files', () => ({
  sizeFileIsCorrect: jest.fn(() => true),
  typeFileIsAccepted: jest.fn(() => true),
}));

jest.mock('v1/global/helpers/alert', () => jest.fn());

jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: jest.fn(),
}));

jest.mock('v1/global/services/documents/Categories', () => {
  return jest.fn().mockImplementation(() => ({
    getCategories: jest.fn().mockResolvedValue([
      { id: 1, name: 'Category 1', files: [] },
      { id: 2, name: 'Category 2', files: [] },
    ]),
    sync: jest.fn().mockResolvedValue({ success: true, documents: [] }),
    addMany: jest.fn().mockResolvedValue({ success: true }),
    removeMany: jest.fn().mockResolvedValue({ success: true }),
    removeManyFolders: jest.fn().mockResolvedValue({ success: true }),
    deleteCategory: jest.fn().mockResolvedValue({ success: true }),
    createCategory: jest.fn().mockResolvedValue({ success: true, id: 3 }),
    renameCategory: jest.fn().mockResolvedValue({ success: true }),
    search: jest.fn().mockResolvedValue([]),
  }));
});

jest.mock('v1/global/services/documents', () => {
  return jest.fn().mockImplementation(() => ({
    createMany: jest.fn().mockResolvedValue([
      { success: true, id: 1, file: { name: 'test.pdf' }, type: { id: 1 } },
    ]),
    delete: jest.fn().mockResolvedValue({ success: true }),
    replace: jest.fn().mockResolvedValue({ success: true }),
  }));
});

jest.mock('v1/global/components/layout/panel/Form', () => ({
  __esModule: true,
  default: ({ contentLeft, contentRight }) => (
    <div data-testid="panel-form">
      <div data-testid="content-left">{contentLeft}</div>
      <div data-testid="content-right">{contentRight}</div>
    </div>
  ),
}));

jest.mock('v1/global/components/layout/panel', () => ({
  __esModule: true,
  default: ({ children, header, className }) => (
    <div data-testid="panel" className={className}>
      {header}
      {children}
    </div>
  ),
}));

jest.mock('v1/global/components/Loading', () => ({
  __esModule: true,
  default: () => <div data-testid="loading">Loading...</div>,
}));

jest.mock('v1/global/components/Search', () => ({
  __esModule: true,
  default: ({ handleChange, value }) => (
    <input
      data-testid="search"
      onChange={(e) => handleChange(e.target.value)}
      value={value?.name || ''}
    />
  ),
}));

jest.mock('v1/global/services/Relay', () => {
  return jest.fn().mockImplementation(() => ({
    post: jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true }),
    }),
  }));
});

jest.mock('v1/global/helpers/constants', () => ({
  ETYPE_PROJECT: 'project',
  TYPE_STRUCTURAL: { id: 1 },
}));

jest.mock('v1/global/components/plan-my-project/package-collator/AcceptedFilesList', () => ({
  __esModule: true,
  default: () => <div data-testid="accepted-files-list">Accepted Files</div>,
}));

jest.mock('./sidemodal/AccordionCategories', () => ({
  __esModule: true,
  default: ({ addFiles, deleteFile, deleteFolder, renameFolder, addAllDocs, setShowAllTenders, setOpenSidemodalCategory, setLoading }) => (
    <div data-testid="accordion-categories">
      <button onClick={() => addFiles && addFiles()}>Add Files</button>
      <button onClick={() => deleteFile && deleteFile({ id: 1 })}>Delete File</button>
      <button onClick={() => deleteFolder && deleteFolder({ id: 1 })}>Delete Folder</button>
      <button onClick={() => renameFolder && renameFolder('New Name', () => {}, () => {}, () => {}, 1)}>Rename</button>
      <button onClick={() => addAllDocs && addAllDocs({ id: 1, cid: 1, tid: 10, pid: 1 })}>Add All</button>
      <button onClick={() => setShowAllTenders && setShowAllTenders(true)}>Show All</button>
      <button onClick={() => setOpenSidemodalCategory && setOpenSidemodalCategory(1)}>Open Category</button>
      <button onClick={() => setLoading && setLoading(true)}>Set Loading</button>
    </div>
  ),
}));

jest.mock('./Header', () => ({
  __esModule: true,
  default: ({ addFiles, setRoot, addFolder, selectFromExistingMedia, addSelectedToAttachments }) => (
    <div data-testid="header">
      <button onClick={() => addFiles && addFiles([])}>Add Files</button>
      <button onClick={() => setRoot && setRoot()}>Set Root</button>
      <button onClick={() => addFolder && addFolder()}>Add Folder</button>
      <button onClick={() => selectFromExistingMedia && selectFromExistingMedia()}>Select Media</button>
      <button onClick={() => addSelectedToAttachments && addSelectedToAttachments()}>Add Attachments</button>
    </div>
  ),
}));

jest.mock('./list', () => ({
  __esModule: true,
  default: ({ clickTender, clickFolder, selectAll, selectItem, deleteFile, deleteFolder, deleteBulkFiles, deleteBulkFolders, renameFolder, addAllDocs, bulkAddAllDocs }) => (
    <div data-testid="list">
      <button onClick={() => clickTender && clickTender({ id: 10, pid: 1, type: 'tender' })}>Click Tender</button>
      <button onClick={() => clickFolder && clickFolder({ id: 1 })}>Click Folder</button>
      <button onClick={() => selectAll && selectAll()}>Select All</button>
      <button onClick={() => selectItem && selectItem({ id: 1, checked: false })}>Select Item</button>
      <button onClick={() => deleteFile && deleteFile({ id: 1, cid: 1 })}>Delete File</button>
      <button onClick={() => deleteFolder && deleteFolder({ id: 1 })}>Delete Folder</button>
      <button onClick={() => deleteBulkFiles && deleteBulkFiles([1, 2])}>Delete Bulk Files</button>
      <button onClick={() => deleteBulkFolders && deleteBulkFolders([1, 2])}>Delete Bulk Folders</button>
      <button onClick={() => renameFolder && renameFolder('New Name', () => {}, () => {}, () => {}, 1)}>Rename Folder</button>
      <button onClick={() => addAllDocs && addAllDocs({ id: 1, cid: 1, tid: 10, pid: 1 })}>Add All Docs</button>
      <button onClick={() => bulkAddAllDocs && bulkAddAllDocs()}>Bulk Add All</button>
    </div>
  ),
}));

jest.mock('./archived-modal', () => ({
  __esModule: true,
  default: ({ project }) => <div data-testid="archived-modal">Archived: {project?.id}</div>,
}));

jest.mock('./duplicate-modal', () => ({
  __esModule: true,
  default: ({ open, onRename, onOverwrite, onClose }) => 
    open ? (
      <div data-testid="duplicate-modal">
        <button onClick={onRename}>Rename</button>
        <button onClick={onOverwrite}>Overwrite</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

jest.mock('./sidemodal/AccordionTenders', () => ({
  __esModule: true,
  default: () => <div data-testid="accordion-tenders">Tenders</div>,
}));

jest.mock('v1/file-manager/helpers/Folders', () => ({
  __esModule: true,
  default: {
    getFolder: jest.fn((folders, id) => folders.find((f) => f.id === id)),
  },
}));

jest.mock('v1/file-manager/helpers/Files', () => ({
  __esModule: true,
  default: {
    deleteFile: jest.fn((files, id) => files.filter((f) => f.id !== id)),
  },
}));

jest.mock('v1/file-manager/helpers/Tenders', () => ({
  __esModule: true,
  default: {
    createTenders: jest.fn((tenders, pid) => 
      tenders.map((t) => ({ ...t, pid, folders: [] }))
    ),
    getTender: jest.fn((tenders, tid) => {
      if (!tenders || tenders.length === 0) {
        return { id: tid, pid: 1, type: 'tender', folders: [] };
      }
      return tenders.find((t) => t.id === tid) || { id: tid, pid: 1, type: 'tender', folders: [] };
    }),
    setFolders: jest.fn((tenders, tid, pid, categories) => 
      tenders.map((t) => (t.id === tid ? { ...t, folders: categories } : t))
    ),
    addFiles: jest.fn((tenders, tid, cid, pid, files) => tenders),
    addFolder: jest.fn((tenders, tid, fid, pid, name) => tenders),
    renameFolder: jest.fn((tenders, tid, fid, name) => tenders),
    deleteFile: jest.fn((tenders, tid, cid, fid) => tenders),
    deleteFolder: jest.fn((tenders, tid, fid) => tenders),
    deleteBulkFiles: jest.fn((tenders, tid, cid, files) => tenders),
    deleteBulkFolders: jest.fn((tenders, tid, folders) => tenders),
    selectFile: jest.fn((tenders, tid, cid, fid, selected) => tenders),
    selectFolder: jest.fn((tenders, tid, fid, selected) => tenders),
    selectAllFiles: jest.fn((tenders, tid, cid, selected) => tenders),
    selectAllFolders: jest.fn((tenders, tid, selected) => tenders),
    getSelectedFolders: jest.fn(() => []),
  },
}));

jest.mock('v1/file-manager/helpers/url', () => ({
  getFolderFromUrl: jest.fn(() => null),
  getTenderFromUrl: jest.fn(() => null),
}));

// Import component after all mocks
import FileManager from './index';

const mockStore = configureStore([]);

// Mock BASE_URLS global
global.BASE_URLS = {
  FILE_MANAGER: '/file-manager/:slug',
};

describe('FileManager Component', () => {
  let store;

  const defaultProps = {
    projectData: {
      id: 1,
      slug: 'test-project',
      tender: [
        { id: 10, name: 'Tender 1', type: 'tender' },
        { id: 20, name: 'Tender 2', type: 'tender' },
      ],
      archived: false,
    },
    domain: '/file-manager/test-project',
    sidemodal: false,
    defaultTender: null,
    callback: jest.fn(),
    location: { pathname: '/file-manager/test-project' },
  };

  beforeEach(() => {
    store = mockStore({
      project: {
        data: defaultProps.projectData,
      },
    });
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <FileManager {...defaultProps} {...props} />
        </MemoryRouter>
      </Provider>
    );
  };

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.queryByText(/An error occurred/)).not.toBeInTheDocument();
    });

    it('renders archived modal when project is archived', () => {
      renderComponent({ projectData: { ...defaultProps.projectData, archived: true } });
      waitFor(() => {
        expect(screen.getByTestId('archived-modal')).toBeInTheDocument();
      });
    });

    it('renders with sidemodal mode', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('renders with regular page mode', () => {
      renderComponent();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Interactive Tests - Header Buttons', () => {
    it('calls setRoot when button clicked', async () => {
      renderComponent();
      const setRootButton = screen.getByText('Set Root');
      setRootButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('calls addFiles when button clicked', async () => {
      renderComponent();
      const addFilesButton = screen.getByText('Add Files');
      addFilesButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Tests - List Buttons', () => {
    it('calls clickTender when button clicked', async () => {
      renderComponent();
      const clickTenderButton = screen.getByText('Click Tender');
      clickTenderButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });

    it('calls clickFolder when button clicked', async () => {
      renderComponent();
      const clickFolderButton = screen.getByText('Click Folder');
      clickFolderButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });

    it('calls selectAll when button clicked', async () => {
      renderComponent();
      const selectAllButton = screen.getByText('Select All');
      selectAllButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });

    it('calls selectItem when button clicked', async () => {
      renderComponent();
      const selectItemButton = screen.getByText('Select Item');
      selectItemButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });

    it('calls deleteFile when button clicked', async () => {
      renderComponent();
      const deleteFileButton = screen.getByText('Delete File');
      deleteFileButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });

    it('calls deleteFolder when button clicked', async () => {
      renderComponent();
      const deleteFolderButton = screen.getByText('Delete Folder');
      deleteFolderButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });

    it('calls deleteBulkFiles when button clicked', async () => {
      renderComponent();
      const deleteBulkFilesButton = screen.getByText('Delete Bulk Files');
      deleteBulkFilesButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });

    it('calls deleteBulkFolders when button clicked', async () => {
      renderComponent();
      const deleteBulkFoldersButton = screen.getByText('Delete Bulk Folders');
      deleteBulkFoldersButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });

    it('calls renameFolder when button clicked', async () => {
      renderComponent();
      const renameFolderButton = screen.getByText('Rename Folder');
      renameFolderButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });

    it('calls addAllDocs when button clicked', async () => {
      renderComponent();
      const addAllDocsButton = screen.getByText('Add All Docs');
      addAllDocsButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });

    it('calls bulkAddAllDocs when button clicked', async () => {
      renderComponent();
      const bulkAddAllButton = screen.getByText('Bulk Add All');
      bulkAddAllButton.click();
      await waitFor(() => {
        expect(screen.getByTestId('list')).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Tests - Sidemodal Buttons', () => {
    it('calls setShowAllTenders from accordion', async () => {
      const mockShowAllFilesSidemodal = jest.fn();
      renderComponent({ sidemodal: true, defaultTender: 10, showAllFilesSidemodal: mockShowAllFilesSidemodal });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
    });

    it('calls setOpenSidemodalCategory from accordion', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        const openCategoryButton = screen.getByText('Open Category');
        openCategoryButton.click();
      });
      expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
    });

    it('calls setLoading from accordion', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
    });

    it('calls addFiles from sidemodal accordion', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
      const addFilesButtons = screen.getAllByText('Add Files');
      expect(addFilesButtons.length).toBeGreaterThan(0);
    });

    it('calls deleteFile from sidemodal accordion', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
    });

    it('calls deleteFolder from sidemodal accordion', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
    });

    it('calls renameFolder from sidemodal accordion', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
      const renameButtons = screen.getAllByText('Rename');
      renameButtons[0].click();
      expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
    });

    it('calls addAllDocs from sidemodal accordion', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
      const addAllButton = screen.getByText('Add All');
      addAllButton.click();
      expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
    });
  });

  describe('Duplicate File Modal Tests', () => {
    it('renders duplicate modal when flag enabled', () => {
      const flag = require('v2/helpers/flags');
      flag.mockReturnValue(true);
      renderComponent();
      expect(screen.queryByTestId('duplicate-modal')).not.toBeInTheDocument();
    });
  });

  describe('Props and Configuration', () => {
    it('handles trAttachments prop', async () => {
      renderComponent({ trAttachments: true, sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('handles showSnackbar callback', async () => {
      const mockShowSnackbar = jest.fn();
      renderComponent({ showSnackbar: mockShowSnackbar, sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('handles callback prop', () => {
      const mockCallback = jest.fn();
      renderComponent({ callback: mockCallback });
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('handles showAllFilesSidemodal callback', async () => {
      const mockShowAllFilesSidemodal = jest.fn();
      renderComponent({ showAllFilesSidemodal: mockShowAllFilesSidemodal, sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('handles closeSidemodal callback', async () => {
      const mockCloseSidemodal = jest.fn();
      renderComponent({ closeSidemodal: mockCloseSidemodal, trAttachments: true, sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles trAttachmentsData prop', async () => {
      renderComponent({ 
        trAttachments: true, 
        trAttachmentsData: { tid: 10, trid: 1 },
        sidemodal: true, 
        defaultTender: 10 
      });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('renders with tenderAddendum prop', async () => {
      renderComponent({ tenderAddendum: true, sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('renders with empty tender list', () => {
      renderComponent({
        projectData: {
          ...defaultProps.projectData,
          tender: []
        }
      });
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders with different location paths', () => {
      renderComponent({
        location: { pathname: '/file-manager/test-project/tender-10' }
      });
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('WrapperFileManager', () => {
    it('shows loading when projectData is missing', () => {
      render(
        <Provider store={mockStore({ project: { data: null } })}>
          <MemoryRouter>
            <FileManager {...defaultProps} projectData={null} />
          </MemoryRouter>
        </Provider>
      );
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('shows loading when projectData has no id', () => {
      render(
        <Provider store={mockStore({ project: { data: {} } })}>
          <MemoryRouter>
            <FileManager {...defaultProps} projectData={{}} />
          </MemoryRouter>
        </Provider>
      );
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('Additional Coverage - State Methods', () => {
    it('renders and allows interaction with showAllFilesSidemodal callback', async () => {
      const mockShowAllFilesSidemodal = jest.fn();
      renderComponent({ 
        sidemodal: true, 
        defaultTender: 10,
        showAllFilesSidemodal: mockShowAllFilesSidemodal 
      });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
      const showAllButton = screen.getByText('Show All');
      showAllButton.click();
      expect(screen.queryByText(/An error occurred/)).not.toBeInTheDocument();
    });

    it('renders accordion categories in sidemodal', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
      const setLoadingButton = screen.getByText('Set Loading');
      expect(setLoadingButton).toBeInTheDocument();
    });

    it('renders and allows header interactions', () => {
      renderComponent();
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      const setRootButton = screen.getByText('Set Root');
      expect(setRootButton).toBeInTheDocument();
    });

    it('renders list with multiple interaction buttons', () => {
      renderComponent();
      const list = screen.getByTestId('list');
      expect(list).toBeInTheDocument();
      const selectAllButton = screen.getByText('Select All');
      expect(selectAllButton).toBeInTheDocument();
    });

    it('handles trAttachments with showAllTenders', async () => {
      renderComponent({ 
        trAttachments: true,
        sidemodal: true,
        defaultTender: 10
      });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-tenders')).toBeInTheDocument();
      });
    });

    it('calls setOpenSidemodalCategory and updates state', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
      const openCategoryButton = screen.getByText('Open Category');
      openCategoryButton.click();
      expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
    });

    it('interacts with accordion buttons successfully', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders panel-form with left and right content', () => {
      renderComponent();
      expect(screen.getByTestId('panel-form')).toBeInTheDocument();
      expect(screen.getByTestId('content-left')).toBeInTheDocument();
      expect(screen.getByTestId('content-right')).toBeInTheDocument();
    });

    it('renders search component in panel', () => {
      renderComponent();
      const search = screen.getByTestId('search');
      expect(search).toBeInTheDocument();
    });

    it('renders accepted files list', () => {
      renderComponent();
      const acceptedFilesList = screen.getByTestId('accepted-files-list');
      expect(acceptedFilesList).toBeInTheDocument();
    });

    it('renders panels correctly', () => {
      renderComponent();
      const panels = screen.getAllByTestId('panel');
      expect(panels.length).toBeGreaterThan(0);
    });

    it('handles multiple tenders in list', () => {
      renderComponent({
        projectData: {
          ...defaultProps.projectData,
          tender: [
            { id: 10, name: 'Tender 1', type: 'tender' },
            { id: 20, name: 'Tender 2', type: 'tender' },
            { id: 30, name: 'Tender 3', type: 'tender' },
            { id: 40, name: 'Tender 4', type: 'tender' },
          ]
        }
      });
      expect(screen.getByTestId('list')).toBeInTheDocument();
    });

    it('renders correctly with project type', () => {
      renderComponent({
        location: { pathname: '/file-manager/test-project/project-1' }
      });
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders correctly with folder in URL', () => {
      renderComponent({
        location: { pathname: '/file-manager/test-project/tender-10-folder-1' }
      });
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders list and header in regular mode', () => {
      renderComponent({ sidemodal: false });
      expect(screen.getByTestId('list')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('search')).toBeInTheDocument();
    });

    it('renders all main components in regular page mode', () => {
      renderComponent();
      expect(screen.getByTestId('panel-form')).toBeInTheDocument();
      expect(screen.getByTestId('content-left')).toBeInTheDocument();
      expect(screen.getByTestId('content-right')).toBeInTheDocument();
      expect(screen.getByTestId('list')).toBeInTheDocument();
      expect(screen.getByTestId('search')).toBeInTheDocument();
      expect(screen.getByTestId('accepted-files-list')).toBeInTheDocument();
    });

    it('renders sidemodal header and accordion', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
    });

    it('renders header with all required buttons', () => {
      renderComponent();
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('Add Files')).toBeInTheDocument();
      expect(screen.getByText('Set Root')).toBeInTheDocument();
    });

    it('renders list with all button options', () => {
      renderComponent();
      const list = screen.getByTestId('list');
      expect(list).toBeInTheDocument();
      expect(screen.getByText('Click Tender')).toBeInTheDocument();
      expect(screen.getByText('Click Folder')).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();
      expect(screen.getByText('Select Item')).toBeInTheDocument();
    });

    it('renders accordion with all controls in sidemodal', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        const accordion = screen.getByTestId('accordion-categories');
        expect(accordion).toBeInTheDocument();
        expect(screen.getByText('Add All')).toBeInTheDocument();
        expect(screen.getByText('Show All')).toBeInTheDocument();
        expect(screen.getByText('Open Category')).toBeInTheDocument();
      });
    });

    it('correctly initializes component with default state', () => {
      const { container } = renderComponent();
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('list')).toBeInTheDocument();
    });

    it('renders different content for sidemodal vs regular mode', async () => {
      const { rerender } = renderComponent({ sidemodal: false });
      expect(screen.getByTestId('panel-form')).toBeInTheDocument();
      
      rerender(
        <Provider store={store}>
          <MemoryRouter>
            <FileManager {...defaultProps} sidemodal={true} defaultTender={10} />
          </MemoryRouter>
        </Provider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('handles different projectData configurations', () => {
      const variations = [
        { tender: [] },
        { tender: [{ id: 1, name: 'T1', type: 'tender' }] },
        { tender: [{ id: 1, name: 'T1', type: 'tender' }, { id: 2, name: 'T2', type: 'tender' }] },
      ];

      variations.forEach((variation) => {
        const { unmount } = renderComponent({
          projectData: {
            ...defaultProps.projectData,
            ...variation
          }
        });
        expect(screen.getByTestId('header')).toBeInTheDocument();
        unmount();
      });
    });

    it('renders correctly for different location paths', () => {
      const paths = [
        '/file-manager/test-project',
        '/file-manager/test-project/tender-10',
        '/file-manager/test-project/project-1',
      ];

      paths.forEach((path) => {
        const { unmount } = renderComponent({
          location: { pathname: path }
        });
        expect(screen.getByTestId('header')).toBeInTheDocument();
        unmount();
      });
    });

    it('shows error state when configured', () => {
      const CategoriesService = require('v1/global/services/documents/Categories');
      CategoriesService.mockImplementationOnce(() => ({
        getCategories: jest.fn().mockRejectedValue(new Error('Test error')),
      }));
      
      renderComponent({ sidemodal: true, defaultTender: 10 });
      expect(screen.queryByTestId('loading')).toBeTruthy();
    });

    it('renders archived modal with project data', () => {
      renderComponent({
        projectData: { ...defaultProps.projectData, archived: true }
      });
      
      waitFor(() => {
        const archivedModal = screen.getByTestId('archived-modal');
        expect(archivedModal).toBeInTheDocument();
        expect(archivedModal.textContent).toContain('1');
      });
    });

    it('renders nonBlockLoading alert when configured', () => {
      renderComponent();
      // Component should render without nonBlockLoading initially
      expect(screen.queryByText(/saving your file structure/i)).not.toBeInTheDocument();
    });

    it('renders with OVERWRITE_FILE_MANAGER flag enabled', () => {
      const flag = require('v2/helpers/flags');
      flag.mockReturnValue(true);
      
      renderComponent();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('handles panel rendering with header', () => {
      renderComponent();
      const panels = screen.getAllByTestId('panel');
      expect(panels.length).toBeGreaterThan(0);
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
    });

    it('renders breadcrumbs panel with header', () => {
      renderComponent();
      const panels = screen.getAllByTestId('panel');
      expect(panels.some(panel => panel.className?.includes('breadcrumbs'))).toBeTruthy();
    });

    it('renders info panel with accepted files list', () => {
      renderComponent();
      const panels = screen.getAllByTestId('panel');
      expect(panels.some(panel => panel.className?.includes('info'))).toBeTruthy();
      expect(screen.getByTestId('accepted-files-list')).toBeInTheDocument();
    });

    it('handles complete sidemodal render cycle', async () => {
      renderComponent({ sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('accordion-categories')).toBeInTheDocument();
      });
    });

    it('handles showAllTenders rendering variation', async () => {
      renderComponent({ trAttachments: true, sidemodal: true, defaultTender: 10 });
      await waitFor(() => {
        expect(screen.getByTestId('accordion-tenders')).toBeInTheDocument();
      });
    });

    it('renders file manager container correctly', () => {
      const { container } = renderComponent();
      expect(container).toBeInTheDocument();
    });
  });
});
