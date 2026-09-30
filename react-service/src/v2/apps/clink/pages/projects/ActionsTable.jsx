import React, { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import TableContainer from '@mui/material/TableContainer';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { formatUKorAnzDateTime } from 'helpers/date';
import RejectionFeedbackModal from './RejectionFeedbackModal';
import { DataGridPro } from '@mui/x-data-grid-pro';
import { getActionsTableColumns } from './ActionsTableColumns';
import i18next from 'helpers/i18n';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const getName = (row) => {
  if (row.status === 'Approved' || row.status === 'Rejected') {
    return row.approverName;
  }
  if (row.status === 'Pending') {
    return row.requesterName;
  }
  return null;
};

const buildRowDescription = (row) => {
  let description = 'N/A';
  if (row.status === 'Rejected') {
    description = i18next.t('order-rejected-by-with-feedback', {
      approverName: row.approver_user_data.display_name,
    });
  }
  if (row.status === 'Approved') {
    description = i18next.t('order-approved-by', {
      approverName: row.approver_user_data.display_name,
    });
  }
  if (row.status === 'Pending') {
    description = i18next.t('order-requested-by', {
      requesterName: row.requester_user_data.display_name,
    });
  }
  return description;
};

const EmptyState = () => (
  <Box sx={{ py: 4, textAlign: 'center' }}>
    <Typography variant="body1">
      {i18next.t('no-actions-required-text')}
    </Typography>
  </Box>
);

const ActionsTable = ({
  items = [],
  clinkAccount,
  type = 'pending',
  filter = 'all',
  dispatchRemoveOrRestoreDashboardAction,
  fetchDashboardActions,
  selectedProjects,
  setSelectedProjects,
  selectedTrades,
  setSelectedTrades,
  selectedDescNames,
  setSelectedDescNames,
}) => {
  const pendingActionItems = useMemo(() => {
    return (items || []).map((item) => {
      return {
        id: item?.id,
        projectName: item?.project_name || '',
        packageName: item?.package_name || '',
        description: buildRowDescription(item || {}),
        status: item?.status,
        pendingSince: item?.updated_at || null,
        actionUrl: item?.order_url || '',
        actionLabel: 'Review order',
        comment: item?.comment,
        approverName: item?.approver_user_data.display_name || '',
        requesterName: item?.requester_user_data.display_name || '',
      };
    });
  }, [items]);

  const projectOptions = useMemo(
    () =>
      Array.from(
        new Set(pendingActionItems.map((r) => r.projectName).filter(Boolean)),
      ),
    [pendingActionItems],
  );
  const tradeOptions = useMemo(
    () =>
      Array.from(
        new Set(pendingActionItems.map((r) => r.packageName).filter(Boolean)),
      ),
    [pendingActionItems],
  );
  const descNameOptions = useMemo(
    () =>
      Array.from(
        new Set(pendingActionItems.map((r) => getName(r)).filter(Boolean)),
      ),
    [pendingActionItems],
  );

  const [anchorProject, setAnchorProject] = useState(null);
  const [anchorTrade, setAnchorTrade] = useState(null);
  const [anchorDesc, setAnchorDesc] = useState(null);
  const [feedbackRow, setFeedbackRow] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleRemove = useCallback(
    async (row) => {
      try {
        await dispatchRemoveOrRestoreDashboardAction(row.id, true);
        setSnackbarSeverity('success');
        setSnackbarMessage(i18next.t('action-removed-success'));
        fetchDashboardActions(filter);
      } catch (e) {
        setSnackbarSeverity('error');
        setSnackbarMessage(i18next.t('action-removed-error'));
      } finally {
        setSnackbarOpen(true);
      }
    },
    [dispatchRemoveOrRestoreDashboardAction, fetchDashboardActions, filter],
  );

  const handleRestore = useCallback(
    async (row) => {
      try {
        await dispatchRemoveOrRestoreDashboardAction(row.id, false);
        setSnackbarSeverity('success');
        setSnackbarMessage(i18next.t('action-restored-success'));
        fetchDashboardActions(filter);
      } catch (e) {
        setSnackbarSeverity('error');
        setSnackbarMessage(i18next.t('action-restored-error'));
      } finally {
        setSnackbarOpen(true);
      }
    },
    [dispatchRemoveOrRestoreDashboardAction, fetchDashboardActions, filter],
  );

  const toggleAll = (columnType, all) => {
    if (columnType === 'project')
      setSelectedProjects(all ? new Set(projectOptions) : new Set());
    if (columnType === 'trade')
      setSelectedTrades(all ? new Set(tradeOptions) : new Set());
    if (columnType === 'desc')
      setSelectedDescNames(all ? new Set(descNameOptions) : new Set());
  };

  const toggleOne = (columnType, value) => {
    if (columnType === 'project') {
      const next = new Set(selectedProjects);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      setSelectedProjects(next);
    }
    if (columnType === 'trade') {
      const next = new Set(selectedTrades);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      setSelectedTrades(next);
    }
    if (columnType === 'desc') {
      const next = new Set(selectedDescNames);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      setSelectedDescNames(next);
    }
  };

  const filteredRows = useMemo(() => {
    return pendingActionItems.filter((r) => {
      const descName = getName(r);
      const projectMatch =
        selectedProjects?.size === 0
          ? false
          : selectedProjects?.has(r.projectName);
      const tradeMatch =
        selectedTrades?.size === 0 ? false : selectedTrades?.has(r.packageName);
      const descMatch =
        selectedDescNames?.size === 0
          ? false
          : descName === '' || selectedDescNames?.has(descName);
      if (
        selectedProjects?.size === 0 &&
        selectedTrades?.size === 0 &&
        selectedDescNames?.size === 0
      ) {
        return true;
      }
      return projectMatch || tradeMatch || descMatch;
    });
  }, [pendingActionItems, selectedProjects, selectedTrades, selectedDescNames]);

  const columns = useMemo(
    () =>
      getActionsTableColumns({
        clinkCountryCode: clinkAccount.country?.code,
        type,
        setAnchorProject,
        setAnchorTrade,
        setAnchorDesc,
        setFeedbackRow,
        handleRemove,
        handleRestore,
        formatUKorAnzDateTime,
      }),
    [
      clinkAccount.country?.code,
      type,
      setAnchorProject,
      setAnchorTrade,
      setAnchorDesc,
      setFeedbackRow,
      handleRemove,
      handleRestore,
    ],
  );

  if (!pendingActionItems.length) {
    return (
      <TableContainer sx={{ backgroundColor: 'white', borderRadius: 2 }}>
        <EmptyState />
      </TableContainer>
    );
  }

  return (
    <Box>
      <Box sx={{ backgroundColor: 'transparent', flex: 1, minHeight: 0 }}>
        <DataGridPro
          autoHeight
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => String(row.id)}
          pagination
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 5 } },
          }}
          pageSizeOptions={[5, 10, 20]}
          disableRowSelectionOnClick
          disableColumnMenu
          disableColumnReorder
          slots={{
            noRowsOverlay: EmptyState,
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaderTitleContainer': {
              pointerEvents: 'auto',
            },
            '& .MuiDataGrid-columnHeaders .MuiIconButton-root': {
              pointerEvents: 'auto',
            },
          }}
        />
        <Popover
          open={Boolean(anchorProject)}
          anchorEl={anchorProject}
          onClose={() => setAnchorProject(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Box sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button size="small" onClick={() => toggleAll('project', true)}>
                Select all
              </Button>
              <Button size="small" onClick={() => toggleAll('project', false)}>
                Clear
              </Button>
            </Stack>
            <FormGroup>
              {projectOptions.map((opt) => (
                <FormControlLabel
                  key={opt}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedProjects.has(opt)}
                      onChange={() => toggleOne('project', opt)}
                    />
                  }
                  label={opt}
                />
              ))}
            </FormGroup>
          </Box>
        </Popover>
        <Popover
          open={Boolean(anchorTrade)}
          anchorEl={anchorTrade}
          onClose={() => setAnchorTrade(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Box sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button size="small" onClick={() => toggleAll('trade', true)}>
                Select all
              </Button>
              <Button size="small" onClick={() => toggleAll('trade', false)}>
                Clear
              </Button>
            </Stack>
            <FormGroup>
              {tradeOptions.map((opt) => (
                <FormControlLabel
                  key={opt}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedTrades.has(opt)}
                      onChange={() => toggleOne('trade', opt)}
                    />
                  }
                  label={opt}
                />
              ))}
            </FormGroup>
          </Box>
        </Popover>
        <Popover
          open={Boolean(anchorDesc)}
          anchorEl={anchorDesc}
          onClose={() => setAnchorDesc(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Box sx={{ p: 1.5, maxWidth: 360 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button size="small" onClick={() => toggleAll('desc', true)}>
                Select all
              </Button>
              <Button size="small" onClick={() => toggleAll('desc', false)}>
                Clear
              </Button>
            </Stack>
            <FormGroup>
              {descNameOptions.map((opt) => (
                <FormControlLabel
                  key={opt}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedDescNames.has(opt)}
                      onChange={() => toggleOne('desc', opt)}
                    />
                  }
                  label={opt}
                />
              ))}
            </FormGroup>
          </Box>
        </Popover>
      </Box>
      <RejectionFeedbackModal
        open={!!feedbackRow}
        onClose={() => setFeedbackRow(null)}
        status={feedbackRow?.status}
        approverName={feedbackRow?.approverName}
        pendingSince={feedbackRow?.pendingSince}
        comment={feedbackRow?.comment}
        countryCode={clinkAccount?.country?.code}
      />

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
      >
        <MuiAlert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            whiteSpace: 'pre-line',
            '& .MuiAlert-icon': { alignSelf: 'center' },
            '& .MuiAlert-action': { alignSelf: 'center' },
          }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default ActionsTable;
