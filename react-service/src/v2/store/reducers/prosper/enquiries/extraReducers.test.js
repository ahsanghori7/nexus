import extraReducers, {
  fetchEnquiries,
  changeStatus,
  createQuote,
  tenderIsDownloaded,
  fetchDocumentsHistory,
} from './extraReducers';
import { processTenderDates } from 'v2/helpers/date';

// Mock external dependencies
jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
  postFormData: jest.fn(),
  patchData: jest.fn(),
}));
jest.mock('services/httpHelper', () => jest.fn());
jest.mock('v2/helpers/date', () => ({
  processTenderDates: jest.fn((payload) => payload),
}));
jest.mock('v2/helpers/flags', () => jest.fn((key) => {
  if (key === 'PROSPER_ENQUIRIES_MUI_PAGINATION') {
    return 6;
  }
  return undefined;
}));
jest.mock('moment', () => {
  const momentMock = jest.fn(() => ({
    format: jest.fn(() => '2023-01-01 12:00'),
  }));
  momentMock.utc = jest.fn(() => momentMock());
  return momentMock;
});
jest.mock('lodash/capitalize', () => jest.fn((str) => str.toUpperCase()));
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    if (key === 'currency') {
      return '£';
    }
    if (key === 'text-tender-returned') {
      return 'text-tender-returned';
    }
    return key;
  }),
}));

