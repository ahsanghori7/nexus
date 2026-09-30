import React from 'react';

const Accordion = ({ children, ...props }) => (
  <div data-testid="mui-accordion" {...props}>
    {children}
  </div>
);

Accordion.displayName = 'Accordion';

export default Accordion;
