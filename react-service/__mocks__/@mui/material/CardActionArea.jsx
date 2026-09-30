import React from 'react';

const CardActionArea = ({ children, ...props }) => (
  <div data-testid="mui-card-action-area" {...props}>
    {children}
  </div>
);

CardActionArea.displayName = 'CardActionArea';

export default CardActionArea;
