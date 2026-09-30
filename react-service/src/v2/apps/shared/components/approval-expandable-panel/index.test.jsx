import { render, screen } from '@testing-library/react';

jest.mock('./index.styled', () => {
  const React = require('react');

  const passthrough =
    (
      tag, // eslint-disable-next-line react/display-name
    ) =>
    ({ children, ...rest }) =>
      React.createElement(tag, rest, children);

  const span = passthrough('span');
  const div = passthrough('div');
  const td = passthrough('td');
  const tr = passthrough('tr');

  return {
    STATUS_CONFIG: {
      approved: {
        color: '#16a34a',
        bg: '#dcfce7',
        label: 'Approved',
        dotColor: '#16a34a',
      },
      rejected: {
        color: '#dc2626',
        bg: '#fee2e2',
        label: 'Rejected',
        dotColor: '#dc2626',
      },
      pending: {
        color: '#d97706',
        bg: '#fef3c7',
        label: 'Pending',
        dotColor: '#d97706',
      },
      locked: {
        color: '#6b7280',
        bg: '#f3f4f6',
        label: 'Locked',
        dotColor: '#9ca3af',
      },
    },
    PanelRoot: div,
    LevelCard: div,
    LevelHeader: div,
    LevelHeaderLeft: div,
    LevelTitle: div,
    AllMustApproveChip: ({ label }) => React.createElement('span', {}, label),
    IndicatorBox: div,
    IndicatorLabel: div,
    LockedLabel: div,
    DividerRow: div,
    DividerText: div,
    StyledHeadCell: td,
    StyledBodyCell: td,
    ApproverRow: tr,
    UserCellBox: div,
    UserAvatar: ({ children }) => React.createElement('span', {}, children),
    UserName: div,
    UserEmail: div,
    RoleText: div,
    TimestampText: div,
    BadgeBox: div,
    BadgePill: span,
    ApprovalStatus: div,
  };
});

// ─── Mock: missing @mui/icons-material icons ──────────────────────────────────
// LockOutlined, South, CheckCircle are not in the project's __mocks__ folder.
// We render nothing for them — tests only care about text content.

jest.mock('@mui/icons-material/LockOutlined', () => () => null);
jest.mock('@mui/icons-material/South', () => () => null);
jest.mock('@mui/icons-material/CheckCircle', () => () => null);

// ─── Mock: i18n ───────────────────────────────────────────────────────────────
// Returns the translation key so test assertions match predictable strings.

jest.mock('v2/helpers/i18n', () => ({
  t: (key, params) => {
    if (key === 'level-sequence') {
      return `Level ${params.fromLevel} must complete before Level ${params.toLevel} begins`;
    }
    const MAP = {
      locked: 'Locked',
      approved: 'approved',
      level: 'Level',
      'all-must-approve': 'All must approve',
      'assigned-to': 'Assigned to',
      role: 'Role',
      status: 'Status',
      timestamp: 'Timestamp',
      'no-approval-levels': 'No approval levels configured.',
      'self-approved-by-requester': 'Self-approved by requester',
      'approved-by-higher-authority': 'Satisfied by higher authority',
    };
    return MAP[key] ?? key;
  },
}));

// ─── Component under test ─────────────────────────────────────────────────────

import ApprovalExpandablePanel from './index';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const APPROVER_PENDING = {
  id: '1',
  role_label: 'Operational Lead',
  approver_user: {
    display_name: 'James Patterson',
    email: 'james.p@mclaren.com',
    initials: 'JP',
  },
  status: { value: 'pending', label: 'Pending' },
  approval_requested_at: '2026-03-01T09:00:00Z',
  actioned_at: null,
};

const APPROVER_APPROVED = {
  id: '2',
  role_label: 'Commercial Lead',
  approver_user: {
    display_name: 'Michael Brooks',
    email: 'michael.b@mclaren.com',
    initials: 'MB',
  },
  status: { value: 'approved', label: 'Approved' },
  approval_requested_at: '2026-03-01T09:00:00Z',
  actioned_at: '2026-03-01T09:30:00Z',
};

