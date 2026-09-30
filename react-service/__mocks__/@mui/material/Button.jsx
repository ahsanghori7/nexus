// __mocks__/@mui/material/Button.js
import * as React from 'react';
const Button = React.forwardRef((props, ref) => {
  const { component, LinkComponent, ...rest } = props;
  // Add the MUI class names based on the variant and color
  const getClassName = () => {
    const baseClass = 'MuiButton-root';
    const variantClass = rest.variant ? `MuiButton-${rest.variant}` : '';
    const colorClass = rest.color
      ? `MuiButton-${rest.variant || 'contained'}${
          rest.color.charAt(0).toUpperCase() + rest.color.slice(1)
        }`
      : '';
    return [baseClass, variantClass, colorClass, rest.className]
      .filter(Boolean)
      .join(' ');
  };

  const { children, ...buttonProps } = rest;

  return React.createElement('button', {
    type: 'button',
    className: getClassName(),
    ...buttonProps,
    ref,
  }, children);
});
Button.displayName = 'Button';
module.exports = Button;
