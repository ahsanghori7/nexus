import getQuoteFilesSummary from './quoteFiles';

describe('getQuoteFilesSummary', () => {
  it('returns null when there is no metadata', () => {
    expect(getQuoteFilesSummary(null)).toBeNull();
    expect(getQuoteFilesSummary(undefined)).toBeNull();
    expect(getQuoteFilesSummary({})).toBeNull();
    expect(getQuoteFilesSummary({ count: 0, documents: [] })).toBeNull();
  });

  it('summarises a single file', () => {
    const summary = getQuoteFilesSummary({
      count: 1,
      documents: [
        { id: 5, name: 'quote.pdf', quote_version: 1, created_at: '2026-06-28 10:12:33' },
      ],
    });

    expect(summary).toEqual({
      primaryName: 'quote.pdf',
      extraCount: 0,
      names: ['quote.pdf'],
      latestUpload: '2026-06-28 10:12:33',
    });
  });

  it('counts extra files and picks the latest upload date', () => {
    const summary = getQuoteFilesSummary({
      count: 3,
      documents: [
        { id: 1, name: 'quote.pdf', quote_version: 1, created_at: '2026-06-20 09:00:00' },
        { id: 2, name: 'appendix.xlsx', quote_version: 1, created_at: '2026-06-28 10:12:33' },
        { id: 3, name: 'terms.docx', quote_version: 1, created_at: '2026-06-25 15:30:00' },
      ],
    });

    expect(summary.primaryName).toBe('quote.pdf');
    expect(summary.extraCount).toBe(2);
    expect(summary.names).toEqual(['quote.pdf', 'appendix.xlsx', 'terms.docx']);
    expect(summary.latestUpload).toBe('2026-06-28 10:12:33');
  });
});
