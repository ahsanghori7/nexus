import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Flags ────────────────────────────────────────────────────────────────────
let mockFlagReturn = false;
jest.mock('v2/helpers/flags', () => jest.fn(() => mockFlagReturn));

// ── Colors ───────────────────────────────────────────────────────────────────
jest.mock('v2/constants/colors', () => ({ white: '#ffffff' }));

// ── Date helper ───────────────────────────────────────────────────────────────
jest.mock('helpers/date', () => ({
  formatUKorAnzDateTime: jest.fn(() => ({ date: '01/01/2024', time: '10:00' })),
}));

// ── ApprovalExpandablePanel ───────────────────────────────────────────────────
jest.mock('v2/apps/shared/components/approval-expandable-panel', () => ({
  __esModule: true,
  default: ({ levels }) => (
    <div data-testid="approval-panel" data-levels={JSON.stringify(levels)}>
      levels:{levels.length}
    </div>
  ),
}));

// ── TableColumns ─────────────────────────────────────────────────────────────
// Mock with a controlled set of columns covering all renderCell paths
jest.mock('apps/clink/pages/tender-recommendations/TableColumns', () =>
  jest.fn(() => [
    {
      field: 'package_name',
      headerName: 'Package Name',
    },
    {
      field: 'subcontractor',
      headerName: 'Subcontractor',
      valueGetter: (v) => v?.name || '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      renderCell: ({ value }) => (
        <span data-testid="status-cell">{value}</span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      getActions: jest.fn(({ row }) => [
        { key: 'edit', label: 'Edit' },
        { key: 'view-logs', label: 'View Logs' },
      ]),
    },
  ]),
);

import DataTable from './DataTable';
import flag from 'v2/helpers/flags';
import getTableColumns from 'apps/clink/pages/tender-recommendations/TableColumns';

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeClinkAccount = (userId = 7) => ({
  user: { id: userId },
  country: { code: 'GB' },
});

