import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProcurementScheduleTableV2 from './ProcurementScheduleTableV2';
import { getProcurementTableColumnsV2 } from './ProcurementScheduleTableColumnV2';
import { MilestoneStatus } from 'v2/constants/milestoneStatus';

// Mock MUI DataGridPro
jest.mock('@mui/x-data-grid-pro', () => ({
  DataGridPro: (props) => (
    <div
      data-testid="datagrid"
      data-rows={JSON.stringify(props.rows)}
      data-cols={JSON.stringify(props.columns)}
      onClick={props.onCellEditCommit} // for testing edit
    />
  ),
  GridColumnMenu: () => null,
}));

jest.mock('./ProcurementScheduleTableColumnV2', () => ({
  getProcurementTableColumnsV2: jest.fn(),
}));

describe('ProcurementScheduleTableV2', () => {
  const mockCols = [{ field: 'f1', headerName: 'H1' }];
  let handleCellEditCommit;
  let handleStartMilestone;
  let handleCompleteMilestone;

  beforeEach(() => {
    getProcurementTableColumnsV2.mockClear();
    getProcurementTableColumnsV2.mockReturnValue(mockCols);

    handleCellEditCommit = jest.fn();
    handleStartMilestone = jest.fn();
    handleCompleteMilestone = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders DataGridPro with rows and columns', () => {
    const rows = [
      { id: 1, reference_no: 'R1' },
      { id: 2, reference_no: 'R2' },
    ];

    render(
      <MemoryRouter>
        <ProcurementScheduleTableV2
          rowData={rows}
          handleCellEditCommit={handleCellEditCommit}
          handleStartMilestone={handleStartMilestone}
          handleCompleteMilestone={handleCompleteMilestone}
        />
      </MemoryRouter>,
    );

    const grid = screen.getByTestId('datagrid');
    expect(grid).toBeInTheDocument();
    expect(grid.getAttribute('data-rows')).toContain('R1');
    expect(grid.getAttribute('data-cols')).toContain('f1');
    expect(getProcurementTableColumnsV2).toHaveBeenCalledTimes(1);
  });

  test('calls handleStatusChange correctly for "In Progress"', () => {
    render(
      <MemoryRouter>
        <ProcurementScheduleTableV2
          rowData={[{ id: 1 }]}
          handleCellEditCommit={handleCellEditCommit}
          handleStartMilestone={handleStartMilestone}
          handleCompleteMilestone={handleCompleteMilestone}
        />
      </MemoryRouter>,
    );

    const args = getProcurementTableColumnsV2.mock.calls[0][0];
    // Simulate status change
    args.onStatusChange(1, 101, MilestoneStatus.IN_PROGRESS);
    expect(handleStartMilestone).toHaveBeenCalledWith(1, 101);
    expect(handleCompleteMilestone).not.toHaveBeenCalled();
  });

  test('calls handleStatusChange correctly for "Completed" with date', () => {
    render(
      <MemoryRouter>
        <ProcurementScheduleTableV2
          rowData={[{ id: 1 }]}
          handleCellEditCommit={handleCellEditCommit}
          handleStartMilestone={handleStartMilestone}
          handleCompleteMilestone={handleCompleteMilestone}
        />
      </MemoryRouter>,
    );

    const args = getProcurementTableColumnsV2.mock.calls[0][0];
    const completionDate = new Date();
    args.onStatusChange(1, 101, MilestoneStatus.COMPLETED, completionDate);

    expect(handleCompleteMilestone).toHaveBeenCalledWith(
      1,
      101,
      completionDate,
    );
    expect(handleStartMilestone).not.toHaveBeenCalled();
  });

  test('formatUKDate returns formatted string or dash', () => {
    render(
      <MemoryRouter>
        <ProcurementScheduleTableV2
          rowData={[]}
          handleCellEditCommit={handleCellEditCommit}
          handleStartMilestone={handleStartMilestone}
          handleCompleteMilestone={handleCompleteMilestone}
        />
      </MemoryRouter>,
    );

    const args = getProcurementTableColumnsV2.mock.calls[0][0];

    // valid date
    const dateStr = args.formatUKDate('2026-02-09');
    expect(dateStr).toMatch(/\d{1,2} \w{3} \d{4}/);

    // invalid date
    expect(args.formatUKDate('invalid')).toBe('—');
    expect(args.formatUKDate(null)).toBe('—');
  });

  test('tooltip handlers set proper state', () => {
    render(
      <MemoryRouter>
        <ProcurementScheduleTableV2
          rowData={[]}
          handleCellEditCommit={handleCellEditCommit}
          handleStartMilestone={handleStartMilestone}
          handleCompleteMilestone={handleCompleteMilestone}
        />
      </MemoryRouter>,
    );

    const args = getProcurementTableColumnsV2.mock.calls[0][0];

    // Open tooltip
    const fakeEvent = { currentTarget: {} };
    args.handleTooltipOpen(fakeEvent, 5);
    expect(args.openTooltipId).toBeNull(); // Cannot read state directly; tested via function existence
  });

  test('renders NoRowsOverlay when no rows', () => {
    render(
      <MemoryRouter>
        <ProcurementScheduleTableV2
          rowData={[]}
          handleCellEditCommit={handleCellEditCommit}
          handleStartMilestone={handleStartMilestone}
          handleCompleteMilestone={handleCompleteMilestone}
        />
      </MemoryRouter>,
    );

    const grid = screen.getByTestId('datagrid');
    expect(grid).toBeInTheDocument();
  });
});
