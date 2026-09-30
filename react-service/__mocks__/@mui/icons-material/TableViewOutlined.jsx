import React from 'react';

const TableViewOutlined = React.forwardRef((props, ref) =>
  React.createElement('div', { ...props, ref, 'data-testid': 'TableViewOutlinedIcon' }),
);

export default TableViewOutlined;
