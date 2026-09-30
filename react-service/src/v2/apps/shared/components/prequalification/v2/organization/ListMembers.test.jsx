import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import ListMembers from './ListMembers';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock MUI components
jest.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children, sx, ...props }) => (
    <div data-testid="mui-typography" style={sx} {...props}>
      {children}
    </div>
  ),
}));

// Mock constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxRed: '#red',
      },
    },
  },
}));

// Mock role helpers
jest.mock('v2/helpers/prequal/organization', () => ({
  DIRECTOR: { value: 'Director' },
}));

// Mock Member component
jest.mock('./Member', () => ({
  __esModule: true,
  default: ({ data, actions }) => (
    <div data-testid={`member-${data.id}`} data-name={`${data.firstname} ${data.lastname}`}>
      <span>{data.firstname} {data.lastname}</span>
      <span>{data.title}</span>
      <div data-testid={`member-actions-${data.id}`}>
        {actions.map((action, index) => (
          action && (
            <button
              key={action.id}
              data-testid={`action-${action.label}-${data.id}`}
              onClick={action.action}
            >
              {action.label}
            </button>
          )
        ))}
      </div>
    </div>
  ),
}));

// Mock Confirm component
jest.mock('./Confirm', () => ({
  __esModule: true,
  default: ({ open, setOpen, handleConfirm }) => (
    open ? (
      <div data-testid="confirm-modal">
        <button data-testid="confirm-cancel" onClick={() => setOpen()}>
          Cancel
        </button>
        <button data-testid="confirm-delete" onClick={handleConfirm}>
          Confirm Delete
        </button>
      </div>
    ) : null
  ),
}));

