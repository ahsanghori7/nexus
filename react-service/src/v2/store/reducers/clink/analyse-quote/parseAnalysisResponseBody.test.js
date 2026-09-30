import parseAnalysisResponseBody from './parseAnalysisResponseBody';

describe('parseAnalysisResponseBody', () => {
  it('returns null for empty response body', () => {
    expect(parseAnalysisResponseBody('')).toBeNull();
    expect(parseAnalysisResponseBody('   ')).toBeNull();
    expect(parseAnalysisResponseBody(null)).toBeNull();
  });

  it('parses JSON job payload', () => {
    expect(parseAnalysisResponseBody('{"status":"STARTED"}')).toEqual({
      status: 'STARTED',
    });
  });
});
