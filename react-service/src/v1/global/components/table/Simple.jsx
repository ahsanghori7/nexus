import React from 'react';

const Row = (props) => {
  const { row, headers, updateRow, rowsIndex, rowsTotal } = props;
  const { id } = row;

  if (!id) {
    throw new Error('Table Row missing id property');
  }
  return (
    <tr key={id} className="simple-table-row">
      {Object.keys(headers).map((cell) => {
        const { render } = headers[cell];
        const data = row[cell];
        const value = render ? (
          render(data, row, updateRow, rowsTotal, rowsIndex)
        ) : (
          <span>{data}</span>
        );
        return <td key={cell}>{value}</td>;
      })}
    </tr>
  );
};

const SimpleTable = (props) => {
  const { headers, classes, rowUpdater, data } = props;
  return (
    <table className={`simple-table ${classes}`}>
      <thead>
        <tr>
          {Object.keys(headers).map((h) => {
            const { label } = headers[h];
            return <th key={h}>{label}</th>;
          })}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => {
          const key = `${row.id}-${index}`;
          return (
            <Row
              rowsIndex={index}
              rowsTotal={data.length}
              key={key}
              row={row}
              updateRow={rowUpdater}
              headers={headers}
            />
          );
        })}
        <tr className="buffer">
          <td />
        </tr>
      </tbody>
      <tfoot />
    </table>
  );
};

export default SimpleTable;
