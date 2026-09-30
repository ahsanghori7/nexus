import { shouldFetchAiGenerateBoqStatus } from './boqAiRehydration';

describe('shouldFetchAiGenerateBoqStatus', () => {
  const emptyEntity = { entries: [], nextEntries: [] };

  it('returns true when there is no known AI status and no rows', () => {
    expect(
      shouldFetchAiGenerateBoqStatus({
        packageId: 2,
        entity: emptyEntity,
        aiGenerationById: {},
        skipAiRehydration: false,
      })
    ).toBe(true);
  });

  it('returns true for SUCCESS without cached result (draft cleared by fetchBoQList)', () => {
    expect(
      shouldFetchAiGenerateBoqStatus({
        packageId: 2,
        entity: emptyEntity,
        aiGenerationById: { 2: { status: 'SUCCESS', result: null } },
        skipAiRehydration: false,
      })
    ).toBe(true);
  });

  it('returns false when draft rows exist', () => {
    expect(
      shouldFetchAiGenerateBoqStatus({
        packageId: 2,
        entity: { entries: [], nextEntries: [{ id: 'x', type: 'item' }] },
        aiGenerationById: { 2: { status: 'SUCCESS', result: null } },
        skipAiRehydration: false,
      })
    ).toBe(false);
  });

  it('returns false for NOT_FOUND', () => {
    expect(
      shouldFetchAiGenerateBoqStatus({
        packageId: 2,
        entity: emptyEntity,
        aiGenerationById: { 2: { status: 'NOT_FOUND' } },
        skipAiRehydration: false,
      })
    ).toBe(false);
  });

  it('returns false for FAILURE (invalid file — no rehydrate poll)', () => {
    expect(
      shouldFetchAiGenerateBoqStatus({
        packageId: 2,
        entity: emptyEntity,
        aiGenerationById: { 2: { status: 'FAILURE' } },
        skipAiRehydration: false,
      })
    ).toBe(false);
  });

  it('returns false when rehydration is skipped', () => {
    expect(
      shouldFetchAiGenerateBoqStatus({
        packageId: 2,
        entity: emptyEntity,
        aiGenerationById: {},
        skipAiRehydration: true,
      })
    ).toBe(false);
  });
});
