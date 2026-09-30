import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { ThemeProvider } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { themeTable } from 'v2/apps/clink/pages/orders/Mui.Components';
import ApprovalExpandablePanel from 'v2/apps/shared/components/approval-expandable-panel';
import LogsModal from 'v2/apps/shared/components/logs-modal';
import mapAssignedApproversToLevels from 'v2/helpers/approvers';
import {
  fetchTenderEnquiryLogs,
  sendTenderInquiryReminder,
} from 'v2/store/reducers/clink/tender-inquiry/asyncThunk';
import TemplateActionsMenu from './TemplateActionsMenu';
import Typography from '@mui/material/Typography';
import useSnackbar from 'v2/hooks/useSnackbar';

const formatDate = (date) => {
  if (!date || date === '-') return '-';
  return moment(date).format('DD/MM/YYYY HH:mm');
};

const getStatusColor = (status) => {
  if (!status) return 'default';

  const statusLower = status.toLowerCase();

  // Draft: Grey
  if (statusLower === 'draft') {
    return 'default';
  }

  // Published: Grey
  if (statusLower === 'published') {
    return 'default';
  }

  // Pending Approval: Orange
  if (statusLower === 'pending approval' || statusLower.includes('pending')) {
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

  // Sent: Teal
  if (statusLower === 'sent') {
    return 'info';
  }

  // Default: Grey
  return 'default';
};

const getEmailStatusColor = (status) => {
  if (!status) return 'default';

  const statusLower = status.toLowerCase();

  // Sent: Green
  if (statusLower === 'sent') {
    return 'success';
  }

  // Partially Sent: Orange
  if (statusLower === 'partially sent') {
    return 'warning';
  }

  // Failed: Red
  if (statusLower === 'failed') {
    return 'error';
  }

  return 'default';
};

const getRequesterIds = (approvalData) =>
  Object.values(approvalData?.approvals || {})
    .flatMap((item) => item?.approvers ?? [item])
    .map((ap) => ap?.requester_user_id)
    .filter(Boolean);

const getHasApprovalInfo = (row) =>
  Boolean(
    row?.approval_info &&
    !(Array.isArray(row.approval_info) && row.approval_info.length === 0),
  );

const getCompanyDisplayInfo = (row) => {
  if (row?.company) {
    const name = row.company?.name || '';
    return { companyDisplay: name || '-', companyName: name };
  }

  if (
    row?.sent_to_subcontractors &&
    row.sent_to_subcontractors !== '-' &&
    typeof row.sent_to_subcontractors === 'string'
  ) {
    return {
      companyDisplay: row.sent_to_subcontractors,
      companyName: row.sent_to_subcontractors,
    };
  }

  return { companyDisplay: '-', companyName: '' };
};

const CompanyCell = ({ companyDisplay, companyName }) => {
  if (!companyName) {
    return <span>{companyDisplay}</span>;
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar
        sx={{
          width: 28,
          height: 28,
          fontSize: 12,
          bgcolor: 'grey.400',
          color: 'black',
        }}
      >
        {companyName?.charAt(0)?.toUpperCase()}
      </Avatar>
      <span>{companyDisplay}</span>
    </Box>
  );
};

const EmailStatusCell = ({ row }) => {
  if (!row?.email_status || row.email_status === '-') {
    return <span>-</span>;
  }
  return (
    <Tooltip
      title={<EmailStatusTooltip emailSentTo={row?.email_sent_to} />}
      placement="top"
      arrow
      disableInteractive
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 3,
            p: 2,
            '& .MuiTooltip-arrow': {
              color: 'background.paper',
            },
          },
        },
      }}
    >
      <Box>
        <Chip
          label={row.email_status}
          size="small"
          color={getEmailStatusColor(row.email_status)}
        />
      </Box>
    </Tooltip>
  );
};

