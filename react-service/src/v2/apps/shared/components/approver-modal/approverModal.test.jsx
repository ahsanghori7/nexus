import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApproverModal from 'v2/apps/shared/components/approver-modal/approverModal';
import i18next from 'i18next';

// Mock i18next
jest.mock('i18next', () => ({
  t: jest.fn((key, opts) => opts?.defaultValue || key),
}));

// Mock context hook
const mockResetApprovers = jest.fn(() => ({ type: 'resetApprovers' }));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchApproversWithLevels: jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue([]),
      })),
      fetchApproversShortlistedSubs: jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue([]),
      })),
      resetApprovers: mockResetApprovers,
    },
    account: { id: 1 },
  }),
}));

// Mock react-redux connect (bypass HOC)
jest.mock('react-redux', () => ({
  connect: () => (Component) => Component,
}));

const mockShowSnackbar = jest.fn();

jest.mock('v2/hooks/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar: mockShowSnackbar,
  }),
}));

const mockDispatch = jest.fn(() => ({
  unwrap: jest.fn().mockResolvedValue([]),
}));

const baseProps = {
  open: true,
  onClose: jest.fn(),
  shortlistedSubcontractorIds: [1, 2],
  onSubmit: jest.fn(() => Promise.resolve()),
  approversPayload: {
    levels: [
      {
        level: 1,
        approval_level_id: 5,
        rule: 'All must approve',
        roles: [
          {
            id: 10,
            name: 'Manager',
            users: [
              {
                id: 100,
                display_name: 'John Doe',
                email: 'john@test.com',
              },
              {
                id: 101,
                display_name: 'Jane Doe',
                email: 'jane@test.com',
              },
            ],
          },
        ],
      },
    ],
  },
  fetchingApprovers: false,
  clinkAccount: { id: 1 },
  dispatch: mockDispatch,
  approvalType: 'tender_recommendation',
};

const renderComponent = (props = {}) =>
  render(<ApproverModal {...baseProps} {...props} />);

describe('ApproverModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal title', () => {
    renderComponent();
    expect(screen.getByText('select-approvers')).toBeInTheDocument();
  });

  it('dispatches fetchApprovers on open', async () => {
    renderComponent({ approversPayload: { levels: [] } });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  it('shows empty state when no approvers', () => {
    renderComponent({ approversPayload: { levels: [] } });
    expect(screen.getByText('no-approvers-available')).toBeInTheDocument();
  });

  it('renders approver levels and roles', () => {
    renderComponent();

    expect(screen.getByText('level-number')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
  });

  it('selects an approver on click', () => {
    renderComponent();

    const user = screen.getByText('john@test.com');
    fireEvent.click(user);

    const radio = screen.getByDisplayValue('100');
    expect(radio).toBeChecked();
  });

  it('enables submit button when all roles selected', () => {
    renderComponent();

    fireEvent.click(screen.getByText('john@test.com'));

    const submitBtn = screen.getByText('request-approval');
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onSubmit with selected approvers', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('john@test.com'));

    const submitBtn = screen.getByText('request-approval');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(baseProps.onSubmit).toHaveBeenCalledWith({
        selectedApprovers: [{ user_id: 100, approval_level_id: 5 }],
      });
    });
  });

  it('does not submit if not all roles selected', () => {
    renderComponent();

    const submitBtn = screen.getByText('request-approval');
    fireEvent.click(submitBtn);

    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByText('cancel'));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose after successful submit', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('john@test.com'));
    fireEvent.click(screen.getByText('request-approval'));

    await waitFor(() => {
      expect(baseProps.onClose).toHaveBeenCalled();
    });
  });

  it('resets state when modal closes', async () => {
    const { rerender } = renderComponent();

    fireEvent.click(screen.getByText('john@test.com'));

    rerender(<ApproverModal {...baseProps} open={false} />);
    rerender(<ApproverModal {...baseProps} open />);

    const submitBtn = screen.getByText('request-approval');
    expect(submitBtn).toBeDisabled();
  });

  it('dispatches resetApprovers when the modal closes', () => {
    const { rerender } = renderComponent();

    rerender(<ApproverModal {...baseProps} open={false} />);

    expect(mockResetApprovers).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'resetApprovers' });
  });

  it('does not dispatch resetApprovers when an order approval modal closes', () => {
    const { rerender } = renderComponent({ approvalType: 'order' });

    rerender(
      <ApproverModal {...baseProps} approvalType="order" open={false} />,
    );

    expect(mockResetApprovers).not.toHaveBeenCalled();
  });
});

