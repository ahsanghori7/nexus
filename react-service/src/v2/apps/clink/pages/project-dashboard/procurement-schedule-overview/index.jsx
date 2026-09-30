import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Container,
  Paper,
  Stack,
  Box,
  Button,
  Typography,
} from '@mui/material';
import SettingsModal from './settings-modal';
import {
  generateRows,
  calculateProcurementProgress,
  countPackagesAtRisk,
} from './procurementService';
import ProcurementScheduleHeader from './ProcurementScheduleHeader';
import ProcurementScheduleFilters from './ProcurementScheduleFilters';
import ProcurementScheduleTable from './ProcurementScheduleTable';
import ProcurementScheduleTableV2 from './ProcurementScheduleTableV2';
import { useContext } from 'v2/hooks/context';
import { useSnackbar } from 'v2/hooks/useSnackbar';
import { MilestoneStatus } from 'v2/constants/milestoneStatus';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

const ProcurementScheduleOverview = ({
  project,
  overview,
  summary,
  dispatch,
  isExporting,
}) => {
  const context = useContext('clink');
  const { actions } = context;
  const [searchTerm, setSearchTerm] = useState('');
  const [milestoneStatus, setMilestoneStatus] = useState('All');
  const [tenderStatus, setTenderStatus] = useState('All');
  const [variance, setVariance] = useState('All');
  const [packagesAtRisk, setPackagesAtRisk] = useState('All');
  const [rowData, setRowData] = useState([]);
  const { showSnackbar } = useSnackbar();
  const { data } = project;
  useEffect(() => {
    setRowData(generateRows(overview));
  }, [overview]);

  const handleCellEditCommit = useCallback(
    (params) => {
      const { id, field, value } = params;

      const updatedRows = rowData.map((row) => {
        if (row.id === id) {
          const safeValue =
            value === '' || value == null ? null : Number(value);

          if (field === 'budget' || field === 'actual') {
            const budget =
              field === 'budget' ? safeValue : Number(row.budget) || 0;
            const actual =
              field === 'actual' ? safeValue : Number(row.actual) || 0;

            return {
              ...row,
              [field]: safeValue,
              variance: (budget ?? 0) - (actual ?? 0),
            };
          }

          return {
            ...row,
            [field]: safeValue,
          };
        }

        return row;
      });
      setRowData(updatedRows);
    },
    [rowData],
  );
  const handleStartMilestone = useCallback(
    async (rowId, milestoneId) => {
      const projectId = data?.id;

      if (!projectId || !milestoneId) {
        showSnackbar(t('missing-project-id-or-milestone-id'), 'error');
        return;
      }

      try {
        const response = await dispatch(
          actions.startMilestone({
            project_id: projectId,
            package_milestone_id: milestoneId,
          }),
        ).unwrap();

        // Update local state on success
        setRowData((prevRows) =>
          prevRows.map((row) => {
            if (row.id === rowId) {
              return {
                ...row,
                status: MilestoneStatus.InProgress,
                currentMilestoneData: {
                  ...row.currentMilestoneData,
                  status: MilestoneStatus.InProgress,
                },
              };
            }
            return row;
          }),
        );

        showSnackbar(response?.data?.message, 'success');
      } catch (error) {
        showSnackbar(error?.message, 'error');
      }
    },
    [data?.id, dispatch, showSnackbar, actions],
  );

  const handleCompleteMilestone = useCallback(
    async (rowId, milestoneId, actualEndDate) => {
      const projectId = data?.id;

      if (!projectId || !milestoneId || !actualEndDate) {
        showSnackbar(t('missing-required-parameters'), 'error');
        return;
      }

      try {
        await dispatch(
          actions.completeMilestone({
            project_id: projectId,
            package_milestone_id: milestoneId,
            actual_end_date: actualEndDate,
          }),
        ).unwrap();

        // Update local state on success
        setRowData((prevRows) =>
          prevRows.map((row) => {
            if (row.id === rowId) {
              return {
                ...row,
                status: MilestoneStatus.Completed,
                currentMilestoneData: {
                  ...row.currentMilestoneData,
                  status: MilestoneStatus.Completed,
                  actual_end_date: actualEndDate,
                },
              };
            }
            return row;
          }),
        );
      } catch (error) {
        showSnackbar(error?.message, 'error');
      }
    },
    [data?.id, dispatch, showSnackbar, actions],
  );

  const handleExport = useCallback(async () => {
    if (!data?.id) {
      showSnackbar('Project ID is required for export', 'error');
      return;
    }

    try {
      const { blob, filename } = await dispatch(
        actions.exportProcurementSchedule({ project_id: data.id, project_name: data.name }),
      ).unwrap();

      const downloadUrl = globalThis.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      showSnackbar(error?.message || 'Export failed', 'error');
    }
  }, [data?.id, dispatch, showSnackbar, actions]);

  const filteredRows = useMemo(() => {
    return rowData.filter((row) => {
      const matchesSearchTerm = searchTerm
        ? Object.values(row).some(
            (value) =>
              typeof value === 'string' &&
              value.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        : true;

      const matchesMilestoneStatus = milestoneStatus
        ? milestoneStatus === 'All' || row.status.trim() === milestoneStatus
        : true;

      let matchesTenderStatus = false;
      const valueHasAwarded =
        row?.subcontractors &&
        row?.subcontractors?.some((company) => company.awarded);

      switch (tenderStatus) {
        case 'tbc':
          matchesTenderStatus = row?.subcontractors?.length === 0;
          break;
        case 'name':
          matchesTenderStatus =
            row?.subcontractors?.length === 1 && !valueHasAwarded;
          break;
        case 'shortlisted':
          matchesTenderStatus =
            row?.subcontractors?.length > 1 && !valueHasAwarded;
          break;
        case 'awarded':
          matchesTenderStatus = row?.subcontractors?.length && valueHasAwarded;
          break;
        case 'All':
        default:
          matchesTenderStatus = true;
          break;
      }

      const matchesVariance = variance
        ? variance === 'All' ||
          (variance === 'positive' && row.variance > 0) ||
          (variance === 'negative' && row.variance < 0) ||
          (variance === 'zero' && row.variance === 0)
        : true;

      let matchesPackagesAtRisk = true;
      if (packagesAtRisk !== 'All') {
        matchesPackagesAtRisk = packagesAtRisk
          ? row.nextMilestoneData?.risk?.trim() === packagesAtRisk &&
            row?.status?.trim() !== 'Completed'
          : true;
      }

      return (
        matchesSearchTerm &&
        matchesMilestoneStatus &&
        matchesTenderStatus &&
        matchesVariance &&
        matchesPackagesAtRisk
      );
    });
  }, [
    rowData,
    searchTerm,
    milestoneStatus,
    tenderStatus,
    variance,
    packagesAtRisk,
  ]);

  const totalPackages = filteredRows.length;
  const procurementProgress = calculateProcurementProgress(filteredRows);
  const packagesAtRiskCount = countPackagesAtRisk(filteredRows);

  return (
    <Container
      id="procurement-schedule-overview"
      data-testid="procurement-schedule-overview"
      maxWidth="100%"
      sx={{ p: '0 !important' }}
    >
      <ProcurementScheduleHeader
        totalPackages={totalPackages}
        procurementProgress={procurementProgress}
        packagesAtRiskCount={packagesAtRiskCount}
        summary={summary}
      />

      <Box sx={{ mb: 4 }} data-testid="procurement-schedule-toolbar">
        <Stack
          direction="row"
          flexWrap="wrap"
          sx={{ gap: 2, alignItems: 'center' }}
        >
          <ProcurementScheduleFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            milestoneStatus={milestoneStatus}
            setMilestoneStatus={setMilestoneStatus}
            tenderStatus={tenderStatus}
            setTenderStatus={setTenderStatus}
            variance={variance}
            setVariance={setVariance}
            packagesAtRisk={packagesAtRisk}
            setPackagesAtRisk={setPackagesAtRisk}
          />
          {data?.version === 1 && (
            <SettingsModal overview={filteredRows} dispatch={dispatch} />
          )}

          {data?.version === 2 && (
            <Button
              variant="outlined"
              color="inherit"
              size="medium"
              onClick={handleExport}
              disabled={isExporting}
              data-testid="procurement-schedule-export-btn"
              sx={{
                borderColor: 'grey.400',
                borderRadius: 1.5,
              }}
            >
              <FileDownloadOutlinedIcon
                sx={{
                  width: 20,
                  height: 20,
                  mr: 1,
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Export to Excel
              </Typography>
            </Button>
          )}
        </Stack>
      </Box>

      <Paper sx={{ width: '100%' }} data-testid="procurement-schedule-table-paper">
        {data?.version === 1 && (
          <ProcurementScheduleTable
            rowData={filteredRows}
            handleCellEditCommit={handleCellEditCommit}
          />
        )}
        {data?.version === 2 && (
          <ProcurementScheduleTableV2
            rowData={filteredRows}
            handleCellEditCommit={handleCellEditCommit}
            handleStartMilestone={handleStartMilestone}
            handleCompleteMilestone={handleCompleteMilestone}
          />
        )}
      </Paper>
    </Container>
  );
};
const mapStateToProps = (state) => ({
  project: state.project,
});

export default connect(mapStateToProps)(ProcurementScheduleOverview);
