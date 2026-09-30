// __mocks__/@construction-link/react-components.js
import * as React from 'react';

// Create mock for CONSTANTS
const CONSTANTS = {
  // Add any constants your tests might need here
  DEFAULT_VALUES: {},
  STATUS: {},
  ORDER_STATUS: {},
  PROJECT_STATUS: {},
  // Add other constants as needed
};

// Create mock exports for components
module.exports = {
  CONSTANTS,
  Button: React.forwardRef((props, ref) =>
    React.createElement('Button', { ...props, ref })
  ),
  TextField: React.forwardRef((props, ref) =>
    React.createElement('TextField', { ...props, ref })
  ),
  // Add other components as needed
};
