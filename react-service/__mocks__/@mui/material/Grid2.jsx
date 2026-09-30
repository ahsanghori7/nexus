// __mocks__/@mui/material/Grid2.js
import * as React from 'react';

const Grid2 = React.forwardRef((props, ref) => {
  const { component, ...rest } = props;

  // If a component is provided, render it with Grid2 props
  if (component) {
    return React.createElement(component, {
      className: 'MuiGrid2-root',
      ...rest,
      ref,
    });
  }

  // Default Grid2 behavior
  return React.createElement('div', {
    className: 'MuiGrid2-root',
    'data-testid': 'grid2',
    ...rest,
    ref,
  });
});

Grid2.displayName = 'Grid2';
module.exports = Grid2;
