import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

export const useHandleDeleteMember = ({
  clinkAccount,
  team,
  setInfoModalState,
  actions,
  getRoleLevel,
}) => {
  const dispatch = useDispatch();

  const handleDeleteMember = useCallback(
    (memberId) => {
      const currentUserId = clinkAccount?.user?.id;
      const currentUserRole = team?.user_role;
      const currentUserRoleLevel = getRoleLevel(currentUserRole);

      const targetMember = team?.members?.find((m) => m.user_id === memberId);
      const targetRoleValue = targetMember?.role?.label;
      const targetRoleLevel = getRoleLevel(targetRoleValue);

      const isSelf = Number(currentUserId) === Number(memberId);
      if (currentUserRole === 'super_admin') {
        if (isSelf) {
          setInfoModalState({
            open: true,
            titleKey: 'delete-self-error-title',
            messageKey: 'delete-self-error-msg',
          });
          return;
        }

        dispatch(actions.removeMemberTeam(memberId)).then(({ payload }) => {
          if (!payload?.success) {
            setInfoModalState({
              open: true,
              titleKey: 'delete-member-error-title',
              messageKey: 'delete-member-error-msg',
            });
          }
        });
        return;
      }

      if (
        ['team_admin', 'administrator', 'team_manager'].includes(
          currentUserRole,
        )
      ) {
        const canDeleteSelf = isSelf;
        const canDeleteLower = targetRoleLevel > currentUserRoleLevel;

        if (canDeleteSelf || canDeleteLower) {
          dispatch(actions.removeMemberTeam(memberId)).then(({ payload }) => {
            if (!payload?.success) {
              setInfoModalState({
                open: true,
                titleKey: 'delete-member-error-title',
                messageKey: 'delete-member-error-msg',
              });
            }
          });
        } else {
          setInfoModalState({
            open: true,
            titleKey: 'delete-role-error-title',
            messageKey: 'delete-role-error-msg',
          });
        }
        return;
      }

      if (['team_assistant', 'approver'].includes(currentUserRole)) {
        if (isSelf) {
          dispatch(actions.removeMemberTeam(memberId)).then(({ payload }) => {
            if (!payload?.success) {
              setInfoModalState({
                open: true,
                titleKey: 'delete-member-error-title',
                messageKey: 'delete-member-error-msg',
              });
            }
          });
        } else {
          setInfoModalState({
            open: true,
            titleKey: 'delete-not-allowed-title',
            messageKey: 'delete-not-allowed-msg',
          });
        }
        return;
      }

      // Fallback
      setInfoModalState({
        open: true,
        titleKey: 'delete-error-title',
        messageKey: 'delete-error-msg',
      });
    },
    [clinkAccount, team, dispatch, setInfoModalState, actions, getRoleLevel],
  );

  return { handleDeleteMember };
};
