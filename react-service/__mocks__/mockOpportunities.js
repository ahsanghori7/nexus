import React from 'react';

const MockOpportunities = ({ children, justify, ...props }) => (
  <div
    data-testid="opportunities-component"
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: justify ? 'center' : 'start'
    }}
    {...props}
  >
    {children}
  </div>
);

export default MockOpportunities;
