import React from 'react';

// Mock for @mui/material/styles
const styled = (Component) => {
  // Return a function that creates a styled component
  return (styles) => {
    // Return the actual component function
    return React.forwardRef((props, ref) => {
      const { className, ...rest } = props;

      // For input elements specifically, since we're using it for VisuallyHiddenInput
      if (typeof Component === 'string' && Component === 'input') {
        return <input ref={ref} className={className} data-testid="visually-hidden-input" {...rest} />;
      }

      // For string components (HTML elements)
      if (typeof Component === 'string') {
        return React.createElement(Component, { ref, className, ...rest });
      }

      // For React components like Box
      return <Component ref={ref} className={className} data-testid="mui-styled-component" {...rest} />;
    });
  };
};

// Other exports from @mui/material/styles can be added here if needed
const createTheme = () => ({});
const ThemeProvider = ({ children }) => children;
const useTheme = () => ({
  palette: { mode: 'light' },
  breakpoints: {
    down: jest.fn(() => '(max-width: 959.95px)'),
    up: jest.fn(() => '(min-width: 960px)'),
    between: jest.fn(() => '(min-width: 600px) and (max-width: 959.95px)'),
  }
});

module.exports = {
  styled,
  createTheme,
  ThemeProvider,
  useTheme,
  // Add any other exports you might need
};
