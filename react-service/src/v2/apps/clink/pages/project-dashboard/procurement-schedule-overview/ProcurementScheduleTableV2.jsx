import React, { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { DataGridPro, GridColumnMenu } from '@mui/x-data-grid-pro';
import { getProcurementTableColumnsV2 } from './ProcurementScheduleTableColumnV2';
import { format } from 'date-fns';
import { MilestoneStatus } from 'v2/constants/milestoneStatus';
import { connect } from 'react-redux';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';

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
      data-testid="procurement-no-rows-v2"
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

const ProcurementScheduleTableV2 = ({
  projectStartDate,
  rowData,
  handleCellEditCommit,
  handleStartMilestone,
  handleCompleteMilestone,
}) => {
  const { checkFeature } = useFeatureFlag();
  const isSubcontractorListApprovalEnabled = checkFeature(
    'SUBCONTRACTOR_LIST_APPROVAL',
  );
  const [anchorEl, setAnchorEl] = useState(null);
  const [openTooltipId, setOpenTooltipId] = useState(null);
  const [milestoneAnchorEl, setMilestoneAnchorEl] = useState(null);
  const [openMilestoneTooltip, setOpenMilestoneTooltip] = useState(null);
  const [completedMilestonesAnchorEl, setCompletedMilestonesAnchorEl] =
    useState(null);
  const [openCompletedMilestonesId, setOpenCompletedMilestonesId] =
    useState(null);

  const formatUKDate = useCallback((date) => {
    if (!date) return '—';

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) return '—';

    return format(dateObj, 'd MMM yyyy');
  }, []);

  const handleTooltipOpen = useCallback((event, id) => {
    setAnchorEl(event.currentTarget);
    setOpenTooltipId(id);
  }, []);

  const handleTooltipClose = useCallback(() => {
    setOpenTooltipId(null);
  }, []);

  const handleMilestoneTooltipOpen = useCallback((event, rowId, type) => {
    setCompletedMilestonesAnchorEl(null);
    setOpenCompletedMilestonesId(null);
    setMilestoneAnchorEl(event.currentTarget);
    setOpenMilestoneTooltip({ rowId, type });
  }, []);

  const handleMilestoneTooltipClose = useCallback(() => {
    setMilestoneAnchorEl(null);
    setOpenMilestoneTooltip(null);
  }, []);
  const handleCompletedMilestonesOpen = useCallback((event, id) => {
    setMilestoneAnchorEl(null);
    setOpenMilestoneTooltip(null);
    setCompletedMilestonesAnchorEl(event.currentTarget);
    setOpenCompletedMilestonesId(id);
  }, []);

  const handleCompletedMilestonesClose = useCallback(() => {
    setCompletedMilestonesAnchorEl(null);
    setOpenCompletedMilestonesId(null);
  }, []);

  const handleStatusChange = useCallback(
    (rowId, milestoneId, newStatus, completionDate = null) => {
      if (newStatus === MilestoneStatus.IN_PROGRESS) {
        handleStartMilestone(rowId, milestoneId);
      } else if (newStatus === MilestoneStatus.COMPLETED && completionDate) {
        handleCompleteMilestone(rowId, milestoneId, completionDate);
      }
    },
    [handleStartMilestone, handleCompleteMilestone],
  );
  const columns = getProcurementTableColumnsV2({
    projectStartDate,
    rowData,
    anchorEl,
    openTooltipId,
    isSubcontractorListApprovalEnabled,
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
    handleCompletedMilestonesOpen,
    handleCompletedMilestonesClose,
    openCompletedMilestonesId,
    completedMilestonesAnchorEl,
    onStatusChange: handleStatusChange,
  });

  return (
    <Box sx={{ minHeight: 200, width: '100%' }} data-testid="procurement-table-v2">
      <DataGridPro
        data-testid="procurement-data-grid-v2"
        autoHeight
        rows={rowData}
        columns={columns}
        getRowId={(row) => String(row.id)}
        pagination
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: 'startOnSite', sort: 'asc' }],
          },
        }}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        onCellEditCommit={handleCellEditCommit}
        startMilestone={handleStartMilestone}
        completeMilestone={handleCompleteMilestone}
        rowHeight={72}
        getRowSpacing={(params) => ({
          top: params.isFirstVisible ? 0 : 2,
          bottom: params.isLastVisible ? 0 : 2,
        })}
        slots={{
          columnMenu: CustomColumnMenu,
          noRowsOverlay: CustomNoRowsOverlay,
        }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(224, 224, 224, 0.8)',
            py: 2,
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(248, 248, 248, 1)',
            borderBottom: '2px solid rgba(224, 224, 224, 1)',
            fontWeight: 600,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            fontSize: '0.875rem',
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '2px solid rgba(224, 224, 224, 1)',
            backgroundColor: 'rgba(248, 248, 248, 0.5)',
          },
          '& .MuiTablePagination-root': {
            marginRight: '30px',
          },
          // Remove cell focus outline for cleaner look
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          // Adjust row separator visibility
          '& .MuiDataGrid-row:last-child .MuiDataGrid-cell': {
            borderBottom: 'none',
          },
        }}
      />
    </Box>
  );
};

const mapStateToProps = (state) => ({
  projectStartDate: state.project.data.start,
});

export default connect(mapStateToProps)(ProcurementScheduleTableV2);
