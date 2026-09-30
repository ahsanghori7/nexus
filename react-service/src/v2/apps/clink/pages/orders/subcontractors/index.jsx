import React, { useCallback, useState } from 'react';
import flag from 'v2/helpers/flags';
import isEmpty from 'lodash/isEmpty';
import { PENDING } from 'v2/helpers/status/orders';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import AssignedApproversAvatars from './AssignedApproversAvatars';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  themeTable,
  AvtarGridContainer,
  CompanyGridContainer,
  StatusGridContainer,
} from 'v2/apps/clink/pages/orders/Mui.Components';
import MuiDropdownButton from 'v2/apps/clink/pages/shared/MuiDropdown';
import { getAccountLogo } from 'v2/helpers/user';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import getActions from 'v2/apps/clink/pages/orders/subcontractors/useActions';
import LogsModal from 'v2/apps/shared/components/logs-modal';
import Collapse from '@mui/material/Collapse';
import ApprovalExpandablePanel from 'v2/apps/shared/components/approval-expandable-panel';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RejectionAcknowledgeModal from '../../projects/RejectionAcknowledgeModal';
import RejectionDetailContent from '../../projects/RejectionDetailContent';
import { clinkRed } from 'v2/constants/colors';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';
import i18next from 'v2/helpers/i18n';
import mapAssignedApproversToLevels from 'v2/helpers/approvers';
import { connect } from 'react-redux';

const document_column =
  (flag('DELETE_DRAFT_ORDER') && [{ id: 2, entry: 'order-page-document' }]) ||
  [];
const headEntries = [
  { id: 1, entry: 'order-page-order-n' },
  ...document_column,
  { id: 3, entry: 'order-page-order-date' },
  { id: 4, entry: 'order-page-company' },
  { id: 5, entry: 'order-page-value' },
  { id: 6, entry: 'order-page-status' },
];

const createdAt = (date) =>
  date ? String(moment(new Date(date)).format('DD/MM/YYYY')) : 'N/A';

const WithdrawApprovalDialog = ({
  open,
  onClose,
  onConfirm,
  loading = false,
}) => (
  <Dialog
    open={open}
    onClose={loading ? undefined : onClose}
    data-testid="withdraw-approval-dialog"
  >
    <DialogTitle>{i18next.t('withdraw-order-approval-title')}</DialogTitle>
    <DialogContent>
      <DialogContentText>
        {i18next.t('withdraw-order-approval-description')}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button
        data-testid="withdraw-approval-cancel"
        onClick={onClose}
        disabled={loading}
      >
        {i18next.t('cancel')}
      </Button>
      <Button
        data-testid="withdraw-approval-confirm"
        onClick={onConfirm}
        variant="contained"
        color="primary"
        disabled={loading}
        startIcon={
          loading ? <CircularProgress size={16} color="inherit" /> : null
        }
      >
        {i18next.t('confirm')}
      </Button>
    </DialogActions>
  </Dialog>
);

WithdrawApprovalDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
const flattenApprovers = (assignedApprovers) => {
  if (!assignedApprovers) return [];
  if (Array.isArray(assignedApprovers)) return assignedApprovers;
  return Object.values(assignedApprovers).flatMap(
    (level) => level?.approvers ?? [],
  );
};

