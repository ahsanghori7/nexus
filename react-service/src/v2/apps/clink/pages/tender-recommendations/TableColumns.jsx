import React from 'react';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { clinkRed } from 'v2/constants/colors';

const statusChip = (status) => {
  const map = {
    Draft: { color: 'default', variant: 'outlined' },
    Pending: { color: 'warning', variant: 'outlined' },
    Approved: { color: 'success', variant: 'outlined' },
    Rejected: { color: 'error', variant: 'outlined' },
    Cancelled: {
      color: 'default',
      variant: 'outlined',
      sx: {
        bgcolor: 'grey.300',
        color: 'grey.800',
      },
    },
  };
  const props = map[status] || { color: 'default' };
  return (
    <Chip
      label={status}
      size="small"
      variant={props.variant}
      color={props.color}
      sx={{
        fontWeight: 'bold',
        ...(props.sx || {}),
      }}
    />
  );
};

const ApproversCell = ({ names = [] }) => {
  const full = (names || []).join(', ');
  return (
    <Tooltip title={full || '-'} placement="top" disableHoverListener={!full}>
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          maxWidth: 300,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          verticalAlign: 'bottom',
        }}
      >
        {full || '-'}
      </Box>
    </Tooltip>
  );
};

const getTableColumns = ({ clinkAccount, formatUKorAnzDateTime, onRejectionInfoClick }) => {
  return [
    {
      field: 'package_name',
      headerName: 'Package Name',
      flex: 1,
      minWidth: 180,
      sortable: false,
      filterable: false,
    },
    {
      field: 'subcontractor',
      headerName: 'Subcontractor Name',
      flex: 1,
      minWidth: 200,
      sortable: false,
      filterable: false,
      valueGetter: (value) => value?.name || '-',
    },
    {
      field: 'submitted_by',
      headerName: 'Submitted By',
      flex: 1,
      minWidth: 160,
      sortable: false,
      filterable: false,
      valueGetter: (value) => value?.display_name || '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (params.value === 'Rejected') {
          const isOwner =
            String(params.row.submitted_by?.id) ===
            String(clinkAccount?.user?.id);
          return (
            <Box display="flex" alignItems="center" gap="6px">
              {statusChip(params.value)}
              {isOwner && (
                <IconButton
                  size="small"
                  sx={{ padding: '2px', color: clinkRed }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRejectionInfoClick?.(e, params.row);
                  }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          );
        }
        return statusChip(params.value);
      },
    },
    {
      field: 'assigned_approvers',
      headerName: 'Approver(s)',
      flex: 1,
      minWidth: 220,
      sortable: false,
      filterable: false,
      valueGetter: (value) => {
        if (!Array.isArray(value)) return [];
        return value
          .filter((appr) => appr?.user) // Only include approvers with user data
          .map((appr) =>
            `${appr?.user?.firstname} ${appr?.user?.lastname}`.trim(),
          );
      },
      renderCell: (params) => <ApproversCell names={params.value} />,
    },
    {
      field: 'approved_by',
      headerName: 'Approved By',
      flex: 1,
      minWidth: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const list = Array.isArray(params?.row?.assigned_approvers)
          ? params.row.assigned_approvers
              .filter(
                (appr) => appr?.status?.label === 'Approved' && appr?.user,
              ) // Filter out nulls
              .map((appr) =>
                `${appr?.user?.firstname} ${appr?.user?.lastname}`.trim(),
              )
          : [];
        return <ApproversCell names={list} />;
      },
    },
    {
      field: 'last_updated',
      headerName: 'Last Updated',
      width: 180,
      sortable: true,
      filterable: false,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value
            ? `${formatUKorAnzDateTime(params.value, clinkAccount.country?.code).date}, ${formatUKorAnzDateTime(params.value, clinkAccount.country?.code).time}`
            : '—'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      width: 120,
      getActions: (params) => {
        const { status } = params?.row || {};
        const submittedById = params?.row.submitted_by?.id || null;
        let items = [];
        switch (status) {
          case 'Draft':
            items = [
              submittedById &&
                clinkAccount &&
                submittedById === clinkAccount?.user?.id && {
                  key: 'edit',
                  label: 'Edit',
                },
              submittedById &&
                clinkAccount &&
                submittedById === clinkAccount?.user?.id && {
                  key: 'request-approval',
                  label: 'Request Approval',
                },
              {
                key: 'view-logs',
                label: 'View Logs',
              },
              submittedById === clinkAccount?.user?.id && {
                key: 'cancel-tr',
                label: 'Cancel Tender Recommendation',
              },
            ].filter(Boolean);
            break;
          case 'Pending':
            items = [
              {
                key: 'view-report',
                label: 'View Report',
              },
              submittedById === clinkAccount?.user?.id && {
                key: 'withdraw',
                label: 'Withdraw',
              },
              {
                key: 'view-logs',
                label: 'View Logs',
              },
              submittedById === clinkAccount?.user?.id && {
                key: 'cancel-tr',
                label: 'Cancel Tender Recommendation',
              },
            ].filter(Boolean);
            break;
          case 'Approved':
            items = [
              {
                key: 'view-report',
                label: 'View Report',
              },
              submittedById === clinkAccount?.user?.id &&
                params?.row?.can_issue_order && {
                  key: 'issue-order',
                  label: 'Issue Order',
                },
              {
                key: 'view-logs',
                label: 'View Logs',
              },
              submittedById === clinkAccount?.user?.id && {
                key: 'cancel-tr',
                label: 'Cancel Tender Recommendation',
              },
            ].filter(Boolean);
            break;
          case 'Rejected':
            items = [
              {
                key: 'view-report',
                label: 'View Report',
              },
              submittedById === clinkAccount?.user?.id && {
                key: 'edit',
                label: 'Edit',
              },
              {
                key: 'view-logs',
                label: 'View Logs',
              },
              submittedById === clinkAccount?.user?.id && {
                key: 'cancel-tr',
                label: 'Cancel Tender Recommendation',
              },
            ].filter(Boolean);
            break;
          case 'Cancelled':
            items = [
              {
                key: 'view-logs',
                label: 'View Logs',
              },
            ].filter(Boolean);
            break;
          default:
            items = [];
        }
        return items;
      },
    },
  ];
};

export default getTableColumns;
