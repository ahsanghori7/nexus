import React from 'react';

const ListItem = React.forwardRef(
  ({ component: Component = 'li', children, role = 'listitem', ...props }, ref) => {
    if (Component === 'li' || Component === undefined) {
      return (
        <li data-testid="listitem" role={role} ref={ref} {...props}>
          {children}
        </li>
      );
    }

    return (
      <Component data-testid="listitem" ref={ref} {...props}>
        {children}
      </Component>
    );
  }
);

ListItem.displayName = 'ListItem';

export default ListItem;
