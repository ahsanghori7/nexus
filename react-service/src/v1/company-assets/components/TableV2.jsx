import React from 'react';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

const Table = ({ title, data, assetsHeaders, classContent = '', children }) => {
  const tableData = data
    ? [...data].sort((itemA, itemB) =>
        itemA.name.toLowerCase().localeCompare(itemB.name.toLowerCase())
      )
    : [];
  return (
    <>
      <div className="table-title">
        <span>{title}</span>
      </div>
      {children ? (
        <div className={`company-assets-table ${classContent}`}>{children}</div>
      ) : (
        <TableContainer component={Paper} sx={{ p: 3 }}>
          <MuiTable aria-label="simple table">
            <TableHead>
              <TableRow>
                {Object.keys(assetsHeaders).map((h) => {
                  const { label } = assetsHeaders[h];
                  return (
                    <TableCell key={h} component="th" align="left">
                      {label}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {Object.keys(assetsHeaders).map((cell) => {
                    const rowData = row[cell];
                    const value = assetsHeaders[cell]?.render
                      ? assetsHeaders[cell]?.render(rowData, row)
                      : rowData;
                    return (
                      <TableCell align="left" key={cell}>
                        {value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </MuiTable>
        </TableContainer>
      )}
    </>
  );
};

export default Table;
