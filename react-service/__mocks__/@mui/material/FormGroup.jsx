import React from 'react';

const MockFormGroup = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

export default MockFormGroup;
