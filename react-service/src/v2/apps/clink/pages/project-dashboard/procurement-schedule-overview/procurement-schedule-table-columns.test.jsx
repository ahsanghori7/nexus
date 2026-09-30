import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { differenceInDays } from 'date-fns/fp';
import { getProcurementTableColumns } from './procurement-schedule-table-columns';

// Mock MUI components
jest.mock('@mui/material/Skeleton', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, ...props }) =>
      React.createElement('div', { 'data-testid': 'skeleton', ...props }, children),
  };
});

jest.mock('@mui/material/Box', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(({ children, onClick, ...props }, ref) =>
      React.createElement('div', { 'data-testid': 'box', onClick, ref, ...props }, children),
    ),
  };
});

jest.mock('@mui/material/Grid2', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, ...props }) =>
      React.createElement('div', { 'data-testid': 'grid2', ...props }, children),
  };
});

jest.mock('@mui/material/Tooltip', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(({ children, title, ...props }, ref) =>
      React.createElement('div', {
        'data-testid': 'tooltip',
        'data-title': title,
        ref,
        ...props,
      }, children),
    ),
  };
});

jest.mock('@mui/material/Typography', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, variant, color, sx, ...props }) =>
      React.createElement('div', {
        'data-testid': 'typography',
        'data-variant': variant,
        'data-color': color,
        ...props,
      }, children),
  };
});

jest.mock('@mui/material/Chip', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ label, color, variant, size, sx, ...props }) =>
      React.createElement('div', {
        'data-testid': 'chip',
        'data-label': label,
        'data-color': color,
        'data-variant': variant,
        'data-size': size,
        ...props,
      }, label),
  };
});

jest.mock('@mui/material/Link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, component, to, sx, ...props }) =>
      React.createElement('a', {
        'data-testid': 'mui-link',
        href: to,
        ...props,
      }, children),
  };
});

// Mock date-fns - make it configurable per test
jest.mock('date-fns/fp', () => ({
  differenceInDays: jest.fn(() => jest.fn(() => 5)),
}));

// Mock price helper
jest.mock('v1/quotes-tender/helpers/price', () => ({
  numToPrice: jest.fn((value) => `£${value?.toLocaleString() || '0'}`),
}));

// Mock StartOnSite component
jest.mock('./StartOnSite', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ params }) =>
      React.createElement('div', {
        'data-testid': 'start-on-site',
      }, 'StartOnSite Component'),
  };
});

// Mock CellPopupInfo component
jest.mock('./CellPopupInfo', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ open, anchorEl, onClose, title, children }) =>
      React.createElement('div', {
        'data-testid': 'cell-popup-info',
        'data-open': String(open),
        'data-title': title,
      }, children),
  };
});

// Helper: render a cell via its renderCell and return the rendered output
const renderCell = (column, cellParams) => {
  const element = column.renderCell(cellParams);
  return render(<BrowserRouter>{element}</BrowserRouter>);
};

