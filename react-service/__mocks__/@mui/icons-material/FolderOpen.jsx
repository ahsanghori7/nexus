import * as React from 'react';

const FolderOpen = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    'data-testid': 'folder-open-icon',
    ...props,
    ref,
  });
});

export default FolderOpen;
