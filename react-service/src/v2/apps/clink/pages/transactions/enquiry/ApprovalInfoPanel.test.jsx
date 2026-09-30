import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApprovalInfoPanel from './ApprovalInfoPanel';

// Mock external dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('moment', () => {
  return (date) => ({
    format: (formatString) => {
      if (date && date !== '-') {
        return '27/01/2026 14:16';
      }
      return '-';
    },
  });
});

describe('ApprovalInfoPanel', () => {
  const mockApprovalInfo = {
    status: 'Approved',
    approver_name: 'John Doe',
    approver_email: 'john.doe@example.com',
    approver_title: 'Project Manager',
    requested_on: '2026-01-27 14:16:02',
  };

  it('renders approval information correctly', () => {
    render(<ApprovalInfoPanel approvalInfo={mockApprovalInfo} />);

    expect(screen.getByText('assigned-to')).toBeInTheDocument();
    expect(screen.getByText('approval-requested')).toBeInTheDocument();
    expect(screen.getByText('job-title')).toBeInTheDocument();
    expect(screen.getByText('status')).toBeInTheDocument();
  });

  it('displays approver name and email', () => {
    render(<ApprovalInfoPanel approvalInfo={mockApprovalInfo} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('displays job title', () => {
    render(<ApprovalInfoPanel approvalInfo={mockApprovalInfo} />);

    expect(screen.getByText('Project Manager')).toBeInTheDocument();
  });

  it('displays approval status', () => {
    render(<ApprovalInfoPanel approvalInfo={mockApprovalInfo} />);

    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('displays formatted date', () => {
    render(<ApprovalInfoPanel approvalInfo={mockApprovalInfo} />);

    expect(screen.getByText('27/01/2026 14:16')).toBeInTheDocument();
  });

  it('shows "-" for missing job title', () => {
    const infoWithoutTitle = {
      ...mockApprovalInfo,
      approver_title: '',
    };

    render(<ApprovalInfoPanel approvalInfo={infoWithoutTitle} />);

    const cells = screen.getAllByText('-');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('renders with Rejected status', () => {
    const rejectedInfo = {
      ...mockApprovalInfo,
      status: 'Rejected',
    };

    render(<ApprovalInfoPanel approvalInfo={rejectedInfo} />);

    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('renders with Pending Approval status', () => {
    const pendingInfo = {
      ...mockApprovalInfo,
      status: 'Pending Approval',
    };

    render(<ApprovalInfoPanel approvalInfo={pendingInfo} />);

    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
  });

  it('renders null when approval_info is empty array', () => {
    const { container } = render(<ApprovalInfoPanel approvalInfo={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders null when approval_info is null', () => {
    const { container } = render(<ApprovalInfoPanel approvalInfo={null} />);

    expect(container.firstChild).toBeNull();
  });

  it('displays approver initials in avatar', () => {
    render(<ApprovalInfoPanel approvalInfo={mockApprovalInfo} />);

    // Avatar should be rendered (mocked by MUI)
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });

  it('handles single name correctly', () => {
    const singleNameInfo = {
      ...mockApprovalInfo,
      approver_name: 'Admin',
    };

    render(<ApprovalInfoPanel approvalInfo={singleNameInfo} />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // Initial
  });

  it('shows "-" for empty approver name', () => {
    const emptyNameInfo = {
      ...mockApprovalInfo,
      approver_name: '',
    };

    render(<ApprovalInfoPanel approvalInfo={emptyNameInfo} />);

    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('renders with all fields empty gracefully', () => {
    const emptyInfo = {
      status: '',
      approver_name: '',
      approver_email: '',
      approver_title: '',
      requested_on: '',
    };

    render(<ApprovalInfoPanel approvalInfo={emptyInfo} />);

    // Should render table headers
    expect(screen.getByText('assigned-to')).toBeInTheDocument();
    expect(screen.getByText('status')).toBeInTheDocument();
  });
});
