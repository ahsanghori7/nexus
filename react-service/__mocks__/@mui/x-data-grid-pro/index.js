// __mocks__/@mui/x-data-grid-pro/index.js
import * as React from 'react';

const DataGridPro = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    className: 'MuiDataGrid-root',
    'data-testid': 'data-grid-pro',
    role: 'grid',
    ...props,
    ref,
  }, props.children);
});

const GridFooterContainer = (props) => {
  return React.createElement('div', {
    className: 'MuiDataGrid-footerContainer',
    'data-testid': 'grid-footer-container',
    ...props,
  }, props.children);
};

const GridPagination = (props) => {
  return React.createElement('div', {
    className: 'MuiDataGrid-pagination',
    'data-testid': 'grid-pagination',
    ...props,
  }, props.children);
};

DataGridPro.displayName = 'DataGridPro';
GridFooterContainer.displayName = 'GridFooterContainer';
GridPagination.displayName = 'GridPagination';

export { DataGridPro, GridFooterContainer, GridPagination };
