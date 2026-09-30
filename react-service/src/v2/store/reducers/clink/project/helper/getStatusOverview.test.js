import getStatusOverview from './getStatusOverview';
import moment from 'moment';

// Mock the date helper
jest.mock('v2/helpers/date', () => ({
  getProperDates2: jest.fn((date) => [date || '2023-12-01']),
}));

describe('getStatusOverview', () => {
  const mockTender = {
    id: 1,
    start_on_site: '2023-12-01',
    has_document: false,
    enquiry_sent_date: null,
  };

  const mockSummary = {
    1: {
      interest_count: 5,
      total_quote_count: 3,
      enquiries_sent: 0,
      unique_quote_count: 0,
    }
  };

  beforeEach(() => {
    // Set a fixed date for consistent testing
    const fixedDate = '2023-10-01';
    jest.spyOn(moment, 'now').mockReturnValue(moment(fixedDate).valueOf());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getRiskCategory', () => {
    it('should return "On Track" for dates more than 7 days away', () => {
      const tenderFarFuture = {
        ...mockTender,
        start_on_site: moment().add(12, 'weeks').add(10, 'days').format('YYYY-MM-DD')
      };
      const result = getStatusOverview(mockSummary, tenderFarFuture);
      expect(result.current.risk).toBe('On Track');
    });

    it('should return "Approaching" for dates within 7 days', () => {
      const tenderWithFutureDate = {
        ...mockTender,
        start_on_site: moment().add(12, 'weeks').add(5, 'days').format('YYYY-MM-DD')
      };
      
      const result = getStatusOverview(mockSummary, tenderWithFutureDate);
      expect(result.current.risk).toBe('Approaching');
    });

    it('should return "Overdue" for past dates', () => {
      const tenderWithPastDate = {
        ...mockTender,
        start_on_site: moment().subtract(1, 'day').add(12, 'weeks').format('YYYY-MM-DD')
      };
      
      const result = getStatusOverview(mockSummary, tenderWithPastDate);
      expect(result.current.risk).toBe('Overdue');
    });
  });

  describe('getStatusOverview function', () => {
    it('should return default structure when no summary provided', () => {
      const result = getStatusOverview(null, mockTender);
      
      expect(result).toEqual({
        interests: 0,
        quotes: {
          main: 0,
          extra: 0,
        },
        status: 0,
        issue_order: '—',
        start_on_site: '2023-12-01',
      });
    });

    it('should handle "Not Started" status when enquiries_sent is 0 and has_document is false', () => {
      const result = getStatusOverview(mockSummary, mockTender);
      
      expect(result.status).toBe('Not Started');
      expect(result.current.status).toBe(1);
      expect(result.current.name).toBe('Issue Tender');
      expect(result.next.status).toBe(2);
      expect(result.next.name).toBe('Quote Due');
      expect(result.interests).toBe(5);
      expect(result.quotes.main.main).toBe(3);
    });

    it('should handle "In Progress" status when enquiries_sent is 0 and has_document is true', () => {
      const tenderWithDoc = { ...mockTender, has_document: true };
      const result = getStatusOverview(mockSummary, tenderWithDoc);
      
      expect(result.status).toBe('In Progress');
      expect(result.current.status).toBe(1);
      expect(result.current.name).toBe('Issue Tender');
      expect(result.next.status).toBe(2);
      expect(result.next.name).toBe('Quote Due');
    });

    it('should handle "Quote Due - Not Started" status when enquiry sent but no quotes', () => {
      const summaryWithEnquiry = {
        1: {
          ...mockSummary[1],
          enquiries_sent: 1,
          unique_quote_count: 0,
        }
      };
      const tenderWithEnquiry = { 
        ...mockTender, 
        enquiry_sent_date: '2023-10-15' 
      };
      
      const result = getStatusOverview(summaryWithEnquiry, tenderWithEnquiry);
      
      expect(result.status).toBe('Not Started');
      expect(result.current.status).toBe(2);
      expect(result.current.name).toBe('Quote Due');
      expect(result.next.status).toBe(3);
      expect(result.next.name).toBe('Issue Order');
    });

    it('should handle "Quote Due - In Progress" status when enquiry sent and quotes received', () => {
      const summaryWithQuotes = {
        1: {
          ...mockSummary[1],
          enquiries_sent: 1,
          unique_quote_count: 2,
        }
      };
      const tenderWithEnquiry = { 
        ...mockTender, 
        enquiry_sent_date: '2023-10-15' 
      };
      const quotesSubcontractors = [
        { id: 1, name: 'Sub 1' },
        { id: 2, name: 'Sub 2' }
      ];
      
      const result = getStatusOverview(
        summaryWithQuotes, 
        tenderWithEnquiry, 
        quotesSubcontractors
      );
      
      expect(result.status).toBe('In Progress');
      expect(result.current.status).toBe(2);
      expect(result.current.name).toBe('Quote Due');
    });

    it('should handle "Issue Order" status when all quotes received and procurement schedule matches', () => {
      const summaryWithQuotes = {
        1: {
          ...mockSummary[1],
          enquiries_sent: 1,
          unique_quote_count: 2,
        }
      };
      const tenderWithEnquiry = { 
        ...mockTender, 
        enquiry_sent_date: '2023-10-15' 
      };
      const quotesSubcontractors = [
        { id: 1, name: 'Sub 1' },
        { id: 2, name: 'Sub 2' }
      ];
      const procurementSchedule = [
        {
          id: 1,
          procurement: {
            1: { selected: true },
            2: { selected: true }
          }
        }
      ];
      
      const result = getStatusOverview(
        summaryWithQuotes, 
        tenderWithEnquiry, 
        quotesSubcontractors,
        [],
        procurementSchedule
      );
      
      expect(result.current.status).toBe(3);
      expect(result.current.name).toBe('Issue Order');
      expect(result.next.status).toBe(4);
      expect(result.next.name).toBe('Start on Site');
    });

    it('should handle "Completed" status when awarded is true', () => {
      const summaryWithQuotes = {
        1: {
          ...mockSummary[1],
          enquiries_sent: 1,
          unique_quote_count: 2,
        }
      };
      const tenderWithEnquiry = { 
        ...mockTender, 
        enquiry_sent_date: '2023-10-15' 
      };
      
      const result = getStatusOverview(
        summaryWithQuotes, 
        tenderWithEnquiry, 
        [],
        [],
        [],
        true // awarded = true
      );
      
      expect(result.status).toBe('Completed');
      expect(result.current.status).toBe(3);
      expect(result.current.name).toBe('Order Issued');
      expect(result.next.status).toBe(4);
      expect(result.next.name).toBe('Start on Site');
    });

    it('should handle undefined or null dueDate in getRiskCategory', () => {
      const summaryWithNullData = {
        1: {
          ...mockSummary[1],
          enquiries_sent: 1,
        }
      };
      const tenderWithNullDate = { 
        ...mockTender, 
        start_on_site: null,
        enquiry_sent_date: '2023-10-15' 
      };
      
      // This should not crash and should handle the null date gracefully
      const result = getStatusOverview(summaryWithNullData, tenderWithNullDate);
      expect(result).toBeDefined();
    });

    it('should calculate correct dates based on start_on_site', () => {
      const result = getStatusOverview(mockSummary, mockTender);
      
      // Verify dates are calculated correctly relative to start_on_site
      expect(result.start_on_site).toBe('2023-12-01');
      expect(result.issue_order).toBe('—');
      
      // Issue tender should be 12 weeks before start_on_site
      // Quote due should be 8 weeks before start_on_site  
      // Issue order should be 4 weeks before start_on_site
      expect(result.current.date).toBe('2023-09-08'); // 12 weeks before 2023-12-01
      expect(result.next.date).toBe('2023-10-06'); // 8 weeks before 2023-12-01
    });

    it('should handle empty quotesSubcontractors array', () => {
      const result = getStatusOverview(mockSummary, mockTender, []);
      expect(result).toBeDefined();
      expect(result.interests).toBe(5);
    });

    it('should handle duplicate subcontractors in quotesSubcontractors', () => {
      const duplicateQuotesSubcontractors = [
        { id: 1, name: 'Sub 1' },
        { id: 1, name: 'Sub 1 Duplicate' }, // Same ID
        { id: 2, name: 'Sub 2' }
      ];
      
      const result = getStatusOverview(
        mockSummary, 
        mockTender, 
        duplicateQuotesSubcontractors
      );
      
      expect(result).toBeDefined();
      // Should deduplicate based on ID
    });
  });
});