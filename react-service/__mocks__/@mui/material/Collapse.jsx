import React from 'react';

const Collapse = ({ children, in: inProp, ...props }) => {
  return inProp ? <div data-testid="mui-collapse" {...props}>{children}</div> : null;
};

export default Collapse;
