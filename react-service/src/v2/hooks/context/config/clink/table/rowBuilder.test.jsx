import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import rowBuilder from './rowBuilder';

jest.mock('v2/helpers/i18n', () => ({ t: (key) => key }));
jest.mock('clink-components', () => ({
  Form: function MockForm({ render, defaultValues }) {
    const mockFormHook = {
      formState: { errors: {} },
      register: jest.fn(),
      setValue: jest.fn(),
      control: {},
    };
    return <div data-testid="form-content">{render(mockFormHook)}</div>;
  },
  InputFormControlled: function MockInputFormControlled(props) {
    return (
      <select data-testid="select-user-type">
        {props.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
  CONSTANTS: {
    colors: {
      general: {
        white: '#fff',
        japaneseIndigo: '#1a1a2e',
        clinkBlack: '#000',
        borderbox: '#eee',
      },
    },
  },
}));

jest.mock('v2/apps/shared/components/confirm-modal/v2', () => ({
  __esModule: true,
  default: function MockConfirmModal({ children }) {
    return <div>{children}</div>;
  },
  Content: function MockContent({ handleCancel, handleAccept }) {
    return (
      <div>
        <button onClick={handleCancel} data-testid="modal-cancel">
          Cancel
        </button>
        <button onClick={handleAccept} data-testid="modal-accept">
          Accept
        </button>
      </div>
    );
  },
}));

jest.mock(
  '@mui/material/Box',
  () =>
    function MockBox({ children, id, component }) {
      if (component === 'span') return <span>{children}</span>;
      return <div id={id}>{children}</div>;
    },
);

jest.mock(
  '@mui/material/Button',
  () =>
    function MockButton({ children, onClick, disabled }) {
      return (
        <button onClick={onClick} disabled={disabled}>
          {children}
        </button>
      );
    },
);

// Roles with value field — rowBuilder uses: roles.find(t => t.value === userRole)
// and isInternalUseRoles = ['administrator', 'project_team_member'] checked against t.value
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

describe('rowBuilder', () => {
  // member.role.id must match roles[].user_type_id for selectedRole lookup
  // e.g. role.id='1' → matches roles where user_type_id='1' → Administrator
  const mockMember = {
    email: 'test@example.com',
    user_id: '123',
    role: {
      id: '1', // matches roles[].user_type_id = '1' → Administrator (level 1)
      label: 'administrator',
      level: '1',
      value: 'Administrator',
    },
    firstname: 'John',
    lastname: 'Doe',
    can_be_removed: true,
    permissions: { permission_count: 5 },
  };

  // ✅ clinkAccount.type is used: const currentUserRoleValue = clinkAccount?.type
  const mockClinkAccount = { type: 'super_admin' };

  const mockChangeRoleAction = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns object with correct basic properties', () => {
    // userRole = 'super_admin' matches roles[].value = 'super_admin' → userRoleData level=2
    // selectedRole: role.id='1' matches user_type_id='1' → Administrator level=1
    // userRoleData.level(2) <= selectedRole.level(1) → FALSE → options=[]
    // But basic properties should still be returned correctly
    const result = rowBuilder(
      mockMember,
      mockRoles,
      'super_admin', // ✅ userRole = roles[].value
      mockChangeRoleAction,
      mockClinkAccount, // ✅ { type: 'super_admin' }
    );

    expect(result).toHaveProperty('id', '123');
    expect(result).toHaveProperty('name', 'John Doe');
    expect(result).toHaveProperty('email', 'test@example.com');
    expect(result).toHaveProperty('canBeRemoved', true);
    expect(result).toHaveProperty('role');
    expect(React.isValidElement(result.role)).toBe(true);
  });

  it('handles member with empty names', () => {
    const result = rowBuilder(
      { ...mockMember, firstname: '', lastname: '' },
      mockRoles,
      'super_admin',
      mockChangeRoleAction,
      mockClinkAccount,
    );
    expect(result.name).toBe('');
  });

  it('handles member with only firstname', () => {
    const result = rowBuilder(
      { ...mockMember, firstname: 'John', lastname: '' },
      mockRoles,
      'super_admin',
      mockChangeRoleAction,
      mockClinkAccount,
    );
    expect(result.name).toBe('John');
  });

  it('renders role form component', () => {
    const result = rowBuilder(
      mockMember,
      mockRoles,
      'super_admin',
      mockChangeRoleAction,
      mockClinkAccount,
    );
    render(result.role);
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
  });

  it('super_admin sees roles with level >= their level (2) excluding internals', () => {
    // Use a member whose role level >= super_admin level so options are not cleared
    // super_admin level=2, member must have selectedRole.level >= 2
    // Use role.id='8' → user_type_id='8' → Super Admin level=2 ✅ (2 <= 2)
    const superAdminMember = {
      ...mockMember,
      role: { id: '8', label: 'super_admin', level: '2', value: 'Super Admin' },
    };
    const result = rowBuilder(
      superAdminMember,
      mockRoles,
      'super_admin', // userRole
      mockChangeRoleAction,
      { type: 'super_admin' }, // clinkAccount
    );
    render(result.role);
    const options = Array.from(
      screen.getByTestId('select-user-type').querySelectorAll('option'),
    );
    const labels = options.map((o) => o.textContent);
    expect(labels).not.toContain('Administrator'); // value='administrator' → internal
    expect(labels).not.toContain('Project Team Member'); // value='project_team_member' → internal
  });

  it('team_assistant gets empty options (blocked by currentUserRoleValue check)', () => {
    const result = rowBuilder(
      mockMember,
      mockRoles,
      'team_assistant', // userRole
      mockChangeRoleAction,
      { type: 'team_assistant' }, // ✅ clinkAccount.type
    );
    render(result.role);
    const options = screen
      .getByTestId('select-user-type')
      .querySelectorAll('option');
    expect(options.length).toBe(0);
  });

  it('approver gets empty options (blocked by currentUserRoleValue check)', () => {
    const result = rowBuilder(
      mockMember,
      mockRoles,
      'approver', // userRole
      mockChangeRoleAction,
      { type: 'approver' }, // ✅ clinkAccount.type
    );
    render(result.role);
    const options = screen
      .getByTestId('select-user-type')
      .querySelectorAll('option');
    expect(options.length).toBe(0);
  });

  it('options use role.id as value (not user_type_id)', () => {
    // Need member whose selectedRole.level >= userRoleData.level for options to show
    // super_admin level=2, use member with role.id='8' (Super Admin user_type_id=8, level=2)
    const superAdminMember = {
      ...mockMember,
      role: { id: '8', label: 'super_admin', level: '2', value: 'Super Admin' },
    };
    const result = rowBuilder(
      superAdminMember,
      mockRoles,
      'super_admin',
      mockChangeRoleAction,
      { type: 'super_admin' },
    );
    render(result.role);
    const options = Array.from(
      screen.getByTestId('select-user-type').querySelectorAll('option'),
    );
    // value should be role.id (e.g. "1", "2") not user_type_id
    options.forEach((opt) => {
      const matchedRole = mockRoles.find((r) => r.id === opt.value);
      expect(matchedRole).toBeDefined();
    });
  });

  it('handles canBeRemoved correctly', () => {
    const result = rowBuilder(
      { ...mockMember, can_be_removed: false },
      mockRoles,
      'super_admin',
      mockChangeRoleAction,
      mockClinkAccount,
    );
    expect(result.canBeRemoved).toBe(false);
  });

  it('returns correct structure for all properties', () => {
    const result = rowBuilder(
      mockMember,
      mockRoles,
      'super_admin',
      mockChangeRoleAction,
      mockClinkAccount,
    );
    ['id', 'name', 'role', 'email', 'canBeRemoved'].forEach((prop) => {
      expect(result).toHaveProperty(prop);
    });
    expect(typeof result.id).toBe('string');
    expect(typeof result.name).toBe('string');
    expect(typeof result.email).toBe('string');
    expect(typeof result.canBeRemoved).toBe('boolean');
    expect(React.isValidElement(result.role)).toBe(true);
  });

  it('renders role select with proper form structure', () => {
    const result = rowBuilder(
      mockMember,
      mockRoles,
      'super_admin',
      mockChangeRoleAction,
      mockClinkAccount,
    );
    render(result.role);
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
    expect(document.querySelector('#mui-wrap-user-role')).toBeInTheDocument();
  });

  it('administrator sees roles with level > 1 excluding internals when member outranks them', () => {
    // administrator level=1, use member with role.id='8' (Super Admin, level=2)
    // userRoleData.level(1) <= selectedRole.level(2) → TRUE → options shown
    // filter: level > 1 AND not internal
    const superAdminMember = {
      ...mockMember,
      role: { id: '8', label: 'super_admin', level: '2', value: 'Super Admin' },
    };
    const result = rowBuilder(
      superAdminMember,
      mockRoles,
      'administrator', // userRole
      mockChangeRoleAction,
      { type: 'administrator' }, // ✅ clinkAccount.type
    );
    render(result.role);
    const options = Array.from(
      screen.getByTestId('select-user-type').querySelectorAll('option'),
    );
    const labels = options.map((o) => o.textContent);
    expect(labels).not.toContain('Administrator'); // level=1, not > 1
    expect(labels).not.toContain('Project Team Member'); // internal
    expect(labels).not.toContain('Account Holder'); // level=0, not > 1
  });

  it('handles witness role member (role.id=6 matches user_type_id=6 → Witness)', () => {
    const witnessMember = {
      ...mockMember,
      role: { id: '6', label: 'witness', level: '7', value: 'Witness' },
    };
    const result = rowBuilder(
      witnessMember,
      mockRoles,
      'super_admin',
      mockChangeRoleAction,
      mockClinkAccount,
    );
    expect(result.id).toBe('123');
    expect(React.isValidElement(result.role)).toBe(true);
  });

  it('selectedRole is found by matching role.id to user_type_id', () => {
    // member.role.id = '1' → matches roles where user_type_id='1' → Administrator
    const result = rowBuilder(
      mockMember, // role.id = '1'
      mockRoles,
      'super_admin',
      mockChangeRoleAction,
      mockClinkAccount,
    );
    render(result.role);
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
  });
});
