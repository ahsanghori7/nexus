import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import find from 'lodash/find';
import Grid from '@mui/material/Grid2';
import { useTranslation } from 'react-i18next';
import { useContext } from 'hooks/context';
import { connect } from 'react-redux';
import { CONSTANTS } from 'clink-components';
import Loading from 'v2/apps/shared/components/Loading';
import InfoModal from 'v2/apps/shared/components/InfoModal';
import { StyledPageSubtitle, StyledTeamContent } from './styled';
import InvitePanel from './InvitePanel';
import ConfirmUpdateDialog from './ConfirmUpdateDialog';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import flag from 'v2/helpers/flags';
import { DataGridPro, GridActionsCellItem } from '@mui/x-data-grid-pro';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { goTo } from 'v2/helpers/url';

const { clinkLightPurple, white } = CONSTANTS.colors.general;
const allowedRoles = [
  'super_admin',
  'administrator',
  'team_manager',
  'team_admin',
];

const TeamManager = ({
  contextType = 'clink',
  dispatch,
  roles,
  account,
  clinkAccount,
  approvalThresholds,
}) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { actions, pages } = context;
  const { addTeam } = pages;
  const { table } = addTeam;

  const { team, status, inviteError } = account;
  const { user, id: accountId } = clinkAccount;

  const resetButton = useRef();

  const [overValue, setOverValue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const hasPermissionToManageTeam = allowedRoles.includes(team?.user_role);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState(null);

  const [infoModalState, setInfoModalState] = useState({
    open: false,
    titleKey: '',
    messageKey: '',
    selfDeleted: false,
  });

  const openPermissionsModal = useCallback((member) => {
    setSelectedMember(member);
    setPermModalOpen(true);
  }, []);

  const closePermissionsModal = useCallback(() => {
    setPermModalOpen(false);
    setSelectedMember(null);
  }, []);

  const handleSaveThresholds = useCallback(
    (newValues) => {
      setModalOpen(false);
      dispatch(actions.updateApprovalThresholds(newValues)).then((res) => {
        if (res?.payload?.success) {
          setSuccessMessage(
            approvalThresholds.length === 0
              ? 'Approval threshold groups have been successfully created.'
              : 'Approval thresholds have been updated successfully.',
          );
          dispatch(actions.fetchTeam());
        }
      });
    },
    [dispatch, actions, approvalThresholds?.length],
  );
  const handlePermissionConfirm = useCallback(
    (permissionData) => {
      const {
        tenderRecommendation,
        tenderApprovals,
        subcontractorListApproval,
        orderApprovalsEnabled,
        orderApprovalsType,
        thresholdIds,
      } = permissionData;

      const payload = {
        user_id: selectedMember.user_id,
        tender_recommendation: tenderRecommendation,
        tender_inquiry_approval: tenderApprovals,
        subcontractor_list_approval: subcontractorListApproval,
        approval_threshold: orderApprovalsEnabled
          ? {
              hasPermission: true,
              type: orderApprovalsType,
              threshold_ids: thresholdIds || [],
            }
          : {
              hasPermission: false,
            },
      };

      dispatch(actions.updateMemberPermissions(payload)).then((res) => {
        closePermissionsModal();
        if (res?.payload?.status) {
          setSuccessMessage(
            t('approval-level-updated', {
              name: `${selectedMember?.firstname} ${selectedMember?.lastname}`,
            }),
          );
        }
      });
    },
    [actions, dispatch, selectedMember, closePermissionsModal, t],
  );

  const openModalHandler = useCallback(() => {
    if (approvalThresholds.length === 0) {
      setModalOpen(true);
    } else {
      setEditConfirmOpen(true);
    }
  }, [approvalThresholds]);
  const openModalDeleteHandler = useCallback((id) => {
    setDeleteModalOpen(true);
    setDeleteMemberId(id);
  }, []);
  useEffect(() => {
    dispatch(actions.userRoles(accountId));
    dispatch(actions.resetProject());
    dispatch(actions.resetQuotesTender());
    dispatch(actions.restartOrders());
    dispatch(actions.restartProcurement());
    dispatch(actions.setBreadcrumbs([]));
    dispatch(actions.setProjectName(false));
    dispatch(actions.setSlug(false));
    dispatch(actions.fetchTeam());
  }, [dispatch, actions, accountId]);

  useEffect(() => {
    if (approvalThresholds && approvalThresholds.length > 0) {
      const initialOver = approvalThresholds.find(
        (threshold) => threshold.to_value === null,
      );
      setOverValue(initialOver);
    } else {
      setOverValue(null);
    }
  }, [approvalThresholds]);

  const handleDeleteMember = useCallback(
    (memberId) => {
      setDeleteModalOpen(false);
      setDeleteMemberId(null);
      dispatch(actions.removeMemberTeam(memberId)).then(({ payload }) => {
        const { success, message } = payload;
        if (success) {
          if (clinkAccount?.user?.id === memberId) {
            setInfoModalState({
              open: true,
              titleKey: 'session-expired',
              messageKey: 'account-deleted',
              selfDeleted: true,
            });
          } else {
            setSuccessMessage(t('delete-success-message'));
          }
        } else {
          setInfoModalState({
            open: true,
            titleKey: 'delete-error-title',
            messageKey: message !== '' ? message : 'delete-error-msg',
          });
        }
      });
    },
    [
      dispatch,
      t,
      setSuccessMessage,
      setInfoModalState,
      actions,
      clinkAccount?.user?.id,
    ],
  );
  const sendInvite = (values) => {
    const role = roles.find((type) => type.label === values.role);
    if (role !== undefined) {
      setLoading(true);
      dispatch(actions.sendInvite({ ...values, role: role.id })).then(
        ({ payload }) => {
          setLoading(false);
          const { success, message } = payload;
          if (success) {
            resetButton.current.click();
            setSuccessMessage(t(message));
            dispatch(actions.fetchTeam());
          } else {
            setInfoModalState({
              open: true,
              titleKey: 'invite-error-title',
              messageKey: message !== '' ? message : 'invite-error-message',
            });
          }
        },
      );
    }
  };

  const handleChangeRole = useCallback(
    async (id, role, revert) => {
      const result = await dispatch(actions.changeRole({ id, role }));
      const isSuccess = result?.payload?.success;
      const message = result?.payload?.message;
      if (!isSuccess && revert) {
        setInfoModalState({
          open: true,
          titleKey: 'change-role-title',
          messageKey:
            message !== '' ? message : 'change-role-exception-message',
        });
        revert();
      } else {
        setSuccessMessage(t('user-role-success'));
      }
    },
    [actions, dispatch, t],
  );

  const rowBuilder = table.rowBuilder;
  const teamList = useMemo(() => {
    if (team?.user_role && team?.members?.length) {
      return team.members
        .filter((member) => {
          const hasNewRoles = Array.isArray(member.roles) && member.roles.length > 0;
          const roleId = hasNewRoles ? member?.roles?.[0]?.id : member?.role?.id;
          if (hasNewRoles){
            return find(roles, (ut) => Number(ut.id) === Number(roleId));
          }
          return find(
            roles,
            (ut) => Number(ut.user_type_id) === Number(roleId),
          );
        })
        .map((member) => {
          return rowBuilder(
            {
              ...member,
            },
            roles,
            team.user_role,
            handleChangeRole,
            clinkAccount?.user || {},
            openPermissionsModal,
          );
        });
    }
    return [];
  }, [
    team,
    clinkAccount,
    rowBuilder,
    handleChangeRole,
    openPermissionsModal,
    roles,
  ]);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const th = document.querySelector('th[width="24"]');
      if (th && !th.querySelector('svg')) {
        th.click();
        th.click();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const theme = 'clink-team-manager';

  const columns = useMemo(() => {
    return table.columns.map((col) => {
            // Base column configuration
      const baseColumn = {
        field: col.key,
        headerName: col.label,
        flex: 1,
        minWidth: col.width ? col.width * 10 : 100,
        align: col.alignColumns || 'left',
        headerAlign: col.alignHeader || 'left',
        sortable: Boolean(col.sortMethod),
      };

      // Special handling for actions column
      if (col.key === 'actions') {
        return {
          // ...baseColumn,
          align: col.alignColumns || 'left',
          headerAlign: col.alignHeader || 'left',
          field: col.key,
          headerName: col.label,
          width: col.width ? col.width : 80,
          type: 'actions',
          getActions: (params) => {
            const { id, row } = params;
            const canBeRemoved = row.can_be_removed ?? row.canBeRemoved; // Handle both cases

            return [
              <GridActionsCellItem
                key="delete"
                icon={<DeleteIcon />}
                label="Delete"
                onClick={() => openModalDeleteHandler(id)}
                disabled={!canBeRemoved}
                showInMenu
                color="inherit"
                data-testid={`team-manager-delete-member-${id}`}
              />,
            ];
          },
        };
      }

      // Special rendering for other columns
      if (col.key === 'role') {
        return {
          ...baseColumn,
          renderCell: (params) => params.row[col.key],
        };
      }

      return baseColumn;
    });
  }, [table.columns, openModalDeleteHandler]);
  const infoProps = {
    theme: 'c-link',
    title: t(infoModalState.titleKey),
    message: t(infoModalState.messageKey),
    closeLabel: t('close'),
    disableEscapeKeyDown: true,
    onHidden: () => {
      setInfoModalState({ ...infoModalState, open: false });
      if (infoModalState.selfDeleted) {
        window.location.reload();
        goTo('/login');
      }
    },
  };
  return (
    <>
      {infoModalState.open && <InfoModal {...infoProps} />}
      <StyledTeamContent data-testid="team-manager-page">
        {hasPermissionToManageTeam && (
          <Grid
            className="team-panel"
            container
            flexDirection="column"
            data-testid="team-manager-invite-section"
            sx={{
              background: white,
              border: `1px solid ${clinkLightPurple}`,
              borderRadius: '10px',
            }}
          >
            {roles && roles.length > 0 && (
              <InvitePanel
                loading={loading}
                sendInvite={sendInvite}
                inviteError={inviteError}
                theme={theme}
                resetButton={resetButton}
                clinkAccount={user}
                userRole={team?.user_role}
                roles={roles}
              />
            )}
          </Grid>
        )}
        <Grid
          mt={3}
          className="team-panel"
          container
          flexDirection="column"
          data-testid="team-manager-your-team-section"
          sx={{
            background: white,
            border: `1px solid ${clinkLightPurple}`,
            borderRadius: '10px',
          }}
        >
          <Grid className="team-panel your-team-panel">
            <StyledPageSubtitle className="page-subtitle">
              {t('your-team')}
            </StyledPageSubtitle>
          </Grid>
          {roles && (
            <Grid className="team-panel your-team-panel" p={3}>
              {Boolean(status.message) && <Loading status={status.message} />}
              {!status.message && (
                <DataGridPro
                  autoHeight
                  rows={teamList}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10]}
                  pagination
                  disableSelectionOnClick
                  getRowId={(row) => row.id}
                  data-testid="team-manager-table"
                  sx={{
                    '& .MuiDataGrid-cell': {
                      display: 'list-item',
                      paddingTop: '5px',
                    },
                    '& .MuiTablePagination-toolbar > *': {
                      marginBottom: 0,
                    },
                    '& img': {
                      position: 'absolute',
                      bottom: '7px',
                      left: '-2px',
                    },
                  }}
                />
              )}
            </Grid>
          )}
        </Grid>

        <div>
          {flag('APPROVAL_THRESHOLD') && (
            <Grid
              mt={3}
              className="team-panel"
              container
              flexDirection="column"
              sx={{
                background: white,
                border: `1px solid ${clinkLightPurple}`,
                borderRadius: '10px',
              }}
            >
              <ConfirmUpdateDialog
                open={editConfirmOpen}
                onCancel={() => setEditConfirmOpen(false)}
                onConfirm={() => {
                  setEditConfirmOpen(false);
                  setModalOpen(true);
                }}
              />

              <Snackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(successMessage)}
                autoHideDuration={5000}
                onClose={() => setSuccessMessage('')}
                data-testid="team-manager-success-snackbar"
              >
                <MuiAlert
                  onClose={() => setSuccessMessage('')}
                  severity="success"
                  sx={{ width: '100%' }}
                  elevation={6}
                  variant="filled"
                >
                  {successMessage}
                </MuiAlert>
              </Snackbar>
            </Grid>
          )}

          <ConfirmDeleteDialog
            open={deleteModalOpen}
            onCancel={() => {
              setDeleteModalOpen(false);
              setDeleteMemberId(null);
            }}
            onConfirm={() => handleDeleteMember(deleteMemberId)}
          />
        </div>
      </StyledTeamContent>
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    roles: state.account.roles,
    account: state.account,
    clinkAccount: state.clinkAccount,
    approvalThresholds: state.account.approvalThresholds,
  };
};

export default connect(mapStateToProps)(TeamManager);
