import * as React from 'react';

const TableChart = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    'data-testid': 'table-chart-icon',
    ...props,
    ref,
  });
});

export default TableChart;
