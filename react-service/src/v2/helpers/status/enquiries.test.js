import moment from 'moment';
import { getStatus, getDaysToShow, getProgress, statusEnquiries } from './enquiries';

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key, // Simply return the key for testing
}));

describe('getStatus', () => {
  test('should return OTHER_STATUS when no matching status found', () => {
    const data = {
      type: 'Unknown',
      status_id: 999
    };
    const result = getStatus(data);
    expect(result.status).toBe('OTHER_STATUS');
  });

  test('should handle INTEREST_REGISTERED status', () => {
    const data = {
      type: 'Interest',
      status_id: 1
    };
    const result = getStatus(data);
    expect(result.status).toBe('INTEREST_REGISTERED');
    expect(result.label).toBe('interested');
  });

  test('should handle UNSUCCESSFUL status for awarded_externally', () => {
    const data = {
      type: 'Enquiry',
      status_id: 1,
      awarded_externally: true
    };
    const result = getStatus(data);
    expect(result.status).toBe('UNSUCCESSFUL');
  });

  test('should handle PENDING_SIGNATURE with signatory counts', () => {
    const data = {
      type: 'Order',
      status_id: 12,
      signatory: {
        total: 3,
        signers: 1
      }
    };
    const result = getStatus(data);
    expect(result.label).toContain('text-pending-signature (1/3)');
  });

  test('should handle multiple possible statuses (AWARDED vs ORDER_RETRACTED)', () => {
    const data = {
      type: 'Order',
      status_id: 7,
      awarded: true,
      order_created: true,
      awarded_externally: false
    };
    const result = getStatus(data);
    expect(result.status).toBe('AWARDED');
  });
});

describe('getProgress', () => {
  test('should return base status progress for INTEREST_REGISTERED', () => {
    const statusData = { status: 'INTEREST_REGISTERED' };
    const progress = getProgress(statusData);
    expect(progress).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'text-interest-registered' })
    ]));
  });

  test('should include declined status in progress', () => {
    const statusData = { status: 'INTEREST_DECLINED' };
    const progress = getProgress(statusData);
    const hasDeclined = progress.some(item => item.label === 'client_declined');
    expect(hasDeclined).toBeTruthy();
  });

  test('should include signature statuses for ORDER_SIGNED', () => {
    const statusData = { status: 'ORDER_SIGNED' };
    const progress = getProgress(statusData);
    const hasSignatureSteps = progress.some(item =>
      item.label === 'text-pending-signature' ||
      item.label === 'text-order-signed'
    );
    expect(hasSignatureSteps).toBeTruthy();
  });
});

describe('getDaysToShow', () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    jest.spyOn(moment, 'now').mockImplementation(() =>
      new Date('2025-02-06').getTime()
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return null for unsupported status', () => {
    const data = {
      type: 'Interest',
      status_id: 1
    };
    expect(getDaysToShow(data)).toBeNull();
  });

  test('should calculate days for TENDER_ACCEPTED', () => {
    const data = {
      type: 'Enquiry',
      status_id: 4,
      tenderReturn: '2025-02-10'
    };
    const result = getDaysToShow(data);
    expect(result).toBe(4); // 4 days between 2025-02-06 and 2025-02-10
  });

  test('should handle both tenderReturn and tender_return fields', () => {
    const data1 = {
      type: 'Enquiry',
      status_id: 4,
      tenderReturn: '2025-02-10'
    };
    const data2 = {
      type: 'Enquiry',
      status_id: 4,
      tender_return: '2025-02-10'
    };
    expect(getDaysToShow(data1)).toBe(getDaysToShow(data2));
  });

  test('should return 0 for past dates', () => {
    const data = {
      type: 'Enquiry',
      status_id: 4,
      tenderReturn: '2025-02-01'
    };
    expect(getDaysToShow(data)).toBe(0);
  });
});

// Edge cases

describe('getStatus - Additional Edge Cases', () => {
  test('should handle null or undefined data', () => {
    expect(getStatus(null)).toEqual({ ...statusEnquiries.OTHER_STATUS, status: 'OTHER_STATUS' });
    expect(getStatus(undefined)).toEqual({ ...statusEnquiries.OTHER_STATUS, status: 'OTHER_STATUS' });
  });

  test('should handle empty type and status_id', () => {
    const data = {};
    expect(getStatus(data)).toEqual({ ...statusEnquiries.OTHER_STATUS, status: 'OTHER_STATUS' });
  });

  test('should handle ORDER_RETRACTED case in multiple statuses', () => {
    const data = {
      type: 'Order',
      status_id: 7,
      awarded: false,
      order_created: true,
      awarded_externally: false
    };
    const result = getStatus(data);
    expect(result.status).toBe('ORDER_RETRACTED');
  });
});

describe('getProgress - Additional Cases', () => {
  test('should handle TENDER_ACCEPTED status', () => {
    const statusData = { status: 'TENDER_ACCEPTED' };
    const progress = getProgress(statusData);
    expect(progress).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'text-tender-specs-received' })
    ]));
  });

  test('should handle TENDER_DECLINED status', () => {
    const statusData = { status: 'TENDER_DECLINED' };
    const progress = getProgress(statusData);
    const hasDeclined = progress.some(item => item.label === 'you_declined');
    expect(hasDeclined).toBeTruthy();
  });

  test('should handle ORDER_REJECTED status', () => {
    const statusData = { status: 'ORDER_REJECTED' };
    const progress = getProgress(statusData);
    expect(progress).toContainEqual(expect.objectContaining({
      label: 'text-order-rejected'
    }));
  });
});

describe('getDaysToShow - Additional Cases', () => {
  beforeEach(() => {
    jest.spyOn(moment, 'now').mockImplementation(() =>
      new Date('2025-02-06').getTime()
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should handle INTEREST_ACCEPTED with start date', () => {
    const data = {
      type: 'Interest',
      status_id: 4,
      start: '2025-02-10'
    };
    expect(getDaysToShow(data)).toBe(4);
  });

  test('should handle INTEREST_ACCEPTED with send_date', () => {
    const data = {
      type: 'Interest',
      status_id: 4,
      send_date: '2025-02-10'
    };
    expect(getDaysToShow(data)).toBe(4);
  });

  test('should handle QUOTE_SENT with decisionDate', () => {
    const data = {
      type: 'Enquiry',
      status_id: 9,
      decisionDate: '2025-02-10'
    };
    expect(getDaysToShow(data)).toBe(4);
  });

  test('should handle QUOTE_SENT with decision_date', () => {
    const data = {
      type: 'Enquiry',
      status_id: 9,
      decision_date: '2025-02-10'
    };
    expect(getDaysToShow(data)).toBe(4);
  });

});

describe('filterStatusByIdAndType - Edge Cases', () => {
  test('should handle array type matching', () => {
    const data = {
      type: 'Order',
      status_id: 7 // AWARDED status has array type
    };
    const result = getStatus(data);
    expect(result.type).toEqual(expect.arrayContaining(['Enquiry', 'Order']));
  });

  test('should handle string type matching', () => {
    const data = {
      type: 'Interest',
      status_id: 1
    };
    const result = getStatus(data);
    expect(result.type).toBe('Interest');
  });

  test('should handle missing or invalid type', () => {
    const data = {
      status_id: 1
    };
    const result = getStatus(data);
    expect(result.status).toBe('OTHER_STATUS');
  });
});
