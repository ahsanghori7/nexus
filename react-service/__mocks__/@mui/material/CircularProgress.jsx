// __mocks__/@mui/material/CircularProgress.js
import * as React from 'react';

const CircularProgress = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    role: 'progressbar', // Add progressbar role for accessibility and testing
    className: 'MuiCircularProgress-root',
    'data-testid': 'mui-circular-progress',
    ...props,
    ref,
  });
});

CircularProgress.displayName = 'CircularProgress';
module.exports = CircularProgress;
