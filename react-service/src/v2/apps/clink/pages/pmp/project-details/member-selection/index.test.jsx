import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MembersSection from './index';

// Mock store
const mockStore = configureStore([]);

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        lightPeriwinkle: '#e6e6fa',
      },
    },
  },
}));

// Mock MUI components
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Autocomplete: ({ children, renderInput, ...props }) => {
    const MockedInput = renderInput ? renderInput({ 
      inputProps: {}, 
      InputProps: { 
        startAdornment: null,
        endAdornment: null 
      } 
    }) : null;
    return (
      <div data-testid="mock-autocomplete" {...props}>
        {MockedInput}
        {children}
      </div>
    );
  },
}));

// Mock context hook
const mockContextActions = {
  fetchTeamApi: jest.fn(() => ({ type: 'FETCH_TEAM_API' })),
  addMember: jest.fn(() => ({ type: 'ADD_MEMBER' })),
  postMember: jest.fn(() => ({ type: 'POST_MEMBER' })),
  updateMember: jest.fn(() => ({ type: 'UPDATE_MEMBER' })),
  deleteMember: jest.fn(() => ({ type: 'DELETE_MEMBER' })),
};

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: mockContextActions,
  }),
}));

// Mock MembersList component
jest.mock('./MembersList', () => ({
  __esModule: true,
  default: ({ members }) => (
    <div data-testid="members-list">
      Members List: {members.length} members
    </div>
  ),
}));

describe('MembersSection Component', () => {
  const mockProject = {
    data: {
      id: 1,
      slug: 'test-project',
    },
    members: [
      {
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        position: 'Manager',
      },
    ],
  };

  const mockConstants = {
    project: {
      team_role: [
        { id: 1, label: 'Manager' },
        { id: 2, label: 'Developer' },
        { id: 3, label: 'Designer' },
      ],
    },
  };

  let store;

  beforeEach(() => {
    store = mockStore({
      project: mockProject,
      constants: mockConstants,
      clinkAccount: { id: 1 },
    });
    jest.clearAllMocks();
  });

  const renderComponent = (customProps = {}) => {
    return render(
      <Provider store={store}>
        <MembersSection {...customProps} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('your-project-team-details')).toBeInTheDocument();
  });

  it('renders member form fields', () => {
    renderComponent();
    
    expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/firstname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lastname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders add member button', () => {
    renderComponent();
    expect(screen.getByText('Add Team Member')).toBeInTheDocument();
  });

  it('renders members list component', () => {
    renderComponent();
    expect(screen.getByTestId('members-list')).toBeInTheDocument();
  });

  it('displays existing members count', () => {
    renderComponent();
    expect(screen.getByText(/1 members/)).toBeInTheDocument();
  });

  it('handles input changes correctly', () => {
    renderComponent();
    
    const firstNameInput = screen.getByLabelText(/firstname/i);
    fireEvent.change(firstNameInput, { target: { name: 'firstname', value: 'Jane' } });
    
    expect(firstNameInput.value).toBe('Jane');
  });

  it('handles email input changes', () => {
    renderComponent();
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { name: 'email', value: 'jane@example.com' } });
    
    expect(emailInput.value).toBe('jane@example.com');
  });

  it('renders with empty members array', () => {
    const storeWithNoMembers = mockStore({
      project: { ...mockProject, members: [] },
      constants: mockConstants,
      clinkAccount: { id: 1 },
    });

    render(
      <Provider store={storeWithNoMembers}>
        <MembersSection />
      </Provider>
    );
    
    expect(screen.getByText('your-project-team-details')).toBeInTheDocument();
    expect(screen.getByText(/0 members/)).toBeInTheDocument();
  });

  it('renders with no project data', () => {
    const storeWithNoProject = mockStore({
      project: { data: null, members: [] },
      constants: mockConstants,
      clinkAccount: { id: 1 },
    });

    render(
      <Provider store={storeWithNoProject}>
        <MembersSection />
      </Provider>
    );
    
    expect(screen.getByText('your-project-team-details')).toBeInTheDocument();
  });

  it('fetches team data when project ID is available', () => {
    renderComponent();
    expect(mockContextActions.fetchTeamApi).toHaveBeenCalledWith(1);
  });

  it('renders add from team button', () => {
    renderComponent();
    expect(screen.getByText('select-from-team')).toBeInTheDocument();
  });
});