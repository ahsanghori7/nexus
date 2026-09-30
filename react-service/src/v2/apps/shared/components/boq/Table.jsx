import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TableMui from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';

const Table = ({
  items = [],
  units = [],
  Body = () => null,
  Columns = () => null,
  actions = true,
  sx = {},
}) => {
  const [rows, setRows] = useState(items);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);

  const handleMenuOpen = (event, id) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  const handleAddRow = (position) => {
    const newRow = {
      id: uuidv4(), // TODO: get id of new row from backend after the record is stored
      item_no: '',
      description: '',
      quantity: 0,
      unit_id: 0,
      rate: 0,
      price: 0,
      notes: [],
    };

    if (position === 'top') {
      setRows([newRow, ...rows]);
    } else if (position === 'bottom') {
      setRows([...rows, newRow]);
    }
  };

  const handleDeleteRow = () => {
    const updatedRows = rows.filter((row) => row.id !== selectedRowId);
    setRows(updatedRows);
    handleMenuClose();
  };

  const handleClearRow = () => {
    const updatedRows = rows.map((row) => {
      if (row.id === selectedRowId) {
        return {
          ...row,
          item_no: '',
          description: '',
          quantity: 0,
          unit_id: 0,
          rate: 0,
          price: 0,
          notes: [],
        };
      }
      return row;
    });
    setRows(updatedRows);
    handleMenuClose();
  };

  const handleMoveRow = (direction) => {
    const currentIndex = rows.findIndex((row) => row.id === selectedRowId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < rows.length) {
      const updatedRows = [...rows];
      const temp = updatedRows[currentIndex];
      updatedRows[currentIndex] = updatedRows[newIndex];
      updatedRows[newIndex] = temp;
      setRows(updatedRows);
    }

    handleMenuClose();
  };

  const handleChange = (id, key, value) => {
    const updatedRows = rows.map((row) => {
      if (row.id === id) {
        return { ...row, [key]: value };
      }
      return row;
    });
    setRows(updatedRows);
  };

  return (
    <TableContainer style={{ border: 0, ...sx }}>
      <TableMui>
        <TableHead>
          <TableRow>
            <Columns />
            {actions && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          <Body
            rows={rows}
            units={units}
            handleChange={handleChange}
            handleMenuOpen={handleMenuOpen}
          />
        </TableBody>
      </TableMui>
      {actions && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleMoveRow('up')}>Move Up</MenuItem>
          <MenuItem onClick={() => handleMoveRow('down')}>Move Down</MenuItem>
          <MenuItem onClick={() => handleAddRow('top')}>
            Add 1 Row on Top
          </MenuItem>
          <MenuItem onClick={() => handleAddRow('bottom')}>
            Add 1 Row on Bottom
          </MenuItem>
          <MenuItem onClick={handleClearRow}>Clear Row</MenuItem>
          <MenuItem onClick={handleDeleteRow}>Remove Row</MenuItem>
        </Menu>
      )}
    </TableContainer>
  );
};

export default Table;
