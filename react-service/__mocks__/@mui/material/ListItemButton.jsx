import React from 'react';

export default function ListItemButton({ children, onClick, component, to, ...props }) {
  if (component) {
    // When a component is provided, render it with the props
    const Component = component;
    return (
      <Component to={to} {...props}>
        <button role="button" onClick={onClick}>
          {children}
        </button>
      </Component>
    );
  }

  return (
    <button role="button" onClick={onClick} {...props}>
      {children}
    </button>
  );
}
