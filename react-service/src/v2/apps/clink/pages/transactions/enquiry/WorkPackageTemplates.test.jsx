import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorkPackageTemplates from './WorkPackageTemplates';

// Mock external dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('v2/apps/clink/pages/orders/Mui.Components', () => ({
  themeTable: {},
}));

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(() => ({ unwrap: () => Promise.resolve({}) })),
  useSelector: (selector) => selector({ clinkAccount: { user: { id: 1 } } }),
}));

jest.mock('v2/apps/shared/components/logs-modal', () => {
  return function MockLogsModal() {
    return null;
  };
});

jest.mock('v2/apps/shared/components/approval-expandable-panel', () => {
  return function MockApprovalExpandablePanel({ levels, entity_id }) {
    return (
      <div data-testid="approval-expandable-panel" data-entity-id={entity_id}>
        {levels?.map((level) =>
          level.approvers.map((approver) => (
            <div key={approver.id}>{approver.approver_user?.display_name}</div>
          )),
        )}
      </div>
    );
  };
});

jest.mock('./TemplateActionsMenu', () => {
  return function MockTemplateActionsMenu({ template, templateLogs, enquiries }) {
    return (
      <div data-testid="template-actions-menu">
        <button data-testid={`menu-${template.id}`}>Actions</button>
        <div data-testid="logs-count">{templateLogs?.length || 0}</div>
        <div data-testid="enquiries-count">{Object.keys(enquiries || {}).length}</div>
      </div>
    );
  };
});

jest.mock('v1/global/public/images/svg/icon-view.svg', () => 'svg');

jest.mock('moment', () => () => ({
  format: () => '01/01/2024 12:00',
}));

jest.mock('@mui/material', () => {
  const React = require('react');
  return {
    ...jest.requireActual('@mui/material'),
    Collapse: ({ children, in: isOpen }) => (
      isOpen ? <div data-testid="collapse">{children}</div> : null
    ),
  };
});

