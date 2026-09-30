import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnquiryList from './list';

// Mock external dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

const mockDispatch = jest.fn(() => Promise.resolve({ payload: {} }));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

const mockClinkContext = {
  actions: {
    assignedApproversTenderInquiry: jest.fn(() => ({
      type: 'MOCK_ASSIGNED_APPROVERS',
    })),
  },
};

jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => mockClinkContext),
}));

jest.mock('v2/apps/clink/pages/shared/Accordion', () => {
  return function MockSimpleAccordion({ children, title, id }) {
    return (
      <div data-testid="simple-accordion" data-accordion-id={id}>
        <div data-testid="accordion-title">{title}</div>
        <div data-testid="accordion-content">{children}</div>
      </div>
    );
  };
});

jest.mock('./WorkPackageTemplates', () => {
  return function MockWorkPackageTemplates({ templates, templateLogs, enquiries, approversData }) {
    return (
      <div data-testid="work-package-templates">
        <div data-testid="templates-count">{Object.keys(templates || {}).length}</div>
        <div data-testid="logs-count">{templateLogs?.length || 0}</div>
        <div data-testid="enquiries-count">{Object.keys(enquiries || {}).length}</div>
        <div data-testid="approvers-data-count">{Object.keys(approversData || {}).length}</div>
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/tender-templates/dialog', () => {
  return function MockTemplateModal({ modalOpen, setModalOpen, createTemplate }) {
    return modalOpen ? (
      <div data-testid="template-modal">
        <button onClick={() => createTemplate()}>Create</button>
        <button onClick={() => setModalOpen(false)}>Close</button>
      </div>
    ) : (
      <button data-testid="add-tender-button" onClick={() => setModalOpen(true)}>
        Add New Tender
      </button>
    );
  };
});

jest.mock('@mui/material', () => {
  const React = require('react');
  return {
    Box: ({ children, ...rest }) => (
      <div data-testid="mui-box" {...rest}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...rest }) => (
      <button type="button" data-testid="mui-button" onClick={onClick} {...rest}>
        {children}
      </button>
    ),
  };
});

describe('EnquiryList', () => {
  const mockCreateTemplate = jest.fn();
  const mockOnTemplateDelete = jest.fn();

  const mockProjectData = {
    id: '123',
    tender: [
      { id: '456', name: 'Tender 1', state: 2 },
      { id: '789', name: 'Tender 2', state: 1 },
    ],
  };

  const mockAssets = [
    { id: 1, name: 'Asset 1' },
    { id: 2, name: 'Asset 2' },
  ];

  const mockItems = {
    '43634': {
      label: '3d Laser Scanning Survey',
      templates: {
        '75294': {
          id: 75294,
          name: 'Invitation to Tender',
          status: 1,
          created_at: '2026-01-27 07:53:57',
          approval_info: {
            status: 'Approved',
            approver_name: 'John Doe',
            approver_email: 'john@example.com',
            approver_title: 'Manager',
            requested_on: '2026-01-27 07:54:37',
          },
          final_status: 'Sent',
          sent_date: '2026-01-27 07:56:32',
          sent_to_subcontractors: [{ id: 21734, name: 'Company A', email: 'company@example.com' }],
          history: [
            {
              id: 1,
              type: 'Sent',
              meta: '{"user":"Admin"}',
              updated_at: '2026-01-27T07:56:32.000000Z',
            },
          ],
        },
      },
      enquries: {
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
      },
    },
    '44018': {
      label: 'Archaeologist',
      templates: {
        '75191': {
          id: 75191,
          name: 'Tender Addendum',
          status: 0,
          created_at: '2024-01-08 15:19:08',
          approval_info: [],
          final_status: 'Draft',
          sent_date: '-',
          sent_to_subcontractors: '-',
          history: [],
        },
      },
      enquries: {},
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches assigned approvers for the project on mount', () => {
    render(
      <EnquiryList
        items={mockItems}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    expect(mockDispatch).toHaveBeenCalled();
  });

  it('passes fetched approversData to each WorkPackageTemplates', async () => {
    mockDispatch.mockReturnValueOnce(
      Promise.resolve({ payload: { 75294: { isLevel: true, approvals: [] } } }),
    );

    render(
      <EnquiryList
        items={mockItems}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    const approversCounts = await screen.findAllByTestId('approvers-data-count');
    expect(approversCounts[0]).toHaveTextContent('1');
  });

  it('renders accordions for each work package', () => {
    render(
      <EnquiryList
        items={mockItems}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    const accordions = screen.getAllByTestId('simple-accordion');
    expect(accordions).toHaveLength(2);
    expect(screen.getByText('3d Laser Scanning Survey')).toBeInTheDocument();
    expect(screen.getByText('Archaeologist')).toBeInTheDocument();
  });

  it('renders WorkPackageTemplates inside each accordion', () => {
    render(
      <EnquiryList
        items={mockItems}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    const templateComponents = screen.getAllByTestId('work-package-templates');
    expect(templateComponents).toHaveLength(2);
  });

  it('passes correct number of templates to WorkPackageTemplates', () => {
    render(
      <EnquiryList
        items={mockItems}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    const templateCounts = screen.getAllByTestId('templates-count');
    expect(templateCounts[0]).toHaveTextContent('1');
    expect(templateCounts[1]).toHaveTextContent('1');
  });

  it('renders Add New Tender button', () => {
    render(
      <EnquiryList
        items={mockItems}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    expect(screen.getByTestId('add-tender-button')).toBeInTheDocument();
  });

  it('opens template modal when Add New Tender button clicked', () => {
    render(
      <EnquiryList
        items={mockItems}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    const addButton = screen.getByTestId('add-tender-button');
    fireEvent.click(addButton);

    expect(screen.getByTestId('template-modal')).toBeInTheDocument();
  });

  it('displays empty state when no work packages available', () => {
    render(
      <EnquiryList
        items={{}}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    expect(screen.getByText('no-templates-available')).toBeInTheDocument();
  });

  it('passes logs to WorkPackageTemplates', () => {
    render(
      <EnquiryList
        items={mockItems}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    const logsCounts = screen.getAllByTestId('logs-count');
    expect(logsCounts[0]).toHaveTextContent('1'); // First work package has 1 log
    expect(logsCounts[1]).toHaveTextContent('0'); // Second work package has 0 logs
  });

  it('handles work packages without templates', () => {
    const itemsWithEmptyTemplates = {
      '43634': {
        label: 'Empty Work Package',
        templates: {},
      },
    };

    render(
      <EnquiryList
        items={itemsWithEmptyTemplates}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    expect(screen.getByText('Empty Work Package')).toBeInTheDocument();
    const templatesCount = screen.getByTestId('templates-count');
    expect(templatesCount).toHaveTextContent('0');
  });

  it('displays untitled-work-package when label is missing', () => {
    const itemsWithoutLabel = {
      '43634': {
        templates: {
          '75294': mockItems['43634'].templates['75294'],
        },
      },
    };

    render(
      <EnquiryList
        items={itemsWithoutLabel}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    expect(screen.getByText('untitled-work-package')).toBeInTheDocument();
  });

  it('passes onTemplateDelete callback correctly', () => {
    render(
      <EnquiryList
        items={mockItems}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    // Component should render without errors with the callback
    expect(screen.getAllByTestId('work-package-templates')).toHaveLength(2);
  });

  it('extracts logs from template history correctly', () => {
    const itemsWithMultipleLogs = {
      '43634': {
        label: 'Work Package',
        templates: {
          '75294': {
            ...mockItems['43634'].templates['75294'],
            history: [
              { id: 1, type: 'Sent', meta: '{}', updated_at: '2026-01-27T07:56:32.000000Z' },
              { id: 2, type: 'Approved', meta: '{}', updated_at: '2026-01-27T08:00:00.000000Z' },
            ],
          },
        },
      },
    };

    render(
      <EnquiryList
        items={itemsWithMultipleLogs}
        projectData={mockProjectData}
        assets={mockAssets}
        createTemplate={mockCreateTemplate}
        onTemplateDelete={mockOnTemplateDelete}
      />
    );

    const logsCount = screen.getByTestId('logs-count');
    expect(logsCount).toHaveTextContent('2');
  });
});
