import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrRejectionFeedbackBanner from './TrRejectionFeedbackBanner';

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: { t: (k) => k },
}));

const mockFormatUKorAnzDateTime = jest.fn(() => ({
  date: '17/04/2026',
  time: '10:30',
}));
jest.mock('helpers/date', () => ({
  formatUKorAnzDateTime: (...args) => mockFormatUKorAnzDateTime(...args),
}));

jest.mock('v2/constants/colors', () => ({
  clinkOrange: '#FF6B00',
  white: '#FFFFFF',
}));

jest.mock('@mui/icons-material/WarningAmber', () => ({
  __esModule: true,
  default: (props) => <span data-testid="warning-icon" {...props} />,
}));

jest.mock('@mui/icons-material/TaskAlt', () => ({
  __esModule: true,
  default: (props) => <span data-testid="task-alt-icon" {...props} />,
}));

const rejectedApprover = {
  status: { label: 'Rejected' },
  comment: 'Please revise the pricing section.',
  approver_user: { display_name: 'Jane Doe' },
  updated_at: '2026-04-17T10:30:00Z',
};

const baseProps = () => ({
  tenderData: { status: 'Rejected' },
  assignedApprovers: [{ approvers: [rejectedApprover] }],
  countryCode: 'GB',
  onAcknowledge: jest.fn(),
  acknowledging: false,
});

describe('TrRejectionFeedbackBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when tenderData status is not Rejected', () => {
    const { container } = render(
      <TrRejectionFeedbackBanner {...baseProps()} tenderData={{ status: 'Draft' }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when tenderData is null', () => {
    const { container } = render(
      <TrRejectionFeedbackBanner {...baseProps()} tenderData={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when tenderData is undefined', () => {
    const { container } = render(<TrRejectionFeedbackBanner {...baseProps()} tenderData={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title i18n key', () => {
    render(<TrRejectionFeedbackBanner {...baseProps()} />);
    expect(screen.getByText('rejection-action-required-title')).toBeInTheDocument();
  });

  it('renders the rejection comment', () => {
    render(<TrRejectionFeedbackBanner {...baseProps()} />);
    expect(screen.getByText('Please revise the pricing section.')).toBeInTheDocument();
  });

  it('renders the approver display name', () => {
    render(<TrRejectionFeedbackBanner {...baseProps()} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders the formatted date and time', () => {
    render(<TrRejectionFeedbackBanner {...baseProps()} />);
    expect(mockFormatUKorAnzDateTime).toHaveBeenCalledWith(
      '2026-04-17T10:30:00Z',
      'GB',
    );
    expect(screen.getByText(/17\/04\/2026, 10:30/)).toBeInTheDocument();
  });

  it('renders the acknowledge button', () => {
    render(<TrRejectionFeedbackBanner {...baseProps()} />);
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument();
  });

  it('calls onAcknowledge when the button is clicked', () => {
    const onAcknowledge = jest.fn();
    render(<TrRejectionFeedbackBanner {...baseProps()} onAcknowledge={onAcknowledge} />);
    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });

  it('disables the acknowledge button when acknowledging is true', () => {
    render(<TrRejectionFeedbackBanner {...baseProps()} acknowledging={true} />);
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeDisabled();
  });

  it('enables the acknowledge button when acknowledging is false', () => {
    render(<TrRejectionFeedbackBanner {...baseProps()} acknowledging={false} />);
    expect(screen.getByRole('button', { name: /acknowledge/i })).not.toBeDisabled();
  });

  it('falls back to em-dash when no rejected approver found', () => {
    render(
      <TrRejectionFeedbackBanner
        {...baseProps()}
        assignedApprovers={[{ approvers: [{ status: { label: 'Pending' } }] }]}
      />,
    );
    // comment and approverName both fall back to '—'
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to em-dash when assignedApprovers is null', () => {
    render(
      <TrRejectionFeedbackBanner {...baseProps()} assignedApprovers={null} />,
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to em-dash when assignedApprovers is empty', () => {
    render(
      <TrRejectionFeedbackBanner {...baseProps()} assignedApprovers={[]} />,
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to em-dash for date when updated_at is null', () => {
    const approverWithoutDate = { ...rejectedApprover, updated_at: null };
    render(
      <TrRejectionFeedbackBanner
        {...baseProps()}
        assignedApprovers={[{ approvers: [approverWithoutDate] }]}
      />,
    );
    // formatUKorAnzDateTime should not be called; '—' shown for date
    expect(mockFormatUKorAnzDateTime).not.toHaveBeenCalled();
    expect(screen.getByText(/—/)).toBeInTheDocument();
  });

  it('renders the rejected-by-label i18n key', () => {
    render(<TrRejectionFeedbackBanner {...baseProps()} />);
    expect(screen.getByText(/rejected-by-label/)).toBeInTheDocument();
  });
});
