import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RejectedOrdersPanel from './RejectedOrdersPanel';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

describe('RejectedOrdersPanel', () => {
  it('renders nothing but the header when there are no rejected orders', () => {
    render(<RejectedOrdersPanel rejectedOrders={[]} onAcknowledge={jest.fn()} />);

    expect(screen.getByText('rejection_feedback')).toBeInTheDocument();
    expect(screen.queryByText('acknowledge')).not.toBeInTheDocument();
  });

  it('labels the rejection as "order_rejected" when docType is order (or omitted)', () => {
    render(
      <RejectedOrdersPanel
        rejectedOrders={[{ id: 1 }]}
        onAcknowledge={jest.fn()}
        docType="order"
      />,
    );

    expect(screen.getByText('order_rejected')).toBeInTheDocument();
    expect(screen.queryByText('tender_rejected')).not.toBeInTheDocument();
  });

  it('labels the rejection as "tender_rejected" when docType is tender', () => {
    render(
      <RejectedOrdersPanel
        rejectedOrders={[{ id: 1 }]}
        onAcknowledge={jest.fn()}
        docType="tender"
      />,
    );

    expect(screen.getByText('tender_rejected')).toBeInTheDocument();
    expect(screen.queryByText('order_rejected')).not.toBeInTheDocument();
  });

  it('renders one entry per rejected order with reason, approver, and role', () => {
    render(
      <RejectedOrdersPanel
        rejectedOrders={[
          {
            id: 1,
            reason: 'Missing signature',
            approver: { name: 'Jane Doe', role: 'Main Contractor' },
            rejectedAt: '2024-03-05T10:30:00Z',
          },
          {
            id: 2,
            reason: 'Incorrect amount',
            approver: { name: 'John Smith' },
            rejectedAt: null,
          },
        ]}
        onAcknowledge={jest.fn()}
        docType="order"
      />,
    );

    expect(screen.getByText('Missing signature')).toBeInTheDocument();
    expect(screen.getByText('Incorrect amount')).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Main Contractor/)).toBeInTheDocument();
    expect(screen.getAllByText('acknowledge')).toHaveLength(2);
  });

  it('falls back to an em dash when reason or approver name is missing', () => {
    render(
      <RejectedOrdersPanel
        rejectedOrders={[{ id: 1, reason: null, approver: {} }]}
        onAcknowledge={jest.fn()}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText(/by: —/)).toBeInTheDocument();
  });

  it('calls onAcknowledge with the order id when its acknowledge button is clicked', () => {
    const onAcknowledge = jest.fn();
    render(
      <RejectedOrdersPanel
        rejectedOrders={[
          { id: 11, reason: 'a', approver: { name: 'A' } },
          { id: 22, reason: 'b', approver: { name: 'B' } },
        ]}
        onAcknowledge={onAcknowledge}
      />,
    );

    fireEvent.click(screen.getAllByText('acknowledge')[1]);

    expect(onAcknowledge).toHaveBeenCalledWith(22);
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });

  it('formats the rejected date as dd/mm/yyyy at hh:mm', () => {
    render(
      <RejectedOrdersPanel
        rejectedOrders={[
          {
            id: 1,
            reason: 'a',
            approver: { name: 'A' },
            rejectedAt: '2024-03-05T14:05:00Z',
          },
        ]}
        onAcknowledge={jest.fn()}
      />,
    );

    expect(screen.getByText(/05\/03\/2024 at/)).toBeInTheDocument();
  });
});
