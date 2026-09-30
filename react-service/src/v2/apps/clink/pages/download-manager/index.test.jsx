import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

// ----- Translations / mocks for shared collaborators -----
jest.mock('i18next', () => ({
  t: (key, opts) => {
    const translations = {
      'file-name': 'File Name',
      'actions': 'Actions',
      'file': 'File',
      'files': 'Files',
      'download': 'Download',
      'project-specific-documents': 'PROJECT SPECIFIC DOCUMENTS',
      'tender-package-documents': 'PACKAGE SPECIFIC DOCUMENTS',
      'additional-documents': 'ADDITIONAL DOCUMENTS',
      'download-all-documents': 'Download all documents',
      'downloading': 'Downloading',
      'document-downloads-title': 'Document Downloads',
      'document-downloads-description':
        'This page lists all documents referenced by this inquiry or agreement that must be downloaded separately.',
      'document-downloads-title-order': 'Order Downloads',
      'document-downloads-description-order':
        'This page lists all documents referenced by this order that must be downloaded separately.',
      'document-downloads-title-enquiry': 'Enquiry Downloads',
      'document-downloads-description-enquiry':
        'This page lists all documents referenced by this enquiry that must be downloaded separately.',
      'document-downloads-title-addendum': 'Addendum Downloads',
      'document-downloads-description-addendum':
        'This page lists all documents referenced by this addendum that must be downloaded separately.',
      'updated-documents': 'UPDATED DOCUMENTS',
      'new-documents': 'NEW DOCUMENTS',
      'withdrawn-documents': 'WITHDRAWN DOCUMENTS',
      'addendum-label': 'Label',
      'addendum-reference': 'Reference',
      'addendum-issued-at': 'Issued',
      'package_name': 'Package name',
      'failed-to-download-documents': 'Failed to download documents',
      'no-documents-found': 'No documents found',
      'unable-to-download-toast-msg': `Unable to download ${opts?.filename || ''}`,
    };
    return translations[key] || key;
  },
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#FFFFFF',
        clinkLightPurple: '#E5E5F7',
      },
    },
  },
}));

jest.mock('v2/helpers/php-globals', () => ({
  PHPAppClinkGloblals: jest.fn(() => ({ status: 'valid', token: 'fixture-token' })),
}));

jest.mock('v2/helpers/user', () => ({
  getAccountLogo: jest.fn(() => 'https://example.com/logo.png'),
}));

const mockShowSnackbar = jest.fn();
jest.mock('v2/hooks/useSnackbar', () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
}));

jest.mock('js-cookie', () => ({
  get: jest.fn(() => 'cookie-token'),
}));

