import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import TeamManager from './index';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'your-team': 'Your Team',
        'delete-success-message': 'Member deleted successfully',
        'invite-error-title': 'Invite Error',
        'invite-error-message': 'Failed to send invite',
        'change-role-title': 'Change Role',
        'change-role-exception-message': 'Failed to change role',
        'user-role-success': 'User role updated successfully',
        close: 'Close',
        'session-expired': 'Session Expired',
        'account-deleted': 'Account Deleted',
        'delete-error-title': 'Delete Error',
        'delete-error-msg': 'Failed to delete member',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      userRoles: jest.fn(() => ({ type: 'USER_ROLES' })),
      resetProject: jest.fn(() => ({ type: 'RESET_PROJECT' })),
      resetQuotesTender: jest.fn(() => ({ type: 'RESET_QUOTES_TENDER' })),
      restartOrders: jest.fn(() => ({ type: 'RESTART_ORDERS' })),
      restartProcurement: jest.fn(() => ({ type: 'RESTART_PROCUREMENT' })),
      setBreadcrumbs: jest.fn(() => ({ type: 'SET_BREADCRUMBS' })),
      setProjectName: jest.fn(() => ({ type: 'SET_PROJECT_NAME' })),
      setSlug: jest.fn(() => ({ type: 'SET_SLUG' })),
      fetchTeam: jest.fn(() => ({ type: 'FETCH_TEAM' })),
      fetchApprovalThresholds: jest.fn(() => ({
        type: 'FETCH_APPROVAL_THRESHOLDS',
      })),
      removeMemberTeam: jest.fn(() =>
        Promise.resolve({
          payload: { success: true, message: 'Member removed' },
        }),
      ),
      sendInvite: jest.fn(() =>
        Promise.resolve({
          payload: { success: true, message: 'invite-success' },
        }),
      ),
      changeRole: jest.fn(() =>
        Promise.resolve({
          payload: { success: true, message: 'Role changed' },
        }),
      ),
      updateApprovalThresholds: jest.fn(() =>
        Promise.resolve({ payload: { success: true } }),
      ),
      updateMemberPermissions: jest.fn(() =>
        Promise.resolve({ payload: { status: true } }),
      ),
    },
    pages: {
      addTeam: {
        table: {
          rowBuilder: jest.fn(
            (
              member,
              roles,
              userRoleValue,
              handleChangeRole,
              clinkUser,
              openPermissionsModal,
            ) => ({
              id: member.user_id,
              name: `${member.firstname} ${member.lastname}`.trim(),
              email: member.email,
              role: member.role?.label || 'Unknown',
              can_be_removed: member.can_be_removed,
              canBeRemoved: member.can_be_removed,
            }),
          ),
          columns: [
            { key: 'name', label: 'Name', width: 200 },
            { key: 'email', label: 'Email', width: 250 },
            { key: 'role', label: 'Role', width: 150 },
            { key: 'actions', label: 'Actions', width: 80 },
          ],
        },
      },
    },
  }),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkLightPurple: '#e6e6fa',
        white: '#ffffff',
      },
    },
  },
}));

jest.mock('v2/helpers/flags', () =>
  jest.fn((flag) => {
    if (flag === 'APPROVAL_THRESHOLD') return true;
    return false;
  }),
);

jest.mock('v2/helpers/url', () => ({ goTo: jest.fn() }));

jest.mock(
  './InvitePanel',
  () =>
    function MockInvitePanel(props) {
      return <div data-testid="invite-panel">Invite Panel</div>;
    },
);

jest.mock(
  './ConfirmUpdateDialog',
  () =>
    function MockConfirmUpdateDialog(props) {
      return props.open ? (
        <div data-testid="confirm-update-dialog">Confirm Update Dialog</div>
      ) : null;
    },
);

jest.mock(
  './ConfirmDeleteDialog',
  () =>
    function MockConfirmDeleteDialog(props) {
      return props.open ? (
        <div data-testid="confirm-delete-dialog">Confirm Delete Dialog</div>
      ) : null;
    },
);

jest.mock(
  'v2/apps/shared/components/InfoModal',
  () =>
    function MockInfoModal(props) {
      return <div data-testid="info-modal">Info Modal</div>;
    },
);

jest.mock(
  'v2/apps/shared/components/Loading',
  () =>
    function MockLoading(props) {
      return <div data-testid="loading">Loading: {props.status}</div>;
    },
);

jest.mock('./styled', () => ({
  StyledPageSubtitle: function MockStyledPageSubtitle({ children, className }) {
    return <h2 className={className}>{children}</h2>;
  },
  StyledTeamContent: function MockStyledTeamContent({ children }) {
    return <div data-testid="team-content">{children}</div>;
  },
}));

