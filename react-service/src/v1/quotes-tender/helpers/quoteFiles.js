/**
 * Summarise a quote's captured file metadata for table display.
 * `filesMeta` is one entry of the quoteDocuments store map:
 *   { count, documents: [{ id, name, quote_version, created_at }] }
 * Returns null when the quote has no captured files (uploads that predate
 * per-file capture only exist inside the merged zip).
 */
const getQuoteFilesSummary = (filesMeta) => {
  const documents = filesMeta?.documents;
  if (!Array.isArray(documents) || documents.length === 0) {
    return null;
  }

  const names = documents.map((doc) => doc.name);
  // created_at is 'YYYY-MM-DD HH:mm:ss', so lexicographic sort orders correctly.
  const latestUpload = documents
    .map((doc) => doc.created_at)
    .sort((a, b) => a.localeCompare(b))
    .at(-1);

  return {
    primaryName: names[0],
    extraCount: names.length - 1,
    names,
    latestUpload,
  };
};

export default getQuoteFilesSummary;
