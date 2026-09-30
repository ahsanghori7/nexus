import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import getTableColumns from './TableColumns';

const mockFormatUKorAnzDateTime = jest.fn((value, countryCode) => ({
  date: '01/01/2024',
  time: '10:00',
}));

const makeClinkAccount = (userId = 7, countryCode = 'GB') => ({
  user: { id: userId },
  country: { code: countryCode },
});

describe('getTableColumns', () => {
  let columns;
  const clinkAccount = makeClinkAccount();

  beforeEach(() => {
    jest.clearAllMocks();
    columns = getTableColumns({
      clinkAccount,
      formatUKorAnzDateTime: mockFormatUKorAnzDateTime,
    });
  });

  it('returns the correct number of columns', () => {
    expect(columns).toHaveLength(8);
  });

  it('returns correct field names', () => {
    const fields = columns.map((c) => c.field);
    expect(fields).toEqual([
      'package_name',
      'subcontractor',
      'submitted_by',
      'status',
      'assigned_approvers',
      'approved_by',
      'last_updated',
      'actions',
    ]);
  });

  // ── package_name ──────────────────────────────────────────────────────────
  describe('package_name column', () => {
    it('has correct headerName', () => {
      const col = columns.find((c) => c.field === 'package_name');
      expect(col.headerName).toBe('Package Name');
    });
  });

  // ── subcontractor ─────────────────────────────────────────────────────────
  describe('subcontractor column', () => {
    let col;
    beforeEach(() => {
      col = columns.find((c) => c.field === 'subcontractor');
    });

    it('returns name when present', () => {
      expect(col.valueGetter({ name: 'Acme Ltd' })).toBe('Acme Ltd');
    });

    it('returns "-" when value is null', () => {
      expect(col.valueGetter(null)).toBe('-');
    });

    it('returns "-" when name is absent', () => {
      expect(col.valueGetter({})).toBe('-');
    });
  });

  // ── submitted_by ──────────────────────────────────────────────────────────
  describe('submitted_by column', () => {
    let col;
    beforeEach(() => {
      col = columns.find((c) => c.field === 'submitted_by');
    });

    it('returns display_name when present', () => {
      expect(col.valueGetter({ display_name: 'John Doe' })).toBe('John Doe');
    });

    it('returns "-" when value is null', () => {
      expect(col.valueGetter(null)).toBe('-');
    });

    it('returns "-" when display_name is absent', () => {
      expect(col.valueGetter({})).toBe('-');
    });
  });

  // ── status ────────────────────────────────────────────────────────────────
  describe('status column renderCell', () => {
    let col;
    beforeEach(() => {
      col = columns.find((c) => c.field === 'status');
    });

    const statuses = ['Draft', 'Pending', 'Approved', 'Rejected', 'Cancelled'];

    statuses.forEach((status) => {
      it(`renders chip with label "${status}"`, () => {
        const { getByText } = render(
          col.renderCell({ value: status, row: { submitted_by: null } }),
        );
        expect(getByText(status)).toBeInTheDocument();
      });
    });

    it('renders chip for unknown status with default color', () => {
      const { getByText } = render(col.renderCell({ value: 'Unknown' }));
      expect(getByText('Unknown')).toBeInTheDocument();
    });
  });

  // ── assigned_approvers ────────────────────────────────────────────────────
  describe('assigned_approvers column', () => {
    let col;
    beforeEach(() => {
      col = columns.find((c) => c.field === 'assigned_approvers');
    });

    it('returns empty array when value is not an array', () => {
      expect(col.valueGetter(null)).toEqual([]);
      expect(col.valueGetter(undefined)).toEqual([]);
      expect(col.valueGetter({})).toEqual([]);
    });

    it('includes approvers that have a user', () => {
      const value = [
        { user: { firstname: 'Alice', lastname: 'Smith' } },
        { user: { firstname: 'Bob', lastname: 'Jones' } },
      ];
      expect(col.valueGetter(value)).toEqual(['Alice Smith', 'Bob Jones']);
    });

    it('filters out approvers without a user', () => {
      const value = [
        { user: { firstname: 'Alice', lastname: 'Smith' } },
        { user: null },
        {},
      ];
      expect(col.valueGetter(value)).toEqual(['Alice Smith']);
    });

    it('renders ApproversCell', () => {
      const names = ['Alice Smith', 'Bob Jones'];
      render(col.renderCell({ value: names }));
      expect(screen.getByText('Alice Smith, Bob Jones')).toBeInTheDocument();
    });

    it('renders ApproversCell with empty list', () => {
      render(col.renderCell({ value: [] }));
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  // ── approved_by ───────────────────────────────────────────────────────────
  describe('approved_by column renderCell', () => {
    let col;
    beforeEach(() => {
      col = columns.find((c) => c.field === 'approved_by');
    });

    it('shows names of approvers with Approved status', () => {
      const params = {
        row: {
          assigned_approvers: [
            {
              status: { label: 'Approved' },
              user: { firstname: 'Carol', lastname: 'White' },
            },
            {
              status: { label: 'Pending' },
              user: { firstname: 'Dan', lastname: 'Black' },
            },
          ],
        },
      };
      render(col.renderCell(params));
      expect(screen.getByText('Carol White')).toBeInTheDocument();
    });

    it('filters out approvers without user data', () => {
      const params = {
        row: {
          assigned_approvers: [
            { status: { label: 'Approved' }, user: null },
          ],
        },
      };
      render(col.renderCell(params));
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('shows "-" when assigned_approvers is null', () => {
      const params = { row: { assigned_approvers: null } };
      render(col.renderCell(params));
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  // ── last_updated ──────────────────────────────────────────────────────────
  describe('last_updated column renderCell', () => {
    let col;
    beforeEach(() => {
      col = columns.find((c) => c.field === 'last_updated');
    });

    it('renders formatted date/time when value is present', () => {
      const { getByText } = render(
        col.renderCell({ value: '2024-01-01T10:00:00Z' }),
      );
      expect(getByText('01/01/2024, 10:00')).toBeInTheDocument();
      expect(mockFormatUKorAnzDateTime).toHaveBeenCalledWith(
        '2024-01-01T10:00:00Z',
        'GB',
      );
    });

    it('renders em-dash when value is absent', () => {
      const { getByText } = render(col.renderCell({ value: null }));
      expect(getByText('—')).toBeInTheDocument();
    });
  });

  // ── actions / getActions ──────────────────────────────────────────────────
  describe('actions column getActions', () => {
    let col;
    const ownerId = 7;
    const otherId = 99;
    beforeEach(() => {
      col = columns.find((c) => c.field === 'actions');
    });

    const makeParams = (status, submittedById, extra = {}) => ({
      row: {
        status,
        submitted_by: { id: submittedById },
        can_issue_order: extra.can_issue_order ?? false,
        ...extra,
      },
    });

    describe('Draft status', () => {
      it('shows edit, request-approval, view-logs, cancel-tr when owner', () => {
        const keys = col
          .getActions(makeParams('Draft', ownerId))
          .map((i) => i.key);
        expect(keys).toEqual([
          'edit',
          'request-approval',
          'view-logs',
          'cancel-tr',
        ]);
      });

      it('shows only view-logs for non-owner', () => {
        const keys = col
          .getActions(makeParams('Draft', otherId))
          .map((i) => i.key);
        expect(keys).toEqual(['view-logs']);
      });
    });

    describe('Pending status', () => {
      it('shows all items when owner', () => {
        const keys = col
          .getActions(makeParams('Pending', ownerId))
          .map((i) => i.key);
        expect(keys).toContain('view-report');
        expect(keys).toContain('withdraw');
        expect(keys).toContain('view-logs');
        expect(keys).toContain('cancel-tr');
      });

      it('shows view-report and view-logs only for non-owner', () => {
        const keys = col
          .getActions(makeParams('Pending', otherId))
          .map((i) => i.key);
        expect(keys).toEqual(['view-report', 'view-logs']);
      });
    });

    describe('Approved status', () => {
      it('shows view-report, issue-order, view-logs, cancel-tr when owner with can_issue_order', () => {
        const keys = col
          .getActions(
            makeParams('Approved', ownerId, { can_issue_order: true }),
          )
          .map((i) => i.key);
        expect(keys).toContain('view-report');
        expect(keys).toContain('issue-order');
        expect(keys).toContain('view-logs');
        expect(keys).toContain('cancel-tr');
      });

      it('omits issue-order when can_issue_order is false', () => {
        const keys = col
          .getActions(
            makeParams('Approved', ownerId, { can_issue_order: false }),
          )
          .map((i) => i.key);
        expect(keys).not.toContain('issue-order');
      });

      it('shows view-report and view-logs for non-owner', () => {
        const keys = col
          .getActions(makeParams('Approved', otherId))
          .map((i) => i.key);
        expect(keys).toEqual(['view-report', 'view-logs']);
      });
    });

    describe('Rejected status', () => {
      it('shows view-report, edit, view-logs, cancel-tr when owner', () => {
        const keys = col
          .getActions(makeParams('Rejected', ownerId))
          .map((i) => i.key);
        expect(keys).toContain('view-report');
        expect(keys).toContain('edit');
        expect(keys).toContain('view-logs');
        expect(keys).toContain('cancel-tr');
      });

      it('omits cancel-tr and edit for non-owner', () => {
        const keys = col
          .getActions(makeParams('Rejected', otherId))
          .map((i) => i.key);
        expect(keys).not.toContain('cancel-tr');
        expect(keys).not.toContain('edit');
        expect(keys).toContain('view-report');
        expect(keys).toContain('view-logs');
      });
    });

    describe('Cancelled status', () => {
      it('shows only view-logs', () => {
        const keys = col
          .getActions(makeParams('Cancelled', ownerId))
          .map((i) => i.key);
        expect(keys).toEqual(['view-logs']);
      });
    });

    describe('unknown status', () => {
      it('returns empty array', () => {
        const items = col.getActions(makeParams('Unknown', ownerId));
        expect(items).toEqual([]);
      });
    });

    it('handles params with no status (falls through to default case)', () => {
      // params.row must exist; undefined status hits the default switch branch
      const items = col.getActions({ row: { submitted_by: null } });
      expect(Array.isArray(items)).toBe(true);
      expect(items).toEqual([]);
    });
  });
});
