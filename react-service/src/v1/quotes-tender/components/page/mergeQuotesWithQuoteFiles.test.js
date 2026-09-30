import mergeQuotesWithQuoteFiles from './mergeQuotesWithQuoteFiles';

describe('mergeQuotesWithQuoteFiles', () => {
  it('keeps zip on quote when quoteFiles entry is not loaded yet', () => {
    const quotesData = {
      tenders: {
        10: {
          id: 10,
          quotes: {
            99: { id: 99, zip: '/download/quote/1/10/99/5' },
          },
        },
      },
    };
    const files = {
      10: {},
    };

    const merged = mergeQuotesWithQuoteFiles(quotesData, files);

    expect(merged.tenders[10].quotes[99].zip).toBe('/download/quote/1/10/99/5');
  });

  it('prefers quoteFiles zip when present', () => {
    const quotesData = {
      tenders: {
        10: {
          id: 10,
          quotes: {
            99: { id: 99, zip: '/old' },
          },
        },
      },
    };
    const files = {
      10: { 99: '/new-from-files' },
    };

    const merged = mergeQuotesWithQuoteFiles(quotesData, files);

    expect(merged.tenders[10].quotes[99].zip).toBe('/new-from-files');
  });

  it('returns quotesData unchanged when files is empty', () => {
    const quotesData = { tenders: { 1: { quotes: {} } } };
    expect(mergeQuotesWithQuoteFiles(quotesData, {})).toBe(quotesData);
  });

  it('populates filesMeta from documents keyed by tender and quote id', () => {
    const quotesData = {
      tenders: {
        10: {
          id: 10,
          quotes: {
            99: { id: 99 },
            100: { id: 100 },
          },
        },
      },
    };
    const documents = {
      10: {
        99: {
          count: 2,
          documents: [
            { id: 1, name: 'a.pdf' },
            { id: 2, name: 'b.pdf' },
          ],
        },
      },
    };

    const merged = mergeQuotesWithQuoteFiles(quotesData, {}, documents);

    expect(merged.tenders[10].quotes[99].filesMeta).toEqual(documents[10][99]);
    expect(merged.tenders[10].quotes[100].filesMeta).toBeNull();
  });
});
