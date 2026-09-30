// Mock for v2/apps/shared/styled/Page.styled
import React from 'react';

export const Slide = ({ children, isMobile, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'slide',
    className: `slide-mock ${isMobile ? 'mobile' : ''}`,
    ...props
  }, children);
};

export const StyledButton = React.forwardRef(({ children, ...props }, ref) => {
  return React.createElement('button', {
    'data-testid': 'styled-button',
    ref,
    ...props
  }, children);
});
