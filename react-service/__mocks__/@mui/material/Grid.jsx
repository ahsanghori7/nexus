// __mocks__/@mui/material/Grid.js
import * as React from 'react';

const Grid = React.forwardRef((props, ref) => {
  // Filter out non-DOM attributes
  const { container, item, ...domProps } = props;

  // Add proper class names for grid based on props
  const getClassName = () => {
    const baseClass = 'MuiGrid-root';
    const containerClass = container ? 'MuiGrid-container' : '';
    const itemClass = item ? 'MuiGrid-item' : '';
    const xsClass = props.xs ? `MuiGrid-grid-xs-${props.xs}` : '';
    const smClass = props.sm ? `MuiGrid-grid-sm-${props.sm}` : '';
    const mdClass = props.md ? `MuiGrid-grid-md-${props.md}` : '';
    const lgClass = props.lg ? `MuiGrid-grid-lg-${props.lg}` : '';
    return [
      baseClass,
      containerClass,
      itemClass,
      xsClass,
      smClass,
      mdClass,
      lgClass,
      props.className,
    ]
      .filter(Boolean)
      .join(' ');
  };

  return React.createElement('div', {
    className: getClassName(),
    'data-testid': 'mui-grid',
    ...domProps,
    ref,
  });
});

Grid.displayName = 'Grid';
module.exports = Grid;
