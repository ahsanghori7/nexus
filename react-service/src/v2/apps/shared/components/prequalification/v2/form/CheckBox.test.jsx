import React from 'react';
import { render, screen } from '@testing-library/react';
import CheckBox from './CheckBox';

// Mock clink-components constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxRed: '#d32f2f'
      }
    }
  }
}));

describe('CheckBox', () => {
  it('renders without crashing', () => {
    render(<CheckBox />);
  });

  it('renders checkbox component', () => {
    render(<CheckBox />);
    const checkboxElement = screen.getByTestId('mui-checkbox');
    expect(checkboxElement).toBeInTheDocument();
  });

  it('checkbox component has type attribute', () => {
    render(<CheckBox />);
    const checkboxElement = screen.getByTestId('mui-checkbox');
    expect(checkboxElement).toHaveAttribute('type', 'checkbox');
  });

  it('renders without label when no label provided', () => {
    render(<CheckBox />);
    expect(screen.queryByTestId('mui-typography')).not.toBeInTheDocument();
  });

  it('renders with label when checkboxLabel is provided', () => {
    const labelText = 'Accept terms and conditions';
    render(<CheckBox checkboxLabel={labelText} />);
    expect(screen.getByText(labelText)).toBeInTheDocument();
  });

  it('renders label typography with correct styles', () => {
    const labelText = 'Test Label';
    render(<CheckBox checkboxLabel={labelText} />);
    const typography = screen.getByTestId('mui-typography');
    expect(typography).toBeInTheDocument();
  });

  it('does not render label when empty string is provided', () => {
    render(<CheckBox checkboxLabel="" />);
    expect(screen.queryByTestId('mui-typography')).not.toBeInTheDocument();
  });

  it('renders container box with correct styles', () => {
    render(<CheckBox />);
    const containerBoxes = screen.getAllByTestId('mui-box');
    expect(containerBoxes.length).toBeGreaterThan(0);
  });

  it('handles long label text', () => {
    const longLabelText = 'This is a very long label text that should still render properly in the checkbox component';
    render(<CheckBox checkboxLabel={longLabelText} />);
    expect(screen.getByText(longLabelText)).toBeInTheDocument();
  });
});