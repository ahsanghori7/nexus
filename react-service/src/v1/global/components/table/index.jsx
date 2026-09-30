import React from 'react';
// TODO: Remove this table from our system, and use Datagrid instead
import MUIDataTable from 'mui-datatables';
import './table.css';
import RowActions from './Actions';

const defaultColumns = ['Supply chain', 'Actions'];
const defaultData = [
  ['The ground & Frame Team', <RowActions key={0} />],
  ['Insitu Co', <RowActions key={1} />],
  ['Vivant Homes', <RowActions key={2} />],
  ['Amara Property', <RowActions key={3} />],
];
const defaultOptions = {
  filterType: 'checkbox',
};

const Table = ({
  data = defaultData,
  components = {},
  columns = defaultColumns,
  options = defaultOptions,
  className = '',
}) => (
  <MUIDataTable
    data={data}
    columns={columns}
    options={options}
    className={className}
    components={components}
  />
);

export default Table;
