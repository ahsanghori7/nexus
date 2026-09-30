import isEmpty from 'lodash/isEmpty';
import resolveQuoteZip from 'v2/helpers/resolveQuoteZip';

/**
 * Merges per-quote download URLs from quoteFiles and per-file metadata from
 * quoteDocuments into tenders/quotes. Preserves zip already on the quote
 * (e.g. immediately after postQuote) when quoteFiles has not been refreshed yet.
 */
const mergeQuotesWithQuoteFiles = (quotesData, files, documents) => {
  if (isEmpty(files) && isEmpty(documents)) {
    return quotesData;
  }

  const newQuotes = { ...quotesData };
  const originalTendersFromProps = quotesData?.tenders || {};
  const newTenders = {};

  Object.keys(originalTendersFromProps).forEach((tenderId) => {
    const originalTender = originalTendersFromProps[tenderId];
    newTenders[tenderId] = { ...originalTender };

    const originalQuotes = originalTender?.quotes || {};
    newTenders[tenderId].quotes = { ...(originalQuotes || {}) };

    Object.keys(originalQuotes).forEach((quoteId) => {
      const originalQuote = originalQuotes[quoteId];
      const zip = resolveQuoteZip(files, tenderId, originalQuote);
      const filesMeta = documents?.[tenderId]?.[quoteId] ?? null;

      newTenders[tenderId].quotes[quoteId] = {
        ...originalQuote,
        zip,
        filesMeta,
      };
    });
  });

  newQuotes.tenders = newTenders;
  return newQuotes;
};

export default mergeQuotesWithQuoteFiles;