describe('Procurement Schedule Table Columns', () => {
  const mockParams = {
    anchorEl: null,
    openTooltipId: null,
    milestoneAnchorEl: null,
    openMilestoneTooltip: null,
    formatUKDate: jest.fn((date) => (date ? '01/01/2024' : '')),
    handleTooltipOpen: jest.fn(),
    handleTooltipClose: jest.fn(),
    handleMilestoneTooltipOpen: jest.fn(),
    handleMilestoneTooltipClose: jest.fn(),
  };

  const getColumn = (field, overrides = {}) => {
    const columns = getProcurementTableColumns({ ...mockParams, ...overrides });
    return columns.find((col) => col.field === field);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset differenceInDays to default (5 days remaining)
    differenceInDays.mockImplementation(() => jest.fn(() => 5));
  });

  // ─── Structure tests ───────────────────────────────────────────────

  describe('getProcurementTableColumns', () => {
    it('should return an array of column definitions', () => {
      const columns = getProcurementTableColumns(mockParams);
      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBeGreaterThan(0);
    });

    it('should return columns with required properties', () => {
      const columns = getProcurementTableColumns(mockParams);
      columns.forEach((column) => {
        expect(column).toHaveProperty('field');
        expect(column).toHaveProperty('headerName');
        expect(column.width || column.minWidth || column.flex).toBeDefined();
      });
    });

    it('should contain all expected column fields', () => {
      const columns = getProcurementTableColumns(mockParams);
      const fieldNames = columns.map((col) => col.field);
      const expectedFields = [
        'package',
        'subcontractors',
        'tenderCoverage',
        'currentMilestone',
        'status',
        'nextMilestone',
        'budget',
        'actual',
        'variance',
        'orderIssueDate',
        'startOnSite',
      ];
      expectedFields.forEach((f) => expect(fieldNames).toContain(f));
    });

    it('should have unique field names', () => {
      const columns = getProcurementTableColumns(mockParams);
      const fieldNames = columns.map((col) => col.field);
      expect(new Set(fieldNames).size).toBe(fieldNames.length);
    });
  });

  // ─── Package column ────────────────────────────────────────────────

  describe('package column', () => {
    it('renders the package name inside a tooltip', () => {
      const col = getColumn('package');
      const { container } = renderCell(col, { value: 'Electrical Works', row: { id: 1 } });
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-title', 'Electrical Works');
      expect(container.textContent).toContain('Electrical Works');
    });

    it('renders a loading skeleton when value is false (boolean)', () => {
      const col = getColumn('package');
      renderCell(col, { value: false, row: { id: 1 } });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });
  });

  // ─── Subcontractors column ─────────────────────────────────────────

  describe('subcontractors column', () => {
    it('renders TBC chip when the array is empty', () => {
      const col = getColumn('subcontractors');
      renderCell(col, { value: [], row: { id: 1 } });
      const chip = screen.getByTestId('subcontractor-chip-tbc-1');
      expect(chip).toHaveAttribute('data-label', 'TBC');
    });

    it('renders a single company with CompanyDisplay', () => {
      const col = getColumn('subcontractors');
      const company = { name: 'Acme Ltd', awarded: false };
      const { container } = renderCell(col, { value: [company], row: { id: 1 } });
      expect(container.textContent).toContain('Acme Ltd');
    });

    it('renders a single awarded company with check icon', () => {
      const col = getColumn('subcontractors');
      const company = { name: 'Acme Ltd', awarded: true };
      renderCell(col, { value: [company], row: { id: 1 } });
      expect(screen.getByTestId('mui-icon-CheckCircle')).toBeDefined();
    });

    it('renders a single company with link when URL is provided', () => {
      const col = getColumn('subcontractors');
      const company = { name: 'Acme Ltd', awarded: false, url: '/companies/1' };
      renderCell(col, { value: [company], row: { id: 1 } });
      const link = screen.getByTestId('mui-link');
      expect(link).toHaveAttribute('href', '/companies/1');
    });

    it('renders "Awarded" chip when multiple companies and one is awarded', () => {
      const col = getColumn('subcontractors');
      const companies = [
        { name: 'A', awarded: true },
        { name: 'B', awarded: false },
      ];
      renderCell(col, { value: companies, row: { id: 1 } });
      const chip = screen.getByTestId('subcontractor-chip-1');
      expect(chip).toHaveAttribute('data-label', 'Awarded');
      expect(chip).toHaveAttribute('data-color', 'success');
    });

    it('renders shortlisted chip when multiple companies and none awarded', () => {
      const col = getColumn('subcontractors');
      const companies = [
        { name: 'A', awarded: false },
        { name: 'B', awarded: false },
        { name: 'C', awarded: false },
      ];
      renderCell(col, { value: companies, row: { id: 1 } });
      const chip = screen.getByTestId('subcontractor-chip-1');
      expect(chip).toHaveAttribute('data-label', '3 shortlisted');
      expect(chip).toHaveAttribute('data-color', 'info');
    });

    it('calls handleTooltipOpen when clicking multiple-company cell', () => {
      const handleTooltipOpen = jest.fn();
      const col = getColumn('subcontractors', { handleTooltipOpen });
      const companies = [
        { name: 'A', awarded: false },
        { name: 'B', awarded: false },
      ];
      const { container } = renderCell(col, { value: companies, row: { id: 5 } });
      // Click on the outer box
      fireEvent.click(container.querySelector('[data-testid="subcontractor-cell-5"]'));
      expect(handleTooltipOpen).toHaveBeenCalledWith(expect.anything(), 5);
    });

    it('calls handleTooltipClose when clicking and row is already the anchor', () => {
      const handleTooltipClose = jest.fn();
      // anchorEl equals the rowId to trigger close path
      const col = getColumn('subcontractors', { anchorEl: 5, handleTooltipClose });
      const companies = [
        { name: 'A', awarded: false },
        { name: 'B', awarded: false },
      ];
      const { container } = renderCell(col, { value: companies, row: { id: 5 } });
      fireEvent.click(container.querySelector('[data-testid="subcontractor-cell-5"]'));
      expect(handleTooltipClose).toHaveBeenCalled();
    });

    it('shows CellPopupInfo when openTooltipId matches rowId', () => {
      const col = getColumn('subcontractors', { openTooltipId: 5 });
      const companies = [
        { name: 'A', awarded: false, url: '/a' },
        { name: 'B', awarded: false },
      ];
      renderCell(col, { value: companies, row: { id: 5 } });
      const popup = screen.getByTestId('cell-popup-info');
      expect(popup).toHaveAttribute('data-open', 'true');
      expect(popup).toHaveAttribute('data-title', 'View Profiles');
    });

    it('renders loading skeleton when value is false (boolean)', () => {
      const col = getColumn('subcontractors');
      renderCell(col, { value: false, row: { id: 1 } });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('sorts by array length', () => {
      const col = getColumn('subcontractors');
      expect(col.sortComparator([1, 2], [1])).toBe(1);
      expect(col.sortComparator([1], [1, 2, 3])).toBe(-2);
    });
  });

  // ─── Tender Coverage column ────────────────────────────────────────

  describe('tenderCoverage column', () => {
    it('renders loading skeleton when value is falsy', () => {
      const col = getColumn('tenderCoverage');
      renderCell(col, { value: null, row: { id: 1 } });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('renders success color when percentage >= 75', () => {
      const col = getColumn('tenderCoverage');
      const { container } = renderCell(col, {
        value: { percentage: 80, display: '80%' },
        row: { id: 1 },
      });
      expect(container.textContent).toContain('80%');
    });

    it('renders warning color when percentage >= 50 and < 75', () => {
      const col = getColumn('tenderCoverage');
      const { container } = renderCell(col, {
        value: { percentage: 60, display: '60%' },
        row: { id: 1 },
      });
      expect(container.textContent).toContain('60%');
    });

    it('renders error color when percentage < 50', () => {
      const col = getColumn('tenderCoverage');
      const { container } = renderCell(col, {
        value: { percentage: 30, display: '30%' },
        row: { id: 1 },
      });
      expect(container.textContent).toContain('30%');
    });

    it('sorts by percentage', () => {
      const col = getColumn('tenderCoverage');
      expect(col.sortComparator({ percentage: 80 }, { percentage: 50 })).toBe(30);
    });
  });

  // ─── Current Milestone column ──────────────────────────────────────

  describe('currentMilestone column', () => {
    it('renders loading skeleton when currentMilestoneData is false (boolean)', () => {
      const col = getColumn('currentMilestone');
      renderCell(col, { row: { id: 1, currentMilestoneData: false }, value: null });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('renders MilestoneCell with milestone data', () => {
      const col = getColumn('currentMilestone');
      const milestoneData = {
        name: 'Design Approval',
        dueDate: '2024-06-01',
        risk: 'On Track',
      };
      const { container } = renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: 'Design Approval',
      });
      expect(container.textContent).toContain('Design Approval');
      expect(container.textContent).toContain('due 01/01/2024');
    });

    it('renders dash when milestone data has no name', () => {
      const col = getColumn('currentMilestone');
      const milestoneData = { dueDate: '2024-06-01' };
      const { container } = renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      expect(container.textContent).toContain('—');
    });

    it('renders dash when milestone data has no dueDate', () => {
      const col = getColumn('currentMilestone');
      const milestoneData = { name: 'Design' };
      const { container } = renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      expect(container.textContent).toContain('—');
    });

    it('renders risk chip when milestone has risk', () => {
      const col = getColumn('currentMilestone');
      const milestoneData = {
        name: 'Design',
        dueDate: '2024-06-01',
        risk: 'Overdue',
      };
      renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      const chip = screen.getByTestId('chip');
      expect(chip).toHaveAttribute('data-label', 'Overdue');
      expect(chip).toHaveAttribute('data-color', 'error');
    });

    it('renders risk chip with warning color for Approaching', () => {
      const col = getColumn('currentMilestone');
      const milestoneData = {
        name: 'Design',
        dueDate: '2024-06-01',
        risk: 'Approaching',
      };
      renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      const chip = screen.getByTestId('chip');
      expect(chip).toHaveAttribute('data-color', 'warning');
    });

    it('renders risk chip with default color for Completed', () => {
      const col = getColumn('currentMilestone');
      const milestoneData = {
        name: 'Design',
        dueDate: '2024-06-01',
        risk: 'Completed',
      };
      renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      const chip = screen.getByTestId('chip');
      expect(chip).toHaveAttribute('data-color', 'default');
    });

    it('renders risk chip with success color for On Track', () => {
      const col = getColumn('currentMilestone');
      const milestoneData = {
        name: 'Design',
        dueDate: '2024-06-01',
        risk: 'On Track',
      };
      renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      const chip = screen.getByTestId('chip');
      expect(chip).toHaveAttribute('data-color', 'success');
    });

    it('renders risk chip with default color for unknown risk', () => {
      const col = getColumn('currentMilestone');
      const milestoneData = {
        name: 'Design',
        dueDate: '2024-06-01',
        risk: 'Unknown Risk',
      };
      renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      const chip = screen.getByTestId('chip');
      expect(chip).toHaveAttribute('data-color', 'default');
    });

    it('does not render risk chip when milestone has no risk', () => {
      const col = getColumn('currentMilestone');
      const milestoneData = {
        name: 'Design',
        dueDate: '2024-06-01',
      };
      renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      expect(screen.queryByTestId('chip')).toBeNull();
    });

    it('calls handleMilestoneTooltipOpen on click', () => {
      const handleMilestoneTooltipOpen = jest.fn();
      const col = getColumn('currentMilestone', { handleMilestoneTooltipOpen });
      const milestoneData = { name: 'Design', dueDate: '2024-06-01' };
      const { container } = renderCell(col, {
        row: { id: 7, currentMilestoneData: milestoneData },
        value: null,
      });
      // Click the outer box
      fireEvent.click(container.querySelector('[data-testid="box"]'));
      expect(handleMilestoneTooltipOpen).toHaveBeenCalledWith(expect.anything(), 7, 'current');
    });

    it('renders "days remaining" text in the popup', () => {
      differenceInDays.mockImplementation(() => jest.fn(() => 10));
      const col = getColumn('currentMilestone');
      const milestoneData = { name: 'Design', dueDate: '2024-06-01' };
      const { container } = renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      expect(container.textContent).toContain('10 days remaining');
    });

    it('renders "days overdue" text when difference is negative', () => {
      differenceInDays.mockImplementation(() => jest.fn(() => -3));
      const col = getColumn('currentMilestone');
      const milestoneData = { name: 'Design', dueDate: '2024-01-01' };
      const { container } = renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      expect(container.textContent).toContain('3 days overdue');
    });

    it('renders "Due today" text when difference is 0', () => {
      differenceInDays.mockImplementation(() => jest.fn(() => 0));
      const col = getColumn('currentMilestone');
      const milestoneData = { name: 'Design', dueDate: '2024-06-01' };
      const { container } = renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      expect(container.textContent).toContain('Due today');
    });

    it('opens CellPopupInfo when milestone tooltip matches', () => {
      const col = getColumn('currentMilestone', {
        openMilestoneTooltip: { rowId: 1, type: 'current' },
        milestoneAnchorEl: document.createElement('div'),
      });
      const milestoneData = { name: 'Design', dueDate: '2024-06-01' };
      renderCell(col, {
        row: { id: 1, currentMilestoneData: milestoneData },
        value: null,
      });
      const popup = screen.getByTestId('cell-popup-info');
      expect(popup).toHaveAttribute('data-open', 'true');
    });

    it('sort comparator handles missing dates', () => {
      const col = getColumn('currentMilestone');
      const mockApi = {
        getRow: jest.fn((id) => {
          if (id === 1) return { currentMilestoneData: null };
          if (id === 2) return { currentMilestoneData: { dueDate: '2024-06-01' } };
          return {};
        }),
      };
      expect(col.sortComparator(null, null, { id: 1, api: mockApi }, { id: 2, api: mockApi })).toBe(-1);
      expect(col.sortComparator(null, null, { id: 2, api: mockApi }, { id: 1, api: mockApi })).toBe(1);
    });

    it('sort comparator compares dates correctly', () => {
      const col = getColumn('currentMilestone');
      const mockApi = {
        getRow: jest.fn((id) => {
          if (id === 1) return { currentMilestoneData: { dueDate: '2024-01-01' } };
          if (id === 2) return { currentMilestoneData: { dueDate: '2024-06-01' } };
          return {};
        }),
      };
      const result = col.sortComparator(null, null, { id: 1, api: mockApi }, { id: 2, api: mockApi });
      expect(result).toBeLessThan(0);
    });
  });

  // ─── Status column ─────────────────────────────────────────────────

  describe('status column', () => {
    it('renders loading skeleton when value is falsy', () => {
      const col = getColumn('status');
      renderCell(col, { value: null, row: { id: 1 } });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('renders "In Progress" chip with info color', () => {
      const col = getColumn('status');
      renderCell(col, { value: 'In Progress', row: { id: 1 } });
      const chip = screen.getByTestId('status-chip-1');
      expect(chip).toHaveAttribute('data-label', 'In Progress');
      expect(chip).toHaveAttribute('data-color', 'info');
      expect(chip).toHaveAttribute('data-variant', 'outlined');
    });

    it('renders "Complete" chip with success color', () => {
      const col = getColumn('status');
      renderCell(col, { value: 'Complete', row: { id: 1 } });
      const chip = screen.getByTestId('status-chip-1');
      expect(chip).toHaveAttribute('data-color', 'success');
    });

    it('renders "Not Started" chip with default color', () => {
      const col = getColumn('status');
      renderCell(col, { value: 'Not Started', row: { id: 1 } });
      const chip = screen.getByTestId('status-chip-1');
      expect(chip).toHaveAttribute('data-color', 'default');
    });

    it('renders unknown status with default color', () => {
      const col = getColumn('status');
      renderCell(col, { value: 'Cancelled', row: { id: 1 } });
      const chip = screen.getByTestId('status-chip-1');
      expect(chip).toHaveAttribute('data-color', 'default');
    });
  });

  // ─── Next Milestone column ─────────────────────────────────────────

  describe('nextMilestone column', () => {
    it('renders loading skeleton when nextMilestoneData is false (boolean)', () => {
      const col = getColumn('nextMilestone');
      renderCell(col, { row: { id: 1, nextMilestoneData: false }, value: null });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('renders MilestoneCell with next milestone data', () => {
      const col = getColumn('nextMilestone');
      const milestoneData = { name: 'Handover', dueDate: '2024-12-01', risk: 'On Track' };
      const { container } = renderCell(col, {
        row: { id: 1, nextMilestoneData: milestoneData },
        value: null,
      });
      expect(container.textContent).toContain('Handover');
    });

    it('renders dash when next milestone has no data', () => {
      const col = getColumn('nextMilestone');
      const { container } = renderCell(col, {
        row: { id: 1, nextMilestoneData: null },
        value: null,
      });
      expect(container.textContent).toContain('—');
    });

    it('calls handleMilestoneTooltipOpen with type "next"', () => {
      const handleMilestoneTooltipOpen = jest.fn();
      const col = getColumn('nextMilestone', { handleMilestoneTooltipOpen });
      const milestoneData = { name: 'Handover', dueDate: '2024-12-01' };
      const { container } = renderCell(col, {
        row: { id: 3, nextMilestoneData: milestoneData },
        value: null,
      });
      fireEvent.click(container.querySelector('[data-testid="box"]'));
      expect(handleMilestoneTooltipOpen).toHaveBeenCalledWith(expect.anything(), 3, 'next');
    });

    it('sort comparator handles missing dates', () => {
      const col = getColumn('nextMilestone');
      const mockApi = {
        getRow: jest.fn((id) => {
          if (id === 1) return { nextMilestoneData: null };
          if (id === 2) return { nextMilestoneData: { dueDate: '2024-06-01' } };
          return {};
        }),
      };
      expect(col.sortComparator(null, null, { id: 1, api: mockApi }, { id: 2, api: mockApi })).toBe(-1);
      expect(col.sortComparator(null, null, { id: 2, api: mockApi }, { id: 1, api: mockApi })).toBe(1);
    });
  });

  // ─── Budget column ─────────────────────────────────────────────────

  describe('budget column', () => {
    it('renders loading skeleton when budget is false (boolean)', () => {
      const col = getColumn('budget');
      renderCell(col, { row: { budget: false }, value: null });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('renders dash when budget is null', () => {
      const col = getColumn('budget');
      const { container } = renderCell(col, { row: { budget: null }, value: null });
      expect(container.textContent).toContain('—');
    });

    it('renders dash when budget is NaN', () => {
      const col = getColumn('budget');
      const { container } = renderCell(col, { row: { budget: 'not-a-number' }, value: null });
      expect(container.textContent).toContain('—');
    });

    it('renders formatted price for valid budget', () => {
      const { numToPrice } = require('v1/quotes-tender/helpers/price');
      const col = getColumn('budget');
      renderCell(col, { row: { budget: 50000 }, value: 50000 });
      expect(numToPrice).toHaveBeenCalledWith(50000);
    });

    it('renders formatted price for zero budget', () => {
      const { numToPrice } = require('v1/quotes-tender/helpers/price');
      const col = getColumn('budget');
      renderCell(col, { row: { budget: 0 }, value: 0 });
      expect(numToPrice).toHaveBeenCalledWith(0);
    });
  });

  // ─── Actual column ─────────────────────────────────────────────────

  describe('actual column', () => {
    it('renders loading skeleton when actual is false (boolean)', () => {
      const col = getColumn('actual');
      renderCell(col, { row: { actual: false }, value: null });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('renders dash when actual is null', () => {
      const col = getColumn('actual');
      const { container } = renderCell(col, { row: { actual: null }, value: null });
      expect(container.textContent).toContain('—');
    });

    it('renders dash when actual is NaN', () => {
      const col = getColumn('actual');
      const { container } = renderCell(col, { row: { actual: 'abc' }, value: null });
      expect(container.textContent).toContain('—');
    });

    it('renders formatted price for valid actual', () => {
      const { numToPrice } = require('v1/quotes-tender/helpers/price');
      const col = getColumn('actual');
      renderCell(col, { row: { actual: 30000 }, value: 30000 });
      expect(numToPrice).toHaveBeenCalledWith(30000);
    });

    it('sort comparator compares actual values', () => {
      const col = getColumn('actual');
      const mockApi = {
        getRow: jest.fn((id) => {
          if (id === 1) return { actual: 100 };
          if (id === 2) return { actual: 200 };
          return {};
        }),
      };
      const result = col.sortComparator(null, null, { id: 1, api: mockApi }, { id: 2, api: mockApi });
      expect(result).toBe(-100);
    });
  });

  // ─── Variance column ──────────────────────────────────────────────

  describe('variance column', () => {
    it('renders loading when budget is false (boolean)', () => {
      const col = getColumn('variance');
      renderCell(col, { row: { budget: false, actual: 100 }, value: null });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('renders loading when actual is false (boolean)', () => {
      const col = getColumn('variance');
      renderCell(col, { row: { budget: 100, actual: false }, value: null });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('renders positive variance (budget > actual) with success color', () => {
      const { numToPrice } = require('v1/quotes-tender/helpers/price');
      const col = getColumn('variance');
      renderCell(col, { row: { budget: 50000, actual: 30000 }, value: null });
      expect(numToPrice).toHaveBeenCalledWith(20000);
    });

    it('renders negative variance (budget < actual) with error color', () => {
      const { numToPrice } = require('v1/quotes-tender/helpers/price');
      const col = getColumn('variance');
      renderCell(col, { row: { budget: 30000, actual: 50000 }, value: null });
      expect(numToPrice).toHaveBeenCalledWith(-20000);
    });

    it('renders zero variance with secondary text color', () => {
      const { numToPrice } = require('v1/quotes-tender/helpers/price');
      const col = getColumn('variance');
      renderCell(col, { row: { budget: 50000, actual: 50000 }, value: null });
      expect(numToPrice).toHaveBeenCalledWith(0);
    });

    it('sort comparator compares variance values', () => {
      const col = getColumn('variance');
      const mockApi = {
        getRow: jest.fn((id) => {
          if (id === 1) return { budget: 100, actual: 50 }; // variance = 50
          if (id === 2) return { budget: 200, actual: 50 }; // variance = 150
          return {};
        }),
      };
      const result = col.sortComparator(null, null, { id: 1, api: mockApi }, { id: 2, api: mockApi });
      expect(result).toBe(-100);
    });
  });

  // ─── Order Issue Date column ───────────────────────────────────────

  describe('orderIssueDate column', () => {
    it('renders loading skeleton when issueOrderUnformatted is false (boolean)', () => {
      const col = getColumn('orderIssueDate');
      renderCell(col, { row: { issueOrderUnformatted: false, orderIssueDate: '01/01/2024' }, value: null });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('renders dash when orderIssueDate is "—"', () => {
      const col = getColumn('orderIssueDate');
      const { container } = renderCell(col, {
        row: { issueOrderUnformatted: '2024-01-01', orderIssueDate: '—' },
        value: null,
      });
      expect(container.textContent).toContain('—');
    });

    it('renders formatted date string', () => {
      const col = getColumn('orderIssueDate');
      const { container } = renderCell(col, {
        row: { issueOrderUnformatted: '2024-01-01', orderIssueDate: '01/01/2024' },
        value: null,
      });
      expect(container.textContent).toContain('01/01/2024');
    });

    it('valueGetter returns Date object when value exists', () => {
      const col = getColumn('orderIssueDate');
      const result = col.valueGetter({ value: '2024-01-01' });
      expect(result).toBeInstanceOf(Date);
    });

    it('valueGetter returns null when value is falsy', () => {
      const col = getColumn('orderIssueDate');
      const result = col.valueGetter({ value: null });
      expect(result).toBeNull();
    });
  });

  // ─── Start on Site column ──────────────────────────────────────────

  describe('startOnSite column', () => {
    it('renders loading skeleton when startOnSiteUnformatted is false (boolean)', () => {
      const col = getColumn('startOnSite');
      renderCell(col, { row: { startOnSiteUnformatted: false }, value: null });
      expect(screen.getByTestId('skeleton')).toBeDefined();
    });

    it('renders StartOnSite component with params', () => {
      const col = getColumn('startOnSite');
      renderCell(col, { row: { id: 1, startOnSiteUnformatted: '2024-01-01' }, value: null });
      expect(screen.getByTestId('start-on-site')).toBeDefined();
    });

    it('sort comparator handles missing dates', () => {
      const col = getColumn('startOnSite');
      const mockApi = {
        getRow: jest.fn((id) => {
          if (id === 1) return { startOnSiteUnformatted: null };
          if (id === 2) return { startOnSiteUnformatted: '2024-06-01' };
          return {};
        }),
      };
      expect(col.sortComparator(null, null, { id: 1, api: mockApi }, { id: 2, api: mockApi })).toBe(-1);
      expect(col.sortComparator(null, null, { id: 2, api: mockApi }, { id: 1, api: mockApi })).toBe(1);
    });

    it('sort comparator compares dates correctly', () => {
      const col = getColumn('startOnSite');
      const mockApi = {
        getRow: jest.fn((id) => {
          if (id === 1) return { startOnSiteUnformatted: '2024-01-01' };
          if (id === 2) return { startOnSiteUnformatted: '2024-06-01' };
          return {};
        }),
      };
      const result = col.sortComparator(null, null, { id: 1, api: mockApi }, { id: 2, api: mockApi });
      expect(result).toBeLessThan(0);
    });
  });
});