import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Grid2 from '@mui/material/Grid2';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { Link as ReactLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import CheckCircle from '@mui/icons-material/CheckCircle';
import CalendarToday from '@mui/icons-material/CalendarToday';
import AccessTime from '@mui/icons-material/AccessTime';
import { differenceInDays } from 'date-fns/fp';
import { numToPrice } from 'v1/quotes-tender/helpers/price';
import StartOnSite from './StartOnSite';
import CellPopupInfo from './CellPopupInfo';

const MilestoneCell = ({
  milestoneData,
  rowId,
  type,
  formatUKDate,
  handleMilestoneTooltipOpen,
  openMilestoneTooltip,
  milestoneAnchorEl,
  handleMilestoneTooltipClose,
}) => {
  if (!milestoneData || !milestoneData.name || !milestoneData.dueDate) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: 'center', width: '100%' }}
      >
        —
      </Typography>
    );
  }

  const milestoneChipColor = {
    Completed: 'default',
    Overdue: 'error',
    Approaching: 'warning',
    'On Track': 'success',
  };

  return (
    <Box
      data-testid={`milestone-cell-${type}-${rowId}`}
      sx={{ cursor: 'pointer', py: 0.5, width: '100%' }}
      onClick={(e) => handleMilestoneTooltipOpen(e, rowId, type)}
    >
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, lineHeight: 1.2, mb: 0.5 }}
      >
        {milestoneData.name}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 0.5,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ lineHeight: 1 }}
        >
          due {formatUKDate(milestoneData.dueDate)}
        </Typography>
        {milestoneData?.risk && (
          <Chip
            label={milestoneData.risk}
            size="small"
            color={milestoneChipColor[milestoneData.risk] || 'default'}
            sx={(theme) => ({
              height: 16,
              fontSize: theme.typography.smallCaption.fontSize,
              '& .MuiChip-label': { px: 0.5, py: 0 },
            })}
          />
        )}
      </Box>

      <CellPopupInfo
        open={
          openMilestoneTooltip?.rowId === rowId &&
          openMilestoneTooltip?.type === type
        }
        anchorEl={milestoneAnchorEl}
        onClose={handleMilestoneTooltipClose}
        title={milestoneData.name}
        placement="top"
        modifiers={[
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 8,
            },
          },
        ]}
        paperSx={{
          p: 2.5,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          maxWidth: 300,
          minWidth: 260,
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1.5,
          }}
        >
          <CalendarToday
            sx={{
              color: 'text.secondary',
            }}
            fontSize="small"
          />
          <Typography variant="body2">
            {formatUKDate(milestoneData.dueDate)}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1.5,
          }}
        >
          <AccessTime
            sx={{
              color: 'text.secondary',
            }}
            fontSize="small"
          />
          <Typography variant="body2">
            {
              // eslint-disable-next-line no-nested-ternary
              differenceInDays(new Date())(milestoneData.dueDate) < 0
                ? `${Math.abs(
                    differenceInDays(new Date())(milestoneData.dueDate),
                  )} days overdue`
                : differenceInDays(new Date())(milestoneData.dueDate) === 0
                  ? 'Due today'
                  : `${differenceInDays(new Date())(
                      milestoneData.dueDate,
                    )} days remaining`
            }
          </Typography>
        </Box>
      </CellPopupInfo>
    </Box>
  );
};

const LoadingCell = () => (
  <Skeleton variant="text" sx={{ fontSize: '1rem', width: '100%' }} />
);
const paramCheck = (param) => !param && typeof param === 'boolean';

const CompanyDisplay = ({
  company,
  sx = {},
  justifyContent = 'flex-start',
}) => {
  const content = (
    <Grid2
      container
      spacing={1}
      flexWrap="nowrap"
      alignItems="center"
      justifyContent={justifyContent}
      sx={{ width: '100%' }}
    >
      <Grid2>
        <Typography variant="body2" sx={sx}>
          {company.name}
        </Typography>
      </Grid2>
      <Grid2>
        {company.awarded && (
          <CheckCircle color="success" fontSize="smallCaption" />
        )}
      </Grid2>
    </Grid2>
  );

  if (company.url) {
    return (
      <Link
        component={ReactLink}
        to={company.url}
        sx={{ width: '100%', display: 'block' }}
      >
        {content}
      </Link>
    );
  }
  return content;
};

