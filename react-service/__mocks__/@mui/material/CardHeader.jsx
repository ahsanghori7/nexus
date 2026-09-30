import React from 'react';

const CardHeader = ({ action, title, subheader, ...props }) => (
  <div data-testid="mui-card-header" title={title} subheader={subheader} {...props}>
    {title}
    {action}
  </div>
);

CardHeader.displayName = 'CardHeader';

export default CardHeader;
