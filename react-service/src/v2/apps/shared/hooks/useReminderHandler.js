import { useState } from 'react';
import i18next from 'v2/helpers/i18n';
import { useSnackbar } from 'v2/hooks/useSnackbar';

export const useReminderHandler = (
  reminderApi,
  entityId,
  entityIdKey = 'entityId',
) => {
  const [loadingReminderId, setLoadingReminderId] = useState(null);
  const { showSnackbar, closeSnackbar: closeSnackbarFromHook } = useSnackbar();

  const handleSendReminder = async (
    approverId,
    approverName,
    customMessage,
  ) => {
    if (!reminderApi) {
      showSnackbar(i18next.t('reminder-api-not-configured'), 'error');
      return;
    }

    if (!entityId) {
      showSnackbar(i18next.t('reminder-entity-id-missing'), 'error');
      return;
    }

    setLoadingReminderId(approverId);

    try {
      const payload = {
        approver_id: approverId,
        [entityIdKey]: entityId,
      };

      const result = reminderApi(payload);
      const response = result?.unwrap ? await result.unwrap() : await result;

      const isSuccess =
        response?.length ||
        response?.payload?.status ||
        response?.status ||
        response?.success ||
        response?.payload?.success;

      if (isSuccess) {
        showSnackbar(
          customMessage || i18next.t('reminder-sent-success', { approverName }),
          'success',
        );
      } else {
        showSnackbar(
          response?.message || i18next.t('reminder-send-failed'),
          'error',
        );
      }
    } catch (error) {
      showSnackbar(
        error?.message || i18next.t('reminder-send-error'),
        'error',
      );
    } finally {
      setLoadingReminderId(null);
    }
  };

  const closeSnackbar = () => {
    closeSnackbarFromHook();
  };

  const resetReminder = () => {
    setLoadingReminderId(null);
  };

  return {
    handleSendReminder,
    loadingReminderId,
    closeSnackbar,
    resetReminder,
  };
};