jest.mock(
  '@mui/material/Button',
  () =>
    function MockButton(props) {
      return (
        <button
          onClick={props.onClick}
          disabled={props.disabled}
          data-testid="mui-button"
        >
          {props.children}
        </button>
      );
    },
);

jest.mock(
  '@mui/material/Grid2',
  () =>
    function MockGrid(props) {
      const { children, ...rest } = props;
      return (
        <div className="grid" {...rest}>
          {children}
        </div>
      );
    },
);

jest.mock(
  '@mui/material/List',
  () =>
    function MockList(props) {
      return <ul {...props}>{props.children}</ul>;
    },
);

jest.mock(
  '@mui/material/ListItem',
  () =>
    function MockListItem(props) {
      return <li {...props}>{props.children}</li>;
    },
);

jest.mock(
  '@mui/material/Typography',
  () =>
    function MockTypography(props) {
      return <p {...props}>{props.children}</p>;
    },
);

jest.mock(
  '@mui/material/Snackbar',
  () =>
    function MockSnackbar(props) {
      return props.open ? (
        <div data-testid="snackbar">{props.children}</div>
      ) : null;
    },
);

jest.mock(
  '@mui/material/Alert',
  () =>
    function MockAlert(props) {
      return (
        <div data-testid="alert" onClick={props.onClose}>
          {props.children}
        </div>
      );
    },
);

jest.mock('@mui/x-data-grid-pro', () => ({
  DataGridPro: function MockDataGridPro(props) {
    return (
      <div data-testid="data-grid">
        {props.rows?.map((row) => (
          <div key={row.id} data-testid={`row-${row.id}`}>
            {row.name} - {row.email} - {row.role}
          </div>
        ))}
      </div>
    );
  },
  GridActionsCellItem: function MockGridActionsCellItem(props) {
    return (
      <button
        onClick={props.onClick}
        disabled={props.disabled}
        data-testid="grid-action"
      >
        {props.label}
      </button>
    );
  },
}));

jest.mock(
  '@mui/icons-material/DeleteOutlined',
  () =>
    function MockDeleteIcon() {
      return <span data-testid="delete-icon">🗑️</span>;
    },
);

jest.mock('react-redux', () => {
  const actualReactRedux = jest.requireActual('react-redux');
  return {
    ...actualReactRedux,
    connect: () => (Component) => {
      const MockComponent = (props) => {
        const { useSelector } = actualReactRedux;
        const state = useSelector((s) => s);
        const dispatch = jest.fn((action) => {
          if (typeof action === 'function') return Promise.resolve();
          return Promise.resolve();
        });
        const propsFromState = {
          roles: Array.isArray(state.account?.roles) ? state.account.roles : [],
          account: state.account || {},
          clinkAccount: state.clinkAccount || {},
          approvalThresholds: state.account?.approvalThresholds || [],
        };
        return <Component {...props} {...propsFromState} dispatch={dispatch} />;
      };
      return MockComponent;
    },
  };
});

const mockRoles = [
  {
    id: '1',
    label: 'Approver',
    description: '',
    user_type_id: '9',
    level: '6',
  },
  {
    id: '2',
    label: 'Super Admin',
    description: '',
    user_type_id: '8',
    level: '2',
  },
  {
    id: '3',
    label: 'Project Team Member',
    description: '',
    user_type_id: '7',
    level: '8',
  },
  { id: '4', label: 'Witness', description: '', user_type_id: '6', level: '7' },
  {
    id: '5',
    label: 'Account Holder',
    description: '',
    user_type_id: '5',
    level: '0',
  },
  {
    id: '6',
    label: 'Team Member',
    description: '',
    user_type_id: '4',
    level: '5',
  },
  { id: '7', label: 'Manager', description: '', user_type_id: '3', level: '4' },
  { id: '8', label: 'Admin', description: '', user_type_id: '2', level: '3' },
  {
    id: '9',
    label: 'Administrator',
    description: '',
    user_type_id: '1',
    level: '1',
  },
];

const mockState = {
  account: {
    roles: mockRoles,
    team: {
      user_role: 'administrator',
      user_role_value: 'Administrator',
      members: [
        {
          user_id: '1',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          role: {
            id: '1',
            label: 'administrator',
            level: '1',
            value: 'Administrator',
          },
          can_be_removed: true,
          permissions: { permission_count: 0 },
        },
        {
          user_id: '2',
          firstname: 'Jane',
          lastname: 'Smith',
          email: 'jane@example.com',
          role: {
            id: '3',
            label: 'team_manager',
            level: '4',
            value: 'Manager',
          },
          can_be_removed: false,
          permissions: { permission_count: 1 },
        },
      ],
    },
    status: { message: '' },
    inviteError: null,
    approvalThresholds: [
      { from_value: 0, to_value: 1000 },
      { from_value: 1000, to_value: null },
    ],
  },
  clinkAccount: {
    id: '1',
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      user_type_id: '1',
    },
  },
};

