import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';

jest.mock('v1/global', () => ({}));
jest.mock('v1/document-creator/public/styles/index.scss', () => ({}), {
  virtual: true,
});

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: { t: jest.fn((key) => key) },
}));

jest.mock('v1/global/services/Relay', () =>
  jest.fn().mockImplementation((action, method) => {
    const responses = {
      'tender.fetch': { project_id: 1 },
      'project.getOne': { id: 1, slug: 'test-project', name: 'Test Project', tender: [] },
      'template.config': { data: [], slug: '' },
      'template.getContent': { content: [], meta: {}, has_boq: false },
      'document.getContent': { content: [], meta: {}, has_boq: false },
      'number_document.fetchAll': { list: [] },
    };
    const response = responses[`${action}.${method}`] ?? {};
    return {
      getJson: jest.fn().mockResolvedValue(response),
      get: jest.fn().mockResolvedValue(response),
      post: jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue(response) }),
      patch: jest.fn().mockResolvedValue(response),
    };
  }),
);

jest.mock('v2/store/reducers/actions', () => ({
  __esModule: true,
  default: {
    clink: {
      setSlug: jest.fn((payload) => ({ type: 'mock/setSlug', payload })),
      setProjectName: jest.fn((payload) => ({ type: 'mock/setProjectName', payload })),
      fetchApproversWithLevels: jest.fn(() => ({
        type: 'mock/fetchApproversWithLevels',
        payload: [],
      })),
      assignedApproversforDocument: jest.fn(() => ({
        type: 'mock/assignedApproversforDocument',
        payload: null,
      })),
      assignedApproversTenderInquiry: jest.fn(() => ({
        type: 'mock/assignedApproversTenderInquiry',
        payload: null,
      })),
      acknowledgeRejectionFeedback: jest.fn((payload) => ({
        type: 'mock/acknowledgeRejectionFeedback',
        payload,
        unwrap: jest.fn().mockResolvedValue({ success: true }),
      })),
    },
  },
}));

jest.mock('v1/global/services/documents/Categories', () =>
  jest.fn().mockImplementation(() => ({
    getCategories: jest.fn().mockResolvedValue([]),
  })),
);

jest.mock('v1/global/services/documents/DocumentCreatorSend', () =>
  jest.fn().mockImplementation(() => ({})),
);

jest.mock('services/helpers', () => ({ postData: jest.fn() }));

jest.mock('v1/file-manager/helpers/Tenders', () => ({
  __esModule: true,
  default: {
    getTender: jest.fn(() => null),
    createTenders: jest.fn(() => []),
    setFolders: jest.fn(() => []),
  },
}));

jest.mock('v2/apps/shared/components/send-document-modal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('v1/document-creator/components/page', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="page-mock">{children}</div>,
}));

jest.mock('./form-config', () => ({
  __esModule: true,
  default: () => <div data-testid="form-config-mock" />,
}));

jest.mock('./signature-section', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./WitnessForm', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./ErrorContent', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./docusign/DocHeader', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./pdf', () => ({
  __esModule: true,
  default: () => <div data-testid="pdf-mock" />,
}));

jest.mock('v2/apps/clink/pages/orders/subcontractors/modal', () => ({
  __esModule: true,
  default: ({ open, children }) => (open ? children : null),
}));

jest.mock('v1/document-creator/components/page/FileManagerModal', () =>
  jest.fn(() => <div data-testid="file-manager-modal-mock" />),
);

// eslint-disable-next-line import/first
import DocumentCreator, { getAssignedApprovers } from './index';
// eslint-disable-next-line import/first
import FileManagerModal from 'v1/document-creator/components/page/FileManagerModal';

describe('DocumentCreator (Edit Tender Template)', () => {
  const mockStore = configureStore([]);

  const renderComponent = (props = {}) => {
    const store = mockStore({
      project: {},
      clinkAccount: { id: 1 },
    });

    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/document-creator/template/123/tender/456']}>
          <Routes>
            <Route
              path="/document-creator/template/:templateId/tender/:tenderId"
              element={<DocumentCreator docType="tender" showForm {...props} />}
            />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
  };

  beforeEach(() => {
    FileManagerModal.mockClear();
  });

  it('mounts without crashing and renders the page shell', async () => {
    renderComponent();

    expect(await screen.findByTestId('page-mock')).toBeInTheDocument();
  });

  it('threads a stable testIdSuffix into the standalone FileManagerModal ("Open Appendix") instance', async () => {
    renderComponent();

    await waitFor(() => expect(FileManagerModal).toHaveBeenCalled());

    const call = FileManagerModal.mock.calls.find(
      ([props]) => props.testIdSuffix === 'appendix',
    );
    expect(call).toBeDefined();
  });
});

describe('getAssignedApprovers', () => {
  it('returns an empty array when there are no approvals', () => {
    expect(getAssignedApprovers(null)).toEqual([]);
    expect(getAssignedApprovers(undefined)).toEqual([]);
    expect(getAssignedApprovers({})).toEqual([]);
  });

  it('flattens a multi-level (isLevel) array of levels and attaches levelStatus to each approver', () => {
    const rawAssigned = {
      isLevel: true,
      approvals: [
        {
          level: 0,
          status: 'in_progress',
          approvers: [
            { id: 1, user_id: 10, status: { label: 'Pending' } },
            { id: 2, user_id: 20, status: { label: 'Approved' } },
          ],
        },
        {
          level: 1,
          status: 'pending',
          approvers: [{ id: 3, user_id: 30, status: { label: 'Pending' } }],
        },
      ],
    };

    expect(getAssignedApprovers(rawAssigned)).toEqual([
      { id: 1, user_id: 10, status: { label: 'Pending' }, levelStatus: 'in_progress' },
      { id: 2, user_id: 20, status: { label: 'Approved' }, levelStatus: 'in_progress' },
      { id: 3, user_id: 30, status: { label: 'Pending' }, levelStatus: 'pending' },
    ]);
  });

  it('flattens a multi-level (isLevel) object map of levels and attaches levelStatus to each approver', () => {
    const rawAssigned = {
      isLevel: true,
      approvals: {
        0: {
          status: 'rejected',
          approvers: [{ id: 1, user_id: 10, status: { label: 'Rejected' } }],
        },
      },
    };

    expect(getAssignedApprovers(rawAssigned)).toEqual([
      { id: 1, user_id: 10, status: { label: 'Rejected' }, levelStatus: 'rejected' },
    ]);
  });

  it('treats a level with no approvers as contributing nothing', () => {
    const rawAssigned = {
      isLevel: true,
      approvals: [{ level: 0, status: 'in_progress' }],
    };

    expect(getAssignedApprovers(rawAssigned)).toEqual([]);
  });

  it('returns a flat array as-is for the legacy (non-level) shape', () => {
    const rawAssigned = {
      isLevel: false,
      approvals: [{ id: 1, approver_user_id: 10, status: { label: 'Pending' } }],
    };

    expect(getAssignedApprovers(rawAssigned)).toEqual(rawAssigned.approvals);
  });

  it('flattens a legacy object map of levels without isLevel set', () => {
    const rawAssigned = {
      approvals: {
        0: { approvers: [{ id: 1, approver_user_id: 10 }] },
      },
    };

    expect(getAssignedApprovers(rawAssigned)).toEqual([
      { id: 1, approver_user_id: 10 },
    ]);
  });
});
