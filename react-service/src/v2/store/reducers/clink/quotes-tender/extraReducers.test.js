import { produce } from 'immer';
import extraReducers from './extraReducers';
import {
  fetchQuoteFiles,
  fetchQuoteDocuments,
  fetchQuotes,
  postQuote,
  editQuote,
  toggleCompliant,
  deleteQuote,
  withdrawAward,
  award,
  toggledSelected,
  updateProjectTender,
} from './asyncThunk';

// Mock the normalizeFormValues helper
jest.mock('v1/quotes-tender/helpers/price', () => ({
  normaliseFormValues: jest.fn((values) => values),
}));

describe('quotes-tender extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      quotesData: {
        tenders: {}
      },
      quoteFiles: {},
      quoteDocuments: {},
      loading: false,
      loadingQuotes: false,
      error: false,
    };
  });

  describe('fetchQuoteDocuments actions', () => {
    test('should store payload for fetchQuoteDocuments.fulfilled', () => {
      const mockPayload = {
        1: { 10: { count: 1, documents: [{ id: 5, name: 'quote.pdf', quote_version: 1, created_at: '2026-06-28 10:12:33' }] } },
      };
      const action = {
        type: fetchQuoteDocuments.fulfilled.type,
        payload: mockPayload,
      };

      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuoteDocuments.fulfilled.type](draft, action);
      });

      expect(state.quoteDocuments).toEqual(mockPayload);
    });

    test('should clear quoteDocuments when payload is an empty array', () => {
      // The backend serialises "no captured files" as an empty JSON array
      initialState.quoteDocuments = { 1: { 10: { count: 1, documents: [] } } };
      const action = {
        type: fetchQuoteDocuments.fulfilled.type,
        payload: [],
      };

      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuoteDocuments.fulfilled.type](draft, action);
      });

      expect(state.quoteDocuments).toEqual({});
    });

    test('should ignore numeric payload for fetchQuoteDocuments.fulfilled', () => {
      initialState.quoteDocuments = { 1: { 10: { count: 1, documents: [] } } };
      const action = {
        type: fetchQuoteDocuments.fulfilled.type,
        payload: 400,
      };

      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuoteDocuments.fulfilled.type](draft, action);
      });

      expect(state.quoteDocuments).toEqual({});
    });

    test('should clear quoteDocuments on fetchQuoteDocuments.rejected', () => {
      initialState.quoteDocuments = { 1: { 10: { count: 1, documents: [] } } };
      const action = { type: fetchQuoteDocuments.rejected.type };

      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuoteDocuments.rejected.type](draft, action);
      });

      expect(state.quoteDocuments).toEqual({});
    });
  });

  describe('fetchQuoteFiles actions', () => {
    test('should handle fetchQuoteFiles.pending without toggling page loading', () => {
      // Arrange
      const action = { type: fetchQuoteFiles.pending.type };
      initialState.loading = false;

      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuoteFiles.pending.type](draft, action);
      });

      // Assert
      expect(state.loading).toBe(false);
    });

    test('should handle fetchQuoteFiles.fulfilled', () => {
      // Arrange
      const mockPayload = { 1: { quote1: 'data' }, 2: { quote2: 'data' } };
      const action = { 
        type: fetchQuoteFiles.fulfilled.type,
        payload: mockPayload 
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuoteFiles.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quoteFiles).toEqual(mockPayload);
    });

    test('should ignore numeric payload for fetchQuoteFiles.fulfilled', () => {
      // Arrange
      initialState.quoteFiles = { 1: { 10: '/download/quote/1' } };
      const action = {
        type: fetchQuoteFiles.fulfilled.type,
        payload: 400,
      };

      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuoteFiles.fulfilled.type](draft, action);
      });

      // Assert
      expect(state.quoteFiles).toEqual({});
      expect(state.loading).toBe(false);
    });

    test('should handle fetchQuoteFiles.rejected without toggling page loading', () => {
      const action = { type: fetchQuoteFiles.rejected.type };
      initialState.loading = true;

      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuoteFiles.rejected.type](draft, action);
      });

      expect(state.loading).toBe(true);
    });
  });

  describe('fetchQuotes actions', () => {
    test('should handle fetchQuotes.pending', () => {
      // Arrange
      const action = { type: fetchQuotes.pending.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuotes.pending.type](draft, action);
      });
      
      // Assert
      expect(state.loading).toBe(true);
      expect(state.loadingQuotes).toBe(true);
      expect(state.error).toBe(false);
    });

    test('should handle fetchQuotes.fulfilled', () => {
      // Arrange
      const mockPayload = { quotes: [{ id: 1, name: 'quote1' }] };
      const action = { 
        type: fetchQuotes.fulfilled.type,
        payload: mockPayload 
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuotes.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quotesData).toEqual(mockPayload);
      expect(state.loading).toBe(false);
      expect(state.loadingQuotes).toBe(false);
      expect(state.error).toBe(false);
    });

    test('should hydrate subcontractor from root subcontractors map into each quote', () => {
      // Arrange — new API shape: subcontractor removed from quotes, added to root map
      const mockPayload = {
        name: 'Test Project',
        subcontractors: {
          17446: { id: 17446, name: 'APO CONSULTANTS LTD', email: 'apo@example.com', type_id: 3 },
          21734: { id: 21734, name: 'TYLIN CAE LIMITED', email: 'tylin@example.com', type_id: 3 },
        },
        tenders: {
          43380: {
            id: 43380,
            label: '3d Laser Scanning Survey',
            quotes: {
              10027: { id: 10027, subcontractor_id: 17446, price: 4400 },
            },
          },
          42755: {
            id: 42755,
            label: 'Dry-Lining',
            quotes: {
              10042: { id: 10042, subcontractor_id: 21734, price: 444400 },
              10044: { id: 10044, subcontractor_id: 21734, price: 7678600 },
            },
          },
          43788: {
            id: 43788,
            label: '3D Modelling',
            quotes: [],
          },
        },
      };
      const action = { type: fetchQuotes.fulfilled.type, payload: mockPayload };

      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuotes.fulfilled.type](draft, action);
      });

      // Assert — each quote should have its subcontractor object hydrated
      expect(state.quotesData.tenders[43380].quotes[10027].subcontractor).toEqual({
        id: 17446,
        name: 'APO CONSULTANTS LTD',
        email: 'apo@example.com',
        type_id: 3,
      });
      expect(state.quotesData.tenders[42755].quotes[10042].subcontractor).toEqual({
        id: 21734,
        name: 'TYLIN CAE LIMITED',
        email: 'tylin@example.com',
        type_id: 3,
      });
      expect(state.quotesData.tenders[42755].quotes[10044].subcontractor).toEqual({
        id: 21734,
        name: 'TYLIN CAE LIMITED',
        email: 'tylin@example.com',
        type_id: 3,
      });
      // Tender with empty-array quotes should pass through unchanged
      expect(state.quotesData.tenders[43788].quotes).toEqual([]);
      expect(state.error).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.loadingQuotes).toBe(false);
    });

    test('should preserve embedded subcontractor when no root subcontractors map (old API)', () => {
      // Arrange — old API shape: subcontractor embedded directly in each quote
      const embeddedSubcontractor = { id: 99, name: 'Legacy Sub', type_id: 3 };
      const mockPayload = {
        tenders: {
          1: {
            quotes: {
              10: {
                id: 10,
                subcontractor_id: 99,
                subcontractor: embeddedSubcontractor,
                price: 1000,
              },
            },
          },
        },
      };
      const action = { type: fetchQuotes.fulfilled.type, payload: mockPayload };

      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuotes.fulfilled.type](draft, action);
      });

      // Assert — embedded subcontractor is preserved unchanged
      expect(state.quotesData.tenders[1].quotes[10].subcontractor).toEqual(
        embeddedSubcontractor,
      );
      expect(state.error).toBe(false);
    });

    test('should ignore numeric payload for fetchQuotes.fulfilled', () => {
      // Arrange
      initialState.quotesData = { tenders: { 1: { quotes: {} } } };
      const action = {
        type: fetchQuotes.fulfilled.type,
        payload: 500,
      };

      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuotes.fulfilled.type](draft, action);
      });

      // Assert
      expect(state.quotesData).toEqual({});
      expect(state.loading).toBe(false);
      expect(state.loadingQuotes).toBe(false);
      expect(state.error).toBe(true);
    });

    test('should handle fetchQuotes.rejected', () => {
      // Arrange
      const action = { type: fetchQuotes.rejected.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuotes.rejected.type](draft, action);
      });
      
      // Assert
      expect(state.loading).toBe(false);
      expect(state.loadingQuotes).toBe(false);
      expect(state.error).toBe(true);
    });
  });

  describe('postQuote actions', () => {
    test('should handle postQuote.pending', () => {
      // Arrange
      const action = { type: postQuote.pending.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[postQuote.pending.type](draft, action);
        return result;
      });
      
      // Assert
      // The reducer returns undefined for pending, so state should be unchanged
      expect(state).toEqual(initialState);
    });

    test('should handle postQuote.fulfilled with new quote', () => {
      // Arrange
      const serverQuote = {
        id: 123,
        tender_id: 1,
        subcontractor_id: 456,
        type_id: 1,
        zip: 'https://example.com/original.zip',
        tender: {
          id: 1,
          project_id: 2,
          label: 'Test tender',
        },
        subcontractor: {
          id: '456',
          name: 'Test Subcontractor',
        },
      };
      const mockPayload = { data: serverQuote };
      const mockMeta = { 
        arg: { 
          tid: 1,
        } 
      };
      const action = { 
        type: postQuote.fulfilled.type,
        payload: mockPayload,
        meta: mockMeta
      };

      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[postQuote.fulfilled.type](draft, action);
      });

      // Assert
      expect(state.quotesData.tenders[1]).toBeDefined();
      expect(state.quotesData.tenders[1].quotes[123]).toBeDefined();
      expect(state.quotesData.tenders[1].quotes[123].zip).toBe(
        'https://example.com/original.zip',
      );
      expect(state.quoteFiles[1]).toBeDefined();
      expect(state.quoteFiles[1][123]).toEqual('https://example.com/original.zip');
      // subcontractor should be normalised
      expect(state.quotesData.tenders[1].quotes[123].subcontractor).toEqual(
        expect.objectContaining({
          id: '456',
          type_id: 1,
          name: 'Test Subcontractor',
        }),
      );
    });

    test('should handle postQuote.fulfilled without quote id', () => {
      // Arrange
      const mockPayload = { data: null };
      const mockMeta = { 
        arg: { 
          tid: 1,
        } 
      };
      const action = { 
        type: postQuote.fulfilled.type,
        payload: mockPayload,
        meta: mockMeta
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[postQuote.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quoteFiles).toEqual({});
    });

    test('should handle postQuote.fulfilled when payload is bare quote object', () => {
      // Arrange
      const serverQuote = {
        id: 999,
        tender_id: 10,
        subcontractor_id: 777,
        zip: 'https://example.com/original.zip',
        tender: {
          id: 10,
          project_id: 20,
        },
      };
      const mockMeta = {
        arg: {
          tid: 10,
        },
      };
      const action = {
        type: postQuote.fulfilled.type,
        payload: serverQuote,
        meta: mockMeta,
      };

      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[postQuote.fulfilled.type](draft, action);
      });

      // Assert
      expect(state.quotesData.tenders[10].quotes[999]).toBeDefined();
      expect(state.quotesData.tenders[10].quotes[999].zip).toBe(
        'https://example.com/original.zip',
      );
      expect(state.quoteFiles[10][999]).toBe('https://example.com/original.zip');
    });

    test('should handle addQuote response shape with S3 zip for immediate AI eligibility', () => {
      const serverQuote = {
        id: 12633,
        tender_id: 56489,
        subcontractor_id: 21638,
        zip: 'https://clink-assets.s3.eu-west-2.amazonaws.com/staging/projects/24349/tenders/56489/transactions/12633/quotes/21638.zip',
        tender: {
          id: 56489,
          project_id: 24349,
          label: 'Above Ground Drainage',
        },
        subcontractor: { id: '21638', name: 'AB ADDITIVE LTD' },
      };
      const action = {
        type: postQuote.fulfilled.type,
        payload: serverQuote,
        meta: { arg: { tid: 56489 } },
      };

      const state = produce(initialState, (draft) => {
        extraReducers[postQuote.fulfilled.type](draft, action);
      });

      expect(state.quotesData.tenders[56489].quotes[12633].zip).toBe(serverQuote.zip);
      expect(state.quoteFiles[56489][12633]).toBe(serverQuote.zip);
    });

    test('should not generate download url when zip is null', () => {
      // Arrange
      const serverQuote = {
        id: 555,
        tender_id: 9,
        subcontractor_id: 888,
        zip: null,
        tender: {
          id: 9,
          project_id: 99,
        },
      };
      const action = {
        type: postQuote.fulfilled.type,
        payload: { data: serverQuote },
        meta: { arg: { tid: 9 } },
      };

      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[postQuote.fulfilled.type](draft, action);
      });

      // Assert
      expect(state.quotesData.tenders[9].quotes[555]).toBeDefined();
      expect(state.quotesData.tenders[9].quotes[555].zip).toBeNull();
      expect(state.quoteFiles[9]?.[555]).toBeUndefined();
    });

    test('should handle postQuote.rejected', () => {
      // Arrange
      const action = { type: postQuote.rejected.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[postQuote.rejected.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });
  });

  describe('editQuote actions', () => {
    test('should handle editQuote.pending', () => {
      // Arrange
      const action = { type: editQuote.pending.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[editQuote.pending.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });

    test('should handle editQuote.fulfilled', () => {
      // Arrange
      const mockMeta = {
        arg: {
          tid: 123,
          tenderId: 1,
          order: {
            price: 1000,
            measured_work: 500
          }
        }
      };
      const action = { 
        type: editQuote.fulfilled.type,
        meta: mockMeta
      };
      
      // Set up initial state with existing quote
      initialState.quotesData.tenders[1] = {
        quotes: {
          123: {
            id: 123,
            price: 800,
            measured_work: 300,
            compliant: 1
          }
        }
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[editQuote.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quotesData.tenders[1].quotes[123].price).toBe(1000);
      expect(state.quotesData.tenders[1].quotes[123].measured_work).toBe(500);
      expect(state.quotesData.tenders[1].quotes[123].compliant).toBe(1); // Should preserve existing properties
    });

    test('should handle editQuote.rejected', () => {
      // Arrange
      const action = { type: editQuote.rejected.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[editQuote.rejected.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });
  });

  describe('toggleCompliant actions', () => {
    test('should handle toggleCompliant.pending', () => {
      // Arrange
      const action = { type: toggleCompliant.pending.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[toggleCompliant.pending.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });

    test('should handle toggleCompliant.fulfilled', () => {
      // Arrange
      const mockPayload = { success: true };
      const mockMeta = {
        arg: {
          id: 123,
          tenderId: 1,
          data: { toggle: 0 }
        }
      };
      const action = { 
        type: toggleCompliant.fulfilled.type,
        payload: mockPayload,
        meta: mockMeta
      };
      
      // Set up initial state with existing quote
      initialState.quotesData.tenders[1] = {
        quotes: {
          123: {
            id: 123,
            compliant: 1,
            price: 1000
          }
        }
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[toggleCompliant.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quotesData.tenders[1].quotes[123].compliant).toBe(0);
      expect(state.quotesData.tenders[1].quotes[123].price).toBe(1000); // Should preserve other properties
    });

    test('should handle toggleCompliant.rejected', () => {
      // Arrange
      const action = { type: toggleCompliant.rejected.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[toggleCompliant.rejected.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });
  });

  describe('deleteQuote actions', () => {
    test('should handle deleteQuote.pending', () => {
      // Arrange
      const action = { type: deleteQuote.pending.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[deleteQuote.pending.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });

    test('should handle deleteQuote.fulfilled', () => {
      // Arrange
      const mockPayload = { success: true };
      const mockMeta = {
        arg: {
          tid: 123,
          tenderId: 1
        }
      };
      const action = { 
        type: deleteQuote.fulfilled.type,
        payload: mockPayload,
        meta: mockMeta
      };
      
      // Set up initial state with existing quote
      initialState.quotesData.tenders[1] = {
        quotes: {
          123: {
            id: 123,
            price: 1000
          },
          456: {
            id: 456,
            price: 2000
          }
        }
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[deleteQuote.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quotesData.tenders[1].quotes[123]).toBeUndefined();
      expect(state.quotesData.tenders[1].quotes[456]).toBeDefined(); // Should preserve other quotes
    });

    test('should handle deleteQuote.rejected', () => {
      // Arrange
      const action = { type: deleteQuote.rejected.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[deleteQuote.rejected.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });
  });

  describe('award actions', () => {
    test('should handle award.pending', () => {
      // Arrange
      const action = { type: award.pending.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[award.pending.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });

    test('should handle award.fulfilled', () => {
      // Arrange
      const mockPayload = { success: true };
      const mockMeta = {
        arg: {
          tid: 1,
          id: 123,
          data: {
            order_value: '5000',
            order_date: '2023-12-01'
          }
        }
      };
      const action = { 
        type: award.fulfilled.type,
        payload: mockPayload,
        meta: mockMeta
      };
      
      // Set up initial state with existing tender and quote
      initialState.quotesData.tenders[1] = {
        awarded: 0,
        quotes: {
          123: {
            id: 123,
            awarded: false,
            price: 1000
          }
        }
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[award.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quotesData.tenders[1].awarded).toBe(1);
      expect(state.quotesData.tenders[1].quotes[123].awarded).toBe(true);
      expect(state.quotesData.tenders[1].quotes[123].order_price).toBe('5000'); // normaliseFormValues returns string
      expect(state.quotesData.tenders[1].quotes[123].order_date).toBe('2023-12-01');
    });

    test('should handle award.rejected', () => {
      // Arrange
      const action = { type: award.rejected.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[award.rejected.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });
  });

  describe('withdrawAward actions', () => {
    test('should handle withdrawAward.pending', () => {
      // Arrange
      const action = { type: withdrawAward.pending.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[withdrawAward.pending.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });

    test('should handle withdrawAward.fulfilled', () => {
      // Arrange
      const mockPayload = { success: true };
      const mockMeta = {
        arg: {
          tid: 1,
          id: 123
        }
      };
      const action = { 
        type: withdrawAward.fulfilled.type,
        payload: mockPayload,
        meta: mockMeta
      };
      
      // Set up initial state with awarded tender and quote
      initialState.quotesData.tenders[1] = {
        awarded: 1,
        quotes: {
          123: {
            id: 123,
            awarded: true,
            order_price: 5000,
            order_date: '2023-12-01'
          }
        }
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[withdrawAward.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quotesData.tenders[1].awarded).toBe(0);
      expect(state.quotesData.tenders[1].quotes[123].awarded).toBe(false);
      expect(state.quotesData.tenders[1].quotes[123].order_price).toBe(null);
      expect(state.quotesData.tenders[1].quotes[123].order_date).toBe(null);
    });

    test('should handle withdrawAward.rejected', () => {
      // Arrange
      const action = { type: withdrawAward.rejected.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[withdrawAward.rejected.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });
  });

  describe('toggledSelected actions', () => {
    test('should handle toggledSelected.pending', () => {
      // Arrange
      const action = { type: toggledSelected.pending.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[toggledSelected.pending.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });

    test('should handle toggledSelected.fulfilled', () => {
      // Arrange
      const mockPayload = { success: true };
      const mockMeta = {
        arg: {
          id: 123,
          tenderId: 1,
          data: { toggle: 1 }
        }
      };
      const action = { 
        type: toggledSelected.fulfilled.type,
        payload: mockPayload,
        meta: mockMeta
      };
      
      // Set up initial state with existing quote
      initialState.quotesData.tenders[1] = {
        quotes: {
          123: {
            id: 123,
            price_selected: 0,
            price: 1000
          }
        }
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[toggledSelected.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quotesData.tenders[1].quotes[123].price_selected).toBe(1);
      expect(state.quotesData.tenders[1].quotes[123].price).toBe(1000); // Should preserve other properties
    });

    test('should handle toggledSelected.rejected', () => {
      // Arrange
      const action = { type: toggledSelected.rejected.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[toggledSelected.rejected.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });
  });

  describe('updateProjectTender actions', () => {
    test('should handle updateProjectTender.pending', () => {
      // Arrange
      const action = { type: updateProjectTender.pending.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[updateProjectTender.pending.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });

    test('should handle updateProjectTender.fulfilled', () => {
      // Arrange
      const mockPayload = { success: true };
      const mockMeta = {
        arg: {
          tid: 1,
          data: { budget: '10000' }
        }
      };
      const action = { 
        type: updateProjectTender.fulfilled.type,
        payload: mockPayload,
        meta: mockMeta
      };
      
      // Set up initial state with existing tender
      initialState.quotesData.tenders[1] = {
        budget: 5000,
        quotes: {}
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[updateProjectTender.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quotesData.tenders[1].budget).toBe(10000);
    });

    test('should handle updateProjectTender.rejected', () => {
      // Arrange
      const action = { type: updateProjectTender.rejected.type };
      
      // Act
      const state = produce(initialState, (draft) => {
        const result = extraReducers[updateProjectTender.rejected.type](draft, action);
        return result;
      });
      
      // Assert
      expect(state).toEqual(initialState);
    });
  });

  describe('Edge cases', () => {
    test('should handle actions with missing payload', () => {
      // Arrange
      const action = { 
        type: fetchQuotes.fulfilled.type,
        payload: undefined 
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[fetchQuotes.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quotesData).toEqual({});
      expect(state.loading).toBe(false);
      expect(state.loadingQuotes).toBe(false);
      expect(state.error).toBe(true);
    });

    test('should handle postQuote.fulfilled with malformed payload', () => {
      // Arrange
      const mockPayload = { wrongProperty: 'value' };
      const mockMeta = { 
        arg: { 
          tid: 1, 
          pid: 2, 
          data: { name: 'test quote' } 
        } 
      };
      const action = { 
        type: postQuote.fulfilled.type,
        payload: mockPayload,
        meta: mockMeta
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[postQuote.fulfilled.type](draft, action);
      });
      
      // Assert
      expect(state.quoteFiles).toEqual({});
    });

    test('should handle actions when success is false', () => {
      // Arrange
      const mockPayload = { success: false };
      const mockMeta = {
        arg: {
          id: 123,
          tenderId: 1,
          data: { toggle: 0 }
        }
      };
      const action = { 
        type: toggleCompliant.fulfilled.type,
        payload: mockPayload,
        meta: mockMeta
      };
      
      // Set up initial state with existing quote
      initialState.quotesData.tenders[1] = {
        quotes: {
          123: {
            id: 123,
            compliant: 1,
            price: 1000
          }
        }
      };
      
      // Act
      const state = produce(initialState, (draft) => {
        extraReducers[toggleCompliant.fulfilled.type](draft, action);
      });
      
      // Assert
      // Should not modify quote when success is false
      expect(state.quotesData.tenders[1].quotes[123].compliant).toBe(1);
    });
  });
});