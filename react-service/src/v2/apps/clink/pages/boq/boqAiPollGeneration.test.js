import {
  bumpAiPollGeneration,
  isStaleAiPollResponse,
} from './boqAiPollGeneration';

describe('boqAiPollGeneration', () => {
  it('bumpAiPollGeneration increments per package', () => {
    const state = { aiPollGenerationById: { 1: 2 } };
    bumpAiPollGeneration(state, 1);
    expect(state.aiPollGenerationById[1]).toBe(3);
  });

  it('bumpAiPollGeneration initializes missing package entry', () => {
    const state = { aiPollGenerationById: {} };
    bumpAiPollGeneration(state, 9);
    expect(state.aiPollGenerationById[9]).toBe(1);
  });

  it('isStaleAiPollResponse returns false when pollGeneration is omitted', () => {
    const state = { aiPollGenerationById: { 1: 3 } };
    expect(isStaleAiPollResponse(state, 1, undefined)).toBe(false);
  });

  it('isStaleAiPollResponse returns true when generation mismatches', () => {
    const state = { aiPollGenerationById: { 1: 3 } };
    expect(isStaleAiPollResponse(state, 1, 2)).toBe(true);
    expect(isStaleAiPollResponse(state, 1, 3)).toBe(false);
  });
});
