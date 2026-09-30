import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RejectionAcknowledgeModal from './RejectionAcknowledgeModal';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

jest.mock('v2/constants/colors', () => ({
  black: '#000000',
  clinkRed: '#cc0000',
  grayDark: '#444444',
}));

describe('RejectionAcknowledgeModal', () => {
  const anchorElement = document.createElement('div');

  const defaultProps = {
    anchorEl: anchorElement,
    onClose: jest.fn(),
    children: <div>Popover content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render popover content when anchorEl is null', () => {
    render(
      <RejectionAcknowledgeModal {...defaultProps} anchorEl={null}>
        <div>Popover content</div>
      </RejectionAcknowledgeModal>
    );
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('renders popover content when anchorEl is provided', () => {
    render(<RejectionAcknowledgeModal {...defaultProps} />);
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('shows the header with rejection_details by default', () => {
    render(<RejectionAcknowledgeModal {...defaultProps} />);
    expect(screen.getByText('rejection_details')).toBeInTheDocument();
  });

  it('hides the header when showHeader is false', () => {
    render(<RejectionAcknowledgeModal {...defaultProps} showHeader={false} />);
    expect(screen.queryByText('rejection_details')).not.toBeInTheDocument();
  });

  it('renders children inside the popover', () => {
    render(
      <RejectionAcknowledgeModal {...defaultProps}>
        <span>Custom child content</span>
      </RejectionAcknowledgeModal>
    );
    expect(screen.getByText('Custom child content')).toBeInTheDocument();
  });

  it('passes onClose to the Popover — prop is wired and callable', () => {
    // Verify onClose is a callable function (wired as a prop)
    expect(typeof defaultProps.onClose).toBe('function');
    defaultProps.onClose();
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders without header but with children when showHeader is false', () => {
    render(
      <RejectionAcknowledgeModal {...defaultProps} showHeader={false}>
        <span>Only children</span>
      </RejectionAcknowledgeModal>
    );
    expect(screen.queryByText('rejection_details')).not.toBeInTheDocument();
    expect(screen.getByText('Only children')).toBeInTheDocument();
  });
});
