import buildTenderReadyContent from './buildTenderReadyContent';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key, params) => {
    if (key === 'analysis-tool-tender-ready-findings') {
      return `${params.count} key findings`;
    }
    if (key === 'analysis-tool-tender-ready-scored') {
      return `${params.count} quotes scored`;
    }
    if (key === 'analysis-tool-tender-ready-recommendations') {
      return `${params.count} recommendations`;
    }
    if (key === 'analysis-tool-generated-at') {
      return `Generated ${params.date}`;
    }
    return key;
  }),
}));

describe('buildTenderReadyContent', () => {
  it('builds summary and footer from executive_summary', () => {
    const result = buildTenderReadyContent(
      {
        status: 'SUCCESS',
        completed_at: '2026-05-12T14:02:00.000Z',
        analysis_results: {
          executive_summary: {
            key_findings: ['a', 'b'],
            quote_quality_assessment: [{}, {}, {}],
            recommendations: ['r1'],
          },
        },
      },
      5,
    );

    expect(result.summary).toContain('2 key findings');
    expect(result.summary).toContain('3 quotes scored');
    expect(result.summary).toContain('1 recommendations');
    expect(result.footer).toMatch(/^Generated /);
  });
});
