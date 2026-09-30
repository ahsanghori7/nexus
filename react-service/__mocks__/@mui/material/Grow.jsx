import React from 'react';

export default function Grow({ children, in: inProp = true, ...props }) {
  return inProp ? <div data-testid="grow" {...props}>{children}</div> : null;
}