const Tenders = ({
  pid,
  entryData,
  tender,
  withdrawSentOrder,
  markAsSignOrder,
  deleteOrder,
  quoteFilesForTender,
  withdrawOrderApproval,
  reloadOrders,
  userInfo,
  fetchOrderLogs,
  sendApprovalReminder,
  clinkAccount,
}) => {
  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const { t } = useTranslation();
  const [openLogModal, setOpenLogModal] = useState(false);
  const [orderLogs, setOrderLogs] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [rejectionAnchorEl, setRejectionAnchorEl] = useState(null);
  const [activeRejection, setActiveRejection] = useState(null);
  const [withdrawApprovalModalOpen, setWithdrawApprovalModalOpen] =
    useState(false);
  const [withdrawApprovalDid, setWithdrawApprovalDid] = useState(null);
  const [withdrawApprovalLoading, setWithdrawApprovalLoading] = useState(false);
  const handleDisabled = () => {
    // Set state to true on button click
    setDisabled(true);

    // Use setTimeout to set state back to false after  1 second
    setTimeout(() => {
      setDisabled(false);
    }, 1000); //  1000 milliseconds =  1 second
  };

  const handleLogModal = useCallback(
    (document_id) => {
      setOpenLogModal(true);
      fetchOrderLogs(document_id).then((result) => {
        setOrderLogs(result?.payload ?? {});
      });
    },
    [fetchOrderLogs],
  );

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRejectionPopoverOpen = (event, row) => {
    setRejectionAnchorEl(event.currentTarget);
    const rejectedApprover = flattenApprovers(row.assigned_approvers)?.find(
      (ap) => ap.status?.label === 'Rejected',
    );
    const did = row.document?.id;
    const tid = tender?.id;
    setActiveRejection({
      type: 'order',
      comment: rejectedApprover?.comment || '—',
      approverName:
        rejectedApprover?.approver_user?.display_name ||
        `${rejectedApprover?.user?.firstname ?? ''} ${rejectedApprover?.user?.lastname ?? ''}`.trim() ||
        '—',
      approverRole: rejectedApprover?.role_label || '',
      editUrl: `/document-creator/template/${did}/order/${tid}`,
    });
  };
  const handleRejectionPopoverClose = () => {
    setRejectionAnchorEl(null);
    setActiveRejection(null);
  };
  const openWithdrawApprovalModal = useCallback((did) => {
    setWithdrawApprovalDid(did);
    setWithdrawApprovalModalOpen(true);
  }, []);

  const handleWithdrawApprovalConfirm = useCallback(() => {
    setWithdrawApprovalLoading(true);
    withdrawOrderApproval({ did: withdrawApprovalDid })
      .then(() => {
        setWithdrawApprovalModalOpen(false);
        if (reloadOrders) reloadOrders();
      })
      .finally(() => {
        setWithdrawApprovalLoading(false);
      });
  }, [withdrawOrderApproval, withdrawApprovalDid, reloadOrders]);

  return (
    <>
      <Modal open={open} setOpen={setOpen} />
      <WithdrawApprovalDialog
        open={withdrawApprovalModalOpen}
        onClose={() => setWithdrawApprovalModalOpen(false)}
        onConfirm={handleWithdrawApprovalConfirm}
        loading={withdrawApprovalLoading}
      />
      {flag('APPROVAL_THRESHOLD') && (
        <LogsModal
          open={openLogModal}
          onClose={() => setOpenLogModal(false)}
          allLogs={orderLogs?.logs}
          headerTitle={t('order-logs')}
          entity="order"
          entity_no={orderLogs?.entity_no}
          package_name={orderLogs?.package_name}
        />
      )}
      <RejectionAcknowledgeModal
        anchorEl={rejectionAnchorEl}
        showHeader
        onClose={handleRejectionPopoverClose}
        width={280}
      >
        <RejectionDetailContent
          rejection={activeRejection}
          onClose={handleRejectionPopoverClose}
        />
      </RejectionAcknowledgeModal>
      <ThemeProvider theme={themeTable}>
        <TableContainer component={Paper} data-testid="orders-table">
          <Table>
            <TableHead>
              <TableRow>
                {headEntries.map((headEntry) => (
                  <TableCell key={headEntry.id}>{t(headEntry.entry)}</TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {entryData.map((row) => {
                if (isEmpty(row)) {
                  return null;
                }
                const { document, subcontractor, signatory = {} } = row;
                const levels = mapAssignedApproversToLevels(
                  row.assigned_approvers,
                  row.isLevel ?? row.is_level,
                );
                const { signers, total } = signatory;
                const status =
                  PENDING === row.status && total
                    ? `${row.status} (${signers}/${total})`
                    : row.status;
                const documentName = document && document.name;
                let acronym = documentName && documentName.split(' ');
                acronym = acronym.reduce(
                  (accumulator, currentValue) => accumulator + currentValue[0],
                  '',
                );
                const rowKey = flag('DELETE_DRAFT_ORDER')
                  ? document.id
                  : subcontractor.id;
                const actions = getActions(
                  pid,
                  row,
                  tender,
                  setOpen,
                  quoteFilesForTender,
                  withdrawSentOrder,
                  markAsSignOrder,
                  deleteOrder,
                  [disabled, handleDisabled],
                  handleLogModal,
                  openWithdrawApprovalModal,
                );
                return (
                  <React.Fragment key={rowKey}>
                    <TableRow data-testid={`order-row-${rowKey}`}>
                      <TableCell>
                        {flag('APPROVAL_THRESHOLD') && levels.length > 0 && (
                          <Grid item>
                            <IconButton
                              data-testid={`order-expand-btn-${rowKey}`}
                              aria-label="expand row"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(rowKey);
                              }}
                            >
                              {expanded[rowKey] ? (
                                <KeyboardArrowUpIcon />
                              ) : (
                                <KeyboardArrowDownIcon />
                              )}
                            </IconButton>
                            {row.order_nr}
                          </Grid>
                        )}
                      </TableCell>
                      {flag('DELETE_DRAFT_ORDER') && (
                        <TableCell>
                          <Tooltip title={documentName}>
                            <Button>{acronym}</Button>
                          </Tooltip>
                        </TableCell>
                      )}
                      <TableCell>{createdAt(row.created_at)}</TableCell>
                      <TableCell>
                        <Grid container spacing={2}>
                          <AvtarGridContainer>
                            <Avatar
                              src={getAccountLogo(subcontractor.id, true)}
                            />
                          </AvtarGridContainer>
                          <CompanyGridContainer>
                            {subcontractor.name}
                          </CompanyGridContainer>
                        </Grid>
                      </TableCell>
                      <TableCell>
                        {parseCurrency(
                          row.value,
                          currencyConfig[t('currency')],
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusGridContainer>
                          <Grid item>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              {status}
                              {row.status === 'Rejected' &&
                                !flattenApprovers(row.assigned_approvers).some(
                                  (ap) =>
                                    ap.approver_user_id ===
                                    Number(userInfo?.user?.id),
                                ) && (
                                  <span>
                                    <IconButton
                                      data-testid={`order-rejection-info-${rowKey}`}
                                      size="small"
                                      sx={{ padding: '2px', color: clinkRed }}
                                      onClick={(e) =>
                                        handleRejectionPopoverOpen(e, row)
                                      }
                                    >
                                      <InfoOutlinedIcon size="small" />
                                    </IconButton>
                                  </span>
                                )}
                            </div>
                            <AssignedApproversAvatars
                              assignedApprovers={flattenApprovers(
                                row.assigned_approvers,
                              )}
                            />
                          </Grid>
                          <Grid item>
                            {actions.length > 0 && (
                              <MuiDropdownButton
                                data-testid={`order-actions-${rowKey}`}
                                options={actions}
                              />
                            )}
                          </Grid>
                        </StatusGridContainer>
                      </TableCell>
                    </TableRow>
                    {flag('APPROVAL_THRESHOLD') && (
                      <TableRow data-testid={`order-approval-row-${rowKey}`}>
                        <TableCell colSpan={headEntries.length}>
                          <Collapse
                            in={!!expanded[rowKey]}
                            timeout="auto"
                            unmountOnExit
                          >
                            <ApprovalExpandablePanel
                              levels={levels}
                              sendApprovalReminder={sendApprovalReminder}
                              entity_id={row.document.id}
                              canSendReminder={flattenApprovers(
                                row.assigned_approvers,
                              ).some(
                                (ap) =>
                                  ap.requester_user_id &&
                                  clinkAccount?.user?.id &&
                                  String(ap.requester_user_id) ===
                                    String(clinkAccount?.user?.id),
                              )}
                            />
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </ThemeProvider>
    </>
  );
};
const mapStateToProps = (state) => ({
  clinkAccount: state.clinkAccount,
});

export default connect(mapStateToProps)(Tenders);
