// __mocks__/@mui/material/Breadcrumbs.jsx
import * as React from 'react';

const Breadcrumbs = ({ children, separator, ...props }) => (
  <nav data-testid="mui-breadcrumbs" {...props}>
    {React.Children.map(children, (child, index) => (
      <React.Fragment key={index}>
        {child}
        {index < React.Children.count(children) - 1 && (
          <span data-testid="breadcrumb-separator">{separator}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

Breadcrumbs.displayName = 'Breadcrumbs';

export default Breadcrumbs;
