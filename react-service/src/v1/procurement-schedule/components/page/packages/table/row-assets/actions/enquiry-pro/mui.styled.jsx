import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Close from '@mui/icons-material/Close';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';

const tableCellStyles = { py: 0, paddingTop: '4px', paddingBottom: '4px' };

const SubcontractorListTable = ({ children }) => {
  return (
    <TableContainer sx={{ flexBasis: '100%', maxHeight: '190px' }}>
      <Table aria-label="subcontractor table">
        <TableHead>
          <TableRow>
            <TableCell sx={tableCellStyles}>Logo</TableCell>
            <TableCell sx={tableCellStyles}>Name</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
};

const RemovableSubcontractorListItem = ({ sub, handleRemoveSubcontractor }) => {
  return (
    <TableRow key={sub.sub_id}>
      <TableCell sx={tableCellStyles}>
        <Avatar alt={sub.name} src={sub.logo} sx={{ width: 20, height: 20 }} />
      </TableCell>
      <TableCell sx={{ ...tableCellStyles, position: 'relative' }}>
        <Tooltip title={sub.name}>
          <Box
            sx={{
              width: '100%',
              maxWidth: '270px',
              textWrap: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sub.name}
          </Box>
        </Tooltip>
        <Button
          sx={{ position: 'absolute', right: 0, top: '-3px', p: 0 }}
          onClick={() => handleRemoveSubcontractor(sub.sub_id)}
          size="small"
          color="primary"
        >
          <Close fontSize="small" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export { RemovableSubcontractorListItem, SubcontractorListTable };