// MUI Mocks (kept lightweight, just enough to assert render/behaviour)
jest.mock('@mui/material/Box', () => ({ children, ...props }) => (
  <div data-testid="mui-box" {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Container', () => ({ children, ...props }) => (
  <div data-testid="mock-container" {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Typography', () => ({ children, ...props }) => (
  <div data-testid="mui-typography" {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Button', () => ({ children, startIcon, onClick, disabled, ...props }) => (
  <button data-testid="mui-button" onClick={onClick} disabled={disabled} {...props}>
    {startIcon}
    {children}
  </button>
));

jest.mock('@mui/icons-material/FileDownloadOutlined', () => () => <span>DownloadIcon</span>);

jest.mock('@mui/material', () => ({
  Avatar: ({ children, ...props }) => (
    <div data-testid="mui-avatar" {...props}>
      {children}
    </div>
  ),
  CircularProgress: ({ ...props }) => (
    <div data-testid="mui-circular-progress" {...props} />
  ),
  Card: ({ children, ...props }) => (
    <div data-testid="mui-card" {...props}>
      {children}
    </div>
  ),
}));

// Mock subcomponents to surface props on the DOM for assertions.
jest.mock('./DocumentsListing', () => ({ projects, onDownload, downloadingFileId, downloadErrors }) => (
  <div data-testid="documents-listing">
    <div data-testid="dl-projects-count">{projects.length}</div>
    <div data-testid="dl-downloading-file">{downloadingFileId || 'none'}</div>
    <div data-testid="dl-error-count">{Object.keys(downloadErrors || {}).length}</div>
    {projects.map((project) =>
      project.folders?.map((folder) =>
        folder.files?.map((file) => (
          <button
            key={`${project.name}-${folder.name}-${file.id || file.download_id}`}
            data-testid={`dl-download-${file.id || file.download_id}`}
            onClick={() => onDownload?.(file, folder.name, project.name, 'ready')}
          >
            Download {file.name}
          </button>
        ))
      )
    )}
  </div>
));

jest.mock('./DocumentsListingPreview', () => ({ projects, onDownload, state }) => (
  <div data-testid="documents-listing-preview">
    <div data-testid="dlp-projects-count">{projects.length}</div>
    <div data-testid="dlp-state">{state}</div>
    {projects.map((project) =>
      project.folders?.map((folder) =>
        folder.files?.map((file) => (
          <button
            key={`${project.name}-${folder.name}-${file.download_id || file.id}`}
            data-testid={`dlp-download-${file.download_id || file.id}`}
            onClick={() => onDownload?.(file, folder.name, project.name, state)}
          >
            Preview {file.name}
          </button>
        ))
      )
    )}
  </div>
));

jest.mock('./AddendumDocumentsListing', () => ({ projects, onDownload, downloadingFileId, downloadErrors, state }) => (
  <div data-testid="addendum-documents-listing">
    <div data-testid="adl-projects-count">{projects.length}</div>
    <div data-testid="adl-downloading-file">{downloadingFileId ?? 'none'}</div>
    <div data-testid="adl-state">{state}</div>
    {projects.map((project) =>
      project.folders?.map((folder) =>
        folder.files?.map((file) => (
          <button
            key={`${project.sectionType}-${folder.name}-${file.id || file.download_id}`}
            data-testid={`adl-download-${file.id || file.download_id}`}
            data-section={project.sectionType}
            onClick={() => onDownload?.(file, folder.name, project.name, state)}
          >
            Download {file.name}
          </button>
        ))
      )
    )}
  </div>
));

jest.mock('./AccessStateWrapper', () => ({ component: Component, ownerAccountName }) => (
  <div data-testid="access-state-wrapper" data-owner={ownerAccountName}>
    <Component />
  </div>
));

jest.mock('./InvalidPage', () => () => (
  <div data-testid="invalid-page">Invalid Page</div>
));

jest.mock('./RescindedPage', () => () => (
  <div data-testid="rescinded-page">Rescinded Page</div>
));

jest.mock('./CustomDocQueueUI', () => () => (
  <div data-testid="custom-doc-queue-ui">Loading...</div>
));

// Don't mock the asyncThunk or reducer - use the real ones
jest.unmock('v2/store/reducers/clink/download-manager/asyncThunk');
jest.unmock('v2/store/reducers/clink/download-manager');

// The repo ships an auto-applied manual mock for react-redux that breaks
// dispatch (useDispatch returns jest.fn(() => jest.fn())). Use the real one.
jest.unmock('react-redux');
jest.mock('react-redux', () => jest.requireActual('react-redux'));

// Mock httpHelperV2 used by the asyncThunk so we can drive `state` through the store.
jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: jest.fn(),
}));

const { httpHelperV2 } = require('v2/services/httpHelper');

const mockUseParams = jest.fn(() => ({ documentId: '123', context: 'enquiry' }));
jest.mock('react-router', () => ({
  useNavigate: jest.fn(() => jest.fn()),
  useParams: () => mockUseParams(),
}));

jest.mock('react-router-dom', () => ({
  useSearchParams: jest.fn(() => [new URLSearchParams('pid=123')]),
}));

// Import after mocks are configured
import DownloadManager from './index';
import downloadManagerReducer from 'v2/store/reducers/clink/download-manager';

const buildStore = () =>
  configureStore({
    reducer: {
      clinkAccount: () => ({ user: { account_id: 123 } }),
      downloadManager: downloadManagerReducer,
    },
  });

const renderWithStore = () =>
  render(
    <Provider store={buildStore()}>
      <DownloadManager />
    </Provider>
  );

