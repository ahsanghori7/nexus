// __mocks__/@mui/material/LinearProgress.js
import * as React from 'react';

const LinearProgress = React.forwardRef((props, ref) => {
  const { value, variant = 'indeterminate', ...rest } = props;

  // Add proper progressbar role and accessibility attributes
  return React.createElement('div', {
    role: 'progressbar',
    'aria-valuenow': value?.toString(),
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    className: `MuiLinearProgress-root MuiLinearProgress-${variant}`,
    'data-testid': 'mui-linear-progress',
    ...rest,
    ref
  });
});

LinearProgress.displayName = 'LinearProgress';
module.exports = LinearProgress;
