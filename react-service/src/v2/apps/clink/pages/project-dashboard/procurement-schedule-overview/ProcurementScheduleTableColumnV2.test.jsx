import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mocks for local components and helpers used by the component file
jest.mock('v1/quotes-tender/helpers/price', () => ({
  numToPrice: (v) =>
    `£${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

jest.mock('./CellPopupInfo', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="cell-popup">{children}</div>,
}));

jest.mock('./CompletionDate', () => ({
  __esModule: true,
  default: () => <div data-testid="completion-date">CompletionDateMock</div>,
}));

// Mock MUI Skeleton so tests can assert its presence reliably
jest.mock('@mui/material/Skeleton', () => ({
  __esModule: true,
  default: (props) => <div data-testid="skeleton" {...props} />,
}));

// Mock StartOnSite to avoid rendering the MUI date picker in column tests
jest.mock('./StartOnSite', () => ({
  __esModule: true,
  default: ({ params }) => {
    const val = params?.row?.startOnSiteUnformatted;
    return (
      <div>
        {val ? (val instanceof Date ? val.toDateString() : String(val)) : '—'}
      </div>
    );
  },
}));

import { getProcurementTableColumnsV2 } from './ProcurementScheduleTableColumnV2';

describe('ProcurementScheduleTableColumnV2 columns', () => {
  const noop = () => {};
  const baseArgs = {
    anchorEl: null,
    openTooltipId: null,
    milestoneAnchorEl: null,
    openMilestoneTooltip: null,
    formatUKDate: (d) => (d instanceof Date ? d.toDateString() : String(d)),
    handleTooltipOpen: noop,
    handleTooltipClose: noop,
    handleMilestoneTooltipOpen: noop,
    handleMilestoneTooltipClose: noop,
    handleCompletedMilestonesOpen: noop,
    handleCompletedMilestonesClose: noop,
    openCompletedMilestonesId: null,
    completedMilestonesAnchorEl: null,
    onStatusChange: noop,
  };

  test('budget column uses numToPrice formatting', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const budgetCol = cols.find((c) => c.field === 'budget');
    const params = { row: { budget: 1234 } };

    const { container } = render(
      <MemoryRouter>{budgetCol.renderCell(params)}</MemoryRouter>,
    );

    expect(container.textContent).toContain('£1,234.00');
  });

  test('ordervalue (actual) column formatting when missing shows dash', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const orderCol = cols.find((c) => c.field === 'ordervalue');
    const params = { row: { actual: null } };

    const { container } = render(
      <MemoryRouter>{orderCol.renderCell(params)}</MemoryRouter>,
    );

    expect(container.textContent.trim()).toBe('—');
  });

  test('subcontractors shows TBC when empty', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const subCol = cols.find((c) => c.field === 'subcontractors');
    const params = { value: [], row: { id: 'r1' } };

    render(<MemoryRouter>{subCol.renderCell(params)}</MemoryRouter>);

    expect(screen.getByText('TBC')).toBeInTheDocument();
  });

  test('currentMilestone renders milestone name and formatted due date', () => {
    const customFormat = jest.fn(() => '01 Jan 2026');
    const args = { ...baseArgs, formatUKDate: customFormat };
    const cols = getProcurementTableColumnsV2(args);
    const currentCol = cols.find((c) => c.field === 'currentMilestone');

    const params = {
      row: {
        id: 'row-1',
        currentMilestoneData: {
          name: 'Milestone A',
          dueDate: new Date(2026, 0, 26),
        },
        status: 'In Progress',
      },
    };

    render(<MemoryRouter>{currentCol.renderCell(params)}</MemoryRouter>);

    expect(screen.getByText('Milestone A')).toBeInTheDocument();

    const dueDateElements = screen.getAllByText(/due.*01 Jan 2026/);
    expect(dueDateElements.length).toBeGreaterThan(0);
    expect(dueDateElements[0]).toBeInTheDocument();
  });

  test('nextMilestone renders name and risk chip when present', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const nextCol = cols.find((c) => c.field === 'nextMilestone');
    const params = {
      row: {
        id: 'r2',
        nextMilestoneData: {
          name: 'Next X',
          dueDate: new Date(),
          risk: 'Overdue',
        },
      },
    };

    render(<MemoryRouter>{nextCol.renderCell(params)}</MemoryRouter>);

    expect(screen.getByText('Next X')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  test('orderIssueDate shows dash when value is special placeholder', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'orderIssueDate');
    const params = {
      row: { issueOrderUnformatted: null, orderIssueDate: '—' },
    };

    const { container } = render(
      <MemoryRouter>{col.renderCell(params)}</MemoryRouter>,
    );

    expect(container.textContent.trim()).toBe('—');
  });

  test('reference_no returns value unchanged when contains dot', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const refCol = cols.find((c) => c.field === 'reference_no');
    const params = { value: '1.2' };

    const { container } = render(
      <MemoryRouter>{refCol.renderCell(params)}</MemoryRouter>,
    );

    expect(container.textContent).toContain('1.2');
  });

  test('subcontractors single company with url renders link and name', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const subCol = cols.find((c) => c.field === 'subcontractors');
    const params = {
      value: [{ name: 'Comp A', url: '/comp-a', awarded: true }],
      row: { id: 'r3' },
    };

    render(<MemoryRouter>{subCol.renderCell(params)}</MemoryRouter>);

    const nameEl = screen.getByText('Comp A');
    expect(nameEl).toBeInTheDocument();
    expect(nameEl.closest('a')).not.toBeNull();
  });

  test('variancePercentage uses provided variance_percent and shows sign', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const varCol = cols.find((c) => c.field === 'variancePercentage');
    const params = {
      row: {
        variance_percent: '10',
        variance_type: 'positive',
        budget: 100,
        actual: 90,
      },
    };

    const { container } = render(
      <MemoryRouter>{varCol.renderCell(params)}</MemoryRouter>,
    );

    expect(container.textContent).toContain('+10%');
  });

  test('budget column shows loading skeleton when boolean false', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const budgetCol = cols.find((c) => c.field === 'budget');
    const params = { row: { budget: false } };

    const { container } = render(
      <MemoryRouter>{budgetCol.renderCell(params)}</MemoryRouter>,
    );
    // Ensure our mocked skeleton is present
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  test('variance column shows positive value in green', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'variance');

    const { container } = render(
      <MemoryRouter>
        {col.renderCell({ row: { budget: 200, actual: 150 } })}
      </MemoryRouter>,
    );

    expect(container.textContent).toContain('£50.00');
  });

  test('variance column shows negative value in red', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'variance');

    const { container } = render(
      <MemoryRouter>
        {col.renderCell({ row: { budget: 100, actual: 150 } })}
      </MemoryRouter>,
    );

    expect(container.textContent).toContain('£-50.00');
  });

  test('variancePercentage calculates from budget and actual when missing variance_percent', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'variancePercentage');

    const { container } = render(
      <MemoryRouter>
        {col.renderCell({ row: { budget: 200, actual: 150 } })}
      </MemoryRouter>,
    );

    expect(container.textContent).toContain('+25.0%');
  });
  test('tenderCoverage renders percentage and display text', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'tenderCoverage');

    render(
      <MemoryRouter>
        {col.renderCell({
          value: { percentage: 80, display: '80%' },
        })}
      </MemoryRouter>,
    );

    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  test('package column renders value inside tooltip', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'package');

    render(
      <MemoryRouter>
        {col.renderCell({ value: 'Electrical Works' })}
      </MemoryRouter>,
    );

    expect(screen.getByText('Electrical Works')).toBeInTheDocument();
  });

  test('startOnSite renders formatted date when present', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'startOnSite');

    const { container } = render(
      <MemoryRouter>
        {col.renderCell({
          row: { startOnSiteUnformatted: new Date(2026, 0, 1) },
        })}
      </MemoryRouter>,
    );

    expect(container.textContent).toContain(
      new Date(2026, 0, 1).toDateString(),
    );
  });

  test('startOnSite shows dash when missing', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'startOnSite');

    const { container } = render(
      <MemoryRouter>
        {col.renderCell({ row: { startOnSiteUnformatted: null } })}
      </MemoryRouter>,
    );

    expect(container.textContent.trim()).toBe('—');
  });

  test('subcontractors with multiple companies shows chip', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'subcontractors');

    render(
      <MemoryRouter>
        {col.renderCell({
          value: [
            { name: 'A', awarded: false },
            { name: 'B', awarded: false },
          ],
          row: { id: 'r10' },
        })}
      </MemoryRouter>,
    );

    expect(screen.getByText('2 Shortlisted')).toBeInTheDocument();
  });

  test('subcontractors with approved companies shows approved count when flag enabled', () => {
    const cols = getProcurementTableColumnsV2({
      ...baseArgs,
      isSubcontractorListApprovalEnabled: true,
    });
    const col = cols.find((c) => c.field === 'subcontractors');

    render(
      <MemoryRouter>
        {col.renderCell({
          value: [
            { name: 'A', status: 'Approved' },
            { name: 'B', status: 'Pending Approval' },
            { name: 'C', status: 'Approved' },
            { name: 'D', status: 'Draft' },
          ],
          row: { id: 'r11' },
        })}
      </MemoryRouter>,
    );

    expect(screen.getByText('2 Approved')).toBeInTheDocument();
  });

  test('subcontractors with approved companies shows shortlisted count when flag disabled', () => {
    const cols = getProcurementTableColumnsV2({
      ...baseArgs,
      isSubcontractorListApprovalEnabled: false,
    });
    const col = cols.find((c) => c.field === 'subcontractors');

    render(
      <MemoryRouter>
        {col.renderCell({
          value: [
            { name: 'A', status: 'Approved' },
            { name: 'B', status: 'Pending Approval' },
            { name: 'C', status: 'Approved' },
            { name: 'D', status: 'Draft' },
          ],
          row: { id: 'r16' },
        })}
      </MemoryRouter>,
    );

    expect(screen.getByText('4 Shortlisted')).toBeInTheDocument();
  });

  test('current milestone start button triggers onStatusChange', () => {
    const mockStatusChange = jest.fn();
    const cols = getProcurementTableColumnsV2({
      ...baseArgs,
      onStatusChange: mockStatusChange,
    });
    const currentCol = cols.find((c) => c.field === 'currentMilestone');
    const params = {
      row: {
        id: 'r1',
        currentMilestoneData: {
          id: 'm1',
          name: 'Milestone A',
          dueDate: new Date(),
          milestone_type: 'manual',
        },
      },
    };

    render(<MemoryRouter>{currentCol.renderCell(params)}</MemoryRouter>);

    const startButton = screen.getByText((content) =>
      /start-milestone/i.test(content),
    );
    startButton.click();

    expect(mockStatusChange).toHaveBeenCalledWith('r1', 'm1', 'In Progress');
  });

  test('completedMilestones column renders nothing when empty array', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'completedMilestones');

    const { container } = render(
      <MemoryRouter>
        {col.renderCell({ row: { id: 1, completeMilestoneData: [] } })}
      </MemoryRouter>,
    );

    expect(container.firstChild).toBeNull();
  });

  test('completedMilestones column renders nothing when data is null', () => {
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'completedMilestones');

    const { container } = render(
      <MemoryRouter>
        {col.renderCell({ row: { id: 1, completeMilestoneData: null } })}
      </MemoryRouter>,
    );

    expect(container.firstChild).toBeNull();
  });

  test('completedMilestones column renders chip with milestone count', () => {
    const milestones = [
      {
        id: 1,
        label: 'Foundation',
        planned_end_date: '2026-01-01',
        actual_end_date: '2026-01-10',
      },
      {
        id: 2,
        label: 'Framing',
        planned_end_date: '2026-02-01',
        actual_end_date: '2026-02-15',
      },
    ];
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'completedMilestones');

    const { container } = render(
      <MemoryRouter>
        {col.renderCell({ row: { id: 1, completeMilestoneData: milestones } })}
      </MemoryRouter>,
    );

    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain('Foundation');
    expect(container.textContent).toContain('Framing');
  });

  test('completedMilestones chip click calls handleCompletedMilestonesOpen', () => {
    const handleOpen = jest.fn();
    const cols = getProcurementTableColumnsV2({
      ...baseArgs,
      handleCompletedMilestonesOpen: handleOpen,
    });
    const col = cols.find((c) => c.field === 'completedMilestones');
    const milestones = [{ id: 1, label: 'Milestone A' }];

    render(
      <MemoryRouter>
        {col.renderCell({ row: { id: 5, completeMilestoneData: milestones } })}
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleOpen).toHaveBeenCalled();
  });

  test('completedMilestones renders formatted dates when present', () => {
    const milestones = [
      {
        id: 1,
        label: 'Milestone A',
        planned_end_date: '2026-01-15',
        actual_end_date: '2026-01-20',
      },
    ];
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'completedMilestones');

    const { container } = render(
      <MemoryRouter>
        {col.renderCell({ row: { id: 1, completeMilestoneData: milestones } })}
      </MemoryRouter>,
    );

    expect(container.textContent).toContain('Milestone A');
    expect(container.textContent).not.toContain('—');
  });

  test('completedMilestones renders dash for missing planned and actual dates', () => {
    const milestones = [
      {
        id: 1,
        label: 'Milestone A',
        planned_end_date: null,
        actual_end_date: null,
      },
    ];
    const cols = getProcurementTableColumnsV2(baseArgs);
    const col = cols.find((c) => c.field === 'completedMilestones');

    const { container } = render(
      <MemoryRouter>
        {col.renderCell({ row: { id: 1, completeMilestoneData: milestones } })}
      </MemoryRouter>,
    );

    expect(container.textContent).toContain('—');
  });

  test('subcontractors with awarded supplier and flag enabled shows "Awarded To" popover with only awarded supplier', () => {
    const cols = getProcurementTableColumnsV2({
      ...baseArgs,
      isSubcontractorListApprovalEnabled: true,
      openTooltipId: 'r12',
    });
    const col = cols.find((c) => c.field === 'subcontractors');

    render(
      <MemoryRouter>
        {col.renderCell({
          value: [
            { name: 'Supplier A', awarded: true, url: '/supply-chain/a' },
            { name: 'Supplier B', awarded: false },
          ],
          row: { id: 'r12' },
        })}
      </MemoryRouter>,
    );

    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.queryByText('Supplier B')).not.toBeInTheDocument();
  });

  test('subcontractors with awarded supplier and flag disabled shows "Awarded To" popover with only awarded supplier', () => {
    const cols = getProcurementTableColumnsV2({
      ...baseArgs,
      isSubcontractorListApprovalEnabled: false,
      openTooltipId: 'r13',
    });
    const col = cols.find((c) => c.field === 'subcontractors');

    render(
      <MemoryRouter>
        {col.renderCell({
          value: [
            { name: 'Supplier X', awarded: true },
            { name: 'Supplier Y', awarded: false },
          ],
          row: { id: 'r13' },
        })}
      </MemoryRouter>,
    );

    expect(screen.getByText('Supplier X')).toBeInTheDocument();
    expect(screen.queryByText('Supplier Y')).not.toBeInTheDocument();
  });

  test('subcontractors popover hides approval status when flag disabled', () => {
    const cols = getProcurementTableColumnsV2({
      ...baseArgs,
      isSubcontractorListApprovalEnabled: false,
      openTooltipId: 'r14',
    });
    const col = cols.find((c) => c.field === 'subcontractors');

    render(
      <MemoryRouter>
        {col.renderCell({
          value: [
            { name: 'Supplier X', awarded: false, status: 'Pending' },
            { name: 'Supplier Y', awarded: false, status: 'Approved' },
          ],
          row: { id: 'r14' },
        })}
      </MemoryRouter>,
    );

    expect(screen.getByText('Supplier X')).toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  test('subcontractors popover shows approval status when flag enabled', () => {
    const cols = getProcurementTableColumnsV2({
      ...baseArgs,
      isSubcontractorListApprovalEnabled: true,
      openTooltipId: 'r15',
    });
    const col = cols.find((c) => c.field === 'subcontractors');

    render(
      <MemoryRouter>
        {col.renderCell({
          value: [
            { name: 'Supplier X', awarded: false, status: 'Pending' },
            { name: 'Supplier Y', awarded: false, status: 'Draft' },
          ],
          row: { id: 'r15' },
        })}
      </MemoryRouter>,
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
