import React from 'react';

const AccordionDetails = ({ children, ...props }) => (
  <div data-testid="mui-accordion-details" {...props}>
    {children}
  </div>
);

AccordionDetails.displayName = 'AccordionDetails';

export default AccordionDetails;
