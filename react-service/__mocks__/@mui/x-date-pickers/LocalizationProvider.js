// Mock for @mui/x-date-pickers/LocalizationProvider
import React from 'react';

export const LocalizationProvider = React.forwardRef(({ children, dateAdapter, ...props }, ref) => {
  return React.createElement('div', {
    'data-testid': 'localization-provider',
    ref,
    ...props,
  }, children);
});