const buildAddendumResponse = (state = 'ready_partial', overrides = {}) => ({
  data: {
    is_addendum: true,
    state,
    addendum: {
      label: 'Addendum 06',
      reference: 'DP',
      package_name: 'Aggregates',
      issued_at: '2026-08-13T21:57:14Z',
      number: 6,
    },
    updated_documents: [
      {
        id: 79451,
        download_id: 'dl-79451',
        name: 'Updated doc.pdf',
        nd: 'ND02',
        downloadable: true,
        source_type: 'project_documents',
      },
    ],
    new_documents: [
      {
        id: 79452,
        download_id: 'dl-79452',
        name: 'New doc.pdf',
        nd: 'ND03',
        downloadable: true,
        source_type: 'project_documents',
      },
    ],
    withdrawn_documents: [
      {
        id: null,
        download_id: null,
        name: 'Withdrawn doc.pdf',
        nd: 'ND02',
        downloadable: false,
        source_type: 'project_documents',
      },
    ],
    additional_documents: {
      folder1: {
        id: 401,
        label: 'Tender Addendum 18/08/26',
        documents: [{ id: 75348, name: 'Tender Addendum', downloadable: true }],
      },
    },
    ...overrides,
  },
});

const buildFullDocumentsResponse = (state = 'ready') => ({
  data: {
    project_documents: {
      nd01: {
        id: 101,
        label: 'ND01',
        documents: [
          { id: 1001, name: 'document1.pdf', download_uri: 'https://example.com/doc1.pdf', download_id: 'dl-1001' },
          { id: 1002, name: 'document2.pdf', download_uri: 'https://example.com/doc2.pdf', download_id: 'dl-1002' },
        ],
      },
    },
    tender_package_documents: {
      id: 201,
      label: 'Tender Package',
      documents: [
        { id: 2001, name: 'tender-doc.pdf', download_uri: 'https://example.com/tender.pdf', download_id: 'dl-2001' },
      ],
    },
    additional_documents: {
      architectural: {
        id: 301,
        label: 'Architectural',
        documents: [
          { id: 3001, name: 'arch-doc.pdf', download_uri: 'https://example.com/arch.pdf', download_id: 'dl-3001' },
        ],
      },
      empty: {
        id: 302,
        label: 'Empty Folder',
        documents: [],
      },
    },
    state,
  },
});

