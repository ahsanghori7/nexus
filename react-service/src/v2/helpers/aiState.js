import resolveQuoteZip from './resolveQuoteZip';

// Helper function to check eligibility for AI analysis
const checkAIEligibility = (
    quotes,
    hasBoq,
    quoteFilesByTender = null,
    tenderId = null,
) => {
    const totalQuotes = Object.keys(quotes || {}).length;
    const withDocs = Object.values(quotes || {}).filter((fq) =>
        resolveQuoteZip(quoteFilesByTender, tenderId, fq),
    ).length;
    const hasBoQ = hasBoq || Object.values(quotes || {}).some((q) => q.has_boq_quotes);

    if (totalQuotes === 0) {
        return { aiState: 'empty', reasons: [] };
    }

    // Check all eligibility conditions
    const reasons = [];
    if (hasBoQ) reasons.push('boq');
    if (totalQuotes > 5) reasons.push('max_quotes');
    if (totalQuotes < 2) reasons.push('insufficient_quotes');
    if (withDocs < totalQuotes) reasons.push('missing_docs');

    const aiState = reasons.length > 0 ? 'ineligible' : 'eligible';

    return { aiState, reasons };
};

export default checkAIEligibility;
