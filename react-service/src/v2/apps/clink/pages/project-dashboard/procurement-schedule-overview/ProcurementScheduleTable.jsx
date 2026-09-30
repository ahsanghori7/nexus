import React, { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { DataGridPro, GridColumnMenu } from '@mui/x-data-grid-pro';
import { getProcurementTableColumns } from './procurement-schedule-table-columns';
import { format } from 'date-fns';

function CustomColumnMenu(props) {
  return (
    <GridColumnMenu
      {...props}
      slots={{
        columnMenuHideItem: null,
        columnMenuFilterItem: null,
        columnMenuColumnsItem: null,
        columnMenuPinningItem: null,
      }}
    />
  );
}

function CustomNoRowsOverlay() {
  return (
    <Box
      data-testid="procurement-no-rows-v1"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <Typography>No Records Found</Typography>
    </Box>
  );
}

const ProcurementScheduleTable = ({ rowData, handleCellEditCommit }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openTooltipId, setOpenTooltipId] = useState(null);
  const [milestoneAnchorEl, setMilestoneAnchorEl] = useState(null);
  const [openMilestoneTooltip, setOpenMilestoneTooltip] = useState(null);

  const formatUKDate = useCallback((date) => {
    return format(date, 'd MMM yyyy');
  }, []);

  const handleTooltipOpen = useCallback((event, id) => {
    setAnchorEl(event.currentTarget);
    setOpenTooltipId(id);
  }, []);

  const handleTooltipClose = useCallback(() => {
    setOpenTooltipId(null);
  }, []);

  const handleMilestoneTooltipOpen = useCallback((event, rowId, type) => {
    setMilestoneAnchorEl(event.currentTarget);
    setOpenMilestoneTooltip({ rowId, type });
  }, []);

  const handleMilestoneTooltipClose = useCallback(() => {
    setMilestoneAnchorEl(null);
    setOpenMilestoneTooltip(null);
  }, []);

  const columns = getProcurementTableColumns({
    rowData,
    anchorEl,
    openTooltipId,
    setAnchorEl,
    setOpenTooltipId,
    milestoneAnchorEl,
    openMilestoneTooltip,
    setMilestoneAnchorEl,
    setOpenMilestoneTooltip,
    formatUKDate,
    handleTooltipOpen,
    handleTooltipClose,
    handleMilestoneTooltipOpen,
    handleMilestoneTooltipClose,
  });

  return (
    <Box sx={{ minHeight: 200, width: '100%' }} data-testid="procurement-table-v1">
      <DataGridPro
        data-testid="procurement-data-grid-v1"
        autoHeight
        rows={rowData}
        columns={columns}
        getRowId={(row) => String(row.id)}
        pagination
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        onCellEditCommit={handleCellEditCommit}
        slots={{
          columnMenu: CustomColumnMenu,
          noRowsOverlay: CustomNoRowsOverlay,
        }}
        sx={{
          '& .MuiTablePagination-root': {
            marginRight: '30px',
          },
        }}
      />
    </Box>
  );
};

export default ProcurementScheduleTable;
