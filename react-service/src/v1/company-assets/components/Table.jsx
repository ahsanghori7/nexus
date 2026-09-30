import React from 'react';
import SimpleTable from '../../global/components/table/Simple';

const Table = ({ title, data, assetsHeaders, classContent = '', children }) => (
  <>
    <div className="table-title">
      <span>{title}</span>
    </div>
    {children ? (
      <div className={`company-assets-table ${classContent}`}>{children}</div>
    ) : (
      <SimpleTable
        classes="company-assets-table"
        data={
          data
            ? [...data].sort((itemA, itemB) =>
                itemA.name.toLowerCase().localeCompare(itemB.name.toLowerCase())
              )
            : []
        }
        headers={assetsHeaders}
      />
    )}
  </>
);

export default Table;
