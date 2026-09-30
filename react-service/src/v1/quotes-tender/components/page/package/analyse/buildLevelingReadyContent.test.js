import buildLevelingReadyContent from './buildLevelingReadyContent';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key, params) => {
    if (key === 'analysis-tool-generated-at') {
      return `Generated ${params.date}`;
    }
    return key;
  }),
}));

jest.mock('./formatAnalysisGeneratedAt', () =>
  jest.fn((isoDate) => (isoDate ? '06/07/2026, 11:27' : null)),
);

describe('buildLevelingReadyContent', () => {
  it('returns description keys and generated footer when completed_at is present', () => {
    const result = buildLevelingReadyContent({
      completed_at: '2026-07-06T06:27:00.000Z',
    });

    expect(result).toEqual({
      description: 'analysis-tool-leveling-ready-description',
      descriptionEmphasis: 'analysis-tool-leveling-ready-description-emphasis',
      footer: 'Generated 06/07/2026, 11:27',
    });
  });

  it('omits footer when completed_at is missing', () => {
    expect(buildLevelingReadyContent({})).toEqual({
      description: 'analysis-tool-leveling-ready-description',
      descriptionEmphasis: 'analysis-tool-leveling-ready-description-emphasis',
      footer: null,
    });
  });
});
