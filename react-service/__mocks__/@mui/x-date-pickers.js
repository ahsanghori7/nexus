// Mock for @mui/x-date-pickers
import React from 'react';

// Mock for the entire package
const createMockComponent = (name) => {
  return React.forwardRef(({ children, value, onChange, label, ...props }, ref) => {
    return React.createElement('div', {
      'data-testid': name,
      ref,
      ...props,
    }, children);
  });
};

export const MobileDatePicker = createMockComponent('mobile-date-picker');
export const LocalizationProvider = createMockComponent('localization-provider');
export const AdapterMoment = () => null;

// Mock the sub-modules as well
module.exports = {
  MobileDatePicker,
  LocalizationProvider,
  AdapterMoment,
};

// Create separate mock files for sub-modules
const mockExports = {
  MobileDatePicker: createMockComponent('mobile-date-picker'),
  LocalizationProvider: createMockComponent('localization-provider'),
  AdapterMoment: () => null,
};