const TemplateRow = ({
  row,
  isExpanded,
  isHighlighted,
  toggleExpand,
  rowRefs,
  t,
  pid,
  tid,
  onTemplateDelete,
  approversData,
  onViewLogs,
}) => {
  const dispatch = useDispatch();
  const clinkAccount = useSelector((state) => state.clinkAccount);
  const { companyDisplay, companyName } = getCompanyDisplayInfo(row);

  const sendApprovalReminder = ({ approver_id, tender_inquiry_id }) =>
    dispatch(
      sendTenderInquiryReminder({
        project_id: pid,
        tender_id: tid,
        tender_inquiry_id,
        approver_id,
      }),
    );

  const isAllowedToSendReminder = getRequesterIds(
    approversData?.[row?.originalTemplateId],
  ).some(
    (id) =>
      clinkAccount?.user?.id && String(id) === String(clinkAccount.user.id),
  );

  const hasApproversData = Boolean(
    Object.keys(approversData?.[row?.originalTemplateId]?.approvals || {})
      .length,
  );

  return (
    <React.Fragment key={row?.rowId}>
      <TableRow
        ref={(el) => {
          if (el && row?.id) {
            rowRefs.current[row.id] = el;
          }
        }}
        sx={{
          border: isHighlighted ? '2px solid' : 'none',
          borderColor: isHighlighted ? 'primary.main' : 'transparent',
        }}
      >
        <TableCell>{row?.name || '-'}</TableCell>
        <TableCell sx={{ width: '18% !important' }}>
          <CompanyCell
            companyDisplay={companyDisplay}
            companyName={companyName}
          />
        </TableCell>
        <TableCell>{formatDate(row?.created_at)}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={row?.final_status || '-'}
              size="small"
              color={getStatusColor(row?.final_status)}
            />
            {hasApproversData && (
              <IconButton
                aria-label="expand row"
                size="small"
                onClick={() => toggleExpand(row?.rowId)}
              >
                {isExpanded ? (
                  <KeyboardArrowUpIcon />
                ) : (
                  <KeyboardArrowDownIcon />
                )}
              </IconButton>
            )}
          </Box>
        </TableCell>
        <TableCell width={'18% !important'}>
          <EmailStatusCell row={row} />
        </TableCell>
        <TableCell>
          {row?.sentDate && row.sentDate !== '-'
            ? formatDate(row.sentDate)
            : '-'}
        </TableCell>
        <TableCell>
          <Box display="flex" gap={1} alignItems="center">
            <Tooltip title={t('view-document')} />
            <TemplateActionsMenu
              template={row}
              pid={pid}
              tid={tid}
              onDelete={onTemplateDelete}
              onViewLogs={onViewLogs}
            />
          </Box>
        </TableCell>
      </TableRow>
      {hasApproversData && (
        <TableRow>
          <TableCell
            colSpan={7}
            sx={{
              borderBottom: isExpanded
                ? '1px solid rgba(224, 224, 224, 1)'
                : 'none',
            }}
          >
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <ApprovalExpandablePanel
                levels={mapAssignedApproversToLevels(
                  approversData?.[row?.originalTemplateId]?.approvals,
                  approversData?.[row?.originalTemplateId]?.isLevel,
                )}
                sendApprovalReminder={sendApprovalReminder}
                entity_id={row?.originalTemplateId}
                entityIdKey="tender_inquiry_id"
                canSendReminder={isAllowedToSendReminder}
              />
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};

const EmailStatusTooltip = ({ emailSentTo }) => {
  const { t } = useTranslation();
  if (!emailSentTo || !Array.isArray(emailSentTo) || emailSentTo.length === 0) {
    return null;
  }

  const sentCount = emailSentTo.filter(
    (item) => item?.status?.toLowerCase() === 'sent',
  ).length;
  const failedCount = emailSentTo.filter(
    (item) => item?.status?.toLowerCase() === 'failed',
  ).length;

  const getIndividualStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'sent') {
      return <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />;
    }
    return <CancelIcon sx={{ fontSize: 18, color: 'error.main' }} />;
  };

  const getIndividualStatusTextColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'sent') {
      return 'success.main';
    }
    return 'error.main';
  };

  return (
    <Box sx={{ minWidth: 280, maxWidth: 600 }}>
      <Box
        paddingBottom={1}
        marginBottom={2}
        borderBottom={'1px solid'}
        borderColor={'divider'}
      >
        <Typography variant="body2" fontWeight={'bold'}>
          {t('email-delivery-status')}
        </Typography>
      </Box>
      <Box>
        {emailSentTo.map((item) => (
          <Box
            key={item?.email || item?.status}
            display={'flex'}
            alignItems={'center'}
            justifyContent={'space-between'}
            marginBottom={1}
            fontSize={'0.875rem'}
          >
            <Box>
              <span>{item?.email || '-'}</span>
            </Box>
            <Box display={'flex'} alignItems={'center'} gap={1}>
              {getIndividualStatusIcon(item?.status)}
              <Box
                sx={{
                  color: getIndividualStatusTextColor(item?.status),
                }}
              >
                {item?.status || '-'}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
      <Box
        paddingTop={1.5}
        borderTop={'1px solid'}
        borderColor={'divider'}
        fontSize={'0.875rem'}
        color={'text.secondary'}
      >
        {t('email-delivery-status-tooltip', {
          sentCount,
          emailSentToLength: emailSentTo.length,
          failedCount,
        })}
      </Box>
    </Box>
  );
};

const WorkPackageTemplates = ({
  templates,
  pid,
  tid,
  onTemplateDelete,
  searchQuery = '',
  approversData = {},
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState({});
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [tenderEnquiryLogs, setTenderEnquiryLogs] = useState({});
  const rowRefs = useRef({});
  const { snackbar } = useSnackbar();

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleViewLogs = useCallback(
    async (template) => {
      setLogsModalOpen(true);

      try {
        const result = await dispatch(
          fetchTenderEnquiryLogs({
            project_id: pid,
            tender_inquiry_id: template.id,
          }),
        ).unwrap();

        setTenderEnquiryLogs(result || {});
      } catch (error) {
        snackbar.error(t('failed-to-fetch-logs'));
      }
    },
    [dispatch, pid],
  );

  // Handle URL hash scrolling to specific document
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#document-')) {
      const documentId = hash.replace('#document-', '');

      const targetRef = rowRefs.current[documentId];
      if (targetRef) {
        targetRef.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        // Highlight the row temporarily
        setHighlightedRow(documentId);
      }
    }
  }, [templates]);

  // Convert templates object to array
  const templateArray = Object.values(templates || {});

  // Flatten templates: create separate row for each company
  const flattenedTemplates = templateArray.flatMap((template) => {
    // If sent_to_subcontractors is an array with items, create a row for each company
    if (
      Array.isArray(template?.sent_to_subcontractors) &&
      template.sent_to_subcontractors.length > 0
    ) {
      return template.sent_to_subcontractors.map((subcontractor, index) => ({
        ...template,
        rowId: `${template?.id}-${index}`,
        originalTemplateId: template?.id,
        company: subcontractor,
        isMultiCompany: template.sent_to_subcontractors.length > 1,
        companyIndex: index,
        sentDate: subcontractor?.sent_date,
      }));
    }
    // Otherwise, return the template as-is with a single row
    return [
      {
        ...template,
        rowId: template?.id,
        originalTemplateId: template?.id,
        company: null,
        isMultiCompany: false,
        companyIndex: 0,
      },
    ];
  });

  // Filter flattened templates by search query (company name)
  const filteredFlattenedTemplates =
    searchQuery && searchQuery.trim() !== ''
      ? flattenedTemplates.filter((row) => {
          const query = searchQuery.toLowerCase().trim();

          // Check company name from flattened row
          if (row?.company?.name) {
            return row.company.name.toLowerCase().includes(query);
          }

          // Check sent_to_subcontractors if it's a string
          if (
            typeof row?.sent_to_subcontractors === 'string' &&
            row.sent_to_subcontractors !== '-'
          ) {
            return row.sent_to_subcontractors.toLowerCase().includes(query);
          }

          return false;
        })
      : flattenedTemplates;

  if (!filteredFlattenedTemplates.length) {
    return (
      <>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <p>
            {searchQuery ? t('no-results-found') : t('no-templates-available')}
          </p>
        </Box>
        <LogsModal
          open={logsModalOpen}
          onClose={() => setLogsModalOpen(false)}
          allLogs={tenderEnquiryLogs?.logs || []}
          headerTitle={t('tender-enquiry-logs')}
          entity="tender enquiry"
          entity_no={tenderEnquiryLogs?.entity_no}
        />
      </>
    );
  }

  return (
    <>
      <ThemeProvider theme={themeTable}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('document-type')}</TableCell>
                <TableCell>{t('company')}</TableCell>
                <TableCell>{t('created')}</TableCell>
                <TableCell>{t('status')}</TableCell>
                <TableCell>{t('email-status')}</TableCell>
                <TableCell>{t('sent-date')}</TableCell>
                <TableCell>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFlattenedTemplates.map((row) => (
                <TemplateRow
                  key={row?.rowId}
                  row={row}
                  isExpanded={expanded[row?.rowId]}
                  isHighlighted={highlightedRow === String(row?.id)}
                  toggleExpand={toggleExpand}
                  rowRefs={rowRefs}
                  t={t}
                  pid={pid}
                  tid={tid}
                  onTemplateDelete={onTemplateDelete}
                  approversData={approversData}
                  onViewLogs={handleViewLogs}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </ThemeProvider>
      <LogsModal
        open={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        allLogs={tenderEnquiryLogs?.logs || []}
        headerTitle={t('tender-enquiry-logs')}
        entity="tender enquiry"
        entity_no={tenderEnquiryLogs?.entity_no}
      />
    </>
  );
};

export default WorkPackageTemplates;
