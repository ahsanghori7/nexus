// __mocks__/@mui/material/Skeleton.jsx
import * as React from 'react';

const Skeleton = ({ variant, width, height, ...props }) => (
  <div
    data-testid="mui-skeleton"
    data-variant={variant}
    style={{ width, height }}
    {...props}
  >
    Loading...
  </div>
);

Skeleton.displayName = 'Skeleton';

export default Skeleton;