const APPROVER_LOCKED = {
  id: '3',
  role_label: 'Commercial Director',
  approver_user: {
    display_name: 'Andrew Stewart',
    email: 'andrew.s@mclaren.com',
    initials: 'AS',
  },
  status: { value: 'locked', label: 'Locked' },
  approval_requested_at: null,
  actioned_at: null,
};

const LEVELS_ACTIVE_ONLY = [
  {
    level_number: 1,
    status: 'pending',
    isLevel: true,
    rule: 'All must approve',
    approvers: [APPROVER_PENDING, APPROVER_APPROVED],
  },
];

const LEVELS_WITH_LOCKED = [
  {
    level_number: 1,
    status: 'pending',
    isLevel: true,
    rule: 'All must approve',
    approvers: [APPROVER_PENDING],
  },
  {
    level_number: 2,
    status: 'locked',
    isLevel: true,
    approvers: [APPROVER_LOCKED],
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ApprovalExpandablePanel', () => {
  describe('empty state', () => {
    it('renders empty state message when levels is empty', () => {
      render(<ApprovalExpandablePanel levels={[]} />);
      expect(
        screen.getByText('No approval levels configured.'),
      ).toBeInTheDocument();
    });

    it('renders empty state message when levels prop is omitted', () => {
      render(<ApprovalExpandablePanel />);
      expect(
        screen.getByText('No approval levels configured.'),
      ).toBeInTheDocument();
    });
  });

  describe('level header', () => {
    it('renders the level number in the header', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(screen.getByText('Level 1')).toBeInTheDocument();
    });

    it('renders "All must approve" chip', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(screen.getByText('All must approve')).toBeInTheDocument();
    });

    it('renders approval fraction in the header', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />); // 1 approved out of 2 — i18n returns 'approved' for the label
      expect(screen.getByText('1/2 approved')).toBeInTheDocument();
    });

    it('renders "Locked" indicator for a locked level', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_WITH_LOCKED} />);
      expect(screen.getAllByText('Locked').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('table columns', () => {
    it('renders all four column headers', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(screen.getByText('Assigned to')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
    });
  });

  describe('approver rows', () => {
    it('renders approver display name', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(screen.getByText('James Patterson')).toBeInTheDocument();
    });

    it('renders approver email', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(screen.getByText('james.p@mclaren.com')).toBeInTheDocument();
    });

    it('renders approver initials in avatar', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(screen.getByText('JP')).toBeInTheDocument();
    });

    it('renders role label', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(screen.getByText('Operational Lead')).toBeInTheDocument();
    });

    it('renders Pending status badge', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders Approved status badge', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('renders formatted timestamp for actioned approver', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />); // Michael Brooks actioned_at: 2026-03-01T09:30:00Z → 01/03/2026 14:30
      expect(screen.getAllByText(/01\/03\/2026/).length).toBeGreaterThanOrEqual(
        1,
      );
    });

    it('renders "—" for approvers with no timestamp', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_WITH_LOCKED} />);
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
  });

  describe('locked level', () => {
    it('renders locked approver name', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_WITH_LOCKED} />);
      expect(screen.getByText('Andrew Stewart')).toBeInTheDocument();
    });

    it('renders Locked status badge for locked approver', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_WITH_LOCKED} />); // 'Locked' appears in the header LockedLabel AND the BadgePill row
      const lockedEls = screen.getAllByText('Locked');
      expect(lockedEls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('between-level divider', () => {
    it('renders divider text when the next level is locked', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_WITH_LOCKED} />);
      expect(
        screen.getByText('Level 1 must complete before Level 2 begins'),
      ).toBeInTheDocument();
    });

    it('does not render a divider when there is only one level', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(
        screen.queryByText(/must complete before/),
      ).not.toBeInTheDocument();
    });
  });

  describe('no send reminder', () => {
    it('does not render a three-dot menu button for pending approvers', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
      expect(screen.queryByLabelText('Options')).not.toBeInTheDocument();
      expect(screen.queryByText('Send Reminder')).not.toBeInTheDocument();
    });
  });

  describe('multiple levels', () => {
    it('renders both level headers when two levels are provided', () => {
      render(<ApprovalExpandablePanel levels={LEVELS_WITH_LOCKED} />);
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
    });
  });
});