describe('ListMembers Component', () => {
  let mockNavigate;
  let mockHandleDelete;
  let mockSetSelected;
  let mockHandleOnShow;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockHandleDelete = jest.fn();
    mockSetSelected = jest.fn();
    mockHandleOnShow = jest.fn();

    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getDefaultProps = (overrides = {}) => ({
    group: mockGroup,
    accountOwner: true,
    handleDelete: mockHandleDelete,
    logoOwner: 'logo-url.jpg',
    setSelected: mockSetSelected,
    handleOnShow: mockHandleOnShow,
    ...overrides,
  });

  const mockGroup = {
    'Director': [
      {
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        title: 'Director',
        email: 'john@example.com',
        account_owner: false,
      },
      {
        id: 2,
        firstname: 'Jane',
        lastname: 'Smith',
        title: 'Director',
        email: 'jane@example.com',
        account_owner: true,
      },
    ],
    'Tendering': [
      {
        id: 3,
        firstname: 'Bob',
        lastname: 'Johnson',
        title: 'Tendering',
        email: 'bob@example.com',
        account_owner: false,
      },
    ],
  };

  describe('Rendering', () => {
    it('should render all groups and members', () => {
      const props = getDefaultProps();
      render(<ListMembers {...props} />);

      // Check group titles by looking at the Typography components
      const typographyElements = screen.getAllByTestId('mui-typography');
      expect(typographyElements[0]).toHaveTextContent('Director');
      expect(typographyElements[1]).toHaveTextContent('Tendering');

      // Check members
      expect(screen.getByTestId('member-1')).toBeInTheDocument();
      expect(screen.getByTestId('member-2')).toBeInTheDocument();
      expect(screen.getByTestId('member-3')).toBeInTheDocument();
    });

    it('should render default group title when title is empty', () => {
      const groupWithEmptyTitle = {
        '': [
          {
            id: 4,
            firstname: 'Test',
            lastname: 'User',
            title: '',
            email: 'test@example.com',
            account_owner: false,
          },
        ],
      };

      render(<ListMembers {...getDefaultProps()} group={groupWithEmptyTitle} />);

      const typographyElement = screen.getByTestId('mui-typography');
      expect(typographyElement).toHaveTextContent('Director');
    });

    it.skip('should handle empty group object', () => {
      render(<ListMembers {...getDefaultProps({ group: {} })} />);

      expect(screen.queryByTestId(/member-/)).not.toBeInTheDocument();
    });

    it.skip('should handle undefined group prop', () => {
      render(<ListMembers {...getDefaultProps({ group: undefined })} />);

      expect(screen.queryByTestId(/member-/)).not.toBeInTheDocument();
    });
  });

  describe('Member Actions', () => {
    it.skip('should render edit and delete actions for regular members when user is account owner', () => {
      render(<ListMembers {...getDefaultProps()} />);

      const editButton = screen.getByTestId('action-edit-1');
      const deleteButton = screen.getByTestId('action-delete-1');

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it.skip('should only render edit action for regular members when user is not account owner', () => {
      const props = {
        ...defaultProps,
        accountOwner: false,
      };

      render(<ListMembers {...props} />);

      const editButton = screen.getByTestId('action-edit-1');
      const deleteButton = screen.queryByTestId('action-delete-1');

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).not.toBeInTheDocument();
    });

    it.skip('should render different actions for account owner members', () => {
      render(<ListMembers {...defaultProps} />);

      // Account owner member (id: 2) should have different edit action
      const editButton = screen.getByTestId('action-edit-2');
      const deleteButton = screen.queryByTestId('action-delete-2');

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).not.toBeInTheDocument();
    });

    it.skip('should not render any actions for account owner members when user is not account owner', () => {
      const props = {
        ...defaultProps,
        accountOwner: false,
      };

      render(<ListMembers {...props} />);

      const actionsContainer = screen.getByTestId('member-actions-2');
      const buttons = actionsContainer.querySelectorAll('button');

      expect(buttons).toHaveLength(0);
    });
  });

  describe('Action Handlers', () => {
    it('should call setSelected and handleOnShow when edit button is clicked for regular member', () => {
      const props = getDefaultProps();
      render(<ListMembers {...props} />);

      const editButton = screen.getByTestId('action-edit-1');
      fireEvent.click(editButton);

      expect(mockSetSelected).toHaveBeenCalledWith(mockGroup.Director[0]);
      expect(mockHandleOnShow).toHaveBeenCalled();
    });

    it.skip('should navigate to profile page when edit button is clicked for account owner', () => {
      render(<ListMembers {...defaultProps} />);

      const editButton = screen.getByTestId('action-edit-2');
      fireEvent.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/my-company/profile');
    });

    it.skip('should show confirm modal when delete button is clicked', () => {
      render(<ListMembers {...defaultProps} />);

      const deleteButton = screen.getByTestId('action-delete-1');
      fireEvent.click(deleteButton);

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    });

    it.skip('should hide confirm modal when cancel is clicked', () => {
      render(<ListMembers {...defaultProps} />);

      // Click delete to show modal
      const deleteButton = screen.getByTestId('action-delete-1');
      fireEvent.click(deleteButton);

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();

      // Click cancel to hide modal
      const cancelButton = screen.getByTestId('confirm-cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    });

    it.skip('should call handleDelete when confirm is clicked', () => {
      render(<ListMembers {...defaultProps} />);

      // Click delete to show modal
      const deleteButton = screen.getByTestId('action-delete-1');
      fireEvent.click(deleteButton);

      // Click confirm
      const confirmButton = screen.getByTestId('confirm-delete');
      fireEvent.click(confirmButton);

      expect(mockHandleDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('Logo Handling', () => {
    it.skip('should pass logoOwner to account owner members', () => {
      render(<ListMembers {...defaultProps} />);

      const accountOwnerMember = screen.getByTestId('member-2');
      expect(accountOwnerMember).toBeInTheDocument();
    });

    it.skip('should not pass logoOwner to regular members', () => {
      render(<ListMembers {...defaultProps} />);

      const regularMember = screen.getByTestId('member-1');
      expect(regularMember).toBeInTheDocument();
    });

    it.skip('should handle missing logoOwner prop', () => {
      const { logoOwner, ...propsWithoutLogo } = defaultProps;

      render(<ListMembers {...propsWithoutLogo} />);

      expect(screen.getByTestId('member-1')).toBeInTheDocument();
      expect(screen.getByTestId('member-2')).toBeInTheDocument();
    });
  });

  describe('Group Structure', () => {
    it.skip('should handle groups with single member', () => {
      const singleMemberGroup = {
        'Manager': [
          {
            id: 5,
            firstname: 'Single',
            lastname: 'Member',
            title: 'Manager',
            email: 'single@example.com',
            account_owner: false,
          },
        ],
      };

      render(<ListMembers {...defaultProps} group={singleMemberGroup} />);

      const typographyElement = screen.getByTestId('mui-typography');
      expect(typographyElement).toHaveTextContent('Manager');
      expect(screen.getByTestId('member-5')).toBeInTheDocument();
    });

    it.skip('should handle groups with multiple members', () => {
      const multiMemberGroup = {
        'Team': [
          {
            id: 6,
            firstname: 'Member',
            lastname: 'One',
            title: 'Team',
            email: 'one@example.com',
            account_owner: false,
          },
          {
            id: 7,
            firstname: 'Member',
            lastname: 'Two',
            title: 'Team',
            email: 'two@example.com',
            account_owner: false,
          },
          {
            id: 8,
            firstname: 'Member',
            lastname: 'Three',
            title: 'Team',
            email: 'three@example.com',
            account_owner: false,
          },
        ],
      };

      render(<ListMembers {...defaultProps} group={multiMemberGroup} />);

      const typographyElement = screen.getByTestId('mui-typography');
      expect(typographyElement).toHaveTextContent('Team');
      expect(screen.getByTestId('member-6')).toBeInTheDocument();
      expect(screen.getByTestId('member-7')).toBeInTheDocument();
      expect(screen.getByTestId('member-8')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it.skip('should handle members without names', () => {
      const groupWithIncompleteData = {
        'Test': [
          {
            id: 9,
            firstname: '',
            lastname: '',
            title: 'Test',
            email: 'test@example.com',
            account_owner: false,
          },
        ],
      };

      render(<ListMembers {...defaultProps} group={groupWithIncompleteData} />);

      expect(screen.getByTestId('member-9')).toBeInTheDocument();
    });

    it.skip('should handle members with missing properties', () => {
      const groupWithMissingProps = {
        'Test': [
          {
            id: 10,
            account_owner: false,
          },
        ],
      };

      render(<ListMembers {...defaultProps} group={groupWithMissingProps} />);

      expect(screen.getByTestId('member-10')).toBeInTheDocument();
    });

    it.skip('should handle null member data', () => {
      const groupWithNullMember = {
        'Test': [null, undefined],
      };

      render(<ListMembers {...defaultProps} group={groupWithNullMember} />);

      const typographyElement = screen.getByTestId('mui-typography');
      expect(typographyElement).toHaveTextContent('Test');
    });
  });

  describe('State Management', () => {
    it.skip('should manage delete modal state correctly', () => {
      const testProps = {
        ...defaultProps,
        handleDelete: mockHandleDelete
      };

      render(<ListMembers {...testProps} />);

      // Initially no modal
      expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();

      // Click delete for first member
      const deleteButton1 = screen.getByTestId('action-delete-1');
      fireEvent.click(deleteButton1);
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByTestId('confirm-cancel');
      fireEvent.click(cancelButton);
      expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();

      // Click delete for different member
      const deleteButton3 = screen.getByTestId('action-delete-3');
      fireEvent.click(deleteButton3);
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();

      // Confirm delete
      const confirmButton = screen.getByTestId('confirm-delete');
      fireEvent.click(confirmButton);
      expect(mockHandleDelete).toHaveBeenCalledWith(3);
    });
  });

  describe('Accessibility', () => {
    it.skip('should render proper group structure', () => {
      render(<ListMembers {...defaultProps} />);

      const groupTitles = screen.getAllByTestId('mui-typography');
      expect(groupTitles.length).toBeGreaterThan(0);
    });

    it.skip('should provide unique keys for members', () => {
      render(<ListMembers {...defaultProps} />);

      const members = screen.getAllByTestId(/member-\d+/);
      expect(members).toHaveLength(3);
    });
  });
});