import React from 'react';

const Refresh = React.forwardRef((props, ref) =>
  React.createElement('div', { ...props, ref, 'data-testid': 'RefreshIcon' }, 'refresh'),
);

export default Refresh;