export const getProcurementTableColumns = ({
  anchorEl,
  openTooltipId,
  milestoneAnchorEl,
  openMilestoneTooltip,
  formatUKDate,
  handleTooltipOpen,
  handleTooltipClose,
  handleMilestoneTooltipOpen,
  handleMilestoneTooltipClose,
}) => {
  const columns = [
    {
      field: 'package',
      headerName: 'Package',
      flex: 1,
      minWidth: 150,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: ['asc', 'desc'],
      renderCell: (params) => {
        if (paramCheck(params.value)) {
          return <LoadingCell />;
        }
        return (
          <Tooltip title={params.value} arrow>
            <Box
              data-testid={`package-cell-${params.row.id}`}
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {params.value}
            </Box>
          </Tooltip>
        );
      },
    },
  ];

  columns.push(
    {
      field: 'subcontractors',
      headerName: 'Subcontractors',
      flex: 1,
      minWidth: 200,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: ['asc', 'desc'],
      sortComparator: (v1, v2) => {
        return v1.length - v2.length;
      },
      renderCell: (params) => {
        if (paramCheck(params.value)) {
          return <LoadingCell />;
        }
        const value = params.value;
        const rowId = params.row.id;

        if (!value.length) {
          return <Chip label="TBC" size="small" color="default" data-testid={`subcontractor-chip-tbc-${rowId}`} />;
        }
        if (value.length === 1) {
          return (
            <Box data-testid={`subcontractor-cell-${rowId}`}>
              {value.map((company) => (
                <CompanyDisplay
                  key={company.name}
                  company={company}
                  justifyContent="space-between"
                />
              ))}
            </Box>
          );
        }

        const handleClick = (e) => {
          if (rowId === anchorEl) {
            handleTooltipClose();
          } else {
            handleTooltipOpen(e, rowId);
          }
        };

        const valueHasAwarded = value.some((company) => company.awarded);
        const label = valueHasAwarded
          ? 'Awarded'
          : `${value.length} shortlisted`;
        const colors = valueHasAwarded ? 'success' : 'info';
        return (
          <Box
            data-testid={`subcontractor-cell-${rowId}`}
            onClick={handleClick}
            sx={{
              cursor: 'pointer',
            }}
          >
            <Chip label={label} size="small" color={colors} data-testid={`subcontractor-chip-${rowId}`} />

            <CellPopupInfo
              open={openTooltipId === rowId}
              anchorEl={anchorEl}
              onClose={handleTooltipClose}
              title="View Profiles"
              paperSx={{ p: 2, boxShadow: 2, maxWidth: 300 }}
            >
              {value.map((company) => (
                <CompanyDisplay
                  key={company.name}
                  company={company}
                  sx={{ py: 0.5 }}
                />
              ))}
            </CellPopupInfo>
          </Box>
        );
      },
    },
    {
      field: 'tenderCoverage',
      headerName: 'Tender Coverage',
      flex: 1,
      minWidth: 150,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: ['asc', 'desc'],
      sortComparator: (v1, v2) => {
        return v1.percentage - v2.percentage;
      },
      renderCell: (params) => {
        if (!params.value) {
          return <LoadingCell />;
        }
        const { percentage, display } = params.value || {};
        let color;
        if (percentage >= 75) color = 'success.light';
        else if (percentage >= 50) color = 'warning.light';
        else color = 'error.light';

        return <Box color={color}>{display}</Box>;
      },
    },
    {
      field: 'currentMilestone',
      headerName: 'Current Milestone',
      flex: 1,
      minWidth: 180,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: ['asc', 'desc'],
      sortComparator: (v1, v2, cellParams1, cellParams2) => {
        const date1 = cellParams1.api.getRow(cellParams1.id)
          .currentMilestoneData?.dueDate;
        const date2 = cellParams2.api.getRow(cellParams2.id)
          .currentMilestoneData?.dueDate;
        if (!date1) return -1;
        if (!date2) return 1;
        return new Date(date1) - new Date(date2);
      },
      renderCell: (params) => {
        if (!params.row.currentMilestoneData) {
          return <LoadingCell />;
        }
        return (
          <MilestoneCell
            milestoneData={params.row.currentMilestoneData}
            rowId={params.row.id}
            type="current"
            formatUKDate={formatUKDate}
            handleMilestoneTooltipOpen={handleMilestoneTooltipOpen}
            openMilestoneTooltip={openMilestoneTooltip}
            milestoneAnchorEl={milestoneAnchorEl}
            handleMilestoneTooltipClose={handleMilestoneTooltipClose}
          />
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: ['asc', 'desc'],
      renderCell: (params) => {
        if (!params.value) {
          return <LoadingCell />;
        }
        const value = params.value;
        const chipStyles = {
          'In Progress': 'info',
          Complete: 'success',
          'Not Started': 'default',
        };
        return (
          <Chip
            label={value}
            size="small"
            variant="outlined"
            color={chipStyles[value] || 'default'}
            data-testid={`status-chip-${params.row.id}`}
          />
        );
      },
    },
    {
      field: 'nextMilestone',
      headerName: 'Next Milestone',
      flex: 1,
      minWidth: 180,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: ['asc', 'desc'],
      sortComparator: (v1, v2, cellParams1, cellParams2) => {
        const date1 = cellParams1.api.getRow(cellParams1.id).nextMilestoneData
          ?.dueDate;
        const date2 = cellParams2.api.getRow(cellParams2.id).nextMilestoneData
          ?.dueDate;
        if (!date1) return -1;
        if (!date2) return 1;
        return new Date(date1) - new Date(date2);
      },
      renderCell: (params) => {
        if (paramCheck(params?.row?.nextMilestoneData)) {
          return <LoadingCell />;
        }
        return (
          <MilestoneCell
            milestoneData={params.row.nextMilestoneData}
            rowId={params.row.id}
            type="next"
            formatUKDate={formatUKDate}
            handleMilestoneTooltipOpen={handleMilestoneTooltipOpen}
            openMilestoneTooltip={openMilestoneTooltip}
            milestoneAnchorEl={milestoneAnchorEl}
            handleMilestoneTooltipClose={handleMilestoneTooltipClose}
          />
        );
      },
    },
    {
      field: 'budget',
      headerName: 'Budget £',
      type: 'number',
      flex: 1,
      minWidth: 130,
      headerAlign: 'right',
      align: 'right',
      sortingOrder: ['asc', 'desc'],
      renderCell: (params) => {
        if (paramCheck(params.row.budget)) {
          return <LoadingCell />;
        }
        const value = params.row.budget;
        if (value == null || isNaN(Number(value))) {
          return (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', width: '100%' }}
            >
              —
            </Typography>
          );
        }
        return (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {numToPrice(value)}
          </Typography>
        );
      },
      editable: false,
    },
    {
      field: 'actual',
      headerName: 'Actual £',
      type: 'number',
      flex: 1,
      minWidth: 130,
      headerAlign: 'right',
      align: 'right',
      sortingOrder: ['asc', 'desc'],
      sortComparator: (v1, v2, cellParams1, cellParams2) => {
        const actual1 = Number(cellParams1.api.getRow(cellParams1.id)?.actual);
        const actual2 = Number(cellParams2.api.getRow(cellParams2.id)?.actual);
        return actual1 - actual2;
      },
      renderCell: (params) => {
        if (paramCheck(params.row.actual)) {
          return <LoadingCell />;
        }
        const value = params.row.actual;
        if (value == null || isNaN(Number(value))) {
          return (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', width: '100%' }}
            >
              —
            </Typography>
          );
        }
        return (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {numToPrice(value)}
          </Typography>
        );
      },
      editable: false,
    },
    {
      field: 'variance',
      headerName: 'Variance £',
      flex: 1,
      minWidth: 130,
      headerAlign: 'right',
      align: 'right',
      sortingOrder: ['asc', 'desc'],
      sortComparator: (v1, v2, cellParams1, cellParams2) => {
        const budget1 = cellParams1.api.getRow(cellParams1.id).budget;
        const actual1 = cellParams1.api.getRow(cellParams1.id).actual;
        const variance1 = budget1 - actual1;
        const budget2 = cellParams2.api.getRow(cellParams2.id).budget;
        const actual2 = cellParams2.api.getRow(cellParams2.id).actual;
        const variance2 = budget2 - actual2;
        return variance1 - variance2;
      },
      renderCell: (params) => {
        if (paramCheck(params.row.budget) || paramCheck(params.row.actual)) {
          return <LoadingCell />;
        }
        const budget = params.row.budget;
        const actual = params.row.actual;
        const value = budget - actual;

        let color = 'text.secondary';
        if (value > 0) {
          color = 'success.main';
        } else if (value < 0) {
          color = 'error.main';
        }

        return (
          <Typography
            variant="body2"
            sx={{ color, fontVariantNumeric: 'tabular-nums' }}
          >
            {numToPrice(value)}
          </Typography>
        );
      },
    },
    {
      field: 'orderIssueDate',
      headerName: 'Order Issue Date',
      type: 'date',
      flex: 1,
      minWidth: 150,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: ['asc', 'desc'],
      valueGetter: (params) => (params.value ? new Date(params.value) : null),
      renderCell: (params) => {
        if (paramCheck(params.row.issueOrderUnformatted)) {
          return <LoadingCell />;
        }
        if (params?.row?.orderIssueDate === '—') {
          return (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', width: '100%' }}
            >
              {params.row.orderIssueDate}
            </Typography>
          );
        }
        return params.row.orderIssueDate;
      },
    },
    {
      field: 'startOnSite',
      headerName: 'Start on Site',
      flex: 1,
      minWidth: 175,
      maxWidth: 195,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => {
        if (paramCheck(params.row.startOnSiteUnformatted)) {
          return <LoadingCell />;
        }
        return <StartOnSite params={params} />;
      },
      sortingOrder: ['asc', 'desc'],
      sortComparator: (v1, v2, cellParams1, cellParams2) => {
        const date1 = cellParams1.api.getRow(
          cellParams1.id,
        )?.startOnSiteUnformatted;
        const date2 = cellParams2.api.getRow(
          cellParams2.id,
        )?.startOnSiteUnformatted;
        if (!date1) return -1;
        if (!date2) return 1;
        return new Date(date1) - new Date(date2);
      },
    },
  );

  return columns;
};
