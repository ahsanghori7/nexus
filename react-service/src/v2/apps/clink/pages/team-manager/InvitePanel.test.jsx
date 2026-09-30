import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvitePanel from './InvitePanel';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'invite-outside': 'Invite Outside',
        'insert-user-name': 'Enter user name',
        'insert-user-email': 'Enter user email',
        reset: 'Reset',
        'invite-to-team': 'Invite to Team',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('clink-components', () => ({
  InputForm: function MockInputForm(props) {
    return (
      <input
        data-testid={`input-${props.name}`}
        placeholder={props.placeholder}
        type={props.type}
        {...(props.register ? props.register(props.name, props.rules) : {})}
      />
    );
  },
  InputFormControlled: function MockInputFormControlled(props) {
    return (
      <select data-testid={`select-${props.name}`}>
        {props.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  },
  Form: function MockForm({ render, onSubmit }) {
    const mockFormHook = {
      formState: { errors: {}, isValid: true },
      register: (name, rules) => ({ name, rules }),
      setValue: jest.fn(),
      control: {},
      setError: jest.fn(),
      clearErrors: jest.fn(),
      resetField: jest.fn(),
    };
    return (
      <form onSubmit={onSubmit} data-testid="form-content">
        {render(mockFormHook)}
      </form>
    );
  },
}));

jest.mock('./styled', () => ({
  StyledPageSubtitle: function MockStyledPageSubtitle({ children, className }) {
    return <h2 className={className}>{children}</h2>;
  },
  StyledTeamReset: function MockStyledTeamReset({ children }) {
    return <div data-testid="team-reset">{children}</div>;
  },
}));

// Roles with value field matching what InvitePanel uses: type.value === userRole
const mockRoles = [
  {
    id: '1',
    label: 'Approver',
    description: '',
    user_type_id: '9',
    level: '6',
    value: 'approver',
  },
  {
    id: '2',
    label: 'Super Admin',
    description: '',
    user_type_id: '8',
    level: '2',
    value: 'super_admin',
  },
  {
    id: '3',
    label: 'Project Team Member',
    description: '',
    user_type_id: '7',
    level: '8',
    value: 'project_team_member',
  },
  {
    id: '4',
    label: 'Witness',
    description: '',
    user_type_id: '6',
    level: '7',
    value: 'witness',
  },
  {
    id: '5',
    label: 'Account Holder',
    description: '',
    user_type_id: '5',
    level: '0',
    value: 'account_holder',
  },
  {
    id: '6',
    label: 'Team Member',
    description: '',
    user_type_id: '4',
    level: '5',
    value: 'team_assistant',
  },
  {
    id: '7',
    label: 'Manager',
    description: '',
    user_type_id: '3',
    level: '4',
    value: 'team_manager',
  },
  {
    id: '8',
    label: 'Admin',
    description: '',
    user_type_id: '2',
    level: '3',
    value: 'team_admin',
  },
  {
    id: '9',
    label: 'Administrator',
    description: '',
    user_type_id: '1',
    level: '1',
    value: 'administrator',
  },
];

describe('InvitePanel', () => {
  const defaultProps = {
    loading: false,
    sendInvite: jest.fn(),
    inviteError: null,
    theme: 'clink-team-manager',
    resetButton: React.createRef(),
    userRole: 'super_admin', // ✅ matches roles[].value (not label)
    roles: mockRoles,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<InvitePanel {...defaultProps} />);
    expect(screen.getByText('Invite Outside')).toBeInTheDocument();
  });

  test('renders form inputs correctly', () => {
    render(<InvitePanel {...defaultProps} />);
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('select-role')).toBeInTheDocument();
  });

  test('renders reset and invite buttons when not loading', () => {
    render(<InvitePanel {...defaultProps} />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Invite to Team')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('shows loading spinner when loading is true', () => {
    render(<InvitePanel {...defaultProps} loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Invite to Team')).not.toBeInTheDocument();
  });

  test('options use role.id as value (not user_type_id)', () => {
    render(<InvitePanel {...defaultProps} userRole="super_admin" />);
    const options = Array.from(
      screen.getByTestId('select-role').querySelectorAll('option'),
    );
    options.forEach((opt) => {
      // value should be role.id (like "1","2") not user_type_id
      const matchedRole = mockRoles.find((r) => r.id === opt.value);
      expect(matchedRole).toBeDefined();
    });
  });

  test('filters out internal use roles (administrator, project_team_member)', () => {
    // isInternalUseRoles = ['administrator', 'project_team_member']
    // these match roles[].value field
    render(<InvitePanel {...defaultProps} userRole="super_admin" />);
    const options = Array.from(
      screen.getByTestId('select-role').querySelectorAll('option'),
    );
    const labels = options.map((o) => o.textContent);
    expect(labels).not.toContain('Administrator'); // value: 'administrator' → filtered
    expect(labels).not.toContain('Project Team Member'); // value: 'project_team_member' → filtered
  });

  test('Administrator (value=administrator, level=1) sees roles with level > 1 excluding internals', () => {
    render(<InvitePanel {...defaultProps} userRole="administrator" />);
    const options = Array.from(
      screen.getByTestId('select-role').querySelectorAll('option'),
    );
    const labels = options.map((o) => o.textContent);
    expect(labels).not.toContain('Administrator'); // own level excluded (level > 1, not >=)
    expect(labels).not.toContain('Project Team Member'); // internal role excluded
    expect(labels).not.toContain('Account Holder'); // level 0, excluded
    // Administrator level=1, filter is level > 1, so Super Admin (level=2) IS included
    expect(labels).toContain('Super Admin');
  });

  test('Manager (value=team_manager, level=4) sees roles with level > 4', () => {
    render(<InvitePanel {...defaultProps} userRole="team_manager" />);
    const options = Array.from(
      screen.getByTestId('select-role').querySelectorAll('option'),
    );
    const labels = options.map((o) => o.textContent);
    expect(labels).not.toContain('Manager'); // own level not included
    expect(labels).not.toContain('Super Admin'); // level 2 < 4, excluded
    expect(labels).not.toContain('Admin'); // level 3 < 4, excluded
    expect(labels).toContain('Team Member'); // level 5 > 4, included
    expect(labels).toContain('Approver'); // level 6 > 4, included
  });

  test('handles empty roles array', () => {
    render(<InvitePanel {...defaultProps} roles={[]} />);
    const options = screen
      .getByTestId('select-role')
      .querySelectorAll('option');
    expect(options.length).toBe(0);
  });

  test('handles undefined userRole — returns empty options', () => {
    render(<InvitePanel {...defaultProps} userRole={undefined} />);
    const options = screen
      .getByTestId('select-role')
      .querySelectorAll('option');
    expect(options.length).toBe(0);
  });

  test('handles userRole that does not match any value', () => {
    render(<InvitePanel {...defaultProps} userRole="nonexistent_role" />);
    const options = screen
      .getByTestId('select-role')
      .querySelectorAll('option');
    expect(options.length).toBe(0);
  });

  test('should handle reset button click', () => {
    render(<InvitePanel {...defaultProps} />);
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    expect(resetButton).toBeInTheDocument();
  });

  test('should render with inviteError', () => {
    render(<InvitePanel {...defaultProps} inviteError="Test error message" />);
    expect(screen.getByText('Invite Outside')).toBeInTheDocument();
  });

  test('creates snapshot', () => {
    const { container } = render(<InvitePanel {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
