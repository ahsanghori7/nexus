import React from 'react';

const Visibility = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': 'VisibilityIcon',
    className: 'MuiSvgIcon-root visibility-icon'
  }, 'visibility');
});

export default Visibility;
