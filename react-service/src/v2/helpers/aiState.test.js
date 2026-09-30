import checkAIEligibility from './aiState';

describe('checkAIEligibility', () => {
    it('returns "empty" with no reasons when no quotes are provided', () => {
        expect(checkAIEligibility({}, false)).toEqual({ aiState: 'empty', reasons: [] });
        expect(checkAIEligibility(null, false)).toEqual({ aiState: 'empty', reasons: [] });
    });
    it('returns "eligible" with no reasons when all conditions are met', () => {
        const validQuotes = {
            quote1: { zip: true },
            quote2: { zip: true },
            quote3: { zip: true }
        };
        expect(checkAIEligibility(validQuotes, false)).toEqual({ aiState: 'eligible', reasons: [] });
    });
    it('returns "ineligible" with missing_docs reason when quotes lack documents', () => {
        const quotes = {
            quote1: { zip: true },
            quote2: { zip: false },
            quote3: { zip: false }
        };
        expect(checkAIEligibility(quotes, false)).toEqual({ 
            aiState: 'ineligible', 
            reasons: ['missing_docs'] 
        });
    });
    it('returns "ineligible" with max_quotes reason when there are more than 5 quotes', () => {
        const tooManyQuotes = {
            quote1: { zip: true },
            quote2: { zip: true },
            quote3: { zip: true },
            quote4: { zip: true },
            quote5: { zip: true },
            quote6: { zip: true }
        };
        expect(checkAIEligibility(tooManyQuotes, false)).toEqual({ 
            aiState: 'ineligible', 
            reasons: ['max_quotes'] 
        });
    });
    it('returns "ineligible" with boq reason when hasBoq is true', () => {
        const validQuotes = {
            quote1: { zip: true },
            quote2: { zip: true }
        };
        expect(checkAIEligibility(validQuotes, true)).toEqual({ 
            aiState: 'ineligible', 
            reasons: ['boq'] 
        });
    });
    it('returns "ineligible" with boq reason when quotes contain has_boq_quotes', () => {
        const quotesWithBoq = {
            quote1: { zip: true, has_boq_quotes: true },
            quote2: { zip: true }
        };
        expect(checkAIEligibility(quotesWithBoq, false)).toEqual({ 
            aiState: 'ineligible', 
            reasons: ['boq'] 
        });
    });
    it('returns "ineligible" with insufficient_quotes reason when less than 2 total quotes', () => {
        const singleQuote = {
            quote1: { zip: true }
        };
        expect(checkAIEligibility(singleQuote, false)).toEqual({ 
            aiState: 'ineligible', 
            reasons: ['insufficient_quotes'] 
        });
    });
    it('returns multiple reasons when multiple conditions are not met', () => {
        const problematicQuotes = {
            quote1: { zip: false, has_boq_quotes: true }
        };
        expect(checkAIEligibility(problematicQuotes, false)).toEqual({ 
            aiState: 'ineligible', 
            reasons: ['boq', 'insufficient_quotes', 'missing_docs'] 
        });
    });
});