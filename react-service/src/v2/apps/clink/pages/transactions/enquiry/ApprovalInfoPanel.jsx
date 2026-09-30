import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

const getApproverInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getStatusColor = (status) => {
  if (!status) return 'default';

  const statusLower = status.toLowerCase();

  // Pending Approval: Orange
  if (statusLower === 'pending approval' || statusLower === 'pending' || statusLower.includes('pending')) {
    return 'warning';
  }

  // Approved: Green
  if (statusLower === 'approved') {
    return 'success';
  }

  // Rejected: Red
  if (statusLower === 'rejected') {
    return 'error';
  }

  // Default: Grey
  return 'default';
};

const formatDate = (date) => {
  if (!date || date === '-') return '-';
  return moment(date).format('DD/MM/YYYY HH:mm');
};

const ApprovalInfoPanel = ({ approvalInfo }) => {
  const { t } = useTranslation();

  if (!approvalInfo || (Array.isArray(approvalInfo) && approvalInfo.length === 0)) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'white !important' }}>
              <TableCell>
                <strong>{t('assigned-to')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('approval-requested')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('job-title')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('status')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: 14,
                      bgcolor: 'grey.400',
                      color: 'black',
                      mr: 1.5,
                    }}
                  >
                    {getApproverInitials(approvalInfo.approver_name)}
                  </Avatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {approvalInfo.approver_name || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {approvalInfo.approver_email || ''}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                {formatDate(approvalInfo.requested_on)}
              </TableCell>
              <TableCell>{approvalInfo.approver_title || '-'}</TableCell>
              <TableCell>
                <Chip
                  label={approvalInfo.status || '-'}
                  size="small"
                  color={getStatusColor(approvalInfo.status)}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ApprovalInfoPanel;
