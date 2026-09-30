import { analyseFetch, analyseStart } from './asyncThunk';
import { QUOTE_LEVELING } from './analysisTypes';
import { httpHelperV2 as httpRequest } from 'v2/services/httpHelper';

jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: jest.fn(),
}));

const mockDispatch = jest.fn();
const mockGetState = jest.fn();

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('analyse-quote asyncThunk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('analyseFetch', () => {
    const args = { tid: 'tender-123' };

    it('should dispatch pending and fulfilled actions on successful fetch', async () => {
      const mockResponse = { data: 'analysis data' };
      httpRequest.mockResolvedValue(JSON.stringify(mockResponse));

      const thunk = analyseFetch(args);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(httpRequest).toHaveBeenCalledWith({
        url: `ai/quote_analysis/initiate/${args.tid}`,
        method: 'GET',
        responseType: 'text',
      });
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: analyseFetch.pending.type }),
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: analyseFetch.fulfilled.type,
          payload: mockResponse,
        }),
      );
    });

    it('should treat empty response body as null payload', async () => {
      httpRequest.mockResolvedValue('');

      const thunk = analyseFetch(args);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: analyseFetch.fulfilled.type,
          payload: null,
        }),
      );
    });

    it('should dispatch pending and rejected actions on error', async () => {
      const error = new Error('Fetch error');
      httpRequest.mockRejectedValue(error);

      const thunk = analyseFetch(args);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: analyseFetch.pending.type }),
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: analyseFetch.rejected.type }),
      );
    });

    it('should spread the error response body into the rejected payload when present', async () => {
      const error = Object.assign(new Error('Fetch error'), {
        response: { error: { code: 'SERVICE_UNAVAILABLE', message: 'Down' } },
        status: 503,
      });
      httpRequest.mockRejectedValue(error);

      const thunk = analyseFetch(args);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: analyseFetch.rejected.type,
          payload: {
            error: { code: 'SERVICE_UNAVAILABLE', message: 'Down' },
            httpStatus: 503,
          },
        }),
      );
    });

    it('should include type=tender_levelling in url when passed', async () => {
      httpRequest.mockResolvedValue(JSON.stringify({ status: 'STARTED' }));
      const thunk = analyseFetch({ tid: 'tender-123', type: QUOTE_LEVELING });
      await thunk(mockDispatch, mockGetState, undefined);

      expect(httpRequest).toHaveBeenCalledWith({
        url: 'ai/quote_analysis/initiate/tender-123?type=tender_levelling',
        method: 'GET',
        responseType: 'text',
      });
    });
  });

  describe('analyseStart', () => {
    const args = { tid: 'tender-456' };

    it('should dispatch pending and fulfilled, and update localStorage if tid not present', async () => {
      const mockResponse = { success: true };
      httpRequest.mockResolvedValue(JSON.stringify(mockResponse));

      const thunk = analyseStart(args);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(httpRequest).toHaveBeenCalledWith({
        url: `ai/quote_analysis/initiate/${args.tid}`,
        method: 'PATCH',
        responseType: 'text',
      });
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: analyseStart.pending.type }),
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: analyseStart.fulfilled.type,
          payload: mockResponse,
        }),
      );
      expect(localStorageMock.getItem('analyseQuote')).toBe(JSON.stringify([args.tid]));
    });

    it('should dispatch pending and fulfilled, and not duplicate tid in localStorage if already present', async () => {
      const mockResponse = { success: true };
      httpRequest.mockResolvedValue(JSON.stringify(mockResponse));
      localStorageMock.setItem('analyseQuote', JSON.stringify([args.tid, 'other-tid']));

      const thunk = analyseStart(args);
      await thunk(mockDispatch, mockGetState, undefined);

      const storedData = JSON.parse(localStorageMock.getItem('analyseQuote'));
      expect(storedData.filter((item) => item === args.tid).length).toBe(1);
      expect(storedData).toContain('other-tid');
    });

    it('should initialize localStorage with new array if analyseQuote is null', async () => {
      httpRequest.mockResolvedValue(JSON.stringify({ success: true }));
      jest.spyOn(localStorageMock, 'getItem').mockReturnValueOnce(null);

      const thunk = analyseStart(args);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(localStorageMock.getItem('analyseQuote')).toBe(JSON.stringify([args.tid]));
    });

    it('should dispatch pending and rejected actions on error', async () => {
      const error = new Error('Start error');
      httpRequest.mockRejectedValue(error);

      const thunk = analyseStart(args);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: analyseStart.pending.type }),
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: analyseStart.rejected.type }),
      );
      expect(localStorageMock.getItem('analyseQuote')).toBeNull();
    });

    it('should spread the error response body into the rejected payload when present', async () => {
      const error = Object.assign(new Error('Start error'), {
        response: { error: { code: 'VALIDATION_ERROR', message: 'Bad input' } },
        status: 400,
      });
      httpRequest.mockRejectedValue(error);

      const thunk = analyseStart(args);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: analyseStart.rejected.type,
          payload: {
            error: { code: 'VALIDATION_ERROR', message: 'Bad input' },
            httpStatus: 400,
          },
        }),
      );
    });

    it('should store quote levelling tid in quoteLeveling localStorage key', async () => {
      httpRequest.mockResolvedValue(JSON.stringify({ success: true }));
      const tid = 'level-789';
      const thunk = analyseStart({ tid, type: QUOTE_LEVELING });
      await thunk(mockDispatch, mockGetState, undefined);

      expect(httpRequest).toHaveBeenCalledWith({
        url: `ai/quote_analysis/initiate/${tid}?type=tender_levelling`,
        method: 'PATCH',
        responseType: 'text',
      });
      expect(localStorageMock.getItem('quoteLeveling')).toBe(JSON.stringify([tid]));
    });
  });
});