describe('prosper enquiries extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      status: '',
      latest: [],
      current: [],
      total: [],
      documents: [],
    };
    jest.clearAllMocks();
  });

  // Test fetchEnquiries
  describe('fetchEnquiries', () => {
    it('should handle pending state correctly', () => {
      extraReducers[fetchEnquiries.pending](initialState);
      expect(initialState.status).toBe('loading');
    });

    it('should handle fulfilled state correctly with array payload', () => {
      const payload = [
        { id: 1, size: '£100', employer_liabilty_insurance: '£50' },
        { id: 2, size: '£200', employer_liabilty_insurance: '£75' },
        { id: 3, size: '£300', employer_liabilty_insurance: '£100' },
        { id: 4, size: '£400', employer_liabilty_insurance: '£125' },
        { id: 5, size: '£500', employer_liabilty_insurance: '£150' },
        { id: 6, size: '£600', employer_liabilty_insurance: '£175' },
        { id: 7, size: '£700', employer_liabilty_insurance: '£200' },
      ];
      processTenderDates.mockReturnValue(payload); // Mock the transformation
      extraReducers[fetchEnquiries.fulfilled](initialState, { payload });
      expect(initialState.status).toBe('');
      expect(initialState.latest.length).toBe(7);
      expect(initialState.current.length).toBe(6);
      expect(initialState.total.length).toBe(1);
      expect(initialState.latest[0].size).toBe('£100'); // Check if replaceAll was called
      expect(initialState.latest[0].employer_liabilty_insurance).toBe('£50');
    });

    it('should handle fulfilled state correctly with non-array payload', () => {
      const payload = null;
      extraReducers[fetchEnquiries.fulfilled](initialState, { payload });
      expect(initialState.status).toBe('');
      expect(initialState.latest).toEqual([]);
      expect(initialState.current).toEqual([]);
      expect(initialState.total).toEqual([]);
    });

    it('should handle rejected state correctly', () => {
      extraReducers[fetchEnquiries.rejected](initialState);
      expect(initialState.status).toBe('error');
      expect(initialState.latest).toEqual([]);
    });
  });

  // Test changeStatus
  describe('changeStatus', () => {
    beforeEach(() => {
      initialState.latest = [
        { id: 1, status_id: 1, status: 'Open' },
        { id: 2, status_id: 2, status: 'Pending' },
      ];
      initialState.current = [
        { id: 1, status_id: 1, status: 'Open' },
        { id: 2, status_id: 2, status: 'Pending' },
      ];
    });

    it('should handle pending state correctly', () => {
      extraReducers[changeStatus.pending](initialState);
      expect(initialState.status).toBe('loading');
    });

    it('should handle fulfilled state correctly', () => {
      const meta = { arg: { enquiryId: 1, status: { id: 3, label: 'Closed' } } };
      extraReducers[changeStatus.fulfilled](initialState, { meta });
      expect(initialState.status).toBe('');
      expect(initialState.latest[0].status_id).toBe(3);
      expect(initialState.latest[0].status).toBe('Closed');
      expect(initialState.current[0].status_id).toBe(3);
      expect(initialState.current[0].status).toBe('Closed');
      expect(initialState.latest[1].status_id).toBe(2); // Other enquiries should remain unchanged
    });

    it('should handle rejected state correctly', () => {
      extraReducers[changeStatus.rejected](initialState);
      expect(initialState.status).toBe('error');
      expect(initialState.latest).toEqual([
        { id: 1, status_id: 1, status: 'Open' },
        { id: 2, status_id: 2, status: 'Pending' },
      ]);
    });
  });

  // Test createQuote
  describe('createQuote', () => {
    beforeEach(() => {
      initialState.latest = [{ id: 1, status: 'Open', status_id: 1 }];
      initialState.current = [{ id: 1, status: 'Open', status_id: 1 }];
    });

    it('should handle pending state correctly', () => {
      extraReducers[createQuote.pending](initialState);
      expect(initialState.status).toBe('loading');
    });

    it('should handle fulfilled state correctly on success', () => {
      const payload = { success: true };
      const meta = { arg: { enquiryId: 1 } };
      extraReducers[createQuote.fulfilled](initialState, { payload, meta });
      expect(initialState.status).toBe('');
      expect(initialState.latest[0].status).toBe('TEXT-TENDER-RETURNED');
      expect(initialState.latest[0].status_id).toBe(9);
      expect(initialState.latest[0].updated_at).toBe('2023-01-01 12:00');
    });

    it('should handle fulfilled state correctly on failure', () => {
      const payload = { success: false };
      const meta = { arg: { enquiryId: 1 } };
      extraReducers[createQuote.fulfilled](initialState, { payload, meta });
      expect(initialState.status).toBe('error');
    });

    it('should handle rejected state correctly', () => {
      extraReducers[createQuote.rejected](initialState);
      expect(initialState.status).toBe('error');
      expect(initialState.latest).toEqual([{ id: 1, status: 'Open', status_id: 1 }]);
      expect(initialState.current).toEqual([{ id: 1, status: 'Open', status_id: 1 }]);
    });
  });

  // Test tenderIsDownloaded
  describe('tenderIsDownloaded', () => {
    it('should handle pending state correctly', () => {
      const originalState = { ...initialState };
      extraReducers[tenderIsDownloaded.pending](initialState);
      expect(initialState).toEqual(originalState); // No state change expected
    });

    it('should handle fulfilled state correctly', () => {
      const originalState = { ...initialState };
      extraReducers[tenderIsDownloaded.fulfilled](initialState);
      expect(initialState).toEqual(originalState); // No state change expected
    });

    it('should handle rejected state correctly', () => {
      const originalState = { ...initialState };
      extraReducers[tenderIsDownloaded.rejected](initialState);
      expect(initialState).toEqual(originalState); // No state change expected
    });
  });

  // Test fetchDocumentsHistory
  describe('fetchDocumentsHistory', () => {
    it('should handle pending state correctly', () => {
      extraReducers[fetchDocumentsHistory.pending](initialState);
      expect(initialState.status).toBe('loading');
    });

    it('should handle fulfilled state correctly with data', () => {
      const payload = {
        data: {
          enquiry: [
            {
              tender_id: 1,
              document_name: 'Enquiry Doc 1',
              download_link: 'link1',
              received_date: '2023-01-03',
              version: '1.0',
            },
          ],
          order: [
            {
              tender_id: 2,
              document_name: 'Order Doc 1',
              download_link: 'link2',
              received_date: '2023-01-01',
              version: '1.0',
            },
          ],
          tender_addendum: [
            {
              tender_id: 3,
              document_name: 'Tender Addendum 1',
              download_link: 'link3',
              received_date: '2023-01-02',
              version: '1.0',
            },
          ],
        },
      };
      extraReducers[fetchDocumentsHistory.fulfilled](initialState, { payload });
      expect(initialState.documents.length).toBe(3);
      expect(initialState.documents[0].document_name).toBe('Enquiry Doc 1'); // Sorted by date descending
      expect(initialState.documents[1].document_name).toBe('Tender Addendum 1');
      expect(initialState.documents[2].document_name).toBe('Order Doc 1');
    });

    it('should handle fulfilled state correctly with no data', () => {
      const payload = { data: null };
      extraReducers[fetchDocumentsHistory.fulfilled](initialState, { payload });
      expect(initialState.documents).toEqual([]);
    });

    it('should handle rejected state correctly', () => {
      extraReducers[fetchDocumentsHistory.rejected](initialState);
      expect(initialState.status).toBe('error');
      expect(initialState.documents).toEqual([]);
    });
  });
});