beforeAll(() => {
  global.API = {
    RELAY_URL: 'https://api.test.com/',
    TOKEN_NAME: 'auth-cookie',
  };
});

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();
  global.fetch = jest.fn();
  mockUseParams.mockReturnValue({ documentId: '123', context: 'enquiry' });
  const { PHPAppClinkGloblals } = require('v2/helpers/php-globals');
  PHPAppClinkGloblals.mockReturnValue({ status: 'valid', token: 'fixture-token' });
  httpHelperV2.mockReset();
  mockShowSnackbar.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('DownloadManager - basic rendering', () => {
  it('renders avatar with company logo from getAccountLogo', () => {
    httpHelperV2.mockResolvedValue({ data: null });
    renderWithStore();
    const avatar = screen.getByTestId('mui-avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('alt', 'Company Logo');
  });

  it('fetches account logo on mount with the resolved user account_id', () => {
    httpHelperV2.mockResolvedValue({ data: null });
    const { getAccountLogo } = require('v2/helpers/user');
    renderWithStore();
    expect(getAccountLogo).toHaveBeenCalledWith(123);
  });

  it('does not fetch documents when documentId is missing', () => {
    mockUseParams.mockReturnValue({ documentId: undefined, context: 'enquiry' });
    httpHelperV2.mockResolvedValue({ data: null });
    renderWithStore();
    expect(httpHelperV2).not.toHaveBeenCalled();
  });

  it('does not fetch documents when status is not valid', () => {
    const { PHPAppClinkGloblals } = require('v2/helpers/php-globals');
    PHPAppClinkGloblals.mockReturnValue({ status: 'invalid', ownerAccountName: 'Acme' });
    httpHelperV2.mockResolvedValue({ data: null });
    renderWithStore();
    expect(httpHelperV2).not.toHaveBeenCalled();
  });
});

describe('DownloadManager - access state rendering', () => {
  it('renders InvalidPage when status is invalid', () => {
    const { PHPAppClinkGloblals } = require('v2/helpers/php-globals');
    PHPAppClinkGloblals.mockReturnValue({ status: 'invalid', ownerAccountName: 'Acme' });
    renderWithStore();

    const wrapper = screen.getByTestId('access-state-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute('data-owner', 'Acme');
    expect(screen.getByTestId('invalid-page')).toBeInTheDocument();
    expect(screen.queryByTestId('documents-listing')).not.toBeInTheDocument();
  });

  it('renders RescindedPage when status is rescinded', () => {
    const { PHPAppClinkGloblals } = require('v2/helpers/php-globals');
    PHPAppClinkGloblals.mockReturnValue({ status: 'rescinded', ownerAccountName: 'Acme' });
    renderWithStore();

    expect(screen.getByTestId('rescinded-page')).toBeInTheDocument();
    expect(screen.queryByTestId('documents-listing')).not.toBeInTheDocument();
  });

  it('does not render any access state wrapper when status is valid', async () => {
    httpHelperV2.mockResolvedValue({ data: null });
    renderWithStore();
    await waitFor(() => expect(httpHelperV2).toHaveBeenCalled());
    expect(screen.queryByTestId('invalid-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rescinded-page')).not.toBeInTheDocument();
  });
});

describe('DownloadManager - getPageHeading and getPageDescription', () => {
  beforeEach(() => {
    httpHelperV2.mockResolvedValue({ data: null });
  });

  it.each([
    ['order', 'Order Downloads', 'This page lists all documents referenced by this order that must be downloaded separately.'],
    ['enquiry', 'Enquiry Downloads', 'This page lists all documents referenced by this enquiry that must be downloaded separately.'],
    ['addendum', 'Addendum Downloads', 'This page lists all documents referenced by this addendum that must be downloaded separately.'],
  ])('renders heading and description for %s context', async (context, heading, description) => {
    mockUseParams.mockReturnValue({ documentId: '123', context });
    renderWithStore();

    expect(await screen.findByText(heading)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('renders default heading and description for unknown context', async () => {
    mockUseParams.mockReturnValue({ documentId: '123', context: 'unknown' });
    renderWithStore();

    expect(await screen.findByText('Document Downloads')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This page lists all documents referenced by this inquiry or agreement that must be downloaded separately.'
      )
    ).toBeInTheDocument();
  });

  it('renders default heading when context is undefined', async () => {
    mockUseParams.mockReturnValue({ documentId: '123', context: undefined });
    renderWithStore();
    expect(await screen.findByText('Document Downloads')).toBeInTheDocument();
  });
});

describe('DownloadManager - transformDocumentsData (via render)', () => {
  it('renders DocumentsListing with all three categories transformed for ready state', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('ready'));
    renderWithStore();

    const projectsCount = await screen.findByTestId('dl-projects-count');
    expect(projectsCount).toHaveTextContent('3');
  });

  it('renders no documents fallback when response has no documents', async () => {
    httpHelperV2.mockResolvedValue({ data: { state: 'ready' } });
    renderWithStore();

    expect(await screen.findByText('No documents found')).toBeInTheDocument();
    expect(screen.queryByTestId('documents-listing')).not.toBeInTheDocument();
  });

  it('skips additional_documents when all folders are empty', async () => {
    httpHelperV2.mockResolvedValue({
      data: {
        project_documents: {
          nd01: {
            id: 101,
            label: 'ND01',
            documents: [{ id: 1, name: 'a.pdf' }],
          },
        },
        additional_documents: {
          empty: { id: 302, label: 'Empty Folder', documents: [] },
        },
        state: 'ready',
      },
    });
    renderWithStore();

    const projectsCount = await screen.findByTestId('dl-projects-count');
    expect(projectsCount).toHaveTextContent('1');
  });

  it('only renders project_documents when other categories are missing', async () => {
    httpHelperV2.mockResolvedValue({
      data: {
        project_documents: {
          nd01: {
            id: 101,
            label: 'ND01',
            documents: [{ id: 1, name: 'a.pdf' }],
          },
        },
        state: 'ready',
      },
    });
    renderWithStore();

    const projectsCount = await screen.findByTestId('dl-projects-count');
    expect(projectsCount).toHaveTextContent('1');
  });

  it('only renders tender_package_documents when other categories are missing', async () => {
    httpHelperV2.mockResolvedValue({
      data: {
        tender_package_documents: {
          id: 201,
          label: 'Package',
          documents: [{ id: 2, name: 't.pdf' }],
        },
        state: 'ready',
      },
    });
    renderWithStore();

    const projectsCount = await screen.findByTestId('dl-projects-count');
    expect(projectsCount).toHaveTextContent('1');
  });

  it('only renders additional_documents when other categories are missing', async () => {
    httpHelperV2.mockResolvedValue({
      data: {
        additional_documents: {
          arch: {
            id: 301,
            label: 'Architectural',
            documents: [{ id: 3, name: 'a.pdf' }],
          },
        },
        state: 'ready',
      },
    });
    renderWithStore();

    const projectsCount = await screen.findByTestId('dl-projects-count');
    expect(projectsCount).toHaveTextContent('1');
  });

  it('shows the no-documents fallback message when transformed data is empty', async () => {
    httpHelperV2.mockResolvedValue({ data: { state: 'ready', project_documents: {}, additional_documents: {} } });
    renderWithStore();

    expect(await screen.findByText('No documents found')).toBeInTheDocument();
  });

  it('shows the error message when getDocuments rejects with an error message', async () => {
    httpHelperV2.mockRejectedValue(new Error('API exploded'));
    renderWithStore();

    expect(await screen.findByText('API exploded')).toBeInTheDocument();
  });

  it('shows fallback i18n message when error has no message', async () => {
    httpHelperV2.mockRejectedValue({});
    renderWithStore();

    expect(await screen.findByText('Failed to download documents')).toBeInTheDocument();
  });
});

describe('DownloadManager - loading state', () => {
  it('renders the CustomDocQueueUI while documents are loading', async () => {
    let resolveHttp;
    httpHelperV2.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveHttp = resolve;
        })
    );

    renderWithStore();

    expect(await screen.findByTestId('custom-doc-queue-ui')).toBeInTheDocument();

    await act(async () => {
      resolveHttp({ data: { state: 'ready' } });
    });

    await waitFor(() =>
      expect(screen.queryByTestId('custom-doc-queue-ui')).not.toBeInTheDocument()
    );
  });
});

