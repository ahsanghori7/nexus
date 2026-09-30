import React from 'react';

const Typography = ({ children, sx, ...props }) => (
  <div data-testid="mui-typography" {...props}>
    {children}
  </div>
);

Typography.displayName = 'Typography';

export default Typography;
