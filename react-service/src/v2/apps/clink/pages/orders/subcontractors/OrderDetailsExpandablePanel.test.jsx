import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderDetailsExpandablePanel from './OrderDetailsExpandablePanel';

// Mock external dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('v2/apps/clink/pages/orders/subcontractors/helpers', () => ({
  getApproverInitials: jest.fn((firstName, lastName) => `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`),
  getOrderStatusColor: jest.fn((status) => status === 'APPROVED' ? 'green' : 'orange'),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('helpers/date', () => ({
  formatUKorAnzDateTime: jest.fn((date) => ({ 
    date: new Date(date).toLocaleDateString() 
  })),
}));

describe('OrderDetailsExpandablePanel Component', () => {
  const mockProps = {
    rowData: {
      document: {
        id: 'doc-123',
      },
      assigned_approvers: [],
    },
    userInfo: {
      id: 'user-1',
      display_name: 'Test User',
    },
    sendApprovalReminder: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<OrderDetailsExpandablePanel {...mockProps} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders table headers correctly', () => {
    render(<OrderDetailsExpandablePanel {...mockProps} />);
    
    expect(screen.getByText('assigned-to')).toBeInTheDocument();
    expect(screen.getByText('approval-requested')).toBeInTheDocument();
    expect(screen.getByText('job-title')).toBeInTheDocument();
    expect(screen.getByText('status')).toBeInTheDocument();
  });

  it('renders assigned approvers when provided', () => {
    const propsWithApprovers = {
      ...mockProps,
      rowData: {
        ...mockProps.rowData,
        assigned_approvers: [
          {
            id: 'approver-1',
            approver_user: {
              id: 'user-1',
              display_name: 'John Doe',
              email: 'john.doe@example.com',
              firstname: 'John',
              lastname: 'Doe',
              job_title: 'Project Manager',
              role: {
                value: 'Project Manager'
              },
            },
            requester_user_id: 'user-2',
            created_at: '2023-01-01T10:00:00Z',
            status: {
              label: 'PENDING',
            },
          },
        ],
      },
    };

    render(<OrderDetailsExpandablePanel {...propsWithApprovers} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Project Manager')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('displays approver initials correctly', () => {
    const propsWithApprover = {
      ...mockProps,
      rowData: {
        ...mockProps.rowData,
        assigned_approvers: [
          {
            id: 'approver-1',
            approver_user: {
              id: 'user-1',
              display_name: 'Test User',
              email: 'test@example.com',
              firstname: 'Test',
              lastname: 'User',
              job_title: 'Manager',
              role: {
                value: 'Manager'
              },
            },
            requester_user_id: 'user-2',
            created_at: '2023-01-01T10:00:00Z',
            status: {
              label: 'PENDING',
            },
          },
        ],
      },
    };

    render(<OrderDetailsExpandablePanel {...propsWithApprover} />);

    // The initials should be displayed in the avatar
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('handles approvers without job title gracefully', () => {
    const propsWithApproverNoJobTitle = {
      ...mockProps,
      rowData: {
        ...mockProps.rowData,
        assigned_approvers: [
          {
            id: 'approver-1',
            approver_user: {
              id: 'user-1',
              display_name: 'No Job Title User',
              email: 'nojob@example.com',
              firstname: 'No',
              lastname: 'Job',
              role: {
                value: null // Provide role structure but with null value
              }
            },
            requester_user_id: 'user-2',
            created_at: '2023-01-01T10:00:00Z',
            status: {
              label: 'PENDING',
            },
          },
        ],
      },
    };

    render(<OrderDetailsExpandablePanel {...propsWithApproverNoJobTitle} />);

    // Should display the fallback '-' since role.value is null
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    const propsWithApprover = {
      ...mockProps,
      rowData: {
        ...mockProps.rowData,
        assigned_approvers: [
          {
            id: 'approver-1',
            approver_user: {
              id: 'user-1',
              display_name: 'Date Test User',
              email: 'date@example.com',
              firstname: 'Date',
              lastname: 'Test',
              job_title: 'Tester',
              role: {
                value: 'Tester'
              },
            },
            requester_user_id: 'user-2',
            created_at: '2023-06-15T14:30:00Z',
            status: {
              label: 'PENDING',
            },
          },
        ],
      },
    };

    render(<OrderDetailsExpandablePanel {...propsWithApprover} />);

    // Check that the formatted date appears
    expect(screen.getByText('6/15/2023')).toBeInTheDocument();
  });
});