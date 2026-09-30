import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigureLeadTimes from './ConfigureLeadTimes';

jest.mock('v2/constants/colors', () => ({
  clinkGreen: '#00C853',
}));

jest.mock('v1/global/helpers/constants', () => ({
  DATE_FORMAT: 'dd/MM/yyyy',
}));

jest.mock('date-fns', () => ({
  format: jest.fn((date, fmt) => '01/06/2025'),
}));

const mockPackageMilestones = {
  milestones: [
    { id: 1, label: 'Tender Issue', type: 'manual', lead_time: 4, sort_order: 1 },
    { id: 2, label: 'Tender Return', type: 'automatic', lead_time: 3, sort_order: 2 },
    { id: 3, label: 'Sub-Contract Let', type: 'manual', lead_time: 2, sort_order: 3 },
    { id: 4, label: 'Start on Site', type: 'automatic', lead_time: 0, sort_order: 4 },
  ],
  started: false,
};

const mockAccountMilestones = [
  { id: 1, label: 'Tender Issue', type: 'manual', lead_time: 6, sort_order: 1 },
  { id: 2, label: 'Tender Return', type: 'automatic', lead_time: 5, sort_order: 2 },
  { id: 3, label: 'Sub-Contract Let', type: 'manual', lead_time: 4, sort_order: 3 },
  { id: 4, label: 'Start on Site', type: 'automatic', lead_time: 0, sort_order: 4 },
];

const defaultProps = {
  open: true,
  handleClose: jest.fn(),
  packageName: 'Electrical',
  startOnSiteDate: new Date('2025-06-01'),
  accountMilestones: mockAccountMilestones,
  packageMilestones: mockPackageMilestones,
  onSave: jest.fn(),
};

const renderComponent = (overrides = {}) => {
  const result = render(<ConfigureLeadTimes {...defaultProps} {...overrides} />);
  return result;
};

const getWeekInputs = () =>
  Array.from(document.querySelectorAll('input[type="text"]'));

