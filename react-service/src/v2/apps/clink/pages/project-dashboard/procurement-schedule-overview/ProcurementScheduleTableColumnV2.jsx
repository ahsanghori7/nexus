import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { differenceInDays } from 'date-fns/fp';
import { numToPrice } from 'v1/quotes-tender/helpers/price';
import CellPopupInfo from './CellPopupInfo';
import Button from '@mui/material/Button';
import CompletionDate from './CompletionDate';
import { useTranslation } from 'react-i18next';
import { MilestoneStatus } from 'v2/constants/milestoneStatus';
import Divider from '@mui/material/Divider';
import StartOnSite from './StartOnSite';
import {
  clinkGreen,
  clinkGreenDark,
  clinkRed,
  darkCharcoal,
  lightGreenBg,
  mediumGray,
  webOrange,
  whiteSmoke,
} from 'v2/constants/colors';
import { lightGray } from 'v2/constants/colors-prosper';

const MilestoneCell = ({
  projectStartDate,
  milestoneData,
  completedMilestoneData,
  milestoneType,
  rowId,
  type,
  formatUKDate,
  handleMilestoneTooltipOpen,
  openMilestoneTooltip,
  milestoneAnchorEl,
  handleMilestoneTooltipClose,
  status,
  handleCompletedMilestonesOpen,
  handleCompletedMilestonesClose,
  openCompletedMilestonesId,
  completedMilestonesAnchorEl,
  onStatusChange,
}) => {
  const { t } = useTranslation();
  const [milestoneStatus, setMilestoneStatus] = useState(
    status || MilestoneStatus.NOT_STARTED,
  );

  useEffect(() => {
    if (status) {
      setMilestoneStatus(status);
    }
  }, [status]);

  // Helper function to avoid nested ternary
  const getMilestoneDaysText = (dueDate) => {
    const daysDifference = differenceInDays(new Date())(dueDate);

    if (daysDifference < 0) {
      return `${Math.abs(daysDifference)} days overdue`;
    }

    if (daysDifference === 0) {
      return 'Due today';
    }

    return `${daysDifference} days remaining`;
  };

  const handleStartMilestone = (e) => {
    e.stopPropagation();
    handleMilestoneTooltipClose();
    setMilestoneStatus(MilestoneStatus.IN_PROGRESS);
    if (onStatusChange) {
      onStatusChange(rowId, milestoneData?.id, MilestoneStatus.IN_PROGRESS);
    }
  };

  const handleCompletionDateSelect = (selectedDate) => {
    if (onStatusChange && milestoneData?.id && selectedDate) {
      onStatusChange(
        rowId,
        milestoneData.id,
        MilestoneStatus.COMPLETED,
        selectedDate,
      );
      setMilestoneStatus(MilestoneStatus.COMPLETED);
      handleMilestoneTooltipClose();
    }
  };
  if (!milestoneData?.name || !milestoneData?.dueDate) {
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

  const statusChipStyles = {
    'In Progress': 'info',
    Completed: 'success',
    'Not Started': 'default',
  };
  const completedMilestones = completedMilestoneData || [];

  return (
    <Box
      data-testid={`milestone-cell-${type}-${rowId}`}
      sx={{ cursor: 'pointer', width: '100%', py: 0.5 }}
      onClick={(e) => {
        if (type === 'current') {
          handleMilestoneTooltipOpen(e, rowId, type);
        }
      }}
    >
      {type === 'current' && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                lineHeight: 1.2,
                textDecoration: 'underline',
                mb: 0.5,
              }}
            >
              {milestoneData.name}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1, display: 'block', mt: 0.25 }}
            >
              due {formatUKDate(milestoneData.dueDate)}
            </Typography>

            {/* Status and Risk chips in a row */}
            <Box
              sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}
            >
              {milestoneStatus && (
                <Chip
                  label={milestoneStatus}
                  size="small"
                  color={statusChipStyles[milestoneStatus] || 'default'}
                  sx={(theme) => ({
                    height: 18,
                    fontSize: theme.typography.smallCaption.fontSize,
                    '& .MuiChip-label': { px: 0.75, py: 0 },
                  })}
                />
              )}
              {milestoneData?.risk && (
                <Chip
                  label={milestoneData.risk}
                  size="small"
                  color={milestoneChipColor[milestoneData.risk] || 'default'}
                  sx={(theme) => ({
                    height: 18,
                    fontSize: theme.typography.smallCaption.fontSize,
                    '& .MuiChip-label': { px: 0.75, py: 0 },
                  })}
                />
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Next milestone layout without icon */}
      {type === 'next' && (
        <>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              lineHeight: 1.2,
              mb: 0.5,
              textDecoration: 'underline',
            }}
          >
            {milestoneData.name}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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
        </>
      )}

      {type === 'current' && (
        <CellPopupInfo
          open={
            openMilestoneTooltip?.rowId === rowId &&
            openMilestoneTooltip?.type === 'current'
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
              due {formatUKDate(milestoneData?.dueDate)}
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
              {getMilestoneDaysText(milestoneData.dueDate)}
            </Typography>
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('Status')}
            </Typography>
            <Chip
              label={milestoneStatus}
              size="small"
              color={statusChipStyles[milestoneStatus] || 'default'}
              sx={(theme) => ({
                height: 20,
                fontSize: theme.typography.body2.fontSize,
                '& .MuiChip-label': { px: 1, py: 0 },
              })}
            />
          </Box>

          {/* Milestone Status Flow */}
          {milestoneType === 'manual' && (
            <>
              {milestoneStatus === MilestoneStatus.NOT_STARTED && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleStartMilestone}
                    sx={{ textTransform: 'none' }}
                    data-testid="start-milestone-btn"
                  >
                    {t('start-milestone')}
                  </Button>
                </Box>
              )}

              {milestoneStatus === MilestoneStatus.IN_PROGRESS && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    {t('completion-date')}
                  </Typography>
                  <Box
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <CompletionDate
                      onDateSelect={handleCompletionDateSelect}
                      projectStartDate={projectStartDate}
                    />
                  </Box>
                </Box>
              )}
            </>
          )}
        </CellPopupInfo>
      )}
    </Box>
  );
};

