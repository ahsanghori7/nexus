import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
} from 'react';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import flag from 'v2/helpers/flags';
import { formatUKorAnzDateTime } from 'helpers/date';
import getTableColumns from 'apps/clink/pages/tender-recommendations/TableColumns';
import {
  white,
  surfaceGray,
  borderGray,
  inkBlack,
  mutedGray,
  clinkGray,
  clinkRed,
  teal,
} from 'v2/constants/colors';
import ApprovalExpandablePanel from 'v2/apps/shared/components/approval-expandable-panel';
import RejectionAcknowledgeModal from 'v2/apps/clink/pages/projects/RejectionAcknowledgeModal';
import RejectionDetailContent from 'v2/apps/clink/pages/projects/RejectionDetailContent';

const toTitleCase = (str) =>
  str?.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) ?? '';

const statusChip = (status) => {
  const map = {
    Draft: { color: 'default', variant: 'outlined' },
    Pending: { color: 'warning', variant: 'outlined' },
    Approved: { color: 'success', variant: 'outlined' },
    Rejected: { color: 'error', variant: 'outlined' },
    Cancelled: {
      color: 'default',
      variant: 'outlined',
      sx: { bgcolor: 'grey.300', color: 'grey.800' },
    },
  };
  const props = map[status] || { color: 'default' };
  return (
    <Chip
      label={status}
      size="small"
      variant={props.variant}
      color={props.color}
      sx={{ fontWeight: 'bold', ...(props.sx || {}) }}
    />
  );
};

const COLUMN_HEADERS = [
  'Supplier',
  'Subcontractor Name',
  'Submitted By',
  'Status',
  'Last Updated',
  'Actions',
];