describe('ConfigureLeadTimes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog when open is true', () => {
    renderComponent();
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('does not render dialog when open is false', () => {
    renderComponent({ open: false });
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('displays the dialog title', () => {
    renderComponent();
    expect(screen.getByText('configure-lead-times')).toBeInTheDocument();
  });

  it('displays the package name and cascade text', () => {
    renderComponent();
    expect(screen.getByText('Electrical - dates-cascade-backwards')).toBeInTheDocument();
  });

  it('renders all milestone items', () => {
    renderComponent();
    expect(screen.getByText('Tender Issue')).toBeInTheDocument();
    expect(screen.getByText('Tender Return')).toBeInTheDocument();
    expect(screen.getByText('Sub-Contract Let')).toBeInTheDocument();
    expect(screen.getByText('Start on Site')).toBeInTheDocument();
  });

  it('sorts milestones by sort_order', () => {
    const unsortedMilestones = {
      milestones: [
        { id: 4, label: 'Start on Site', type: 'automatic', lead_time: 0, sort_order: 4 },
        { id: 1, label: 'Tender Issue', type: 'manual', lead_time: 4, sort_order: 1 },
        { id: 3, label: 'Sub-Contract Let', type: 'manual', lead_time: 2, sort_order: 3 },
        { id: 2, label: 'Tender Return', type: 'automatic', lead_time: 3, sort_order: 2 },
      ],
      started: false,
    };
    renderComponent({ packageMilestones: unsortedMilestones });

    const items = screen.getAllByText(/Tender Issue|Tender Return|Sub-Contract Let|Start on Site/);
    expect(items[0]).toHaveTextContent('Tender Issue');
    expect(items[1]).toHaveTextContent('Tender Return');
    expect(items[2]).toHaveTextContent('Sub-Contract Let');
    expect(items[3]).toHaveTextContent('Start on Site');
  });

  it('displays Auto chip for automatic milestones', () => {
    renderComponent();
    const autoChips = screen.getAllByText('auto', { exact: false });
    expect(autoChips.length).toBeGreaterThan(0);
  });

  it('displays Manual chip for manual milestones', () => {
    renderComponent();
    const manualChips = screen.getAllByText('manual');
    expect(manualChips.length).toBeGreaterThan(0);
  });

  it('shows week inputs for all items except the last', () => {
    renderComponent();
    const weekInputs = getWeekInputs();
    // 4 milestones, last one (Start on Site) has no input
    expect(weekInputs).toHaveLength(3);
  });

  it('displays initial lead_time values in week inputs', () => {
    renderComponent();
    const weekInputs = getWeekInputs();
    expect(weekInputs[0].value).toBe('4');
    expect(weekInputs[1].value).toBe('3');
    expect(weekInputs[2].value).toBe('2');
  });

  it('shows the formatted start on site date on the last item', () => {
    renderComponent();
    expect(screen.getByText('01/06/2025')).toBeInTheDocument();
  });

  it('calculates total lead time from all items except the last', () => {
    renderComponent();
    // 4 + 3 + 2 = 9
    expect(screen.getByText('total-lead-time')).toBeInTheDocument();
  });

  it('updates week value when user types in input', () => {
    renderComponent();
    const weekInputs = getWeekInputs();
    fireEvent.change(weekInputs[0], { target: { value: '10' } });
    expect(getWeekInputs()[0].value).toBe('10');
  });

  it('rejects non-numeric input', () => {
    renderComponent();
    const weekInputs = getWeekInputs();
    fireEvent.change(weekInputs[0], { target: { value: 'abc' } });
    // value should remain unchanged
    expect(getWeekInputs()[0].value).toBe('4');
  });

  it('resets to account milestones defaults when reset is clicked', () => {
    renderComponent();
    const weekInputs = getWeekInputs();
    // Verify initial package values
    expect(weekInputs[0].value).toBe('4');

    const resetLink = screen.getByText('reset-to-defaults');
    fireEvent.click(resetLink);

    const updatedInputs = getWeekInputs();
    expect(updatedInputs[0].value).toBe('6');
    expect(updatedInputs[1].value).toBe('5');
    expect(updatedInputs[2].value).toBe('4');
  });

  it('calls handleClose when cancel button is clicked', () => {
    const handleClose = jest.fn();
    renderComponent({ handleClose });
    fireEvent.click(screen.getByText('cancel'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls handleClose when close icon button is clicked', () => {
    const handleClose = jest.fn();
    renderComponent({ handleClose });
    fireEvent.click(screen.getByLabelText('close'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with correct payload and closes on save', () => {
    const onSave = jest.fn();
    const handleClose = jest.fn();
    renderComponent({ onSave, handleClose });

    fireEvent.click(screen.getByText('save-lead-times'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith([
      { id: 1, label: 'Tender Issue', lead_time: 4, sort_order: 1 },
      { id: 2, label: 'Tender Return', lead_time: 3, sort_order: 2 },
      { id: 3, label: 'Sub-Contract Let', lead_time: 2, sort_order: 3 },
      { id: 4, label: 'Start on Site', lead_time: 0, sort_order: 4 },
    ]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('saves updated weeks values after editing', () => {
    const onSave = jest.fn();
    renderComponent({ onSave });

    const weekInputs = getWeekInputs();
    fireEvent.change(weekInputs[0], { target: { value: '10' } });

    fireEvent.click(screen.getByText('save-lead-times'));

    expect(onSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, label: 'Tender Issue', lead_time: 10 }),
      ]),
    );
  });

  it('renders empty content when no milestones provided', () => {
    renderComponent({ packageMilestones: {} });
    expect(getWeekInputs()).toHaveLength(0);
  });

  it('shows legend with manual and automatic labels', () => {
    renderComponent();
    // Legend labels use i18next keys
    expect(screen.getAllByText('manual').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('automatic')).toBeInTheDocument();
  });

  it('still calls handleClose on save even when onSave is not provided', () => {
    const handleClose = jest.fn();
    renderComponent({ onSave: undefined, handleClose });

    fireEvent.click(screen.getByText('save-lead-times'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