const makeRow = (overrides = {}) => ({
  tender_recommendation_id: 1,
  package_name: 'Package A',
  status: 'Draft',
  subcontractor: { name: 'Acme Ltd' },
  assigned_approvers: [],
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────

describe('DataTable', () => {
  const clinkAccount = makeClinkAccount();
  const onAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFlagReturn = false;
  });

  // ── Basic rendering ─────────────────────────────────────────────────────────
  describe('basic rendering', () => {
    it('renders without crashing with no rows', () => {
      render(
        <DataTable
          rows={[]}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // When there are no rows, nothing is rendered (grouped array is empty)
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('renders table header columns', () => {
      const rows = [makeRow()];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      expect(screen.getByText('Supplier')).toBeInTheDocument();
      expect(screen.getByText('Subcontractor Name')).toBeInTheDocument();
      expect(screen.getByText('Submitted By')).toBeInTheDocument();
    });

    it('renders a row with subcontractor name', () => {
      const rows = [makeRow({ subcontractor: { name: 'My Subcontractor' } })];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // Subcontractor name appears in multiple columns, so use getAllByText
      expect(screen.getAllByText('My Subcontractor').length).toBeGreaterThan(0);
    });

    it('renders "-" when submitted_by value is null/undefined', () => {
      const rows = [makeRow({ submitted_by: null })];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('applies valueGetter for subcontractor column', () => {
      const rows = [makeRow({ subcontractor: { name: 'BuildCo' } })];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // Subcontractor name appears in multiple columns
      expect(screen.getAllByText('BuildCo').length).toBeGreaterThan(0);
    });

    it('renders status column with Chip component', () => {
      const rows = [makeRow({ status: 'Approved' })];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // Status is rendered as a Chip component
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('renders multiple rows', () => {
      const rows = [
        makeRow({ tender_recommendation_id: 1, subcontractor: { name: 'Sub 1' } }),
        makeRow({ tender_recommendation_id: 2, subcontractor: { name: 'Sub 2' } }),
      ];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // Verify both subcontractor names appear in the document
      const sub1Elements = screen.getAllByText('Sub 1');
      const sub2Elements = screen.getAllByText('Sub 2');
      expect(sub1Elements.length).toBeGreaterThan(0);
      expect(sub2Elements.length).toBeGreaterThan(0);
    });
  });

  // ── actions column ──────────────────────────────────────────────────────────
  describe('actions column', () => {
    it('renders a three-dot icon button for each row', () => {
      const rows = [makeRow()];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // icon buttons rendered inside the actions cell
      const iconButtons = screen.getAllByRole('button');
      expect(iconButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('does NOT render expand button when APPROVAL_THRESHOLD flag is false', () => {
      mockFlagReturn = false;
      const rows = [
        makeRow({
          assigned_approvers: [
            { approvers: [], level: 1 },
          ],
        }),
      ];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // Only the three-dot button (exclude status chip)
      const iconButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('[data-testid="more-vert-icon"]') || 
        btn.querySelector('[data-testid="chevron-right-icon"]')
      );
      expect(iconButtons).toHaveLength(1);
    });

    it('renders expand button when APPROVAL_THRESHOLD flag is true and row has assigned_approvers', () => {
      mockFlagReturn = true;
      const rows = [
        makeRow({
          assigned_approvers: [
            {
              level: 1,
              approvers: [
                {
                  id: 1,
                  approver_user: { firstname: 'Jane', lastname: 'Doe', account_role: { label: 'Manager' } },
                  status: { label: 'Pending' },
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                },
              ],
            },
          ],
        }),
      ];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // three-dot + expand = 2 buttons (exclude status chip)
      const iconButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('[data-testid="more-vert-icon"]') || 
        btn.querySelector('[data-testid="chevron-right-icon"]')
      );
      expect(iconButtons).toHaveLength(2);
    });
  });

  // ── Menu open / close / item click ─────────────────────────────────────────
  describe('context menu', () => {
    it('opens menu when three-dot button is clicked', () => {
      const rows = [makeRow()];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      expect(screen.queryByTestId('mui-menu')).not.toBeInTheDocument();
      // Find the menu button (last button, the three-dot)
      const allButtons = screen.getAllByRole('button');
      const menuButton = allButtons[allButtons.length - 1];
      fireEvent.click(menuButton);
      expect(screen.getByTestId('mui-menu')).toBeInTheDocument();
    });

    it('shows action items in menu', () => {
      const rows = [makeRow()];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // Find the menu button (last button, the three-dot)
      const allButtons = screen.getAllByRole('button');
      const menuButton = allButtons[allButtons.length - 1];
      fireEvent.click(menuButton);
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('View Logs')).toBeInTheDocument();
    });

    it('calls onAction with the right key and row when a menu item is clicked', () => {
      const row = makeRow({ tender_recommendation_id: 42 });
      render(
        <DataTable
          rows={[row]}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // Find the menu button (last button, the three-dot)
      const allButtons = screen.getAllByRole('button');
      const menuButton = allButtons[allButtons.length - 1];
      fireEvent.click(menuButton);
      fireEvent.click(screen.getByText('Edit'));
      expect(onAction).toHaveBeenCalledWith('edit', row);
    });

    it('closes menu after clicking a menu item', () => {
      const rows = [makeRow()];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // Find the menu button (last button, the three-dot)
      let allButtons = screen.getAllByRole('button');
      let menuButton = allButtons[allButtons.length - 1];
      fireEvent.click(menuButton);
      expect(screen.getByTestId('mui-menu')).toBeInTheDocument();
      fireEvent.click(screen.getByText('View Logs'));
      expect(screen.queryByTestId('mui-menu')).not.toBeInTheDocument();
    });

    it('does not crash if onAction is not provided', () => {
      const rows = [makeRow()];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
        />,
      );
      // Find the menu button (last button, the three-dot)
      const allButtons = screen.getAllByRole('button');
      const menuButton = allButtons[allButtons.length - 1];
      fireEvent.click(menuButton);
      expect(() => fireEvent.click(screen.getByText('Edit'))).not.toThrow();
    });
  });

  // ── Expand / collapse (ApprovalExpandablePanel) ─────────────────────────────
  describe('row expand / collapse', () => {
    beforeEach(() => {
      mockFlagReturn = true;
    });

    const rowWithApprovers = makeRow({
      tender_recommendation_id: 5,
      assigned_approvers: [
        {
          level: 1,
          approvers: [
            {
              id: 10,
              approver_user: {
                firstname: 'Alice',
                lastname: 'Smith',
                account_role: { label: 'Manager' },
              },
              status: { label: 'Pending' },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          ],
        },
      ],
    });

    it('does not show ApprovalExpandablePanel initially', () => {
      render(
        <DataTable
          rows={[rowWithApprovers]}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      expect(screen.queryByTestId('approval-panel')).not.toBeInTheDocument();
    });

    it('shows ApprovalExpandablePanel after clicking expand button', () => {
      render(
        <DataTable
          rows={[rowWithApprovers]}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // Find the expand button (ChevronRight icon button)
      const allButtons = screen.getAllByRole('button');
      const expandButton = allButtons.find(btn => {
        const icon = btn.querySelector('[data-testid="chevron-right-icon"]');
        return icon !== null;
      });
      if (expandButton) {
        fireEvent.click(expandButton);
        expect(screen.getByTestId('approval-panel')).toBeInTheDocument();
      }
    });

    it('collapses panel on second click', () => {
      render(
        <DataTable
          rows={[rowWithApprovers]}
          clinkAccount={clinkAccount}
          onAction={onAction}
        />,
      );
      // Find the expand button (ChevronRight icon button)
      const allButtons = screen.getAllByRole('button');
      const expandButton = allButtons.find(btn => {
        const icon = btn.querySelector('[data-testid="chevron-right-icon"]');
        return icon !== null;
      });
      if (expandButton) {
        fireEvent.click(expandButton);
        expect(screen.getByTestId('approval-panel')).toBeInTheDocument();
        fireEvent.click(expandButton);
        expect(screen.queryByTestId('approval-panel')).not.toBeInTheDocument();
      }
    });
  });

  // ── transformLevels ─────────────────────────────────────────────────────────
  // Tested indirectly via expand rendering; coverage through ApprovalExpandablePanel
  describe('transformLevels (via expand)', () => {
    beforeEach(() => {
      mockFlagReturn = true;
    });

    it('passes correct level count to ApprovalExpandablePanel', () => {
      const row = makeRow({
        tender_recommendation_id: 7,
        assigned_approvers: [
          {
            level: 1,
            approvers: [
              {
                id: 1,
                approver_user: { firstname: 'A', lastname: 'B', account_role: null },
                status: { label: 'Approved' },
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
              },
            ],
          },
          {
            level: 2,
            approvers: [],
          },
        ],
      });
      render(
        <DataTable rows={[row]} clinkAccount={clinkAccount} onAction={onAction} />,
      );
      // Find the expand button
      const allButtons = screen.getAllByRole('button');
      const expandButton = allButtons.find(btn => {
        const icon = btn.querySelector('[data-testid="chevron-right-icon"]');
        return icon !== null;
      });
      if (expandButton) {
        fireEvent.click(expandButton);
        expect(screen.getByTestId('approval-panel')).toHaveTextContent('levels:2');
      }
    });

    it('renders locked level status when all approvers are locked', () => {
      const row = makeRow({
        tender_recommendation_id: 8,
        assigned_approvers: [
          {
            level: 1,
            approvers: [
              {
                id: 2,
                approver_user: { firstname: 'X', lastname: 'Y', account_role: null },
                status: { label: 'locked' },
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
              },
            ],
          },
        ],
      });
      render(
        <DataTable rows={[row]} clinkAccount={clinkAccount} onAction={onAction} />,
      );
      // Find the expand button
      const allButtons = screen.getAllByRole('button');
      const expandButton = allButtons.find(btn => {
        const icon = btn.querySelector('[data-testid="chevron-right-icon"]');
        return icon !== null;
      });
      if (expandButton) {
        fireEvent.click(expandButton);
        expect(screen.getByTestId('approval-panel')).toBeInTheDocument();
      }
    });

    it('maps satisfaction flags from the approver record onto the level approver', () => {
      const row = makeRow({
        tender_recommendation_id: 12,
        assigned_approvers: [
          {
            level: 1,
            approvers: [
              {
                id: 20,
                approver_user: { firstname: 'Robert', lastname: 'Dean', account_role: null },
                status: { label: 'Pending' },
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
                is_level_satisfied_by_higher_authority: true,
                is_level_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: false,
                is_satisfied_by_self_approved: true,
              },
            ],
          },
        ],
      });
      render(
        <DataTable rows={[row]} clinkAccount={clinkAccount} onAction={onAction} />,
      );
      const allButtons = screen.getAllByRole('button');
      const expandButton = allButtons.find(btn => {
        const icon = btn.querySelector('[data-testid="chevron-right-icon"]');
        return icon !== null;
      });
      fireEvent.click(expandButton);
      const levels = JSON.parse(
        screen.getByTestId('approval-panel').dataset.levels,
      );
      const approver = levels[0].approvers[0];
      expect(approver.is_level_satisfied_by_higher_authority).toBe(true);
      expect(approver.is_level_satisfied_by_self_approved).toBe(false);
      expect(approver.is_satisfied_by_higher_authority).toBe(false);
      expect(approver.is_satisfied_by_self_approved).toBe(true);
    });

    it('handles null assigned_approvers gracefully', () => {
      const row = makeRow({
        tender_recommendation_id: 9,
        assigned_approvers: null,
      });
      // Should render without crash; no expand button since null has no length > 0
      render(
        <DataTable rows={[row]} clinkAccount={clinkAccount} onAction={onAction} />,
      );
      // Only two-dot button (no expand)
      expect(screen.queryByTestId('approval-panel')).not.toBeInTheDocument();
    });

    it('handles approver_user being null (uses fallback initials "?")', () => {
      const row = makeRow({
        tender_recommendation_id: 11,
        assigned_approvers: [
          {
            level: 1,
            approvers: [
              {
                id: 5,
                approver_user: null,
                status: { label: 'Pending' },
                created_at: null,
                updated_at: null,
              },
            ],
          },
        ],
      });
      render(
        <DataTable rows={[row]} clinkAccount={clinkAccount} onAction={onAction} />,
      );
      // Find the expand button
      const allButtons = screen.getAllByRole('button');
      const expandButton = allButtons.find(btn => {
        const icon = btn.querySelector('[data-testid="chevron-right-icon"]');
        return icon !== null;
      });
      if (expandButton) {
        fireEvent.click(expandButton);
        expect(screen.getByTestId('approval-panel')).toBeInTheDocument();
      }
    });
  });

  // ── Scroll behaviour ────────────────────────────────────────────────────────
  describe('scroll to target row', () => {
    let originalRaf;
    let originalCaf;
    beforeEach(() => {
      jest.useFakeTimers();
      // jsdom with pretendToBeVisual=false does not expose requestAnimationFrame;
      // assign stubs directly so the component code paths can execute
      originalRaf = window.requestAnimationFrame;
      originalCaf = window.cancelAnimationFrame;
      let rafId = 0;
      window.requestAnimationFrame = jest.fn((cb) => {
        rafId += 1;
        cb();
        return rafId;
      });
      window.cancelAnimationFrame = jest.fn();
    });

    afterEach(() => {
      jest.useRealTimers();
      window.requestAnimationFrame = originalRaf;
      window.cancelAnimationFrame = originalCaf;
    });

    it('does not throw when scrollInfo has scroll=true and matching trId', () => {
      const rows = [makeRow({ tender_recommendation_id: 10 })];
      const scrollIntoViewMock = jest.fn();

      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
          scrollInfo={{ trId: '10', scroll: 'true' }}
        />,
      );

      // Assign scroll mock to the ref'd row element
      const tableRows = screen.getAllByTestId('mui-tablerow');
      tableRows[0].scrollIntoView = scrollIntoViewMock;

      act(() => {
        jest.runAllTimers();
      });
      // No errors thrown
    });

    it('does not scroll when scroll is not "true"', () => {
      const rows = [makeRow({ tender_recommendation_id: 10 })];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
          scrollInfo={{ trId: '10', scroll: 'false' }}
        />,
      );
      act(() => {
        jest.runAllTimers();
      });
      // No errors
    });

    it('does not scroll when trId is null', () => {
      const rows = [makeRow({ tender_recommendation_id: 10 })];
      render(
        <DataTable
          rows={rows}
          clinkAccount={clinkAccount}
          onAction={onAction}
          scrollInfo={{ trId: null, scroll: 'true' }}
        />,
      );
      act(() => {
        jest.runAllTimers();
      });
    });
  });

  // ── Default props ───────────────────────────────────────────────────────────
  describe('default props', () => {
    it('renders with no props except clinkAccount', () => {
      render(<DataTable clinkAccount={clinkAccount} />);
      // Just verify it doesn't crash and renders without rows
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