const DataTable = ({
  rows = [],
  clinkAccount,
  onAction,
  scrollInfo = {},
  sendApprovalReminder,
}) => {
  const { trId, scroll } = scrollInfo;
  const rowRefs = useRef({});
  const [highlightId, setHighlightId] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuActions, setMenuActions] = useState([]);
  const [menuRow, setMenuRow] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [rejectionAnchorEl, setRejectionAnchorEl] = useState(null);
  const [activeRejection, setActiveRejection] = useState(null);

  const grouped = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const key = row.package_name || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return [...map.entries()];
  }, [rows]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRejectionPopoverClose = useCallback(() => {
    setRejectionAnchorEl(null);
    setActiveRejection(null);
  }, []);

  const handleRejectionEdit = useCallback(
    (row) => {
      handleRejectionPopoverClose();
      onAction?.('edit', row);
    },
    [handleRejectionPopoverClose, onAction],
  );

  const handleRejectionInfoClick = useCallback(
    (event, row) => {
      const allApprovers = (row.assigned_approvers ?? []).flatMap(
        (levelObj) => levelObj.approvers ?? [],
      );
      const rejectedApprover = allApprovers.find(
        (a) => a.status?.label === 'Rejected',
      );
      setRejectionAnchorEl(event.currentTarget);
      setActiveRejection({
        type: 'tender_recommendation',
        comment: rejectedApprover?.comment ?? '—',
        approverName: rejectedApprover?.approver_user?.display_name ?? '—',
        approverRole:
          rejectedApprover?.approver_user?.account_role?.label ?? '',
        onEdit: () => handleRejectionEdit(row),
      });
    },
    [handleRejectionEdit],
  );

  const transformLevels = (assignedApprovers, isLevel) => {
    if (!Array.isArray(assignedApprovers)) return [];
    return assignedApprovers.map((levelObj) => {
      const approvers = (levelObj.approvers ?? []).map((a) => {
        const statusLabel = a.status?.label ?? 'Pending';
        const initials =
          [
            a.approver_user?.firstname?.[0] ?? '',
            a.approver_user?.lastname?.[0] ?? '',
          ]
            .join('')
            .toUpperCase() || '?';
        return {
          id: a.id,
          role_label: a.approver_user?.account_role?.label ?? null,
          approver_user: { ...a.approver_user, initials },
          is_level_satisfied_by_higher_authority:
            a?.is_level_satisfied_by_higher_authority,
          is_level_satisfied_by_self_approved:
            a?.is_level_satisfied_by_self_approved,
          is_satisfied_by_higher_authority: a?.is_satisfied_by_higher_authority,
          is_satisfied_by_self_approved: a?.is_satisfied_by_self_approved,
          status: { value: statusLabel.toLowerCase(), label: statusLabel },
          approval_requested_at: a.created_at ?? null,
          actioned_at:
            statusLabel.toLowerCase() !== 'pending' ? a.updated_at : null,
        };
      });
      return {
        level_number: levelObj.level,
        isLevel,
        rule: levelObj.rule ?? 'all',
        status: levelObj?.status,
        approvers,
      };
    });
  };

  const columns = useMemo(
    () =>
      getTableColumns({
        clinkAccount,
        formatUKorAnzDateTime,
        onRejectionInfoClick: handleRejectionInfoClick,
      }),
    [clinkAccount, handleRejectionInfoClick],
  );

  const getActionsForRow = useCallback(
    (row) => {
      const actionsCol = columns.find((c) => c.type === 'actions');
      if (!actionsCol) return [];
      return actionsCol.getActions({ row, id: row.tender_recommendation_id });
    },
    [columns],
  );

  // Helper to clear highlight after delay
  const clearHighlight = useCallback(() => {
    setHighlightId(null);
  }, []);

  // Helper to scroll to row and highlight
  const scrollToRow = useCallback(
    (targetId) => {
      const rowEl = rowRefs.current[String(targetId)];
      if (rowEl) {
        rowEl.scrollIntoView({
          block: 'center',
          inline: 'nearest',
          behavior: 'auto',
        });
        setHighlightId(targetId);
        return window.setTimeout(clearHighlight, 2000);
      }
      return 0;
    },
    [clearHighlight],
  );

  // Scroll to a specific row when instructed
  useEffect(() => {
    const targetId = trId;
    const canScroll =
      scroll === 'true' && targetId !== null && targetId !== undefined;

    let rafId = 0;
    let timeoutId = 0;
    let postTimeoutId = 0;

    const handleScroll = () => {
      timeoutId = window.setTimeout(() => {
        postTimeoutId = scrollToRow(targetId);
      }, 0);
    };

    if (canScroll) {
      rafId = window.requestAnimationFrame(handleScroll);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
      if (postTimeoutId) clearTimeout(postTimeoutId);
    };
  }, [scroll, trId, rows, scrollToRow]);

  const handleMenuOpen = (event, actions, row) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuActions(actions);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuActions([]);
    setMenuRow(null);
  };

  const handleMenuItemClick = (action) => {
    onAction?.(action.key, menuRow);
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {grouped.map(([packageName, packageRows]) => (
        <Paper
          key={packageName}
          elevation={0}
          sx={{
            border: `1px solid ${borderGray}`,
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${borderGray}`,
            }}
          >
            <Avatar
              sx={{
                bgcolor: teal,
                width: 32,
                height: 32,
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {packageName[0]?.toUpperCase() ?? '?'}
            </Avatar>
            <Typography fontWeight={600} fontSize="14px" color={inkBlack}>
              {packageName}
            </Typography>
          </Box>

          {/* Table */}
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                {COLUMN_HEADERS.map((header, idx) => {
                  const widths = ['20%', '20%', '20%', '15%', '15%', '10%'];
                  return (
                    <TableCell
                      key={header}
                      sx={{
                        width: widths[idx],
                        backgroundColor: surfaceGray,
                        color: mutedGray,
                        fontWeight: 700,
                        fontSize: '11px',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        borderBottom: `1px solid ${borderGray}`,
                        padding: '10px 16px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {header}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {packageRows.map((row) => {
                const rowId = row.tender_recommendation_id;
                const isHighlighted =
                  highlightId != null && String(rowId) === String(highlightId);
                const hasLevels =
                  flag('APPROVAL_THRESHOLD') &&
                  (row?.assigned_approvers ?? []).some(
                    (levelObj) => (levelObj.approvers ?? []).length > 0,
                  );
                const isExpanded = !!expanded[rowId];
                const rowActions = getActionsForRow(row);

                return (
                  <Fragment key={rowId}>
                    <TableRow
                      ref={(el) => {
                        rowRefs.current[String(rowId)] = el;
                      }}
                      sx={{
                        backgroundColor: isHighlighted ? clinkGray : white,
                        transition: 'background-color 0.15s ease',
                        '&:hover': { backgroundColor: surfaceGray },
                        '&:last-child td': { borderBottom: 0 },
                      }}
                    >
                      <TableCell
                        sx={{
                          color: inkBlack,
                          fontSize: '13px',
                          padding: '12px 16px',
                          borderBottom: `1px solid ${borderGray}`,
                        }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          sx={{ minWidth: 0 }}
                        >
                          {hasLevels && (
                            <IconButton
                              size="small"
                              onClick={() => toggleExpand(rowId)}
                              sx={{ p: 0.25, flexShrink: 0 }}
                            >
                              <ChevronRightIcon
                                fontSize="small"
                                sx={{
                                  transform: isExpanded
                                    ? 'rotate(90deg)'
                                    : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease',
                                }}
                              />
                            </IconButton>
                          )}
                          <Typography
                            fontSize="13px"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                            }}
                          >
                            {toTitleCase(row.subcontractor?.name)}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell
                        sx={{
                          color: mutedGray,
                          fontSize: '13px',
                          padding: '12px 16px',
                          borderBottom: `1px solid ${borderGray}`,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.subcontractor?.name ?? '-'}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: inkBlack,
                          fontSize: '13px',
                          padding: '12px 16px',
                          borderBottom: `1px solid ${borderGray}`,
                        }}
                      >
                        {row.submitted_by?.display_name ?? '-'}
                      </TableCell>

                      <TableCell
                        sx={{
                          padding: '12px 16px',
                          borderBottom: `1px solid ${borderGray}`,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap="6px">
                          {statusChip(row.status)}
                          {row.status === 'Rejected' &&
                            String(row.submitted_by?.id) ===
                              String(clinkAccount?.user?.id) && (
                              <IconButton
                                size="small"
                                sx={{ padding: '2px', color: clinkRed }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectionInfoClick(e, row);
                                }}
                              >
                                <InfoOutlinedIcon fontSize="small" />
                              </IconButton>
                            )}
                        </Box>
                      </TableCell>

                      <TableCell
                        sx={{
                          color: inkBlack,
                          fontSize: '13px',
                          padding: '12px 16px',
                          borderBottom: `1px solid ${borderGray}`,
                        }}
                      >
                        <Typography variant="body2">
                          {row.last_updated
                            ? `${formatUKorAnzDateTime(row.last_updated, clinkAccount?.country?.code).date}, ${formatUKorAnzDateTime(row.last_updated, clinkAccount?.country?.code).time}`
                            : '—'}
                        </Typography>
                      </TableCell>

                      <TableCell
                        sx={{
                          padding: '12px 16px',
                          borderBottom: `1px solid ${borderGray}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, rowActions, row)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {hasLevels && (
                      <TableRow sx={{ backgroundColor: `${white} !important` }}>
                        <TableCell
                          colSpan={COLUMN_HEADERS.length}
                          sx={{
                            py: 0,
                            borderBottom: isExpanded
                              ? `1px solid ${borderGray}`
                              : 0,
                          }}
                        >
                          <Collapse
                            in={isExpanded}
                            timeout="auto"
                            unmountOnExit
                            sx={{ paddingY: 1 }}
                          >
                            <ApprovalExpandablePanel
                              levels={transformLevels(
                                row?.assigned_approvers,
                                row?.isLevel,
                              )}
                              sendApprovalReminder={({ approver_id }) =>
                                sendApprovalReminder({
                                  approver_id,
                                  tid: row?.tender_recommendation_id,
                                })
                              }
                              entity_id={row?.tender_recommendation_id}
                              entityIdKey="tid"
                              canSendReminder={
                                String(row?.submitted_by?.id) ===
                                String(clinkAccount?.user?.id)
                              }
                            />
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      ))}

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {menuActions.map((action) => (
          <MenuItem
            key={action.key}
            onClick={() => handleMenuItemClick(action)}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>

      <RejectionAcknowledgeModal
        anchorEl={rejectionAnchorEl}
        showHeader
        onClose={handleRejectionPopoverClose}
        width={280}
      >
        <RejectionDetailContent rejection={activeRejection} />
      </RejectionAcknowledgeModal>
    </Box>
  );
};

export default DataTable;
