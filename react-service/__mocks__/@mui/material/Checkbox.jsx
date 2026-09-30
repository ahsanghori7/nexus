// __mocks__/@mui/material/Checkbox.js
import * as React from 'react';
module.exports = React.forwardRef((props, ref) => {
  const { onChange, onClick, value, ...otherProps } = props;

  const handleClick = (e) => {
    // Create a proper event object with target value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: value || e.target.value || ''
      }
    };

    if (onChange) onChange(syntheticEvent);
    if (onClick) onClick(syntheticEvent);
  };

  return React.createElement('input', {
    type: 'checkbox',
    onChange: handleClick,
    value: value,
    'data-testid': 'mui-checkbox',
    ref,
    ...otherProps
  });
});
