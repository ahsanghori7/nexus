/**
 * Resolve a quote document URL from merged quote data and/or quoteFiles map.
 * quoteFiles keys are tender id -> transaction id -> download path.
 */
const resolveQuoteZip = (quoteFilesByTender, tenderId, quote) => {
  if (!quote) {
    return null;
  }

  const tid = tenderId ?? quote.tender_id;
  const filesForTender =
    tid != null
      ? quoteFilesByTender?.[tid] ?? quoteFilesByTender?.[String(tid)]
      : null;

  if (filesForTender) {
    const qid = quote.id;
    if (qid != null) {
      const byQuoteId = filesForTender[qid] ?? filesForTender[String(qid)];
      if (byQuoteId) {
        return byQuoteId;
      }
    }

    const sid = quote.subcontractor?.id ?? quote.subcontractor_id;
    if (sid != null) {
      const bySubcontractor = filesForTender[sid] ?? filesForTender[String(sid)];
      if (bySubcontractor) {
        return bySubcontractor;
      }
    }
  }

  return quote.zip || null;
};

export default resolveQuoteZip;