const LoadingCell = () => (
  <Skeleton variant="text" sx={{ fontSize: '1rem', width: '100%' }} />
);

const paramCheck = (param) => !param && typeof param === 'boolean';

const statusColors = {
  pending: { bg: webOrange, color: darkCharcoal },
  approved: { bg: clinkGreen, color: darkCharcoal },
  rejected: { bg: clinkRed, color: whiteSmoke },
  draft: { bg: lightGray, color: mediumGray },
};

const SORTING_ORDER = ['asc', 'desc'];

const getVarianceColor = (value, varianceType) => {
  if (varianceType === 'positive' || value > 0) return 'success.main';
  if (varianceType === 'negative' || value < 0) return 'error.main';
  return 'text.secondary';
};

const isCompanyApproved = (company) => {
  if (company?.approved === true) return true;

  const status = company?.status;
  if (!status) return false;

  const statusString =
    typeof status === 'string' ? status : status?.label || status?.value || '';

  return statusString.toLowerCase().includes('approved');
};

const getStatusColor = (status) => {
  if (!status) return statusColors.draft;

  const statusLower = status.toLowerCase();

  if (statusLower.includes('approved') || statusLower.includes('awarded')) {
    return statusColors.approved;
  }

  if (statusLower.includes('rejected') || statusLower.includes('declined')) {
    return statusColors.rejected;
  }

  if (statusLower.includes('pending') || statusLower.includes('awaiting')) {
    return statusColors.pending;
  }

  if (statusLower.includes('draft') || statusLower.includes('added')) {
    return statusColors.draft;
  }

  return statusColors.draft;
};

