import React from 'react';

const PlayArrow = React.forwardRef((props, ref) =>
  React.createElement('div', { ...props, ref, 'data-testid': 'PlayArrowIcon' }, 'play'),
);

export default PlayArrow;
