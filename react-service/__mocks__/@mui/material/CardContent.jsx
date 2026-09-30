import React from 'react';

const CardContent = ({ children, ...props }) => (
  <div data-testid="mui-card-content" {...props}>
    {children}
  </div>
);

CardContent.displayName = 'CardContent';

export default CardContent;
