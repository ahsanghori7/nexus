import httpHelper, { httpHelperV2 } from './httpHelper';
import Cookies from 'js-cookie';
import * as sessionHelpers from 'v2/helpers/session';

// Mock Cookies
jest.mock('js-cookie');

jest.mock('v2/helpers/session', () => ({
  handleUnauthorized: jest.fn(),
  SESSION_EXPIRED_KEY: 'session_expired_message',
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock global API object
const originalGlobalAPI = global.API;
const mockApiBaseUrl = 'https://api.test.com';
const mockApiTokenName = 'test_token';

describe('HTTP Helper', () => {
  beforeAll(() => {
    global.API = {
      RELAY_URL: mockApiBaseUrl,
      TOKEN_NAME: mockApiTokenName,
    };
  });

  afterAll(() => {
    global.API = originalGlobalAPI; // Restore original API object
  });

  beforeEach(() => {
    fetch.mockClear();
    Cookies.get.mockClear();
    Cookies.get.mockReturnValue('mock_jwt_token'); // Default mock token
    sessionHelpers.handleUnauthorized.mockClear();
  });

  const testCases = [
    { name: 'httpHelper', fn: httpHelper, throwsOnError: false },
    { name: 'httpHelperV2', fn: httpHelperV2, throwsOnError: true },
  ];

  testCases.forEach(({ name, fn: helperFunction, throwsOnError }) => {
    describe(name, () => {
      it('should make a GET request successfully', async () => {
        const mockResponseData = { data: 'success' };
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponseData,
        });

        const result = await helperFunction({ url: '/test' });
        expect(fetch).toHaveBeenCalledWith(`${mockApiBaseUrl}/test`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock_jwt_token',
          },
          body: null,
        });
        expect(result).toEqual(mockResponseData);
      });

      it('should make a POST request with JSON body successfully', async () => {
        const mockResponseData = { id: 1, status: 'created' };
        const requestBody = { name: 'Test Item' };
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponseData,
        });

        const result = await helperFunction({
          url: '/create',
          method: 'POST',
          body: requestBody,
        });
        expect(fetch).toHaveBeenCalledWith(`${mockApiBaseUrl}/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock_jwt_token',
          },
          body: JSON.stringify(requestBody),
        });
        expect(result).toEqual(mockResponseData);
      });

      it('should make a POST request with FormData body successfully', async () => {
        const mockResponseData = { message: 'uploaded' };
        const formData = new FormData();
        formData.append('file', 'testfile');
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponseData,
        });

        const result = await helperFunction({
          url: '/upload',
          method: 'POST',
          body: formData,
          isFormData: true,
        });
        expect(fetch).toHaveBeenCalledWith(`${mockApiBaseUrl}/upload`, {
          method: 'POST',
          headers: {
            // No Content-Type for FormData, browser sets it
            Authorization: 'Bearer mock_jwt_token',
          },
          body: formData,
        });
        expect(result).toEqual(mockResponseData);
      });

      it('should include custom headers', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        const customHeaders = { 'X-Custom-Header': 'TestValue' };
        await helperFunction({ url: '/custom', headers: customHeaders });
        expect(fetch.mock.calls[0][1].headers).toMatchObject(customHeaders);
      });

      it('should use custom base URL if provided', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        const customBase = 'https://custom.api.com';
        await helperFunction({ url: '/resource', base: customBase });
        expect(fetch).toHaveBeenCalledWith(
          `${customBase}/resource`,
          expect.anything(),
        );
      });

      it('should handle response not ok (e.g., 404)', async () => {
        const statusText = 'Not Found';
        const errorResponse = { data: { message: 'Resource not found' } };
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText,
          json: async () => errorResponse,
        });

        if (throwsOnError) {
          // httpHelperV2 should throw an error with additional properties
          try {
            await helperFunction({ url: '/notfound' });
            fail('Expected function to throw');
          } catch (error) {
            expect(error.message).toContain('Resource not found');
            expect(error.status).toBe(404);
            expect(error.statusText).toBe(statusText);
            expect(error.response).toEqual(errorResponse);
          }
        } else {
          const result = await helperFunction({ url: '/notfound' });
          expect(result).toBe(statusText);
        }
      });

      it('should call handleUnauthorized and return a never-resolving promise on 401', async () => {
        const errorBody = {
          error: 'Unauthorized',
          message: 'Your session has expired. Please log in again.',
        };
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => errorBody,
          text: async () => JSON.stringify(errorBody),
        });

        let settled = false;
        helperFunction({ url: '/protected' })
          .then(() => { settled = true; })
          .catch(() => { settled = true; });

        // Flush microtasks so fetch resolves and handleUnauthorized fires.
        await Promise.resolve();
        await Promise.resolve();

        expect(sessionHelpers.handleUnauthorized).toHaveBeenCalledTimes(1);
        // Must not have settled — downstream never processes the 401 body.
        expect(settled).toBe(false);
      });

      it('should NOT call handleUnauthorized for non-401 error responses', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => { throw new Error('Not JSON'); },
          text: async () => 'Server error',
        });

        try {
          await helperFunction({ url: '/error' });
        } catch {
          // httpHelperV2 will throw; that's expected
        }

        expect(sessionHelpers.handleUnauthorized).not.toHaveBeenCalled();
      });

      it('should use error.message from API shape { error: { message } } when response not ok', async () => {
        if (!throwsOnError) return;
        const statusText = 'Bad Request';
        const errorResponse = {
          error: {
            code: 'INVALID_JSON',
            type: 'validation_error',
            message:
              'Invalid value for quotes: At least two quotes are required for tender analysis',
          },
        };
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText,
          json: async () => errorResponse,
        });

        try {
          await helperFunction({ url: '/ai/quote_analysis/initiate/123' });
          fail('Expected function to throw');
        } catch (error) {
          expect(error.message).toBe(errorResponse.error.message);
          expect(error.status).toBe(400);
          expect(error.response).toEqual(errorResponse);
        }
      });

      it('should handle response not ok with text response', async () => {
        const statusText = 'Internal Server Error';
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText,
          json: async () => {
            throw new Error('Not JSON');
          },
          text: async () => 'Server error occurred',
        });

        if (throwsOnError) {
          try {
            await helperFunction({ url: '/servererror' });
            fail('Expected function to throw');
          } catch (error) {
            expect(error.message).toBe('Server error occurred');
            expect(error.status).toBe(500);
            expect(error.response).toEqual({
              message: 'Server error occurred',
            });
          }
        } else {
          const result = await helperFunction({ url: '/servererror' });
          expect(result).toBe(statusText);
        }
      });

      it('should handle network error during fetch', async () => {
        const networkError = new Error('Network failure');
        fetch.mockRejectedValueOnce(networkError);

        if (throwsOnError) {
          // httpHelperV2 should preserve the original error (not wrap it)
          try {
            await helperFunction({ url: '/networkfail' });
            fail('Expected function to throw');
          } catch (error) {
            expect(error.message).toBe('Network failure');
            expect(error).toBe(networkError); // Should be the same error object
          }
        } else {
          // httpHelper returns the error object itself
          const result = await helperFunction({ url: '/networkfail' });
          expect(result).toBe(networkError);
        }
      });

      it('should handle JSON parsing error in success response', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        if (throwsOnError) {
          await expect(helperFunction({ url: '/invalidjson' })).rejects.toThrow(
            'Failed to parse response',
          );
        } else {
          // httpHelper would return the parsing error
          const result = await helperFunction({ url: '/invalidjson' });
          expect(result).toBeInstanceOf(Error);
          expect(result.message).toBe('Invalid JSON');
        }
      });

      it('should handle undefined token', async () => {
        Cookies.get.mockReturnValueOnce(undefined);
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

        await helperFunction({ url: '/test-no-token' });
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer undefined', // Or 'Bearer null' depending on Cookies.get
            }),
          }),
        );
      });
    });
  });
});
