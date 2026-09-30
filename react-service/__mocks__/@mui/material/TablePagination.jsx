// Mock for @mui/material/TablePagination
export const tablePaginationClasses = {
  root: 'MuiTablePagination-root',
  toolbar: 'MuiTablePagination-toolbar',
  spacer: 'MuiTablePagination-spacer',
  selectLabel: 'MuiTablePagination-selectLabel',
  selectRoot: 'MuiTablePagination-selectRoot',
  select: 'MuiTablePagination-select',
  selectIcon: 'MuiTablePagination-selectIcon',
  input: 'MuiTablePagination-input',
  menuItem: 'MuiTablePagination-menuItem',
  displayedRows: 'MuiTablePagination-displayedRows',
  actions: 'MuiTablePagination-actions'
};

const TablePagination = ({ children, ...props }) => (
  <div data-testid="table-pagination" {...props}>
    {children}
  </div>
);

export default TablePagination;