describe('DownloadManager - data-testid attributes', () => {
  it('renders download-manager-page testid on the page container', async () => {
    httpHelperV2.mockResolvedValue({ data: null });
    renderWithStore();
    await waitFor(() => expect(httpHelperV2).toHaveBeenCalled());
    expect(screen.getByTestId('download-manager-page')).toBeInTheDocument();
  });

  it('renders download-manager-page-title testid on the heading', async () => {
    httpHelperV2.mockResolvedValue({ data: null });
    renderWithStore();
    await waitFor(() => expect(httpHelperV2).toHaveBeenCalled());
    expect(screen.getByTestId('download-manager-page-title')).toBeInTheDocument();
  });

  it('renders download-manager-download-all-btn when state is ready', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('ready'));
    renderWithStore();
    await screen.findByTestId('documents-listing');
    expect(screen.getByTestId('download-manager-download-all-btn')).toBeInTheDocument();
  });

  it('does not render download-manager-download-all-btn in snapshot_preview state', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('snapshot_preview'));
    renderWithStore();
    await screen.findByTestId('documents-listing-preview');
    expect(screen.queryByTestId('download-manager-download-all-btn')).not.toBeInTheDocument();
  });

  it('renders download-manager-empty-message when no documents found', async () => {
    httpHelperV2.mockResolvedValue({ data: { state: 'ready' } });
    renderWithStore();
    expect(await screen.findByTestId('download-manager-empty-message')).toBeInTheDocument();
  });
});

describe('DownloadManager - DocumentsListingPreview rendering', () => {
  it('renders DocumentsListingPreview when state is snapshot_preview', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('snapshot_preview'));
    renderWithStore();

    expect(await screen.findByTestId('documents-listing-preview')).toBeInTheDocument();
    expect(screen.getByTestId('dlp-state')).toHaveTextContent('snapshot_preview');
  });

  it('does not render Download all documents button in snapshot_preview state', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('snapshot_preview'));
    renderWithStore();
    await screen.findByTestId('documents-listing-preview');
    expect(screen.queryByText('Download all documents')).not.toBeInTheDocument();
  });

  it('renders the Download all documents button in ready_partial state', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('ready_partial'));
    renderWithStore();
    expect(await screen.findByText('Download all documents')).toBeInTheDocument();
  });
});

