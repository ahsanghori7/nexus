import React from 'react';

const CardActions = ({ children, ...props }) => (
  <div data-testid="mui-card-actions" {...props}>
    {children}
  </div>
);

CardActions.displayName = 'CardActions';

export default CardActions;
