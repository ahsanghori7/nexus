import React from 'react';

const Replay = React.forwardRef((props, ref) =>
  React.createElement('div', { ...props, ref, 'data-testid': 'ReplayIcon' }),
);

export default Replay;