describe('formatTimestamp branches', () => {
  it('returns "—" when timestamp is null', () => {
    const levels = [
      {
        level_number: 1,
        status: 'pending',
        approvers: [
          {
            id: '1',
            role_label: 'Lead',
            approver_user: {
              display_name: 'A',
              email: 'a@a.com',
              initials: 'A',
            },
            status: { value: 'pending', label: 'Pending' },
            approval_requested_at: null,
            actioned_at: null,
          },
        ],
      },
    ];
    render(<ApprovalExpandablePanel levels={levels} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats a valid ISO timestamp correctly', () => {
    const levels = [
      {
        level_number: 1,
        status: 'pending',
        approvers: [
          {
            id: '1',
            role_label: 'Lead',
            approver_user: {
              display_name: 'A',
              email: 'a@a.com',
              initials: 'A',
            },
            status: { value: 'approved', label: 'Approved' },
            approval_requested_at: null,
            actioned_at: '2026-03-01T09:30:00Z',
          },
        ],
      },
    ];
    render(<ApprovalExpandablePanel levels={levels} />);
    expect(screen.getByText(/01\/03\/2026/)).toBeInTheDocument();
  });
});
describe('LevelIndicator', () => {
  it('renders locked indicator path', () => {
    render(<ApprovalExpandablePanel levels={LEVELS_WITH_LOCKED} />);
    expect(screen.getAllByText('Locked').length).toBeGreaterThanOrEqual(1);
  });

  it('renders approved fraction on active level', () => {
    render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
    expect(screen.getByText('1/2 approved')).toBeInTheDocument();
  });
});

describe('StatusBadge all status values', () => {
  const makeLevel = (statusValue, statusLabel) => [
    {
      level_number: 1,
      status: 'pending',
      approvers: [
        {
          id: '1',
          role_label: 'Lead',
          approver_user: {
            display_name: 'Test User',
            email: 't@t.com',
            initials: 'TU',
          },
          status: { value: statusValue, label: statusLabel },
          approval_requested_at: null,
          actioned_at: null,
        },
      ],
    },
  ];

  it('renders approved badge', () => {
    render(
      <ApprovalExpandablePanel levels={makeLevel('approved', 'Approved')} />,
    );
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders rejected badge', () => {
    render(
      <ApprovalExpandablePanel levels={makeLevel('rejected', 'Rejected')} />,
    );
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('renders pending badge', () => {
    render(
      <ApprovalExpandablePanel levels={makeLevel('pending', 'Pending')} />,
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders locked badge', () => {
    render(<ApprovalExpandablePanel levels={makeLevel('locked', 'Locked')} />);
    expect(screen.getAllByText('Locked').length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to pending config for unknown status value', () => {
    render(
      <ApprovalExpandablePanel levels={makeLevel('unknown', 'Custom Label')} />,
    );
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('renders default label from config when status label is missing', () => {
    const levels = [
      {
        level_number: 1,
        status: 'pending',
        approvers: [
          {
            id: '1',
            role_label: 'Lead',
            approver_user: {
              display_name: 'Test',
              email: 't@t.com',
              initials: 'T',
            },
            status: { value: 'approved' }, // no label — should fall back to cfg.label
            approval_requested_at: null,
            actioned_at: null,
          },
        ],
      },
    ];
    render(<ApprovalExpandablePanel levels={levels} />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });
});

describe('LevelDivider', () => {
  it('renders divider component between levels when next is locked', () => {
    render(<ApprovalExpandablePanel levels={LEVELS_WITH_LOCKED} />);
    expect(
      screen.getByText('Level 1 must complete before Level 2 begins'),
    ).toBeInTheDocument();
  });

  it('does not render divider when next level is not locked', () => {
    const twoActiveLevels = [
      { level_number: 1, status: 'pending', approvers: [APPROVER_PENDING] },
      { level_number: 2, status: 'pending', approvers: [APPROVER_APPROVED] },
    ];
    render(<ApprovalExpandablePanel levels={twoActiveLevels} />);
    expect(screen.queryByText(/must complete before/)).not.toBeInTheDocument();
  });
});

describe('LevelPanel', () => {
  it('renders locked level panel with locked styles', () => {
    render(<ApprovalExpandablePanel levels={LEVELS_WITH_LOCKED} />);
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Andrew Stewart')).toBeInTheDocument();
  });

  it('renders active level panel', () => {
    render(<ApprovalExpandablePanel levels={LEVELS_ACTIVE_ONLY} />);
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('James Patterson')).toBeInTheDocument();
  });

  it('renders approver with missing role_label as "—"', () => {
    const levels = [
      {
        level_number: 1,
        status: 'pending',
        approvers: [
          {
            id: '1',
            role_label: null,
            approver_user: {
              display_name: 'No Role',
              email: 'nr@a.com',
              initials: 'NR',
            },
            status: { value: 'pending', label: 'Pending' },
            approval_requested_at: null,
            actioned_at: null,
          },
        ],
      },
    ];
    render(<ApprovalExpandablePanel levels={levels} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});

describe('approval status message', () => {
  const makeApprover = (overrides = {}) => ({
    id: '1',
    role_label: 'Lead',
    approver_user: {
      display_name: 'Test User',
      email: 't@t.com',
      initials: 'TU',
    },
    status: { value: 'approved', label: 'Approved' },
    approval_requested_at: null,
    actioned_at: null,
    ...overrides,
  });

  const makeLevels = (approverOverrides) => [
    {
      level_number: 1,
      status: 'pending',
      approvers: [makeApprover(approverOverrides)],
    },
  ];

  it('renders "Satisfied by higher authority" when is_level_satisfied_by_higher_authority is true', () => {
    render(
      <ApprovalExpandablePanel
        levels={makeLevels({ is_level_satisfied_by_higher_authority: true })}
      />,
    );
    expect(
      screen.getByText('Satisfied by higher authority'),
    ).toBeInTheDocument();
  });

  it('renders "Self-approved by requester" when is_level_satisfied_by_self_approved is true', () => {
    render(
      <ApprovalExpandablePanel
        levels={makeLevels({ is_level_satisfied_by_self_approved: true })}
      />,
    );
    expect(screen.getByText('Self-approved by requester')).toBeInTheDocument();
  });

  it('renders "Satisfied by higher authority" when is_satisfied_by_higher_authority is true and level flags are absent', () => {
    render(
      <ApprovalExpandablePanel
        levels={makeLevels({
          is_satisfied_by_higher_authority: true,
        })}
      />,
    );
    expect(
      screen.getByText('Satisfied by higher authority'),
    ).toBeInTheDocument();
  });

  it('renders "Self-approved by requester" when is_satisfied_by_self_approved is true and other flags are absent', () => {
    render(
      <ApprovalExpandablePanel
        levels={makeLevels({
          is_satisfied_by_self_approved: true,
        })}
      />,
    );
    expect(screen.getByText('Self-approved by requester')).toBeInTheDocument();
  });

  it('renders no approval status message when no flags are set', () => {
    render(<ApprovalExpandablePanel levels={makeLevels()} />);
    expect(
      screen.queryByText('Satisfied by higher authority'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Self-approved by requester'),
    ).not.toBeInTheDocument();
  });
});
