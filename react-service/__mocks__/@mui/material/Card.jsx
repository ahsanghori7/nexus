import React from 'react';

const Card = ({ children, ...props }) => (
  <div data-testid="mui-card" {...props}>
    {children}
  </div>
);

Card.displayName = 'Card';

export default Card;
