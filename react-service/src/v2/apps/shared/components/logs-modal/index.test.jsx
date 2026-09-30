import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogsModal from './index';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('i18next', () => ({
  t: (key) => {
    const MAP = {
      'rejection-reason': 'Rejection reason',
      'self-approved-by-requester': 'Self-approved by requester',
      'approved-by-higher-authority': 'Satisfied by higher authority',
    };
    return MAP[key] ?? key;
  },
}));

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  headerTitle: 'Logs',
};

describe('LogsModal', () => {
  it('renders "no-logs-available" when allLogs is empty', () => {
    render(<LogsModal {...defaultProps} allLogs={[]} />);
    expect(screen.getByText('no-logs-available')).toBeInTheDocument();
  });

  it('renders a plain log entry with a comment', () => {
    const allLogs = [
      {
        type: 'created',
        label: 'Created',
        user: 'John Smith',
        timestamp: '2026-03-01T09:00:00Z',
        comment: 'Initial submission',
      },
    ];
    render(<LogsModal {...defaultProps} allLogs={allLogs} />);
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Initial submission')).toBeInTheDocument();
  });

  it('renders rejection reason inside an alert for rejected entries', () => {
    const allLogs = [
      {
        type: 'rejected',
        label: 'Rejected',
        user: 'Jane Doe',
        timestamp: '2026-03-01T09:00:00Z',
        comment: 'Missing document',
      },
    ];
    render(<LogsModal {...defaultProps} allLogs={allLogs} />);
    expect(
      screen.getByText('Rejection reason: Missing document'),
    ).toBeInTheDocument();
  });

  it('calls onClose when the close icon button is clicked', () => {
    const onClose = jest.fn();
    render(<LogsModal {...defaultProps} allLogs={[]} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('icon-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('approval_request logs', () => {
    const makeApprovalLog = (entryOverrides = [{}, {}]) => [
      {
        type: 'approval_request',
        heading: 'Approval Request #4',
        label: 'Sent For Approval',
        user: 'admin',
        timestamp: '2026-08-03T12:03:43Z',
        levels: [
          {
            level: 1,
            rule: 'Any 2 from 2 must approve',
            status: 'in_progress',
            min_required: 2,
            entries: [
              {
                type: 'approved',
                user: 'James Patterson',
                timestamp: '2026-08-03T12:30:00Z',
                ...entryOverrides[0],
              },
              {
                type: 'pending',
                user: 'Michael Brooks',
                timestamp: '2026-08-03T12:00:00Z',
                ...entryOverrides[1],
              },
            ],
          },
        ],
      },
    ];

    it('renders the level heading and rule chip', () => {
      render(<LogsModal {...defaultProps} allLogs={makeApprovalLog()} />);
      expect(screen.getByText('Approval Request #4')).toBeInTheDocument();
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(
        screen.getByText('Any 2 from 2 must approve'),
      ).toBeInTheDocument();
    });

    it('does not render an approval message when entry.label is absent', () => {
      render(<LogsModal {...defaultProps} allLogs={makeApprovalLog()} />);
      expect(
        screen.queryByText('Satisfied by higher authority'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Self-approved by requester'),
      ).not.toBeInTheDocument();
    });

    it('renders entry.label as the approval message below that entry only', () => {
      render(
        <LogsModal
          {...defaultProps}
          allLogs={makeApprovalLog([
            { label: 'Satisfied by higher authority' },
            {},
          ])}
        />,
      );
      expect(
        screen.getAllByText('Satisfied by higher authority'),
      ).toHaveLength(1);
      expect(
        screen.queryByText('Self-approved by requester'),
      ).not.toBeInTheDocument();
    });

    it('renders different labels per entry independently', () => {
      render(
        <LogsModal
          {...defaultProps}
          allLogs={makeApprovalLog([
            { label: 'Satisfied by higher authority' },
            { label: 'Self-approved by requester' },
          ])}
        />,
      );
      expect(
        screen.getByText('Satisfied by higher authority'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Self-approved by requester'),
      ).toBeInTheDocument();
    });
  });
});