describe('DownloadManager - handleDownloadAll', () => {
  beforeEach(() => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('ready'));
  });

  it('downloads zip when fetch succeeds with Content-Disposition header', async () => {
    const blob = new Blob(['zip-content']);
    global.fetch.mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn((name) =>
          name === 'Content-Disposition' ? 'attachment; filename=archive.zip' : null
        ),
      },
      blob: jest.fn().mockResolvedValue(blob),
    });

    renderWithStore();
    const button = await screen.findByText('Download all documents');

    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/document/123/snapshot/download-all',
        expect.objectContaining({ method: 'GET' })
      );
    });

    expect(linkClick).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    linkClick.mockRestore();
  });

  it('falls back to documentId.zip filename when Content-Disposition is missing', async () => {
    const blob = new Blob(['zip-content']);
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: jest.fn(() => null) },
      blob: jest.fn().mockResolvedValue(blob),
    });

    renderWithStore();
    const button = await screen.findByText('Download all documents');

    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => expect(linkClick).toHaveBeenCalled());
    linkClick.mockRestore();
  });

  it('shows snackbar error when handleDownloadAll fetch fails', async () => {
    global.fetch.mockResolvedValue({ ok: false });

    renderWithStore();
    const button = await screen.findByText('Download all documents');

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith('Download failed', 'error');
    });
  });

  it('uses cookie token as Bearer when config token is missing', async () => {
    const { PHPAppClinkGloblals } = require('v2/helpers/php-globals');
    PHPAppClinkGloblals.mockReturnValue({ status: 'valid' });

    const blob = new Blob(['zip-content']);
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: jest.fn(() => null) },
      blob: jest.fn().mockResolvedValue(blob),
    });

    renderWithStore();
    const button = await screen.findByText('Download all documents');

    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer cookie-token' }),
        })
      );
    });
    linkClick.mockRestore();
  });

  it('ignores subsequent clicks while a download is already in progress', async () => {
    let resolveFetch;
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    renderWithStore();
    const button = await screen.findByText('Download all documents');

    fireEvent.click(button);
    fireEvent.click(button);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch({
        ok: true,
        headers: { get: jest.fn(() => null) },
        blob: jest.fn().mockResolvedValue(new Blob(['x'])),
      });
    });
  });
});

describe('DownloadManager - handleDownload (ready state)', () => {
  beforeEach(() => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('ready'));
  });

  it('downloads a single file successfully when X-Download-Status is downloaded', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn((name) => (name === 'X-Download-Status' ? 'downloaded' : null)),
      },
      blob: jest.fn().mockResolvedValue(new Blob(['file'])),
    });

    renderWithStore();
    const downloadButton = await screen.findByTestId('dl-download-1001');

    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await act(async () => {
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/document/download/1001',
        expect.objectContaining({ method: 'GET' })
      );
    });
    expect(linkClick).toHaveBeenCalled();
    linkClick.mockRestore();
  });

  it('shows snackbar error when X-Download-Status is not "downloaded"', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: jest.fn(() => 'queued') },
    });

    renderWithStore();
    const downloadButton = await screen.findByTestId('dl-download-1001');

    await act(async () => {
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('Unable to download'),
        'error'
      );
    });
  });

  it('shows snackbar error when fetch fails', async () => {
    global.fetch.mockResolvedValue({ ok: false });

    renderWithStore();
    const downloadButton = await screen.findByTestId('dl-download-1001');

    await act(async () => {
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('Unable to download'),
        'error'
      );
    });
  });

  it('shows snackbar without folder label when folderLabel is empty', async () => {
    global.fetch.mockResolvedValue({ ok: false });

    httpHelperV2.mockResolvedValue({
      data: {
        project_documents: {
          nd01: {
            id: 101,
            label: '',
            documents: [{ id: 9999, name: 'orphan.pdf' }],
          },
        },
        state: 'ready',
      },
    });

    renderWithStore();
    const downloadButton = await screen.findByTestId('dl-download-9999');

    await act(async () => {
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('Unable to download'),
        'error'
      );
    });
  });
});

