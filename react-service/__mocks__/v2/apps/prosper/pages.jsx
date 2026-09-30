import React from 'react';

// Mock Prosper layout component
const Prosper = ({ title, children }) => (
  <div data-testid="prosper-layout" data-title={title}>
    {children}
  </div>
);

export default Prosper;