const CompanyDisplay = ({
  company,
  sx = {},
  justifyContent = 'flex-start',
  showStatus = false,
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
      {showStatus && company.status ? (
        <>
          <Grid2>
            <Tooltip title={company.name} arrow placement="top">
              <Typography
                variant="body2"
                sx={{
                  ...sx,
                  width: '100px',
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {company.url ? (
                  <Link
                    component={ReactLink}
                    to={company.url}
                    sx={{ width: '100%', display: 'block' }}
                  >
                    {company.name}
                  </Link>
                ) : (
                  company.name
                )}
              </Typography>
            </Tooltip>
          </Grid2>
          <Grid2
            display="flex"
            flexDirection="row"
            justifyContent="flex-end"
            width="125px"
          >
            <Chip
              label={company.status}
              size="small"
              sx={{
                ml: 1,
                height: 22,
                fontSize: '0.75rem',
                backgroundColor: getStatusColor(company.status).bg,
                color: getStatusColor(company.status).color,
              }}
            />
          </Grid2>
        </>
      ) : (
        <Grid2>
          <Typography variant="body2" sx={sx}>
            {company.url ? (
              <Link
                component={ReactLink}
                to={company.url}
                sx={{ width: '100%', display: 'block' }}
              >
                {company.name}
              </Link>
            ) : (
              company.name
            )}
          </Typography>
        </Grid2>
      )}
      <Grid2>
        {company.awarded && (
          <CheckCircle
            sx={{
              color: 'success.main',
              width: '32px',
              height: '32px',
            }}
          />
        )}
      </Grid2>
    </Grid2>
  );

  return content;
};

CompanyDisplay.propTypes = {
  company: PropTypes.shape({
    name: PropTypes.string,
    status: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ label: PropTypes.string, value: PropTypes.string }),
    ]),
    awarded: PropTypes.bool,
    url: PropTypes.string,
  }).isRequired,
  sx: PropTypes.object,
  justifyContent: PropTypes.string,
  showStatus: PropTypes.bool,
};

