import React from 'react';

const VisibilityOff = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': 'VisibilityOffIcon',
    className: 'MuiSvgIcon-root visibility-off-icon'
  }, 'visibility_off');
});

export default VisibilityOff;