describe('DownloadManager - handleDownload (edge cases)', () => {
  it('uses fallback filename when file has no name on success (ready state)', async () => {
    httpHelperV2.mockResolvedValue({
      data: {
        project_documents: {
          nd01: {
            id: 101,
            label: 'ND01',
            documents: [{ id: 5005, download_id: 'dl-5005' }],
          },
        },
        state: 'ready',
      },
    });

    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: jest.fn(() => 'downloaded') },
      blob: jest.fn().mockResolvedValue(new Blob(['file'])),
    });

    renderWithStore();
    const downloadButton = await screen.findByTestId('dl-download-5005');

    let capturedLink;
    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      capturedLink = this;
    });

    await act(async () => {
      fireEvent.click(downloadButton);
    });

    await waitFor(() => expect(linkClick).toHaveBeenCalled());
    expect(capturedLink.download).toMatch(/^document-/);
    linkClick.mockRestore();
  });

  it('does not start a duplicate download for the same file id while in flight', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('ready'));

    let resolveFetch;
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    renderWithStore();
    const downloadButton = await screen.findByTestId('dl-download-1001');

    fireEvent.click(downloadButton);
    fireEvent.click(downloadButton);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch({
        ok: true,
        headers: { get: jest.fn(() => 'downloaded') },
        blob: jest.fn().mockResolvedValue(new Blob(['x'])),
      });
    });
  });

  it('does not start a duplicate download for the same download_id during snapshot_preview', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('snapshot_preview'));

    let resolveFetch;
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    renderWithStore();
    const downloadButton = await screen.findByTestId('dlp-download-dl-1001');

    fireEvent.click(downloadButton);
    fireEvent.click(downloadButton);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch({
        ok: true,
        headers: { get: jest.fn(() => 'downloaded') },
        blob: jest.fn().mockResolvedValue(new Blob(['x'])),
      });
    });
  });

  it('handles project_documents folder with no documents array (default to empty)', async () => {
    httpHelperV2.mockResolvedValue({
      data: {
        project_documents: {
          empty: { id: 101, label: 'Empty' },
        },
        state: 'ready',
      },
    });

    renderWithStore();
    const projectsCount = await screen.findByTestId('dl-projects-count');
    expect(projectsCount).toHaveTextContent('1');
  });
});

describe('DownloadManager - handleDownload (snapshot_preview state)', () => {
  it('uses preview-mode endpoint for project documents in snapshot_preview', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('snapshot_preview'));
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: jest.fn(() => 'downloaded') },
      blob: jest.fn().mockResolvedValue(new Blob(['file'])),
    });

    renderWithStore();
    const downloadButton = await screen.findByTestId('dlp-download-dl-1001');

    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await act(async () => {
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      const url = global.fetch.mock.calls[0][0];
      expect(url).toContain('document/123/preview-mode/download');
      expect(url).toContain('category=project_documents');
      expect(url).toContain('folder=ND01');
      expect(url).toContain('file=dl-1001');
    });
    linkClick.mockRestore();
  });

  it('uses preview-mode endpoint for tender package documents in snapshot_preview', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('snapshot_preview'));
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: jest.fn(() => 'downloaded') },
      blob: jest.fn().mockResolvedValue(new Blob(['file'])),
    });

    renderWithStore();
    const downloadButton = await screen.findByTestId('dlp-download-dl-2001');

    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await act(async () => {
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      const url = global.fetch.mock.calls[0][0];
      expect(url).toContain('category=tender_package_documents');
      expect(url).toContain('file=dl-2001');
    });
    linkClick.mockRestore();
  });

  it('uses regular download endpoint for additional documents in snapshot_preview', async () => {
    httpHelperV2.mockResolvedValue(buildFullDocumentsResponse('snapshot_preview'));
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: jest.fn(() => 'downloaded') },
      blob: jest.fn().mockResolvedValue(new Blob(['file'])),
    });

    renderWithStore();
    const downloadButton = await screen.findByTestId('dlp-download-dl-3001');

    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await act(async () => {
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      const url = global.fetch.mock.calls[0][0];
      expect(url).toBe('https://api.test.com/document/download/3001');
    });
    linkClick.mockRestore();
  });
});

