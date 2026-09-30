/**
 * BoQ list / per-package async flags used for skeleton UX (cards + grid).
 * @param {{ uiLoading?: object } | null | undefined} boq
 * @param {string|number|undefined|null} packageId Entity id (package scope)
 */
export function selectBoqUiLoadingFlags(boq, packageId) {
  const ui = boq?.uiLoading;
  const pid = packageId;
  const isEntityUpdating = Boolean(ui?.updateEntityById?.[pid]);
  const isNewBoqResetting = Boolean(ui?.newBoqResetById?.[pid]);
  return {
    isBoqListLoading: Boolean(ui?.boqList),
    isAiPollLoading: Boolean(ui?.aiPollById?.[pid]),
    isEntityUpdating,
    isNewBoqResetting,
    isPublishing: Boolean(ui?.publishById?.[pid]),
    /** New BoQ reset, upload, or start-from-scratch PATCH (+ list refresh). */
    isBoqCreationBusy: isNewBoqResetting || isEntityUpdating,
  };
}
