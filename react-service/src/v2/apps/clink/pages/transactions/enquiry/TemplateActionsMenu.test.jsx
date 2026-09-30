// Mock external dependencies BEFORE any imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

const mockSetOpenContactsModal = jest.fn((payload) => ({
  type: 'contacts/setOpenContactsModal',
  payload,
}));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      setOpenContactsModal: mockSetOpenContactsModal,
    },
  }),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TemplateActionsMenu from './TemplateActionsMenu';

describe('TemplateActionsMenu', () => {
  let mockStore;
  let mockDispatch;

  const mockTemplate = {
    id: 75298,
    name: 'Tender Addendum',
    final_status: 'Pending Approval',
  };

  const mockTemplateLogs = [
    {
      id: 1,
      user_id: 23030,
      entity_type: 'tender_inquiry_approval',
      entity_id: 75298,
      type: 'Approved',
      meta: '{"message":"Tender Inquiry Approved","user":"John Doe"}',
      created_at: '2026-01-28T12:01:35.000000Z',
      updated_at: '2026-01-28T12:01:35.000000Z',
    },
  ];

  const mockOnTemplateDelete = jest.fn();

  const mockEnquiries = {
    21734: {
      history: [
        {
          author_id: 21734,
          created_at: '2026-01-27 07:56:07',
          status_id: 10,
          specialist_id: 21734,
          meta: '""',
        },
        {
          author_id: 1,
          created_at: '2026-01-27 07:56:32',
          status_id: 1,
          specialist_id: 21734,
          meta: '{"document":{"21734":[]},"enquiry":75294,"is_tender_addendum":false,"email_sent_to":"test@example.com"}',
        },
      ],
      archived: false,
      last_status: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetOpenContactsModal.mockClear();
    jest.useFakeTimers();

    // Create a more realistic mock dispatch that returns a proper promise
    mockDispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        // For thunk actions, execute them and return the result
        return Promise.resolve({ payload: { success: true }, type: 'test/fulfilled' });
      }
      return Promise.resolve({ payload: { success: true }, type: action.type });
    });

    mockStore = configureStore({
      reducer: {
        project: (state = {}) => state,
        tenderInquiry: (state = {}) => state,
        contacts: (state = { open: false }) => state,
      },
    });

    mockStore.dispatch = mockDispatch;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockOnViewLogs = jest.fn();

  const renderWithStore = (template = mockTemplate, logs = mockTemplateLogs, enquiries = mockEnquiries) => {
    return render(
      <Provider store={mockStore}>
        <TemplateActionsMenu
          template={template}
          pid="123"
          tid="456"
          onTemplateDelete={mockOnTemplateDelete}
          templateLogs={logs}
          enquiries={enquiries}
          onViewLogs={mockOnViewLogs}
        />
      </Provider>
    );
  };

  it('renders menu icon button', () => {
    renderWithStore();

    expect(screen.getByTestId('more-vert-icon')).toBeInTheDocument();
  });

  it('opens menu when icon clicked', () => {
    renderWithStore();

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('edit-tender')).toBeInTheDocument();
  });

  it('displays edit option for templates not approved', () => {
    renderWithStore({ ...mockTemplate, final_status: 'Draft' });

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('edit-tender')).toBeInTheDocument();
  });

  it('does not display edit option for approved templates', () => {
    renderWithStore({ ...mockTemplate, final_status: 'Approved' });

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    expect(screen.queryByText('edit-tender')).not.toBeInTheDocument();
  });

  it('displays send option for approved templates', () => {
    renderWithStore({ ...mockTemplate, final_status: 'Approved' });

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('send-tender')).toBeInTheDocument();
  });

  it('displays delete option for non-sent templates', () => {
    renderWithStore({ ...mockTemplate, final_status: 'Draft' });

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('delete-tender')).toBeInTheDocument();
  });

  it('does not display delete option for sent templates', () => {
    renderWithStore({ ...mockTemplate, final_status: 'Sent' });

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    expect(screen.queryByText('delete-tender')).not.toBeInTheDocument();
  });

  it('displays view logs option', () => {
    renderWithStore();

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('view-logs')).toBeInTheDocument();
  });

  it('calls onViewLogs with the template when view logs clicked', () => {
    renderWithStore();

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    const viewLogsButton = screen.getByText('view-logs');
    fireEvent.click(viewLogsButton);

    expect(mockOnViewLogs).toHaveBeenCalledWith(mockTemplate);
    // Menu should close after triggering the callback
    expect(screen.queryByText('view-logs')).not.toBeInTheDocument();
  });

  it('closes menu after delete action', () => {
    renderWithStore({ ...mockTemplate, final_status: 'Draft' });

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    const deleteButton = screen.getByText('delete-tender');
    fireEvent.click(deleteButton);

    // Menu should close
    expect(screen.queryByText('edit-tender')).not.toBeInTheDocument();
  });

  it('shows send tender option for approved templates', () => {
    const approvedTemplate = {
      ...mockTemplate,
      final_status: 'Approved',
    };

    renderWithStore(approvedTemplate);

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('send-tender')).toBeInTheDocument();
  });

  it('sends tender using existing Redux state subcontractors when available', async () => {
    const existingSubcontractors = [
      {
        name: 'Existing Company',
        email: 'existing@example.com',
        sub_id: 21734,
        type: 'Enquiry',
        status: { id: 1, uid: 'sent' },
        last_action: { author_id: 1, created_at: '2026-01-27 07:56:32' },
      },
    ];

    // Reset mockDispatch to ensure clean state
    mockDispatch.mockClear();

    // Configure store with existing subcontractors in Redux state
    const testStore = configureStore({
      reducer: {
        project: (state = {}) => state,
        tenderInquiry: (state = {}) => state,
        contacts: (state = { open: { subcontractors: existingSubcontractors } }) => state,
      },
    });
    testStore.dispatch = mockDispatch;

    const templateWithApproved = {
      ...mockTemplate,
      final_status: 'Approved',
    };

    render(
      <Provider store={testStore}>
        <TemplateActionsMenu
          template={templateWithApproved}
          pid="123"
          tid="456"
          onTemplateDelete={mockOnTemplateDelete}
          templateLogs={mockTemplateLogs}
          enquiries={mockEnquiries}
        />
      </Provider>
    );

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    const sendTenderButton = screen.getByText('send-tender');
    fireEvent.click(sendTenderButton);

    // Verify setOpenContactsModal was called
    expect(mockSetOpenContactsModal).toHaveBeenCalledTimes(1);
    
    // Verify the payload uses existing subcontractors from Redux state
    const callArgs = mockSetOpenContactsModal.mock.calls[0][0];
    expect(callArgs).toMatchObject({
      pid: '123',
      tid: '456',
      did: templateWithApproved.id,
      tenderAddendum: false,
    });
    expect(callArgs.subcontractors).toEqual(existingSubcontractors);
  });

  it('sends tender with empty subcontractors when Redux state is empty', async () => {
    const templateWithSubcontractors = {
      ...mockTemplate,
      final_status: 'Approved',
      sent_to_subcontractors: [
        {
          id: 21734,
          name: 'Test Company',
          email: 'test@example.com',
        },
      ],
    };

    renderWithStore(templateWithSubcontractors);

    const menuButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(menuButton);

    const sendTenderButton = screen.getByText('send-tender');
    fireEvent.click(sendTenderButton);

    // Verify setOpenContactsModal was called
    expect(mockSetOpenContactsModal).toHaveBeenCalledTimes(1);
    
    // Verify the payload has correct structure
    const callArgs = mockSetOpenContactsModal.mock.calls[0][0];
    expect(callArgs).toMatchObject({
      pid: '123',
      tid: '456',
      did: templateWithSubcontractors.id,
      tenderAddendum: false,
    });
    
    // Since Redux state is empty and enquiries building is removed,
    // subcontractors should be an empty array
    expect(callArgs.subcontractors).toEqual([]);
  });

});
