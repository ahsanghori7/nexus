import React from 'react';

const AccordionSummary = ({ children, expandIcon, ...props }) => (
  <div data-testid="mui-accordion-summary" {...props}>
    {children}
    {expandIcon && <div className="expand-icon">{expandIcon}</div>}
  </div>
);

AccordionSummary.displayName = 'AccordionSummary';

export default AccordionSummary;