describe('DownloadManager - addendum rendering', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ documentId: '123', context: 'addendum' });
  });

  it('renders AddendumDocumentsListing instead of DocumentsListing for addendum responses', async () => {
    httpHelperV2.mockResolvedValue(buildAddendumResponse('ready_partial'));

    renderWithStore();

    expect(await screen.findByTestId('addendum-documents-listing')).toBeInTheDocument();
    expect(screen.queryByTestId('documents-listing')).not.toBeInTheDocument();
    expect(screen.getByTestId('adl-projects-count')).toHaveTextContent('4');
  });

  it('shows addendum page title and description', async () => {
    httpHelperV2.mockResolvedValue(buildAddendumResponse('ready_partial'));

    renderWithStore();

    expect(await screen.findByText('Addendum Downloads')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This page lists all documents referenced by this addendum that must be downloaded separately.'
      )
    ).toBeInTheDocument();
  });

  it('renders addendum metadata with formatted issued date', async () => {
    httpHelperV2.mockResolvedValue(buildAddendumResponse('ready_partial'));

    renderWithStore();

    expect(await screen.findByText(/Label:/)).toBeInTheDocument();
    expect(screen.getByText(/Addendum 06/)).toBeInTheDocument();
    expect(screen.getByText(/Reference:/)).toBeInTheDocument();
    expect(screen.getByText(/DP/)).toBeInTheDocument();
    expect(screen.getByText(/Package name:/)).toBeInTheDocument();
    expect(screen.getByText(/Aggregates/)).toBeInTheDocument();
    expect(screen.getByText(/Issued:/)).toBeInTheDocument();
    expect(screen.getByText(/13\/08\/2026, 21:57/)).toBeInTheDocument();
  });

  it('renders dash for null addendum metadata fields', async () => {
    httpHelperV2.mockResolvedValue(
      buildAddendumResponse('ready_partial', {
        addendum: {
          label: null,
          reference: null,
          package_name: null,
          issued_at: null,
        },
      })
    );

    renderWithStore();

    await screen.findByTestId('addendum-documents-listing');

    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it('shows no documents found when addendum has no document sections', async () => {
    httpHelperV2.mockResolvedValue(
      buildAddendumResponse('ready_partial', {
        updated_documents: [],
        new_documents: [],
        withdrawn_documents: [],
        additional_documents: {},
      })
    );

    renderWithStore();

    expect(await screen.findByText('No documents found')).toBeInTheDocument();
    expect(screen.queryByTestId('addendum-documents-listing')).not.toBeInTheDocument();
  });

  it('omits empty addendum sections from transformed projects', async () => {
    httpHelperV2.mockResolvedValue(
      buildAddendumResponse('ready_partial', {
        new_documents: [],
        withdrawn_documents: [],
        additional_documents: {},
      })
    );

    renderWithStore();

    expect(await screen.findByTestId('adl-projects-count')).toHaveTextContent('1');
  });
});

describe('DownloadManager - addendum handleDownload', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ documentId: '123', context: 'addendum' });
  });

  it('downloads addendum files via regular endpoint in ready_partial state', async () => {
    httpHelperV2.mockResolvedValue(buildAddendumResponse('ready_partial'));
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: jest.fn((name) => (name === 'X-Download-Status' ? 'downloaded' : null)) },
      blob: jest.fn().mockResolvedValue(new Blob(['file'])),
    });

    renderWithStore();
    const downloadButton = await screen.findByTestId('adl-download-79451');

    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/document/download/79451',
        expect.objectContaining({ method: 'GET' })
      );
    });
    linkClick.mockRestore();
  });

  it('uses source_type for preview-mode download in snapshot_preview addendum', async () => {
    httpHelperV2.mockResolvedValue(buildAddendumResponse('snapshot_preview'));
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: jest.fn(() => 'downloaded') },
      blob: jest.fn().mockResolvedValue(new Blob(['file'])),
    });

    renderWithStore();
    const downloadButton = await screen.findByTestId('adl-download-79451');

    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    fireEvent.click(downloadButton);

    await waitFor(() => {
      const url = global.fetch.mock.calls[0][0];
      expect(url).toContain('document/123/preview-mode/download');
      expect(url).toContain('category=project_documents');
      expect(url).toContain('folder=ND02');
      expect(url).toContain('file=dl-79451');
    });
    linkClick.mockRestore();
  });

  it('uses regular download endpoint for additional documents in snapshot_preview addendum', async () => {
    httpHelperV2.mockResolvedValue(buildAddendumResponse('snapshot_preview'));
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: jest.fn(() => 'downloaded') },
      blob: jest.fn().mockResolvedValue(new Blob(['file'])),
    });

    renderWithStore();
    const downloadButton = await screen.findByTestId('adl-download-75348');

    const linkClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    fireEvent.click(downloadButton);

    await waitFor(() => {
      const url = global.fetch.mock.calls[0][0];
      expect(url).toBe('https://api.test.com/document/download/75348');
    });
    linkClick.mockRestore();
  });
});
