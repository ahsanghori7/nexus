import resolveQuoteZip from './resolveQuoteZip';
import checkAIEligibility from './aiState';

describe('resolveQuoteZip', () => {
  it('returns zip on quote when quoteFiles has no entry yet', () => {
    expect(
      resolveQuoteZip({ 10: {} }, 10, { id: 99, zip: '/download/quote/1/10/99/5' }),
    ).toBe('/download/quote/1/10/99/5');
  });

  it('reads zip from quoteFiles by transaction id', () => {
    expect(
      resolveQuoteZip(
        { 10: { 99: '/from-files' } },
        10,
        { id: 99, zip: '/on-quote' },
      ),
    ).toBe('/from-files');
  });
});

describe('checkAIEligibility with quoteFiles', () => {
  it('returns eligible when quoteFiles provides docs for all quotes', () => {
    const quotes = {
      1: { id: 1 },
      2: { id: 2 },
    };
    const quoteFiles = {
      99: {
        1: '/download/1',
        2: '/download/2',
      },
    };

    expect(checkAIEligibility(quotes, false, quoteFiles, 99)).toEqual({
      aiState: 'eligible',
      reasons: [],
    });
  });
});