const CompletedMilestonesCell = ({
  completedMilestoneData,
  rowId,
  handleCompletedMilestonesOpen,
  handleCompletedMilestonesClose,
  openCompletedMilestonesId,
  completedMilestonesAnchorEl,
  formatUKDate,
}) => {
  const { t } = useTranslation();
  const completedMilestones = completedMilestoneData || [];

  if (!completedMilestones.length) return null;

  return (
    <>
      {completedMilestones?.length > 0 && (
        <Chip
          icon={
            <CheckCircle
              sx={{
                fontSize: '14px',
                color: `${clinkGreenDark} !important`,
              }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption">
                {completedMilestones.length}
              </Typography>
              <ChevronRightIcon sx={{ fontSize: 14, ml: 0.25 }} />
            </Box>
          }
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleCompletedMilestonesOpen(e, rowId);
          }}
          sx={{
            height: 20,
            fontSize: '12px',
            cursor: 'pointer',
            mt: 0.2,
            backgroundColor: lightGreenBg,
            color: clinkGreenDark,
          }}
        />
      )}

      <CellPopupInfo
        open={openCompletedMilestonesId === rowId}
        anchorEl={completedMilestonesAnchorEl}
        onClose={handleCompletedMilestonesClose}
        title={t('completed-milestones')}
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
        <Box onClick={(e) => e.stopPropagation()}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 2 }}
          >
            {t('completed-milestones-count', {
              count: completedMilestones?.length || 0,
            })}
          </Typography>

          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {completedMilestones?.map((milestone, index) => (
              <React.Fragment key={milestone.id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    mb: index === completedMilestones.length - 1 ? 0 : 1,
                  }}
                >
                  <CheckCircle
                    sx={{
                      color: 'success.main',
                      width: '18px',
                      height: '18px',
                      mt: 0.2,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {milestone.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {t('due')}{' '}
                      {milestone.planned_end_date
                        ? formatUKDate(new Date(milestone.planned_end_date))
                        : '—'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {t('completed')}{' '}
                      {milestone.actual_end_date
                        ? formatUKDate(new Date(milestone.actual_end_date))
                        : '—'}
                    </Typography>
                  </Box>
                </Box>
                {index < completedMilestones.length - 1 && (
                  <Divider sx={{ my: 1 }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </CellPopupInfo>
    </>
  );
};

export const getProcurementTableColumnsV2 = ({
  projectStartDate,
  anchorEl,
  openTooltipId,
  milestoneAnchorEl,
  openMilestoneTooltip,
  formatUKDate,
  handleTooltipOpen,
  handleTooltipClose,
  handleMilestoneTooltipOpen,
  handleMilestoneTooltipClose,
  handleCompletedMilestonesOpen,
  handleCompletedMilestonesClose,
  openCompletedMilestonesId,
  completedMilestonesAnchorEl,
  onStatusChange,
  isSubcontractorListApprovalEnabled,
}) => {
  return [
    {
      field: 'reference_no',
      headerName: 'Ref No.',
      flex: 0.8,
      minWidth: 80,
      maxWidth: 100,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: SORTING_ORDER,
      renderCell: (params) => {
        if (paramCheck(params.value)) {
          return <LoadingCell />;
        }
        const formattedValue = params.value?.toString().includes('.')
          ? params.value
          : `${params.value}`;
        return (
          <Box
            sx={{
              fontWeight: 500,
              color: 'text.primary',
            }}
          >
            {formattedValue || '—'}
          </Box>
        );
      },
    },
    {
      field: 'package',
      headerName: 'Package',
      flex: 1,
      minWidth: 150,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: SORTING_ORDER,
      renderCell: (params) => {
        if (paramCheck(params.value)) {
          return <LoadingCell />;
        }
        return (
          <Tooltip title={params.value} arrow>
            <Box
              data-testid={`package-cell-${params.row?.id}`}
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
    {
      field: 'subcontractors',
      headerName: 'Subcontractors',
      flex: 1,
      minWidth: 200,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: SORTING_ORDER,
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
        if (value.length === 1 && !value[0].awarded) {
          return (
            <Box data-testid={`subcontractor-cell-${rowId}`}>
              {value.map((company) => (
                <CompanyDisplay
                  key={company.name}
                  company={company}
                  justifyContent="space-between"
                  showStatus={isSubcontractorListApprovalEnabled}
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
        const approvedCount = isSubcontractorListApprovalEnabled
          ? value.filter(isCompanyApproved).length
          : 0;

        let label;
        if (valueHasAwarded) {
          label = 'Awarded';
        } else if (approvedCount) {
          label = `${approvedCount} Approved`;
        } else {
          label = `${value.length} Shortlisted`;
        }
        const colors = approvedCount || valueHasAwarded ? 'success' : 'info';
        const showAwardedOnly = valueHasAwarded;
        const popoverTitle = showAwardedOnly ? 'Awarded To' : 'View Profiles';
        const popoverCompanies = showAwardedOnly
          ? value.filter((company) => company.awarded)
          : value;

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
              title={popoverTitle}
              paperSx={{ p: 2, boxShadow: 2, maxWidth: 300 }}
            >
              {popoverCompanies.map((company) => (
                <CompanyDisplay
                  key={company.name}
                  company={company}
                  sx={{ py: 0.5 }}
                  justifyContent="space-between"
                  showStatus={
                    isSubcontractorListApprovalEnabled && !showAwardedOnly
                  }
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
      minWidth: 200,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: SORTING_ORDER,
      renderHeader: () => (
        <Box
          component="span"
          sx={{ display: 'inline-flex', alignItems: 'center' }}
        >
          Tender Coverage
          <Tooltip
            title="Quotes returned ÷ suppliers who received tender documents"
            arrow
          >
            <HelpOutlineIcon
              fontSize="inherit"
              sx={{ ml: 0.5, verticalAlign: 'bottom', cursor: 'pointer' }}
            />
          </Tooltip>
        </Box>
      ),
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
      field: 'completedMilestones',
      headerName: '',
      width: 72,
      sortable: false,
      disableColumnMenu: true,
      align: 'center',
      renderCell: (params) => (
        <CompletedMilestonesCell
          completedMilestoneData={params.row.completeMilestoneData}
          rowId={params.row.id}
          handleCompletedMilestonesOpen={handleCompletedMilestonesOpen}
          handleCompletedMilestonesClose={handleCompletedMilestonesClose}
          openCompletedMilestonesId={openCompletedMilestonesId}
          completedMilestonesAnchorEl={completedMilestonesAnchorEl}
          formatUKDate={formatUKDate}
        />
      ),
    },
    {
      field: 'currentMilestone',
      headerName: 'Current Milestone',
      flex: 1.5,
      minWidth: 220,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: SORTING_ORDER,
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
            milestoneType={params.row.currentMilestoneData?.milestone_type}
            projectStartDate={projectStartDate}
            milestoneData={params.row.currentMilestoneData}
            completedMilestoneData={params.row.completeMilestoneData}
            rowId={params.row.id}
            type="current"
            status={params.row.status}
            formatUKDate={formatUKDate}
            handleMilestoneTooltipOpen={handleMilestoneTooltipOpen}
            openMilestoneTooltip={openMilestoneTooltip}
            milestoneAnchorEl={milestoneAnchorEl}
            handleMilestoneTooltipClose={handleMilestoneTooltipClose}
            onStatusChange={onStatusChange}
          />
        );
      },
    },
    {
      field: 'nextMilestone',
      headerName: 'Next Milestone',
      flex: 1.2,
      minWidth: 180,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: SORTING_ORDER,
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
      sortingOrder: SORTING_ORDER,
      renderCell: (params) => {
        if (paramCheck(params.row.budget)) {
          return <LoadingCell />;
        }
        const value = params.row.budget;
        if (value == null || Number.isNaN(Number(value))) {
          return (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'right', width: '100%' }}
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
      field: 'ordervalue',
      headerName: 'Order Value £',
      type: 'number',
      flex: 1,
      minWidth: 130,
      headerAlign: 'right',
      align: 'right',
      sortingOrder: SORTING_ORDER,
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
        if (value == null || Number.isNaN(Number(value))) {
          return (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'right', width: '100%' }}
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
      sortingOrder: SORTING_ORDER,
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

        // Use variance_type from v2 if available, otherwise determine from value
        let color = 'text.secondary';
        if (params.row.variance_type === 'positive' || value > 0) {
          color = 'success.main';
        } else if (params.row.variance_type === 'negative' || value < 0) {
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
      field: 'variancePercentage',
      headerName: 'Variance %',
      flex: 0.9,
      minWidth: 110,
      headerAlign: 'right',
      align: 'right',
      sortingOrder: SORTING_ORDER,
      sortComparator: (v1, v2, cellParams1, cellParams2) => {
        const budget1 = cellParams1.api.getRow(cellParams1.id).budget;
        const actual1 = cellParams1.api.getRow(cellParams1.id).actual;
        const percentageVariance1 =
          budget1 > 0 ? ((budget1 - actual1) / budget1) * 100 : 0;
        const budget2 = cellParams2.api.getRow(cellParams2.id).budget;
        const actual2 = cellParams2.api.getRow(cellParams2.id).actual;
        const percentageVariance2 =
          budget2 > 0 ? ((budget2 - actual2) / budget2) * 100 : 0;
        return percentageVariance1 - percentageVariance2;
      },
      renderCell: (params) => {
        if (paramCheck(params.row.budget) || paramCheck(params.row.actual)) {
          return <LoadingCell />;
        }

        if (params.row.variance_percent) {
          const percentValue = Number.parseFloat(params.row.variance_percent);
          const color = getVarianceColor(
            percentValue,
            params.row.variance_type,
          );

          return (
            <Typography
              variant="body2"
              sx={{
                color,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 500,
              }}
            >
              {percentValue > 0 ? '+' : ''}
              {params.row.variance_percent}%
            </Typography>
          );
        }

        const budget = params.row.budget;
        const actual = params.row.actual;

        if (!budget || budget === 0) {
          return (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'right', width: '100%' }}
            >
              —
            </Typography>
          );
        }

        const percentageVariance = ((budget - actual) / budget) * 100;
        const color = getVarianceColor(
          percentageVariance,
          params.row.variance_type,
        );

        return (
          <Typography
            variant="body2"
            sx={{ color, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}
          >
            {percentageVariance > 0 ? '+' : ''}
            {percentageVariance.toFixed(1)}%
          </Typography>
        );
      },
    },
    {
      field: 'orderIssueDate',
      headerName: 'Order Issue Date',
      type: 'date',
      flex: 1,
      minWidth: 140,
      headerAlign: 'left',
      align: 'left',
      sortingOrder: SORTING_ORDER,
      editable: false,
      valueGetter: (value) => (value ? new Date(value) : null),
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
              —
            </Typography>
          );
        }
        return (
          <Typography variant="body2">{params.row.orderIssueDate}</Typography>
        );
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
      sortingOrder: SORTING_ORDER,
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
  ];
};