describe('WorkPackageTemplates', () => {
  const mockOnTemplateDelete = jest.fn();
  const mockTemplates = {
    75298: {
      id: 75298,
      name: 'Tender Addendum',
      status: 0,
      created_at: '2026-01-27 14:15:50',
      approval_info: {
        status: 'Rejected',
        approver_name: 'John Doe',
        approver_email: 'john@example.com',
        approver_title: 'Manager',
        requested_on: '2026-01-27 14:16:02',
      },
      final_status: 'Rejected',
      sent_date: '-',
      sent_to_subcontractors: [{ name: 'Company A' }],
    },
    75299: {
      id: 75299,
      name: 'Invitation to Tender',
      status: 1,
      created_at: '2026-01-27 14:21:29',
      approval_info: [],
      final_status: 'Draft',
      sent_date: '2026-01-28 10:00:00',
      sent_to_subcontractors: '-',
    },
  };

  const mockTemplateLogs = [
    {
      id: 1,
      entity_id: 75298,
      type: 'Rejected',
      meta: '{"user":"Admin"}',
      updated_at: '2026-01-27T14:17:38.000000Z',
    },
  ];

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
      ],
      archived: false,
      last_status: 1,
    },
  };

  const mockApproversData = {
    75298: {
      isLevel: false,
      approvals: [
        {
          id: 1,
          user: {
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com',
            account_role_label: 'Manager',
          },
          status: { label: 'Rejected' },
          created_at: '2026-01-27 14:16:02',
          updated_at: '2026-01-27 14:16:02',
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table with templates', () => {
    render(
      <WorkPackageTemplates
        templates={mockTemplates}
        pid="123"
        tid="456"
        onTemplateDelete={mockOnTemplateDelete}
        templateLogs={mockTemplateLogs}
        enquiries={mockEnquiries}
      />
    );

    expect(screen.getByText('document-type')).toBeInTheDocument();
    expect(screen.getByText('company')).toBeInTheDocument();
    expect(screen.getByText('created')).toBeInTheDocument();
    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByText('sent-date')).toBeInTheDocument();
    expect(screen.getByText('actions')).toBeInTheDocument();
  });

  it('displays template data correctly', () => {
    render(
      <WorkPackageTemplates
        templates={mockTemplates}
        pid="123"
        tid="456"
        onTemplateDelete={mockOnTemplateDelete}
        templateLogs={mockTemplateLogs}
        enquiries={mockEnquiries}
      />
    );

    expect(screen.getByText('Tender Addendum')).toBeInTheDocument();
    expect(screen.getByText('Invitation to Tender')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows "-" for missing sent_date', () => {
    render(
      <WorkPackageTemplates
        templates={mockTemplates}
        pid="123"
        tid="456"
        onTemplateDelete={mockOnTemplateDelete}
        templateLogs={mockTemplateLogs}
        enquiries={mockEnquiries}
      />
    );

    const rows = screen.getAllByText('-');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('expands approval info panel when button clicked', () => {
    render(
      <WorkPackageTemplates
        templates={mockTemplates}
        pid="123"
        tid="456"
        onTemplateDelete={mockOnTemplateDelete}
        templateLogs={mockTemplateLogs}
        enquiries={mockEnquiries}
        approversData={mockApproversData}
      />
    );

    // Find and click the expand button
    const expandButtons = screen.getAllByRole('button', { name: /expand row/i });
    fireEvent.click(expandButtons[0]);

    // Check if approval expandable panel is visible
    expect(screen.getByTestId('approval-expandable-panel')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('does not show expand button for templates without approval info', () => {
    const templatesWithoutApproval = {
      75299: mockTemplates[75299],
    };

    render(
      <WorkPackageTemplates
        templates={templatesWithoutApproval}
        pid="123"
        tid="456"
        onTemplateDelete={mockOnTemplateDelete}
        templateLogs={[]}
        enquiries={mockEnquiries}
      />
    );

    const expandButtons = screen.queryAllByRole('button', { name: /expand row/i });
    expect(expandButtons).toHaveLength(0);
  });

  it('renders actions menu for each template', () => {
    render(
      <WorkPackageTemplates
        templates={mockTemplates}
        pid="123"
        tid="456"
        onTemplateDelete={mockOnTemplateDelete}
        templateLogs={mockTemplateLogs}
        enquiries={mockEnquiries}
      />
    );

    expect(screen.getByTestId('menu-75298')).toBeInTheDocument();
    expect(screen.getByTestId('menu-75299')).toBeInTheDocument();
  });

  it('shows empty state when no templates provided', () => {
    render(
      <WorkPackageTemplates
        templates={{}}
        pid="123"
        tid="456"
        onTemplateDelete={mockOnTemplateDelete}
        templateLogs={[]}
        enquiries={mockEnquiries}
      />
    );

    expect(screen.getByText('no-templates-available')).toBeInTheDocument();
  });

  it('displays company name for array of subcontractors', () => {
    render(
      <WorkPackageTemplates
        templates={mockTemplates}
        pid="123"
        tid="456"
        onTemplateDelete={mockOnTemplateDelete}
        templateLogs={mockTemplateLogs}
        enquiries={mockEnquiries}
      />
    );

    expect(screen.getByText('Company A')).toBeInTheDocument();
  });

  it('collapses approval panel when expand button clicked again', () => {
    render(
      <WorkPackageTemplates
        templates={mockTemplates}
        pid="123"
        tid="456"
        onTemplateDelete={mockOnTemplateDelete}
        templateLogs={mockTemplateLogs}
        enquiries={mockEnquiries}
        approversData={mockApproversData}
      />
    );

    // Find and click the expand button
    const expandButtons = screen.getAllByRole('button', { name: /expand row/i });
    fireEvent.click(expandButtons[0]);

    // Panel should be visible
    expect(screen.getByTestId('approval-expandable-panel')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(expandButtons[0]);

    // Panel should not be visible
    expect(screen.queryByTestId('collapse')).not.toBeInTheDocument();
  });
});
