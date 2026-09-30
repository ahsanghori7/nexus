import React from 'react';

const Slide = React.forwardRef(({ children, direction, in: inProp, mountOnEnter, unmountOnExit, ...props }, ref) => {
  return React.createElement('div', {
    'data-testid': 'mui-slide',
    ref,
    className: `slide-transition ${direction || 'up'} ${inProp ? 'in' : 'out'}`,
    ...props
  }, inProp ? children : null);
});

export default Slide;
