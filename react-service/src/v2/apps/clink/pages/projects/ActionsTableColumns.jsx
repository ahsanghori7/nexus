import React from 'react';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import RestoreIcon from '@mui/icons-material/Restore';

export const getActionsTableColumns = ({
  clinkCountryCode,
  type = 'pending',
  setAnchorProject,
  setAnchorTrade,
  setFeedbackRow,
  handleRemove,
  handleRestore,
  formatUKorAnzDateTime,
}) => {
  return [
    {
      field: 'projectName',
      headerName: 'Project name',
      flex: 1,
      minWidth: 160,
      sortable: false,
      filterable: false,
      renderHeader: () => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <span>Project name</span>
          <IconButton
            size="small"
            aria-label="Filter Project name"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAnchorProject((prev) => (prev ? null : e.currentTarget));
            }}
            sx={{ p: 0.5 }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
      renderCell: (params) => (
        <Typography variant="body2">{params.value}</Typography>
      ),
    },
    {
      field: 'packageName',
      headerName: 'Package name',
      flex: 1,
      minWidth: 160,
      sortable: false,
      filterable: false,
      renderHeader: () => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <span>Package name</span>
          <IconButton
            size="small"
            aria-label="Filter Package name"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAnchorTrade((prev) => (prev ? null : e.currentTarget));
            }}
            sx={{ p: 0.5 }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
      renderCell: (params) => (
        <Typography variant="body2">{params.value}</Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 240,
      sortable: false,
      filterable: false,
      renderHeader: () => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <span>Description</span>
        </Stack>
      ),
      renderCell: (params) => {
        const row = params.row;
        return (
          <Typography variant="body2">
            {row.status === 'Rejected' ? (
              <>
                {'Order rejected by '}
                {row.approverName || 'approver'}
                {' with '}
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  color="primary"
                  onClick={() => setFeedbackRow(row)}
                >
                  feedback
                </Link>
              </>
            ) : (
              row.description
            )}
          </Typography>
        );
      },
    },
    {
      field: 'pendingSince',
      headerName: 'Pending since',
      flex: 1,
      minWidth: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value
            ? formatUKorAnzDateTime(params.value, clinkCountryCode).date
            : '—'}
        </Typography>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      width: 220,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ width: '100%' }}
          >
            {row.actionUrl ? (
              <Link
                href={row.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                color="primary"
              >
                {row.actionLabel}
              </Link>
            ) : null}
            {type === 'pending' ? (
              <IconButton
                size="small"
                aria-label="remove"
                title="Remove"
                onClick={() => handleRemove(row)}
                color="error"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            ) : (
              <IconButton
                size="small"
                aria-label="restore"
                title="Restore"
                onClick={() => handleRestore(row)}
                color="error"
              >
                <RestoreIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        );
      },
    },
  ];
};
