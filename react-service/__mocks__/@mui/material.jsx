import React from 'react';

// Mock Material-UI components
export const Box = ({ children, ...props }) => (
  <div data-testid="mui-box" {...props}>
    {children}
  </div>
);

export const Button = ({ children, ...props }) => (
  <button data-testid="mui-button" {...props}>
    {children}
  </button>
);

export const Typography = ({ children, ...props }) => (
  <div data-testid="mui-typography" {...props}>
    {children}
  </div>
);

export const TextField = ({ ...props }) => (
  <input data-testid="mui-textfield" {...props} />
);

export const TableCell = ({ children, ...props }) => (
  <td data-testid="mui-tablecell" {...props}>
    {children}
  </td>
);

export const TableRow = ({ children, ...props }) => (
  <tr data-testid="mui-tablerow" {...props}>
    {children}
  </tr>
);

export const IconButton = ({ children, onClick, ...props }) => (
  <button data-testid="mui-iconbutton" onClick={onClick} {...props}>
    {children}
  </button>
);

export default {
  Box,
  Button,
  Typography,
  TextField,
  TableCell,
  TableRow,
  IconButton,
};
