import { useCallback, useState } from 'react';

/**
 * Wraps re-run / retry actions with a confirmation modal before executing.
 */
const useConfirmAnalysisRerun = () => {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const requestRerun = useCallback((action) => {
    if (typeof action !== 'function') {
      return;
    }
    setPendingAction(() => action);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setPendingAction(null);
  }, []);

  const handleConfirm = useCallback(() => {
    pendingAction?.();
    setOpen(false);
    setPendingAction(null);
  }, [pendingAction]);

  return {
    confirmOpen: open,
    requestRerun,
    handleClose,
    handleConfirm,
  };
};

export default useConfirmAnalysisRerun;
