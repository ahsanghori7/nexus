import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock LocalizationProvider to simply render children
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <div>{children}</div>,
}));

// Mock DatePicker to expose props and render the provided start adornment
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: (props) => {
    const startAdornment =
      props.slotProps?.textField?.InputProps?.startAdornment;

    return (
      <div data-testid="mock-datepicker" data-open={String(!!props.open)}>
        <div data-testid="mock-value">{String(props.value)}</div>
        <div data-testid="mock-start-adornment">{startAdornment}</div>
      </div>
    );
  },
}));

import CompletionDate from './CompletionDate';

describe('CompletionDate', () => {
  test('renders DatePicker and opens on click via start adornment', () => {
    render(<CompletionDate />);

    const dp = screen.getByTestId('mock-datepicker');
    expect(dp).toBeInTheDocument();

    // initially closed
    expect(dp.getAttribute('data-open')).toBe('false');

    // click the calendar icon in start adornment
    const start = screen.getByTestId('mock-start-adornment');
    expect(start).toBeInTheDocument();

    const button = start.querySelector('button');
    expect(button).toBeTruthy();

    button.click();

    // now it should be open
    expect(dp.getAttribute('data-open')).toBe('true');
  });
});
