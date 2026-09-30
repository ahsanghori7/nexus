import reducer, { resetQuotesTender } from './index';

describe('quotes-tender reducer', () => {
  const initialState = {
    quotesData: {},
    quoteFiles: {},
    quoteDocuments: {},
    loading: false,
    loadingQuotes: false,
    error: false,
  };

  it('should handle initial state', () => {
    const newState = reducer(undefined, { type: 'unknown' });
    expect(newState).toEqual(initialState);
  });

  describe('resetQuotesTender', () => {
    it('should reset all state to initial values', () => {
      const modifiedState = {
        quotesData: { 1: { id: 1, name: 'Quote 1' } },
        quoteFiles: { 1: { id: 1, file: 'file1.pdf' } },
        quoteDocuments: { 1: { 10: { count: 1, documents: [] } } },
        loading: true,
        loadingQuotes: true,
        error: true,
      };

      const newState = reducer(modifiedState, resetQuotesTender());

      expect(newState).toEqual(initialState);
    });

    it('should reset quotesData to empty object', () => {
      const state = {
        ...initialState,
        quotesData: { 1: { id: 1 }, 2: { id: 2 } },
      };

      const newState = reducer(state, resetQuotesTender());

      expect(newState.quotesData).toEqual({});
    });

    it('should reset quoteFiles to empty object', () => {
      const state = {
        ...initialState,
        quoteFiles: { file1: 'data1', file2: 'data2' },
      };

      const newState = reducer(state, resetQuotesTender());

      expect(newState.quoteFiles).toEqual({});
    });

    it('should reset quoteDocuments to empty object', () => {
      const state = {
        ...initialState,
        quoteDocuments: { 1: { 10: { count: 1, documents: [] } } },
      };

      const newState = reducer(state, resetQuotesTender());

      expect(newState.quoteDocuments).toEqual({});
    });

    it('should reset loading flags to false', () => {
      const state = {
        ...initialState,
        loading: true,
        loadingQuotes: true,
      };

      const newState = reducer(state, resetQuotesTender());

      expect(newState.loading).toBe(false);
      expect(newState.loadingQuotes).toBe(false);
    });

    it('should reset error flag to false', () => {
      const state = {
        ...initialState,
        error: true,
      };

      const newState = reducer(state, resetQuotesTender());

      expect(newState.error).toBe(false);
    });
  });
});
