import React from 'react';

export default function MenuList({ children, ...props }) {
  return <div data-testid="menu-list" role="menu" {...props}>{children}</div>;
}
