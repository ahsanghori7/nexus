import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApproverTooltip from './approverTooltip';

const baseProps = {
  approvers: [
    { levelNumber: 1, names: 'John Doe' },
    { levelNumber: 2, names: 'Jane Smith' },
    { levelNumber: 3, names: 'Alex Johnson' },
  ],
};

const renderComponent = (props = {}) =>
  render(<ApproverTooltip {...baseProps} {...props} />);

describe('ApproverTooltip', () => {
  it('returns null when approvers is undefined', () => {
    const { container } = render(<ApproverTooltip approvers={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when approvers array is empty', () => {
    const { container } = render(<ApproverTooltip approvers={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the correct number of levels based on the array length', () => {
    renderComponent();

    expect(screen.getByText('Level 1:')).toBeInTheDocument();
    expect(screen.getByText('Level 2:')).toBeInTheDocument();
    expect(screen.getByText('Level 3:')).toBeInTheDocument();
  });

  it('renders the correct approver names for each level', () => {
    renderComponent();

    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Alex Johnson/i)).toBeInTheDocument();
  });


  it('renders each level as block (vertical stacking)', () => {
    renderComponent();

    const typographies = screen.getAllByTestId('mui-typography');

    expect(typographies).toHaveLength(3);

    typographies.forEach((el) => {
      expect(el).toHaveAttribute('display', 'block');
    });
  });
});