describe('ApproverModal - custom quorum rule', () => {
  const customApprovers = [
    {
      level: 1,
      approval_level_id: 6,
      rule: 'custom',
      rule_description: 'Any 1 from 2 must approve',
      min_required: 1,
      roles: [
        {
          id: '7',
          label: 'Manager',
          users: [
            {
              id: '2969',
              firstname: 'Liam',
              lastname: 'Curley',
              email: 'liam@test.com',
            },
          ],
        },
        {
          id: '8',
          label: 'Admin',
          users: [
            {
              id: '22639',
              firstname: 'aa',
              lastname: '',
              email: 'aa@test.com',
            },
          ],
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires only min_required approvers instead of one per role', () => {
    renderComponent({ approversPayload: { levels: customApprovers } });

    expect(screen.getByText('Any 1 from 2 must approve')).toBeInTheDocument();
    expect(screen.getByText('0/1 selected')).toBeInTheDocument();
  });

  it('marks quorum satisfied after selecting a single role out of many', () => {
    renderComponent({ approversPayload: { levels: customApprovers } });

    fireEvent.click(screen.getByText('liam@test.com'));

    expect(screen.getByText('1/1 selected')).toBeInTheDocument();
    const submitBtn = screen.getByText('request-approval');
    expect(submitBtn).not.toBeDisabled();
  });

  it('allows switching the selected approver to a different role once quorum is met', () => {
    renderComponent({ approversPayload: { levels: customApprovers } });

    fireEvent.click(screen.getByText('liam@test.com'));
    expect(screen.getByDisplayValue('2969')).toBeChecked();

    fireEvent.click(screen.getByText('aa@test.com'));

    expect(screen.getByDisplayValue('22639')).toBeChecked();
    expect(screen.getByDisplayValue('2969')).not.toBeChecked();
    expect(screen.getByText('1/1 selected')).toBeInTheDocument();
  });

  it('submits only the currently selected approver after switching roles', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    renderComponent({
      approversPayload: { levels: customApprovers },
      onSubmit,
    });

    fireEvent.click(screen.getByText('liam@test.com'));
    fireEvent.click(screen.getByText('aa@test.com'));
    fireEvent.click(screen.getByText('request-approval'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        selectedApprovers: [{ user_id: '22639', approval_level_id: 6 }],
      });
    });
  });

  it('shows a reset control for the custom quorum rule', () => {
    renderComponent({ approversPayload: { levels: customApprovers } });

    expect(screen.getByText('clear-level')).toBeInTheDocument();
  });

  it("clears only that level's selections when reset is clicked", () => {
    renderComponent({ approversPayload: { levels: customApprovers } });

    fireEvent.click(screen.getByText('liam@test.com'));
    expect(screen.getByDisplayValue('2969')).toBeChecked();
    expect(screen.getByText('1/1 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByText('clear-level'));

    expect(screen.getByDisplayValue('2969')).not.toBeChecked();
    expect(screen.getByText('0/1 selected')).toBeInTheDocument();
    expect(screen.getByText('request-approval')).toBeDisabled();
  });

  it('does not toggle the accordion when reset is clicked', () => {
    renderComponent({ approversPayload: { levels: customApprovers } });

    expect(screen.getByText('liam@test.com')).toBeInTheDocument();

    fireEvent.click(screen.getByText('clear-level'));

    expect(screen.getByText('liam@test.com')).toBeInTheDocument();
  });
});

describe('ApproverModal — rule = any', () => {
  const anyRuleProps = {
    ...baseProps,
    approversPayload: {
      levels: [
        {
          level: 1,
          approval_level_id: 5,
          rule: 'any',
          roles: [
            {
              id: 10,
              name: 'Commercial Director',
              users: [
                { id: 100, display_name: 'John Doe', email: 'john@test.com' },
              ],
            },
            {
              id: 11,
              name: 'Operations Director',
              users: [
                { id: 200, display_name: 'Amy Roe', email: 'amy@test.com' },
              ],
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables submit with nothing selected', () => {
    render(<ApproverModal {...anyRuleProps} />);

    expect(screen.getByText('request-approval')).toBeDisabled();
  });

  it('enables submit once a single user is selected from any one role', () => {
    render(<ApproverModal {...anyRuleProps} />);

    fireEvent.click(screen.getByText('john@test.com'));

    expect(screen.getByText('request-approval')).not.toBeDisabled();
  });

  it('allows selecting more than one role and keeps submit enabled', () => {
    render(<ApproverModal {...anyRuleProps} />);

    fireEvent.click(screen.getByText('john@test.com'));
    fireEvent.click(screen.getByText('amy@test.com'));

    expect(screen.getByDisplayValue('200')).not.toBeDisabled();
    expect(screen.getByText('request-approval')).not.toBeDisabled();
  });

  it('submits only the one selected approver for the level', async () => {
    render(<ApproverModal {...anyRuleProps} />);

    fireEvent.click(screen.getByText('john@test.com'));
    fireEvent.click(screen.getByText('request-approval'));

    await waitFor(() => {
      expect(anyRuleProps.onSubmit).toHaveBeenCalledWith({
        selectedApprovers: [{ user_id: 100, approval_level_id: 5 }],
      });
    });
  });

  it('shows the "any" rule info message and tag', () => {
    render(<ApproverModal {...anyRuleProps} />);

    expect(
      screen.getByText('select-approvers-alert-message-any'),
    ).toBeInTheDocument();
    expect(screen.getByText('select-approvers-tag-any')).toBeInTheDocument();
  });

  it('does not show a reset control for the "any" rule', () => {
    render(<ApproverModal {...anyRuleProps} />);

    expect(screen.queryByText('clear-level')).not.toBeInTheDocument();
  });
});

describe('ApproverModal — rule = all', () => {
  const allRuleProps = {
    ...baseProps,
    approversPayload: {
      levels: [
        {
          level: 1,
          approval_level_id: 5,
          rule: 'all',
          roles: [
            {
              id: 10,
              name: 'Commercial Director',
              users: [
                { id: 100, display_name: 'John Doe', email: 'john@test.com' },
              ],
            },
          ],
        },
      ],
    },
  };

  it('shows the "all" rule info message and tag', () => {
    render(<ApproverModal {...allRuleProps} />);

    expect(
      screen.getByText('select-approvers-alert-message-all'),
    ).toBeInTheDocument();
    expect(screen.getByText('select-approvers-tag-all')).toBeInTheDocument();
  });

  it('does not show a reset control for the "all" rule', () => {
    render(<ApproverModal {...allRuleProps} />);

    expect(screen.queryByText('clear-level')).not.toBeInTheDocument();
  });
});

describe('ApproverModal — rule = custom', () => {
  const customRuleProps = {
    ...baseProps,
    approversPayload: {
      levels: [
        {
          level: 1,
          approval_level_id: 5,
          rule: 'custom',
          min_required: 2,
          roles: [
            {
              id: 10,
              name: 'Commercial Director',
              users: [
                { id: 100, display_name: 'John Doe', email: 'john@test.com' },
              ],
            },
            {
              id: 11,
              name: 'Operations Director',
              users: [
                { id: 200, display_name: 'Amy Roe', email: 'amy@test.com' },
              ],
            },
            {
              id: 12,
              name: 'Managing Director',
              users: [
                { id: 300, display_name: 'Sam Lee', email: 'sam@test.com' },
              ],
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows no info message or tag until copy is provided for this rule', () => {
    render(<ApproverModal {...customRuleProps} />);

    expect(
      screen.queryByText(/select-approvers-alert-message-/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/select-approvers-tag-/)).not.toBeInTheDocument();
  });

  it('locks and greys out the remaining role once min_required is met', () => {
    render(<ApproverModal {...customRuleProps} />);

    fireEvent.click(screen.getByText('john@test.com'));
    fireEvent.click(screen.getByText('amy@test.com'));

    const lockedRadio = screen.getByDisplayValue('300');
    expect(lockedRadio).toBeDisabled();

    fireEvent.click(screen.getByText('sam@test.com'));

    expect(lockedRadio).not.toBeChecked();
    expect(screen.getByText('2/2 selected')).toBeInTheDocument();
    expect(screen.getByText('request-approval')).not.toBeDisabled();
  });

  it('unlocks a role again once a selection is cleared', () => {
    render(<ApproverModal {...customRuleProps} />);

    fireEvent.click(screen.getByText('john@test.com'));
    fireEvent.click(screen.getByText('amy@test.com'));
    expect(screen.getByDisplayValue('300')).toBeDisabled();

    fireEvent.click(screen.getByText('clear-level'));

    expect(screen.getByDisplayValue('300')).not.toBeDisabled();
  });

  it('falls back to requiring every role when min_required is not set', () => {
    const propsWithoutMinRequired = {
      ...customRuleProps,
      approversPayload: {
        levels: [
          {
            ...customRuleProps.approversPayload.levels[0],
            min_required: undefined,
          },
        ],
      },
    };
    render(<ApproverModal {...propsWithoutMinRequired} />);

    fireEvent.click(screen.getByText('john@test.com'));
    fireEvent.click(screen.getByText('amy@test.com'));
    expect(screen.getByText('request-approval')).toBeDisabled();

    fireEvent.click(screen.getByText('sam@test.com'));
    expect(screen.getByText('request-approval')).not.toBeDisabled();
  });

  it('resets all selections for the level via the reset control', () => {
    render(<ApproverModal {...customRuleProps} />);

    fireEvent.click(screen.getByText('john@test.com'));
    fireEvent.click(screen.getByText('amy@test.com'));
    expect(screen.getByText('2/2 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByText('clear-level'));

    expect(screen.getByText('0/2 selected')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).not.toBeChecked();
    expect(screen.getByDisplayValue('200')).not.toBeChecked();
    expect(screen.getByText('request-approval')).toBeDisabled();
  });
});

describe('ApproverModal — higher authority fallback status', () => {
  // Mirrors the real-world case: rule "any", Admin has eligible users, QS has
  // no users, and Super Admin is a higher-condition role. Any role flagged
  // is_higher_condition_role with eligible users always surfaces the fallback
  // chip on the role itself. The level is also flagged
  // is_level_satisfied_by_higher_authority, so it's already auto-approved —
  // the top-of-modal alert must stay hidden even though a fallback role is
  // present.
  const anyRuleWithBlockedRoleCoveredByPeer = {
    ...baseProps,
    approversPayload: {
      levels: [
        {
          level: 1,
          approval_level_id: 7,
          rule: 'any',
          rule_description: 'Anyone can approve',
          is_level_satisfied_by_higher_authority: true,
          roles: [
            {
              id: 8,
              name: 'Admin',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: false,
              users: [
                {
                  id: '22639',
                  firstname: 'aa',
                  lastname: '',
                  email: 'aa@test.com',
                },
              ],
            },
            {
              id: 1333,
              name: 'QS',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: false,
              users: [],
            },
            {
              id: 2,
              name: 'Super Admin',
              is_satisfied_by_self_approved: true,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: true,
              users: [
                {
                  id: '22645',
                  firstname: 'abc',
                  lastname: '',
                  email: 'abc@test.com',
                },
              ],
            },
          ],
        },
      ],
    },
  };

  it('shows the higher-authority fallback tag on the role, but suppresses the top alert once the level is already auto-approved', () => {
    render(<ApproverModal {...anyRuleWithBlockedRoleCoveredByPeer} />);

    expect(
      screen.getByText('higher-authority-fallback-enabled-tag'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('higher-authority-fallback-available-title'),
    ).not.toBeInTheDocument();
  });

  it('shows the fallback-styled empty-role message once the level is in fallback status', () => {
    render(<ApproverModal {...anyRuleWithBlockedRoleCoveredByPeer} />);

    expect(
      screen.getByText('no-project-members-assigned-for-role'),
    ).toBeInTheDocument();
  });

  it('enables submit once the unblocked peer role is selected', () => {
    render(<ApproverModal {...anyRuleWithBlockedRoleCoveredByPeer} />);

    fireEvent.click(screen.getByText('aa@test.com'));

    expect(
      screen.getByText('apply-approval-and-submit-order'),
    ).not.toBeDisabled();
  });

  // "all" rule with 2 roles needs 2 real approver picks (one per role slot).
  // QS is empty and Super Admin can supply only 1 real approver, so the
  // quota (2) would normally be unreachable even with the higher-condition
  // role covering for QS. But the level is flagged
  // is_level_satisfied_by_higher_authority, so it's already auto-approved —
  // the top alert must stay hidden regardless of the underlying quota math.
  const allRuleRequiringFallback = {
    ...baseProps,
    approversPayload: {
      levels: [
        {
          level: 1,
          approval_level_id: 9,
          rule: 'all',
          is_level_satisfied_by_higher_authority: true,
          roles: [
            {
              id: 1333,
              name: 'QS',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: false,
              users: [],
            },
            {
              id: 2,
              name: 'Super Admin',
              is_satisfied_by_self_approved: true,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: true,
              users: [
                {
                  id: '22645',
                  firstname: 'abc',
                  lastname: '',
                  email: 'abc@test.com',
                },
              ],
            },
          ],
        },
      ],
    },
  };

  it('suppresses the top alert when the level is already auto-approved by higher authority, even though the raw quota is unreachable', () => {
    render(<ApproverModal {...allRuleRequiringFallback} />);

    expect(
      screen.queryByText('no-eligible-approver-title'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('higher-authority-fallback-available-title'),
    ).not.toBeInTheDocument();
  });

  // Same shape as above but with enough capacity: 2 roles, 1 empty, and the
  // higher-condition role can supply the single approver a "min_required: 1"
  // -style quota needs. Fallback status must not depend on the
  // is_satisfied_by_higher_authority / is_level_satisfied_by_higher_authority
  // flags (those only reflect an already-recorded approval) — an empty role
  // plus an eligible higher-condition role, with enough achievable capacity,
  // is enough on their own.
  const allRuleFallbackWithoutSatisfiedFlags = {
    ...baseProps,
    approversPayload: {
      levels: [
        {
          level: 1,
          approval_level_id: 10,
          rule: 'any',
          rule_description: 'Anyone can approve',
          roles: [
            {
              id: 1334,
              name: 'Senior QS',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: false,
              users: [],
            },
            {
              id: 3,
              name: 'Managing QS',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: true,
              users: [
                { id: '22646', firstname: 'David', lastname: 'Kamau', email: 'david.kamau@aclient.com' },
              ],
            },
          ],
        },
      ],
    },
  };

  it('shows the fallback tag and alert when a role is empty and a higher-authority role is eligible, even without the already-satisfied flags set', () => {
    render(<ApproverModal {...allRuleFallbackWithoutSatisfiedFlags} />);

    expect(
      screen.getByText('higher-authority-fallback-enabled-tag'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('higher-authority-fallback-available-title'),
    ).toBeInTheDocument();
  });

  // A higher-condition role with eligible users always triggers fallback
  // status for the level, even when the other role is only self-blocked
  // (not empty) rather than having zero users.
  const allRuleSelfBlockedNotFallback = {
    ...baseProps,
    clinkAccount: { id: 1, user: { id: '900' } },
    approversPayload: {
      levels: [
        {
          level: 1,
          approval_level_id: 11,
          rule: 'all',
          roles: [
            {
              id: 1335,
              name: 'Requester Role',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: false,
              users: [{ id: '900', email: 'current.user@test.com' }],
            },
            {
              id: 4,
              name: 'Managing QS',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: true,
              users: [
                { id: '22647', firstname: 'Lena', lastname: 'Muller', email: 'lena.muller@aclient.com' },
              ],
            },
          ],
        },
      ],
    },
  };

  it('shows the fallback tag even when the other role is self-blocked rather than empty', () => {
    render(<ApproverModal {...allRuleSelfBlockedNotFallback} />);

    expect(
      screen.getByText('higher-authority-fallback-enabled-tag'),
    ).toBeInTheDocument();
  });

  // Regression: a "custom" rule with min_required satisfied only by the
  // higher-condition role itself (the ordinary role is empty) must still
  // surface fallback — the fallback role's own presence shouldn't count as
  // an ordinary peer that quietly satisfies the quota.
  const customRuleSatisfiedOnlyByFallbackRole = {
    ...baseProps,
    approversPayload: {
      levels: [
        {
          level: 1,
          approval_level_id: 11,
          rule: 'custom',
          min_required: 1,
          is_level_satisfied_by_higher_authority: false,
          roles: [
            {
              id: 1333,
              name: 'QS',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: false,
              users: [],
            },
            {
              id: 1,
              name: 'Approver',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: true,
              users: [
                { id: '3745', firstname: 'Robert', lastname: 'Dean', email: 'robert.dean@aclient.com' },
              ],
            },
          ],
        },
      ],
    },
  };

  it('shows the fallback tag when a custom-rule quota is only met by the higher-condition role itself', () => {
    render(<ApproverModal {...customRuleSatisfiedOnlyByFallbackRole} />);

    expect(
      screen.getByText('higher-authority-fallback-enabled-tag'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('higher-authority-fallback-available-title'),
    ).toBeInTheDocument();
  });

  // Regression: "Any 2 from 2 must approve" (min_required equals the role
  // count) is a hard, admin-set quota — QS being empty leaves only one real
  // approver available (from the higher-condition role), which can't reach
  // a quota of 2 no matter how it's covered. This must resolve to genuinely
  // blocked ("no eligible approver"), not "fallback available".
  const customRuleQuotaUnreachableEvenWithFallback = {
    ...baseProps,
    approversPayload: {
      levels: [
        {
          level: 1,
          approval_level_id: 11,
          rule: 'custom',
          rule_description: 'Any 2 from 2 must approve',
          min_required: 2,
          is_level_satisfied_by_higher_authority: false,
          is_level_satisfied_by_self_approved: false,
          roles: [
            {
              id: 1333,
              name: 'QS',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: false,
              users: [],
            },
            {
              id: 1,
              name: 'Approver',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: true,
              users: [
                { id: '3745', firstname: 'Robert', lastname: 'Dean', email: 'robert.dean@aclient.com' },
              ],
            },
          ],
        },
      ],
    },
  };

  it('shows the no-eligible-approver alert instead of fallback when a custom-rule quota cannot be reached even with the higher-condition role', () => {
    render(<ApproverModal {...customRuleQuotaUnreachableEvenWithFallback} />);

    expect(
      screen.getByText('no-eligible-approver-title'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('higher-authority-fallback-available-title'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('higher-authority-fallback-enabled-tag'),
    ).not.toBeInTheDocument();
  });

  it('labels the "remains editable" chip with the approval type for a blocked level', () => {
    render(<ApproverModal {...customRuleQuotaUnreachableEvenWithFallback} />);

    expect(screen.getByText('remains-editable-tag')).toBeInTheDocument();
    expect(i18next.t).toHaveBeenCalledWith('remains-editable-tag', {
      approvalType: 'Tender Recommendations',
    });
  });

  it('labels the "remains editable" chip as "Order" for order approvals', () => {
    render(
      <ApproverModal
        {...customRuleQuotaUnreachableEvenWithFallback}
        approvalType="order"
      />,
    );

    expect(i18next.t).toHaveBeenCalledWith('remains-editable-tag', {
      approvalType: 'Order',
    });
  });

  it('labels the "remains editable" chip as "Supplier" for supplier-list approvals', () => {
    render(
      <ApproverModal
        {...customRuleQuotaUnreachableEvenWithFallback}
        approvalType="supplier_list"
      />,
    );

    expect(i18next.t).toHaveBeenCalledWith('remains-editable-tag', {
      approvalType: 'Supplier',
    });
  });

  // Regression: when an earlier level resolves to "fallback" and a LATER
  // level resolves to "blocked" (no role has a higher-condition alternative
  // to cover its empty role), the top alert must surface the blocked level's
  // "no eligible approver" message — not silently hide it behind the earlier
  // level's fallback message just because it comes first in array order.
  const blockedLevelAfterFallbackLevel = {
    ...baseProps,
    approversPayload: {
      levels: [
        {
          level: 1,
          approval_level_id: 11,
          rule: 'any',
          rule_description: 'Anyone can approve',
          roles: [
            {
              id: 1333,
              name: 'QS',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: false,
              users: [],
            },
            {
              id: 1,
              name: 'Approver',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: true,
              users: [
                { id: '3745', firstname: 'Robert', lastname: 'Dean', email: 'robert.dean@aclient.com' },
              ],
            },
          ],
        },
        {
          level: 2,
          approval_level_id: 12,
          rule: 'any',
          rule_description: 'Anyone can approve',
          roles: [
            {
              id: 1333,
              name: 'QS',
              is_satisfied_by_self_approved: false,
              is_satisfied_by_higher_authority: false,
              is_higher_condition_role: false,
              users: [],
            },
          ],
        },
      ],
    },
  };

  it('surfaces a later blocked level over an earlier fallback level in the top alert', () => {
    render(<ApproverModal {...blockedLevelAfterFallbackLevel} />);

    expect(
      screen.getByText('no-eligible-approver-title'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('higher-authority-fallback-available-title'),
    ).not.toBeInTheDocument();
  });
});

describe('ApproverModal — self-approval blocked for the current user', () => {
  const currentUserId = '900';
  const clinkAccountWithUser = { id: 1, user: { id: currentUserId } };

  const selfApprovalBlockedProps = {
    ...baseProps,
    clinkAccount: clinkAccountWithUser,
    approversPayload: {
      allow_requester_self_approval: false,
      levels: [
        {
          level: 1,
          approval_level_id: 20,
          rule: 'any',
          rule_description: 'Anyone can approve',
          roles: [
            {
              id: 30,
              name: 'Approver',
              users: [
                { id: currentUserId, email: 'current.user@test.com' },
                { id: 101, email: 'jane@test.com' },
              ],
            },
          ],
        },
      ],
    },
  };

  it('disables the current user but leaves the other eligible user selectable', () => {
    render(<ApproverModal {...selfApprovalBlockedProps} />);

    expect(screen.getByDisplayValue(currentUserId)).toBeDisabled();
    expect(screen.getByDisplayValue('101')).not.toBeDisabled();
  });

  it('does not preselect the current user', () => {
    render(<ApproverModal {...selfApprovalBlockedProps} />);

    expect(screen.getByDisplayValue(currentUserId)).not.toBeChecked();
  });

  it('shows the blocked-note tag on the current user only', () => {
    render(<ApproverModal {...selfApprovalBlockedProps} />);

    expect(
      screen.getByText('approver-self-approval-blocked-note'),
    ).toBeInTheDocument();
  });

  it('ignores clicks on the disabled current user', () => {
    render(<ApproverModal {...selfApprovalBlockedProps} />);

    fireEvent.click(screen.getByText('current.user@test.com'));

    expect(screen.getByDisplayValue(currentUserId)).not.toBeChecked();
  });

  it('still allows selecting the other eligible user and enables submit', () => {
    render(<ApproverModal {...selfApprovalBlockedProps} />);

    fireEvent.click(screen.getByText('jane@test.com'));

    expect(screen.getByDisplayValue('101')).toBeChecked();
    expect(screen.getByText('request-approval')).not.toBeDisabled();
  });
});

describe('ApproverModal — self-approval preselected for the current user', () => {
  const currentUserId = '900';
  const clinkAccountWithUser = { id: 1, user: { id: currentUserId } };

  it('preselects via the level flag and auto-satisfies an "any" level', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 21,
            rule: 'any',
            rule_description: 'Anyone can approve',
            is_level_satisfied_by_self_approved: true,
            roles: [
              {
                id: 31,
                name: 'Approver',
                is_satisfied_by_self_approved: false,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(screen.getByDisplayValue(currentUserId)).toBeChecked();
    expect(screen.getByDisplayValue(currentUserId)).not.toBeDisabled();
    expect(
      screen.getByText('approver-progress-satisfied-by-authority'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('approver-tag-recorded-self-approved'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('apply-approval-and-submit-order'),
    ).not.toBeDisabled();
  });

  it('preselects via the role flag for one role of a multi-role "all" level, leaving the other role open', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 22,
            rule: 'all',
            rule_description: 'All must approve',
            roles: [
              {
                id: 32,
                name: 'Approver A',
                is_satisfied_by_self_approved: true,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
              {
                id: 33,
                name: 'Approver B',
                is_satisfied_by_self_approved: false,
                users: [{ id: 101, email: 'jane@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(screen.getByDisplayValue(currentUserId)).toBeChecked();
    expect(screen.getByText('request-approval')).toBeDisabled();

    fireEvent.click(screen.getByText('jane@test.com'));

    expect(screen.getByText('request-approval')).not.toBeDisabled();
  });

  it('preselects one of two required approvers for a "custom 2/3" level, leaving quorum incomplete', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 23,
            rule: 'custom',
            min_required: 2,
            rule_description: 'Any 2 from 3 must approve',
            roles: [
              {
                id: 34,
                name: 'Approver A',
                is_satisfied_by_self_approved: true,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
              {
                id: 35,
                name: 'Approver B',
                is_satisfied_by_self_approved: false,
                users: [{ id: 101, email: 'jane@test.com' }],
              },
              {
                id: 36,
                name: 'Approver C',
                is_satisfied_by_self_approved: false,
                users: [{ id: 200, email: 'amy@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(screen.getByDisplayValue(currentUserId)).toBeChecked();
    expect(screen.getByText('1/2 selected')).toBeInTheDocument();
    expect(
      screen.getByText(
        'select-approvers-alert-message-self-approval-preselected',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('select-approvers-tag-self-approval-preselected'),
    ).toBeInTheDocument();
    expect(screen.getByText('request-approval')).toBeDisabled();

    fireEvent.click(screen.getByText('amy@test.com'));

    expect(screen.getByText('2/2 selected')).toBeInTheDocument();
    expect(screen.getByText('request-approval')).not.toBeDisabled();
  });

  it('caps preselection at min_required when the current user qualifies for more than one role', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 44,
            rule: 'custom',
            min_required: 1,
            rule_description: 'Any 1 from 2 must approve',
            roles: [
              {
                id: 45,
                name: 'Approver A',
                is_satisfied_by_self_approved: true,
                users: [{ id: currentUserId, email: 'current.userA@test.com' }],
              },
              {
                id: 46,
                name: 'Approver B',
                is_satisfied_by_self_approved: true,
                users: [{ id: currentUserId, email: 'current.userB@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    const radios = screen.getAllByDisplayValue(currentUserId);
    expect(radios).toHaveLength(2);
    expect(radios.filter((radio) => radio.checked)).toHaveLength(1);
    expect(
      screen.getByText('approver-progress-satisfied-by-authority'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('apply-approval-and-submit-order'),
    ).not.toBeDisabled();
  });
});

describe('ApproverModal — higher authority preselected for the current user', () => {
  const currentUserId = '900';
  const clinkAccountWithUser = { id: 1, user: { id: currentUserId } };

  it('preselects via higher authority even when self-approval is disabled, using the higher-authority messaging', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: false,
        levels: [
          {
            level: 1,
            approval_level_id: 24,
            rule: 'any',
            rule_description: 'Anyone can approve',
            is_level_satisfied_by_higher_authority: true,
            roles: [
              {
                id: 37,
                name: 'Approver',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: false,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(screen.getByDisplayValue(currentUserId)).toBeChecked();
    expect(screen.getByDisplayValue(currentUserId)).not.toBeDisabled();
    expect(
      screen.getByText('approver-progress-satisfied-by-higher-authority'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('apply-approval-and-submit-order'),
    ).not.toBeDisabled();
    expect(
      screen.getByText('approver-tag-recorded-higher-authority'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('approver-level-auto-approved'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('approver-tag-recorded-self-approved'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('apply-approval-and-submit-order'),
    ).not.toBeDisabled();
  });

  it('preselects via the role-level higher-authority flag for an "all" level', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 25,
            rule: 'all',
            rule_description: 'All must approve',
            roles: [
              {
                id: 38,
                name: 'Approver A',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: true,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(screen.getByDisplayValue(currentUserId)).toBeChecked();
    expect(
      screen.getByText('approver-progress-satisfied-by-higher-authority'),
    ).toBeInTheDocument();
  });

  it('attributes the level to higher authority even when a lower-priority role is processed first', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 29,
            rule: 'all',
            rule_description: 'All must approve',
            roles: [
              {
                id: 42,
                name: 'Approver A',
                is_satisfied_by_self_approved: true,
                is_satisfied_by_higher_authority: false,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
              {
                id: 43,
                name: 'Approver B',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: true,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(screen.getAllByDisplayValue(currentUserId)).toHaveLength(2);
    expect(
      screen
        .getAllByDisplayValue(currentUserId)
        .every((radio) => radio.checked),
    ).toBe(true);
    expect(
      screen.getByText('approver-progress-satisfied-by-higher-authority'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('approver-progress-satisfied-by-authority'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('apply-approval-and-submit-order'),
    ).not.toBeDisabled();
    expect(
      screen.getByText('approver-tag-recorded-higher-authority'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('approver-tag-recorded-self-approved'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('apply-approval-and-submit-order'),
    ).not.toBeDisabled();
  });

  it('lets a higher-authority match override a self-approval block on the same role', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: false,
        levels: [
          {
            level: 1,
            approval_level_id: 28,
            rule: 'all',
            rule_description: 'All must approve',
            roles: [
              {
                id: 41,
                name: 'Approver',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: true,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(screen.getByDisplayValue(currentUserId)).toBeChecked();
    expect(screen.getByDisplayValue(currentUserId)).not.toBeDisabled();
  });
});

describe('ApproverModal — eligibility respects level-level and higher-authority flags', () => {
  const currentUserId = '900';
  const clinkAccountWithUser = { id: 1, user: { id: currentUserId } };

  it('does not treat a single-user role as self-blocked when the level flag satisfies self-approval', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 26,
            rule: 'any',
            rule_description: 'Anyone can approve',
            is_level_satisfied_by_self_approved: true,
            roles: [
              {
                id: 39,
                name: 'Approver',
                is_satisfied_by_self_approved: false,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(
      screen.queryByText('self-approval-disabled-no-other-approver'),
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue(currentUserId)).toBeChecked();
  });

  it('does not treat a single-user role as self-blocked when higher authority satisfies it', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 27,
            rule: 'all',
            rule_description: 'All must approve',
            roles: [
              {
                id: 40,
                name: 'Approver',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: true,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(
      screen.queryByText('self-approval-disabled-no-other-approver'),
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue(currentUserId)).toBeChecked();
  });

  it('shows the sole ineligible current user as a disabled row instead of an alert', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: false,
        levels: [
          {
            level: 1,
            approval_level_id: 28,
            rule: 'any',
            rule_description: 'Anyone can approve',
            roles: [
              {
                id: 41,
                name: 'Approver',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: false,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    // Only the top summary banner shows this message; the per-role card no
    // longer duplicates it with its own alert.
    expect(
      screen.getAllByText('self-approval-disabled-no-other-approver'),
    ).toHaveLength(1);
    expect(screen.getByDisplayValue(currentUserId)).toBeDisabled();
    expect(
      screen.getByText('approver-self-approval-blocked-note'),
    ).toBeInTheDocument();
  });
});

describe('ApproverModal — auto_complete_lower_approvals cascade', () => {
  const currentUserId = '900';
  const clinkAccountWithUser = { id: 1, user: { id: currentUserId } };

  it('satisfies the level regardless of requiredApprovers count when auto_complete_lower_approvals and the higher-authority level flag are both set', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        auto_complete_lower_approvals: true,
        levels: [
          {
            level: 1,
            approval_level_id: 50,
            rule: 'all',
            rule_description: 'All must approve',
            is_level_satisfied_by_higher_authority: true,
            roles: [
              {
                id: 51,
                name: 'Approver A',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: false,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
              {
                id: 52,
                name: 'Approver B',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: false,
                users: [{ id: 101, email: 'jane@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(
      screen.getByText('approver-progress-satisfied-by-higher-authority'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('apply-approval-and-submit-order'),
    ).not.toBeDisabled();
  });

  it('does not satisfy the level via the cascade when auto_complete_lower_approvals is not set', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 51,
            rule: 'all',
            rule_description: 'All must approve',
            is_level_satisfied_by_higher_authority: true,
            roles: [
              {
                id: 53,
                name: 'Approver A',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: false,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
              {
                id: 54,
                name: 'Approver B',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: false,
                users: [{ id: 101, email: 'jane@test.com' }],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(
      screen.queryByText('approver-progress-satisfied-by-higher-authority'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('request-approval')).toBeDisabled();
  });
});

describe('ApproverModal — blocked role vs. pre-satisfied level override', () => {
  const currentUserId = '900';
  const clinkAccountWithUser = { id: 1, user: { id: currentUserId } };

  it('enables submit when a level with an unfillable role is otherwise flagged fully satisfied', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 60,
            rule: 'any',
            rule_description: 'Anyone can approve',
            is_level_satisfied_by_higher_authority: true,
            roles: [
              {
                id: 61,
                name: 'Approver',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: false,
                users: [],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    expect(
      screen.getByText('no-users-assigned-to-role-on-project'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('apply-approval-and-submit-order'),
    ).not.toBeDisabled();
  });

  it('submits the current user as the approver for a higher-authority-satisfied level with no selection made', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    const props = {
      ...baseProps,
      onSubmit,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 60,
            rule: 'any',
            rule_description: 'Anyone can approve',
            is_level_satisfied_by_higher_authority: true,
            roles: [
              {
                id: 61,
                name: 'Approver',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: false,
                users: [],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);

    fireEvent.click(screen.getByText('apply-approval-and-submit-order'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        selectedApprovers: [
          {
            user_id: currentUserId,
            approval_level_id: 60,
            is_level_satisfied_by_higher_authority: true,
            is_satisfied_by_self_approved: false,
            is_satisfied_by_higher_authority: false,
          },
        ],
      });
    });
  });

  it('keeps submit disabled when the unfillable-role level is not otherwise satisfied, even if other levels are', () => {
    const props = {
      ...baseProps,
      clinkAccount: clinkAccountWithUser,
      approversPayload: {
        allow_requester_self_approval: true,
        levels: [
          {
            level: 1,
            approval_level_id: 62,
            rule: 'any',
            rule_description: 'Anyone can approve',
            is_level_satisfied_by_higher_authority: true,
            roles: [
              {
                id: 63,
                name: 'Approver A',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: true,
                users: [{ id: currentUserId, email: 'current.user@test.com' }],
              },
            ],
          },
          {
            level: 2,
            approval_level_id: 64,
            rule: 'any',
            rule_description: 'Anyone can approve',
            roles: [
              {
                id: 65,
                name: 'Approver B',
                is_satisfied_by_self_approved: false,
                is_satisfied_by_higher_authority: false,
                users: [],
              },
            ],
          },
        ],
      },
    };

    render(<ApproverModal {...props} />);
    expect(screen.getByText('request-approval')).toBeDisabled();
  });
});

describe('ApproverModal — submit and fetch failure handling', () => {
  beforeEach(() => {
    mockShowSnackbar.mockClear();
  });

  it('shows the error snackbar and re-enables submit when onSubmit rejects with a message', async () => {
    const onSubmit = jest.fn(() => Promise.reject(new Error('network down')));
    renderComponent({ onSubmit });

    fireEvent.click(screen.getByText('john@test.com'));
    fireEvent.click(screen.getByText('request-approval'));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith('network down', 'error');
    });

    expect(screen.getByText('request-approval')).not.toBeDisabled();
  });

  it('falls back to the generic failure message when onSubmit rejects without a message', async () => {
    const onSubmit = jest.fn(() => Promise.reject(new Error()));
    renderComponent({ onSubmit });

    fireEvent.click(screen.getByText('john@test.com'));
    fireEvent.click(screen.getByText('request-approval'));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'approval-request-failed',
        'error',
      );
    });
  });

  it('disables submit when the supplier-list approvers fetch fails', async () => {
    const dispatch = jest.fn(() => ({
      unwrap: jest.fn().mockRejectedValue(new Error('fetch failed')),
    }));

    renderComponent({
      dispatch,
      approvalType: 'supplier_list',
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText('request-approval')).toBeDisabled();
  });
});
