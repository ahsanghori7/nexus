import React from 'react';
import { render } from '@testing-library/react';
import AssignedApproversAvatars from './AssignedApproversAvatars';

// Mock the helpers
jest.mock('v2/apps/clink/pages/orders/subcontractors/helpers', () => ({
  getOrderStatusColor: jest.fn((status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'success';
    if (s === 'pending') return 'warning';
    if (s === 'rejected') return 'error';
    return 'disabled';
  }),
  getApproverInitials: jest.fn((firstName, lastName) => {
    const firstInitial = firstName?.charAt(0).toUpperCase() || '';
    const lastInitial = lastName?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }),
}));

describe('AssignedApproversAvatars Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<AssignedApproversAvatars assignedApprovers={[]} />);
    expect(container).toBeTruthy();
  });

  it('should return null for empty assignedApprovers', () => {
    const { container } = render(<AssignedApproversAvatars assignedApprovers={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null for null assignedApprovers', () => {
    const { container } = render(<AssignedApproversAvatars assignedApprovers={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null for undefined assignedApprovers', () => {
    const { container } = render(<AssignedApproversAvatars />);
    expect(container.firstChild).toBeNull();
  });

  it('should render AvatarGroup for non-empty assignedApprovers', () => {
    const mockApprovers = [
      {
        id: 1,
        status: { label: 'approved' },
        user: {
          firstname: 'John',
          lastname: 'Doe'
        }
      }
    ];
    
    const { getByTestId } = render(<AssignedApproversAvatars assignedApprovers={mockApprovers} />);
    expect(getByTestId('assigned-approvers-avatars')).toBeInTheDocument();
  });

  it('should render avatars for each approver', () => {
    const mockApprovers = [
      {
        id: 1,
        status: { label: 'approved' },
        user: {
          firstname: 'John',
          lastname: 'Doe'
        }
      },
      {
        id: 2,
        status: 'pending',
        user: {
          firstname: 'Jane',
          lastname: 'Smith'
        }
      }
    ];
    
    const { container } = render(<AssignedApproversAvatars assignedApprovers={mockApprovers} />);
    const avatars = container.querySelectorAll('[data-testid^="approver-avatar-"]');
    expect(avatars).toHaveLength(2);
  });

  it('should display initials in avatars', () => {
    const mockApprovers = [
      {
        id: 1,
        status: { label: 'approved' },
        user: {
          firstname: 'John',
          lastname: 'Doe'
        }
      }
    ];
    
    const { getByText } = render(<AssignedApproversAvatars assignedApprovers={mockApprovers} />);
    expect(getByText('JD')).toBeInTheDocument();
  });

  it('should handle missing user data', () => {
    const mockApprovers = [
      {
        id: 1,
        status: { label: 'approved' },
        user: null
      }
    ];
    
    const { getByTestId } = render(<AssignedApproversAvatars assignedApprovers={mockApprovers} />);
    expect(getByTestId('assigned-approvers-avatars')).toBeInTheDocument();
  });

  it('should handle string status instead of object', () => {
    const mockApprovers = [
      {
        id: 1,
        status: 'pending',
        user: {
          firstname: 'John',
          lastname: 'Doe'
        }
      }
    ];
    
    const { getByTestId } = render(<AssignedApproversAvatars assignedApprovers={mockApprovers} />);
    expect(getByTestId('assigned-approvers-avatars')).toBeInTheDocument();
  });
});