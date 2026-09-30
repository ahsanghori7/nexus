// Mock for @mui/x-date-pickers/DatePicker
import React from 'react';

const DatePicker = React.forwardRef(({
  children,
  value,
  onChange,
  label,
  format,
  required,
  ...props
}, ref) => {
  return React.createElement('input', {
    'data-testid': 'date-picker',
    'aria-label': label,
    type: 'date',
    value: value ? '2024-01-01' : '',
    onChange: (e) => onChange && onChange({ format: () => e.target.value }),
    required,
    ref,
    ...props,
  });
});

DatePicker.displayName = 'DatePicker';

module.exports = { DatePicker };
