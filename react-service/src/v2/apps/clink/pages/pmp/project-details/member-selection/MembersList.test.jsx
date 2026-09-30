import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom';
import MembersList from './MembersList';

// Mock the context hook
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      fetchTeam: jest.fn().mockReturnValue({ type: 'FETCH_TEAM' }),
      updateMember: jest.fn().mockImplementation((payload) => ({ type: 'UPDATE_MEMBER', payload })),
    },
  })),
}));

// Mock the i18n helper
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

// Mock CONSTANTS
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkPurple: '#purple',
        clinkGreen: '#green',
      },
    },
  },
}));

const mockStore = configureStore([]);

describe('MembersList Component', () => {
  const mockHandleDeleteMember = jest.fn();
  const mockHandleAddSelectedMembers = jest.fn();
  const mockHandleCloseTeamDialog = jest.fn();
  const mockHandlePostMember = jest.fn();
  const mockSetSelectedFromTeam = jest.fn();

  const mockMembers = [
    {
      id: 1,
      user_id: 1,
      member: {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contact_number: '123-456-7890',
        position: {
          id: 1,
        },
      },
    },
    {
      id: 2,
      user_id: 2,
      member: {
        firstname: 'Jane',
        lastname: 'Smith',
        email: 'jane@example.com',
        contact_number: '098-765-4321',
        position: {
          id: 2,
        },
      },
    },
  ];

  const mockTeamRoleArray = [
    { id: 1, label: 'Manager' },
    { id: 2, label: 'Developer' },
    { id: 3, label: 'Designer' },
  ];

  const mockAccount = {
    team: {
      members: [
        {
          user_id: 3,
          firstname: 'Bob',
          lastname: 'Wilson',
          email: 'bob@example.com',
        },
        {
          user_id: 4,
          firstname: 'Alice',
          lastname: 'Johnson',
          email: 'alice@example.com',
        },
      ],
    },
  };

  const mockUseTeamDialog = [false];
  const mockUseSelectedFromTeam = [{}, mockSetSelectedFromTeam];

  let store;

  beforeEach(() => {
    store = mockStore({
      account: mockAccount,
    });
    jest.clearAllMocks();
  });

  const renderComponent = (customProps = {}) => {
    const mockDispatch = customProps.dispatch || jest.fn();
    
    // Override the store's dispatch with our mock
    store.dispatch = mockDispatch;
    
    const defaultProps = {
      handleDeleteMember: mockHandleDeleteMember,
      handleAddSelectedMembers: mockHandleAddSelectedMembers,
      handleCloseTeamDialog: mockHandleCloseTeamDialog,
      handlePostMember: mockHandlePostMember,
      members: mockMembers,
      useTeamDialog: mockUseTeamDialog,
      useSelectedFromTeam: mockUseSelectedFromTeam,
      teamRoleArray: mockTeamRoleArray,
      ...customProps,
    };

    return render(
      <Provider store={store}>
        <MembersList {...defaultProps} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('position')).toBeInTheDocument();
  });

  it('renders members table when members exist', () => {
    renderComponent();
    
    expect(screen.getByText('position')).toBeInTheDocument();
    expect(screen.getByText('profile-firstname')).toBeInTheDocument();
    expect(screen.getByText('profile-lastname')).toBeInTheDocument();
    expect(screen.getByText('contact')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('table-column-actions')).toBeInTheDocument();
  });

  it('displays member information in table rows', () => {
    renderComponent();
    
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123-456-7890')).toBeInTheDocument();
    
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('098-765-4321')).toBeInTheDocument();
  });

  it('renders delete buttons for each member', () => {
    renderComponent();
    
    const deleteButtons = screen.getAllByTestId('delete-icon');
    expect(deleteButtons).toHaveLength(2);
  });

  it('calls handleDeleteMember when delete button is clicked', () => {
    renderComponent();
    
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockHandleDeleteMember).toHaveBeenCalledWith(1, 1);
  });

  it('handles contact number changes', () => {
    const mockDispatch = jest.fn();
    renderComponent({ dispatch: mockDispatch });
    
    const contactInput = screen.getByDisplayValue('123-456-7890');
    fireEvent.change(contactInput, { target: { name: 'contact_number', value: '555-555-5555' } });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_MEMBER',
      payload: {
        id: 1,
        name: 'contact_number',
        value: '555-555-5555',
      },
    });
  });

  it('calls handlePostMember on contact number blur', () => {
    renderComponent();
    
    const contactInput = screen.getByDisplayValue('123-456-7890');
    fireEvent.blur(contactInput, { target: { value: '555-555-5555' } });
    
    expect(mockHandlePostMember).toHaveBeenCalledWith({
      position: 1,
      firstname: 'John',
      lastname: 'Doe',
      contact_number: '555-555-5555',
      email: 'john@example.com',
      id: 1,
    });
  });

  it('does not render table when no members', () => {
    renderComponent({ members: [] });
    
    expect(screen.queryByText('position')).not.toBeInTheDocument();
    expect(screen.queryByText('profile-firstname')).not.toBeInTheDocument();
  });

  it('renders team selection dialog when teamDialog is open', () => {
    const openTeamDialog = [true];
    renderComponent({ useTeamDialog: openTeamDialog });
    
    expect(screen.getByText('select-from-team')).toBeInTheDocument();
    expect(screen.getByText('cancel')).toBeInTheDocument();
    expect(screen.getByText('add-selected')).toBeInTheDocument();
  });

  it('displays team members in dialog', () => {
    const openTeamDialog = [true];
    renderComponent({ useTeamDialog: openTeamDialog });
    
    expect(screen.getByText('Bob Wilson (bob@example.com)')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson (alice@example.com)')).toBeInTheDocument();
  });

  it('filters out existing members from team dialog', () => {
    const openTeamDialog = [true];
    const membersWithExistingTeamMember = [
      ...mockMembers,
      {
        id: 3,
        user_id: 3,
        member: {
          firstname: 'Bob',
          lastname: 'Wilson',
          email: 'bob@example.com',
          contact_number: '111-222-3333',
          position: { id: 1 },
        },
      },
    ];
    
    renderComponent({ 
      useTeamDialog: openTeamDialog,
      members: membersWithExistingTeamMember,
    });
    
    // Bob should not appear since he's already a member
    expect(screen.queryByText('Bob Wilson (bob@example.com)')).not.toBeInTheDocument();
    // Alice should still appear
    expect(screen.getByText('Alice Johnson (alice@example.com)')).toBeInTheDocument();
  });

  it('calls setSelectedFromTeam when team member is selected', () => {
    const openTeamDialog = [true];
    renderComponent({ useTeamDialog: openTeamDialog });
    
    const aliceOption = screen.getByText('Alice Johnson (alice@example.com)');
    fireEvent.click(aliceOption);
    
    expect(mockSetSelectedFromTeam).toHaveBeenCalledWith({
      user_id: 4,
      firstname: 'Alice',
      lastname: 'Johnson',
      email: 'alice@example.com',
    });
  });

  it('calls handleCloseTeamDialog when cancel button is clicked', () => {
    const openTeamDialog = [true];
    renderComponent({ useTeamDialog: openTeamDialog });
    
    const cancelButton = screen.getByText('cancel');
    fireEvent.click(cancelButton);
    
    expect(mockHandleCloseTeamDialog).toHaveBeenCalled();
  });

  it('calls handleAddSelectedMembers when add selected button is clicked', () => {
    const openTeamDialog = [true];
    renderComponent({ useTeamDialog: openTeamDialog });
    
    const addButton = screen.getByText('add-selected');
    fireEvent.click(addButton);
    
    expect(mockHandleAddSelectedMembers).toHaveBeenCalled();
  });

  it('handles position change for member', () => {
    renderComponent();
    
    // Find the position input for the first member by name
    const positionInputs = screen.getAllByDisplayValue('1');
    const firstPositionInput = positionInputs[0];
    
    fireEvent.change(firstPositionInput, { target: { value: '2' } });
    
    expect(mockHandlePostMember).toHaveBeenCalledWith({
      position: '2',
      id: 1,
      firstname: 'John',
      lastname: 'Doe',
      contact_number: '123-456-7890',
      email: 'john@example.com',
    });
  });
});