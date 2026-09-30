import React, { useCallback, useMemo, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import {
  getApproverInitials,
  getOrderStatusColor,
} from 'v2/apps/clink/pages/orders/subcontractors/helpers';
import i18next from 'v2/helpers/i18n';
import { formatUKorAnzDateTime } from 'helpers/date';

const OrderDetailsExpandablePanel = ({
  rowData,
  userInfo = {},
  sendApprovalReminder,
}) => {
  const did = rowData?.document.id;
  const orderApprovers = useMemo(() => {
    return rowData?.assigned_approvers.map((approver) => {
      return {
        id: approver.approver_user.id,
        requester_id: approver.requester_user_id,
        assignedTo: approver.approver_user?.display_name,
        email: approver?.approver_user.email,
        approvalRequested: approver.created_at,
        jobTitle: approver?.approver_user?.role.value || '-',
        status: approver.status.label,
        approverId: approver.id,
        firstName: approver.approver_user.firstname,
        lastName: approver.approver_user.lastname,
      };
    });
  }, [rowData?.assigned_approvers]);

  const showSendReminder = useCallback(
    (approver) => {
      const user = userInfo.user;
      return (
        approver.status.trim() === 'Pending' &&
        (user.type.trim() === 'super_admin' ||
          user.type.trim() === 'team_admin' ||
          approver.requester_id === Number(user.id))
      );
    },
    [userInfo?.user],
  );

  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSendReminder = async (approver_id, approver_name) => {
    const res = await sendApprovalReminder({ approver_id, did });
    if (res.payload?.status) {
      setSnackbarSeverity('success');
      setSnackbarMessage(
        i18next.t('order-approval-reminder-success', {
          approverName: approver_name,
        }),
      );
    } else {
      setSnackbarSeverity('error');
      setSnackbarMessage(i18next.t('order-approval-reminder-error'));
    }
    setSnackbarOpen(true);
    handleMenuClose();
  };

  return (
    <div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'white !important' }}>
              <TableCell>
                <strong>{i18next.t('assigned-to')}</strong>
              </TableCell>
              <TableCell>
                <strong>{i18next.t('approval-requested')}</strong>
              </TableCell>
              <TableCell>
                <strong>{i18next.t('job-title')}</strong>
              </TableCell>
              <TableCell>
                <strong>{i18next.t('status')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderApprovers.map((item) => {
              const isMenuOpen = Boolean(anchorEl?.id === item.approverId);

              return (
                <TableRow key={`assigned-${item.assignedTo}`}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 14,
                          color: 'black',
                          mr: 1.5,
                        }}
                      >
                        {getApproverInitials(item.firstName, item.lastName)}
                      </Avatar>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.assignedTo || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.email || ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {formatUKorAnzDateTime(item.approvalRequested).date}
                  </TableCell>
                  <TableCell>{item.jobTitle}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                        }}
                      >
                        <FiberManualRecordIcon
                          color={getOrderStatusColor(item.status)}
                          fontSize="small"
                        />
                        <span>{item.status}</span>
                      </Box>

                      {showSendReminder(item) && (
                        <>
                          <IconButton
                            id={`row-actions-button-${item.assignedTo}`}
                            aria-label="more actions"
                            aria-controls={
                              isMenuOpen
                                ? `row-actions-menu-${item.approverId}`
                                : undefined
                            }
                            aria-haspopup="true"
                            aria-expanded={isMenuOpen ? 'true' : undefined}
                            edge="end"
                            size="small"
                            onClick={(e) =>
                              setAnchorEl({
                                el: e.currentTarget,
                                id: item.approverId,
                              })
                            }
                            sx={{ p: 0.25 }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>

                          <Menu
                            id={`row-actions-menu-${item.approverId}`}
                            anchorEl={anchorEl?.el}
                            open={isMenuOpen}
                            onClose={() => setAnchorEl(null)}
                            keepMounted
                          >
                            <MenuItem
                              onClick={() =>
                                handleSendReminder(
                                  item.approverId,
                                  item.assignedTo,
                                )
                              }
                            >
                              {i18next.t('send-reminder')}
                            </MenuItem>
                          </Menu>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
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
    </div>
  );
};

export default OrderDetailsExpandablePanel;
