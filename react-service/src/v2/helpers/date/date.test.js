import {
  isValidDate,
  getDateValuesString,
  getDateValues,
  getLondonUTCDate,
  getProperDates,
  happenInLast24Hours,
  expiredDate,
  getStringDate,
  processTenderDates,
  isIOS,
  isIpadOS,
  getDateValuesV1,
} from './index';

// Mock Date.now()
const mockNow = new Date('2025-02-10T12:00:00Z').getTime();
global.Date.now = jest.fn(() => mockNow);

// Mock window.safari
const originalWindow = { ...window };
beforeEach(() => {
  delete window.safari;
});
afterEach(() => {
  // eslint-disable-next-line no-global-assign
  window = { ...originalWindow };
});

describe('Date Utils', () => {
  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate('2025-02-10')).toBe(false);
    });
  });

  describe('getDateValuesString', () => {
    it('should handle null values', () => {
      expect(getDateValuesString(null)).toBeNull();
    });

    it('should replace hyphens with slashes in Safari', () => {
      window.safari = {};
      expect(getDateValuesString('2025-02-10')).toBe('2025/02/10');
    });

    it('should not modify date string in non-Safari browsers', () => {
      expect(getDateValuesString('2025-02-10')).toBe('2025-02-10');
    });
  });

  describe('getDateValues', () => {
    it('should return null for invalid inputs', () => {
      expect(getDateValues(null)).toBeNull();
      expect(getDateValues('invalid')).toBeNull();
    });

    it('should return Date object for valid input', () => {
      const result = getDateValues('2025-02-10');
      expect(result instanceof Date).toBe(true);
      expect(result.toISOString().split('T')[0]).toBe('2025-02-10');
    });
  });

  describe('getLondonUTCDate', () => {
    it('should format current date when no input provided', () => {
      const result = getLondonUTCDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should format string date input', () => {
      const result = getLondonUTCDate('2025-02-10T12:00:00');
      expect(result).toMatch(/^2025-02-10 \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('happenInLast24Hours', () => {
    it('should return true for dates within last 24 hours', () => {
      const date23HoursAgo = mockNow - 23 * 60 * 60 * 1000;
      expect(happenInLast24Hours(date23HoursAgo)).toBe(true);
    });

    it('should return false for older dates', () => {
      const date25HoursAgo = mockNow - 25 * 60 * 60 * 1000;
      expect(happenInLast24Hours(date25HoursAgo)).toBe(false);
    });
  });

  describe('expiredDate', () => {
    it('should return true for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(expiredDate(yesterday)).toBe(true);
    });

    it('should return false for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(expiredDate(tomorrow)).toBe(false);
    });
  });

  describe('getStringDate', () => {
    it('should handle string input', () => {
      expect(getStringDate('2025-02-10')).toBe('2025-02-10');
    });

    it('should format Date with custom format', () => {
      const date = new Date('2025-02-10');
      expect(getStringDate(date, 'DD/MM/YYYY')).toBe('10/02/2025');
    });
  });

  describe('getProperDates', () => {
    it('should handle date format conversion', () => {
      const [start, end] = getProperDates('10-02-2025', '15-02-2025');
      expect(start instanceof Date).toBe(true);
      expect(end instanceof Date).toBe(true);
    });

    it('should handle null inputs', () => {
      const [start, end] = getProperDates(null, null);
      expect(start).toBeNull();
      expect(end).toBeNull();
    });
  });

  describe('processTenderDates', () => {
    const mockTender = {
      start_on_site: '01-03-2025',
      tender_return: '15-02-2025',
      send_date: '2025-02-01',
      decision_date: '2025-02-20',
      subcontract_work_finish: '2025-04-01',
    };

    it('should process complete tender data', () => {
      const processed = processTenderDates([mockTender])[0];
      expect(processed.start).toBe('2025-02-01');
      expect(processed.tenderReturn).toBe('2025-02-15');
      expect(processed.startOnSite).toBe('2025-03-01');
    });

    it('should handle missing send_date', () => {
      const tender = { ...mockTender, send_date: null };
      const processed = processTenderDates([tender])[0];
      expect(processed.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should use enquiry_sent_date when available', () => {
      const tender = { ...mockTender, enquiry_sent_date: '2025-01-25' };
      const processed = processTenderDates([tender])[0];
      expect(processed.start).toBe('2025-01-25');
    });
  });
});

describe('isIOS', () => {
  const originalNavigator = window.navigator;
  let mockNavigator;

  beforeEach(() => {
    mockNavigator = {
      platform: '',
      maxTouchPoints: 0,
    };

    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('should return true for iPad platform', () => {
    mockNavigator.platform = 'iPad';
    expect(isIOS()).toBe(true);
  });

  it('should return true for iPhone platform', () => {
    mockNavigator.platform = 'iPhone';
    expect(isIOS()).toBe(true);
  });

  it('should return true for iPod platform', () => {
    mockNavigator.platform = 'iPod';
    expect(isIOS()).toBe(true);
  });

  it('should return true for MacIntel with touch points', () => {
    mockNavigator.platform = 'MacIntel';
    mockNavigator.maxTouchPoints = 3;
    expect(isIOS()).toBe(true);
  });
});

describe('isIpadOS', () => {
  const originalNavigator = window.navigator;
  let mockNavigator;

  beforeEach(() => {
    mockNavigator = {
      platform: '',
      maxTouchPoints: 0,
    };

    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('should return true for MacIntel with more than 2 touch points', () => {
    mockNavigator.platform = 'MacIntel';
    mockNavigator.maxTouchPoints = 3;
    expect(isIpadOS()).toBe(true);
  });

  it('should return false for MacIntel with 2 or fewer touch points', () => {
    mockNavigator.platform = 'MacIntel';
    mockNavigator.maxTouchPoints = 2;
    expect(isIpadOS()).toBe(false);
  });

  it('should return false for non-MacIntel platform', () => {
    mockNavigator.platform = 'Win32';
    mockNavigator.maxTouchPoints = 5;
    expect(isIpadOS()).toBe(false);
  });
});

describe('getDateValuesV1', () => {
  const originalNavigator = window.navigator;
  let mockNavigator;

  beforeEach(() => {
    mockNavigator = {
      platform: '',
      maxTouchPoints: 0,
    };

    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true,
    });

    delete window.safari;
  });

  afterEach(() => {
    // eslint-disable-next-line no-global-assign
    window = { ...originalWindow };
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('should handle null with acceptNullValue true', () => {
    expect(getDateValuesV1(null, true)).toBeNull();
  });

  it('should handle null with acceptNullValue false', () => {
    expect(getDateValuesV1(null, false)).toBe('');
  });

  it('should handle Date object input', () => {
    const date = new Date('2025-02-10');
    expect(getDateValuesV1(date)).toBe('10/02/2025');
  });

  it('should handle DD/MM/YYYY format', () => {
    const result = getDateValuesV1('10/02/2025');
    expect(result instanceof Date).toBe(true);
    expect(result.toISOString().split('T')[0]).toBe('2025-02-10');
  });

  it('should return original value for invalid date string', () => {
    expect(getDateValuesV1('invalid-date')).toBe('invalid-date');
  });

  it('should handle DD-MM-YYYY format on non-Safari browser', () => {
    mockNavigator.platform = 'Win32';
    const result = getDateValuesV1('10-02-2025');
    expect(result instanceof Date).toBe(true);
    expect(result.toISOString().split('T')[0]).toBe('2025-02-10');
  });
});
