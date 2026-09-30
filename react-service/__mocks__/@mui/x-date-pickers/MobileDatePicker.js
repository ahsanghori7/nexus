// Mock for @mui/x-date-pickers/MobileDatePicker
import React from 'react';

export const MobileDatePicker = React.forwardRef(({ children, value, onChange, label, ...props }, ref) => {
  return React.createElement('div', {
    'data-testid': 'mobile-date-picker',
    ref,
    ...props,
  }, children);
});