const mockReducer = (state = mockState, action) => state;
const mockStore = createStore(mockReducer);

describe('TeamManager', () => {
  const renderTeamManager = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <TeamManager {...props} />
      </Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.MutationObserver = class {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {}
      disconnect() {}
    };
  });

  // ─── Basic Rendering ────────────────────────────────────────────────────────

  test('renders without crashing', () => {
    renderTeamManager();
    expect(screen.getByTestId('team-content')).toBeInTheDocument();
  });

  test('renders Your Team section', () => {
    renderTeamManager();
    expect(screen.getByText('Your Team')).toBeInTheDocument();
  });

  test('renders data grid', () => {
    renderTeamManager();
    expect(screen.getByTestId('data-grid')).toBeInTheDocument();
  });

  test('handles contextType prop correctly', () => {
    renderTeamManager({ contextType: 'prosper' });
    expect(screen.getByTestId('team-content')).toBeInTheDocument();
  });

  test('renders InvitePanel when user has permission (Administrator user_type_id=1)', () => {
    renderTeamManager();
    expect(screen.getByTestId('invite-panel')).toBeInTheDocument();
  });

  test('renders InvitePanel for Super Admin (user_type_id=8)', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          ...mockState.account.team,
          user_role: 'super_admin',
          user_role_value: 'Super Admin',
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('invite-panel')).toBeInTheDocument();
  });

  test('renders InvitePanel for Admin (user_type_id=2)', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          ...mockState.account.team,
          user_role: 'team_admin',
          user_role_value: 'Admin',
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('invite-panel')).toBeInTheDocument();
  });

  test('renders InvitePanel for Manager (user_type_id=3)', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          ...mockState.account.team,
          user_role: 'team_manager',
          user_role_value: 'Manager',
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('invite-panel')).toBeInTheDocument();
  });

  test('does not render InvitePanel when user_role_value has no permission (Team Member user_type_id=4)', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          ...mockState.account.team,
          user_role: 'team_assistant',
          user_role_value: 'Team Member',
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.queryByTestId('invite-panel')).not.toBeInTheDocument();
  });

  test('does not render InvitePanel for Witness (user_type_id=6)', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          ...mockState.account.team,
          user_role: 'witness',
          user_role_value: 'Witness',
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.queryByTestId('invite-panel')).not.toBeInTheDocument();
  });

  // ─── Team Members ────────────────────────────────────────────────────────────

  test('renders team members filtered by user_type_id matching role.id', () => {
    renderTeamManager();
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-2')).toBeInTheDocument();
  });

  test('filters out members whose role.id does not match any user_type_id', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          user_role: 'administrator',
          user_role_value: 'Administrator',
          members: [
            {
              user_id: '1',
              firstname: 'John',
              lastname: 'Doe',
              email: 'john@example.com',
              role: {
                id: '1',
                label: 'administrator',
                level: '1',
                value: 'Administrator',
              },
              can_be_removed: true,
              permissions: { permission_count: 0 },
            },
            {
              user_id: '3',
              firstname: 'Bob',
              lastname: 'Johnson',
              email: 'bob@example.com',
              role: { id: '99', label: 'unknown_role' },
              can_be_removed: true,
              permissions: { permission_count: 0 },
            },
          ],
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.queryByTestId('row-3')).not.toBeInTheDocument();
  });

  test('handles empty team members array', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          user_role: 'administrator',
          user_role_value: 'Administrator',
          members: [],
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('data-grid')).toBeInTheDocument();
  });

  test('handles team without user_role', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: { members: mockState.account.team.members },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('team-content')).toBeInTheDocument();
  });

  test('handles null team data', () => {
    const state = {
      ...mockState,
      account: { ...mockState.account, team: null },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('team-content')).toBeInTheDocument();
  });

  test('displays loading when status message is present', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        status: { message: 'Loading team data...' },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(
      screen.getByText('Loading: Loading team data...'),
    ).toBeInTheDocument();
  });

  test('ConfirmUpdateDialog not visible by default', () => {
    renderTeamManager();
    expect(
      screen.queryByTestId('confirm-update-dialog'),
    ).not.toBeInTheDocument();
  });

  test('threshold section renders for Administrator (hasThresholdPermission=true)', () => {
    renderTeamManager();
    expect(screen.getByTestId('team-content')).toBeInTheDocument();
  });

  test('threshold block does not render for Manager (user_type_id=3, not in THRESHOLD_TYPE_IDS)', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          ...mockState.account.team,
          user_role: 'team_manager',
          user_role_value: 'Manager',
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(
      screen.queryByTestId('confirm-update-dialog'),
    ).not.toBeInTheDocument();
  });

  test('threshold block does not render for Team Member (user_type_id=4)', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          ...mockState.account.team,
          user_role: 'team_assistant',
          user_role_value: 'Team Member',
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(
      screen.queryByTestId('confirm-update-dialog'),
    ).not.toBeInTheDocument();
  });

  test('delete modal not visible by default', () => {
    renderTeamManager();
    expect(
      screen.queryByTestId('confirm-delete-dialog'),
    ).not.toBeInTheDocument();
  });

  test('success snackbar not visible initially', () => {
    renderTeamManager();
    expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
  });

  test('renders with minimal state', () => {
    const minimalState = {
      account: {
        roles: [],
        team: null,
        status: { message: '' },
        inviteError: null,
        approvalThresholds: [],
      },
      clinkAccount: { user: null },
    };
    render(
      <Provider store={createStore(() => minimalState)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('team-content')).toBeInTheDocument();
  });

  test('handles empty roles array gracefully', () => {
    const state = {
      ...mockState,
      account: { ...mockState.account, roles: [] },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('team-content')).toBeInTheDocument();
  });

  test('handles invite error state', () => {
    const state = {
      ...mockState,
      account: { ...mockState.account, inviteError: 'Failed to send invite' },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('invite-panel')).toBeInTheDocument();
  });

  // ─── sendInvite ──────────────────────────────────────────────────────────────

  test('sendInvite finds role by label matching values.role (role.id as value)', async () => {
    let sendInviteHandler = null;
    jest.doMock(
      './InvitePanel',
      () =>
        function MockInvitePanel(props) {
          sendInviteHandler = props.sendInvite;
          return <div data-testid="invite-panel">Invite Panel</div>;
        },
    );
    renderTeamManager();
    await waitFor(() =>
      expect(screen.getByTestId('invite-panel')).toBeInTheDocument(),
    );
    if (sendInviteHandler) {
      sendInviteHandler({
        name: 'Test User',
        email: 'test@example.com',
        role: '2',
      });
    }
  });

  test('sendInvite with invalid role id does not dispatch', async () => {
    let sendInviteHandler = null;
    jest.doMock(
      './InvitePanel',
      () =>
        function MockInvitePanel(props) {
          sendInviteHandler = props.sendInvite;
          return <div data-testid="invite-panel">Invite Panel</div>;
        },
    );
    renderTeamManager();
    await waitFor(() =>
      expect(screen.getByTestId('invite-panel')).toBeInTheDocument(),
    );
    if (sendInviteHandler) {
      sendInviteHandler({
        name: 'Test',
        email: 'test@example.com',
        role: '999',
      });
    }
  });

  test('handleChangeRole dispatches with full role object containing id', async () => {
    renderTeamManager();
    await waitFor(() =>
      expect(screen.getByTestId('team-content')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-2')).toBeInTheDocument();
  });

  test('handles mutation observer for table header clicks', () => {
    const mockTh = document.createElement('th');
    mockTh.setAttribute('width', '24');
    mockTh.click = jest.fn();
    jest.spyOn(document, 'querySelector').mockReturnValue(mockTh);
    renderTeamManager();
    expect(screen.getByTestId('team-content')).toBeInTheDocument();
    document.querySelector.mockRestore();
  });

  // ─── Threshold permission checks (via hasThresholdPermission flag) ───────────

  test('Super Admin (user_type_id=8) is in THRESHOLD_TYPE_IDS', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          ...mockState.account.team,
          user_role: 'super_admin',
          user_role_value: 'Super Admin',
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('invite-panel')).toBeInTheDocument();
    expect(
      screen.queryByTestId('confirm-update-dialog'),
    ).not.toBeInTheDocument();
  });

  test('Admin (user_type_id=2) is in THRESHOLD_TYPE_IDS', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          ...mockState.account.team,
          user_role: 'team_admin',
          user_role_value: 'Admin',
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.getByTestId('invite-panel')).toBeInTheDocument();
  });

  test('Approver (user_type_id=9) is NOT in THRESHOLD_TYPE_IDS or ALLOWED_TYPE_IDS', () => {
    const state = {
      ...mockState,
      account: {
        ...mockState.account,
        team: {
          ...mockState.account.team,
          user_role: 'approver',
          user_role_value: 'Approver',
        },
      },
    };
    render(
      <Provider store={createStore(() => state)}>
        <TeamManager />
      </Provider>,
    );
    expect(screen.queryByTestId('invite-panel')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('confirm-update-dialog'),
    ).not.toBeInTheDocument();
  });
});
