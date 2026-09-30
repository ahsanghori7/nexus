import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RejectionDetailContent from './RejectionDetailContent';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

jest.mock('v2/helpers/url', () => ({
  goToNewTab: jest.fn(),
}));

jest.mock('v2/constants/colors', () => ({
  clinkLightGray: '#cccccc',
  lightGray3: '#f5f5f5',
  grayDark: '#444444',
}));

import { goToNewTab } from 'v2/helpers/url';

describe('RejectionDetailContent', () => {
  const defaultRejection = {
    type: 'order',
    comment: 'Please revise the pricing section.',
    approverName: 'Jane Doe',
    approverRole: 'Project Manager',
    editUrl: '/orders/123/edit',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when rejection is null', () => {
    const { container } = render(<RejectionDetailContent rejection={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when rejection is undefined', () => {
    const { container } = render(<RejectionDetailContent />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the rejection comment', () => {
    render(<RejectionDetailContent rejection={defaultRejection} />);
    expect(screen.getByText('Please revise the pricing section.')).toBeInTheDocument();
  });

  it('renders the approver name', () => {
    render(<RejectionDetailContent rejection={defaultRejection} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders the approver role when provided', () => {
    render(<RejectionDetailContent rejection={defaultRejection} />);
    expect(screen.getByText('(Project Manager)')).toBeInTheDocument();
  });

  it('does not render approver role when not provided', () => {
    const rejectionWithoutRole = { ...defaultRejection, approverRole: undefined };
    render(<RejectionDetailContent rejection={rejectionWithoutRole} />);
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it('renders translated section label keys', () => {
    render(<RejectionDetailContent rejection={defaultRejection} />);
    expect(screen.getByText('rejection_note')).toBeInTheDocument();
    expect(screen.getByText('rejected_by')).toBeInTheDocument();
    expect(screen.getByText('rejection_resolve_hint')).toBeInTheDocument();
  });

  it('renders the edit order button with translated label', () => {
    render(<RejectionDetailContent rejection={defaultRejection} />);
    expect(screen.getByRole('button', { name: 'edit-order' })).toBeInTheDocument();
  });

  it('calls goToNewTab with editUrl when button is clicked', () => {
    render(<RejectionDetailContent rejection={defaultRejection} />);
    fireEvent.click(screen.getByRole('button', { name: 'edit-order' }));
    expect(goToNewTab).toHaveBeenCalledTimes(1);
    expect(goToNewTab).toHaveBeenCalledWith('/orders/123/edit');
  });
});
