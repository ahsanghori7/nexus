// __mocks__/@mui/material/Stack.js
import * as React from 'react';

const Stack = React.forwardRef((props, ref) => {
  return React.createElement('stack', {
    className: 'MuiStack-root',
    'data-testid': 'mui-stack',
    ...props,
    ref,
  });
});

Stack.displayName = 'Stack';
module.exports = Stack;
