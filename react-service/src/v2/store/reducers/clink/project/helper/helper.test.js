import {
  getDateValues,
  getProperDates,
  getDiffDays,
  getProperDates2,
} from 'v2/helpers/date';
import { showWarning, initTasks } from './index';
import moment from 'moment';

jest.mock('v2/helpers/date', () => ({
  getDateValues: jest.fn(),
  getProperDates: jest.fn(),
  getDiffDays: jest.fn(),
  getProperDates2: jest.fn(),
}));

describe('showWarning function', () => {
  test('should return 2 if status <= 2 and start is within 5 days', () => {
    getDiffDays.mockReturnValue(4);
    const result = showWarning({ start: '2025-02-17' }, { status: 2 });
    expect(result).toBe(2);
  });

  test('should return 3 if status is 3, quotes.main is missing, and middle is within 5 days', () => {
    getDiffDays.mockReturnValue(3);
    const result = showWarning(
      { middle: '2025-02-17', quotes: {} },
      { status: 3 },
    );
    expect(result).toBe(3);
  });

  test('should return 4 if status is 4 and end is within 10 days', () => {
    getDiffDays.mockReturnValue(9);
    const result = showWarning({ end: '2025-02-17' }, { status: 4 });
    expect(result).toBe(4);
  });

  test('should return false if none of the conditions match', () => {
    getDiffDays.mockReturnValue(20);
    const result = showWarning({ start: '2025-02-17' }, { status: 1 });
    expect(result).toBe(false);
  });
});

describe('initTasks function', () => {
  let consoleWarnSpy;

  beforeAll(() => {
    // eslint-disable-next-line no-console
    const originalConsoleWarn = console.warn;
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((message, ...args) => {
      if (typeof message === 'string' && message.includes('Deprecation warning')) {
        return;
      }
      originalConsoleWarn(message, ...args);
    });
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return empty array and false when tenders is empty', () => {
    const result = initTasks([], {}, {});
    expect(result).toEqual([[], false]);
  });

  test('should correctly filter and process tenders', () => {
    getProperDates.mockReturnValue([
      moment('2025-02-17'),
      moment('2025-02-10'),
    ]);
    getDateValues.mockReturnValue(moment('2025-02-10'));
    getProperDates2.mockReturnValue(['2025-02-17', '2025-02-10']);
    getProperDates2.mockReturnValue('2025-02-10');

    const tenders = [
      {
        id: 1,
        label: 'Tender 1',
        state: '1',
        start_on_site: '2025-02-20',
        tender_return: '2025-02-15',
      },
    ];

    const summary = {
      1: {
        interest_count: 0,
        total_quote_count: 0,
        enquiries_sent: 0,
        unique_quote_count: 0,
      },
    };

    const dependency = {};
    const result = initTasks(tenders, summary, dependency);

    expect(result[0].length).toBe(1);
    expect(result[1]).toBe(false);
  });

  test('should set showAlert to true if incorrect ranges are found', () => {
    getProperDates.mockReturnValue([
      moment('2025-02-10'),
      moment('2025-02-17'),
    ]);
    getDateValues.mockReturnValue(moment('2025-02-10'));

    const tenders = [
      {
        id: 1,
        label: 'Tender 1',
        state: '1',
        start_on_site: '2025-02-10',
        tender_return: '2025-02-17',
      },
    ];

    const summary = {};
    const dependency = {};

    const result = initTasks(tenders, summary, dependency);
    expect(result[1]).toBe(true);
  });
});
