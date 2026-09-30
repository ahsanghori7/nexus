import { selectBoqUiLoadingFlags } from './selectBoqUiLoadingFlags';

describe('selectBoqUiLoadingFlags', () => {
  it('returns false flags when boq is empty', () => {
    expect(selectBoqUiLoadingFlags(undefined, 1)).toEqual({
      isBoqListLoading: false,
      isAiPollLoading: false,
      isEntityUpdating: false,
      isNewBoqResetting: false,
      isPublishing: false,
      isBoqCreationBusy: false,
    });
  });

  it('maps uiLoading flags for the given package id', () => {
    const boq = {
      uiLoading: {
        boqList: true,
        aiPollById: { 9: true },
        updateEntityById: { 9: true },
        newBoqResetById: { 9: true },
        publishById: { 9: true },
      },
    };
    expect(selectBoqUiLoadingFlags(boq, 9)).toEqual({
      isBoqListLoading: true,
      isAiPollLoading: true,
      isEntityUpdating: true,
      isNewBoqResetting: true,
      isPublishing: true,
      isBoqCreationBusy: true,
    });
  });
});
