import {
  fetchData,
  postData,
  postFormData,
  patchData,
  patchFormData,
  deleteData,
  analytics,
} from './helpers';
import Relay from 'v2/services/relay';
import flag from 'v2/helpers/flags';

// Mock Relay class and its methods
jest.mock('v2/services/relay');

// Mock flag helper
jest.mock('v2/helpers/flags');

describe('Service Helpers', () => {
  const mockResource = 'testResource';
  const mockParams = { id: 1 };
  const mockData = { name: 'testName' };
  const mockMethod = 'testMethod';
  const mockVersion = 'vTest';
  const mockHost = 'testhost.com';

  let mockRelayInstance;

  beforeEach(() => {
    // Reset all mocks
    Relay.mockClear();
    flag.mockClear();

    // Setup default mock implementation for Relay methods
    const mockJsonFn = jest.fn().mockResolvedValue({ success: true });
    mockRelayInstance = {
      get: jest.fn().mockResolvedValue({ json: mockJsonFn }),
      post: jest.fn().mockResolvedValue({ success: true }), // For most postData calls
      postForm: jest.fn().mockResolvedValue({ success: true }),
      patch: jest.fn().mockResolvedValue({ success: true }),
      patchForm: jest.fn().mockResolvedValue({ success: true }),
      deleter: jest.fn().mockResolvedValue({ success: true }),
    };
    Relay.mockImplementation(() => mockRelayInstance);
  });

  describe('fetchData', () => {
    it('should call Relay.get and response.json', async () => {
      const result = await fetchData(mockResource, mockParams, mockMethod, mockVersion, mockHost);
      expect(Relay).toHaveBeenCalledWith(mockResource, mockVersion, mockHost);
      expect(mockRelayInstance.get).toHaveBeenCalledWith(mockMethod, mockParams);
      // mockRelayInstance.get() returns a Promise. We need to check the .json() on its resolved value.
      // The mockJsonFn is defined in the outer beforeEach and assigned to the json property of the resolved value of get.
      const resolvedValue = await mockRelayInstance.get.mock.results[0].value; // Get the promise returned by the first call to get
      expect(resolvedValue.json).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should use default version and host if not provided for fetchData', async () => {
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { VERSION: 'globalVFetch', HOST: 'globalHFetch' };
      await fetchData(mockResource, mockParams, mockMethod); // version & host omitted
      expect(Relay).toHaveBeenCalledWith(mockResource, 'globalVFetch', 'globalHFetch');
      global.RELAY = originalGlobalRelay;
    });
  });

  describe('postData', () => {
    it('should call Relay.post', async () => {
      await postData(mockResource, mockData, mockMethod, mockParams, mockVersion, mockHost);
      expect(Relay).toHaveBeenCalledWith(mockResource, mockVersion, mockHost);
      expect(mockRelayInstance.post).toHaveBeenCalledWith(mockData, mockMethod, mockParams);
    });
    it('should use default version and host if not provided for postData', async () => {
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { VERSION: 'globalVPost', HOST: 'globalHPost' };
      await postData(mockResource, mockData, mockMethod, mockParams);
      expect(Relay).toHaveBeenCalledWith(mockResource, 'globalVPost', 'globalHPost');
      global.RELAY = originalGlobalRelay;
    });
  });

  describe('postFormData', () => {
    it('should call Relay.postForm', async () => {
      await postFormData(mockResource, mockData, mockMethod, mockParams, mockVersion, mockHost);
      expect(Relay).toHaveBeenCalledWith(mockResource, mockVersion, mockHost);
      expect(mockRelayInstance.postForm).toHaveBeenCalledWith(mockData, mockMethod, mockParams);
    });
    it('should use default version and host if not provided for postFormData', async () => {
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { VERSION: 'globalVPostForm', HOST: 'globalHPostForm' };
      await postFormData(mockResource, mockData, mockMethod, mockParams);
      expect(Relay).toHaveBeenCalledWith(mockResource, 'globalVPostForm', 'globalHPostForm');
      global.RELAY = originalGlobalRelay;
    });
  });

  describe('patchData', () => {
    it('should call Relay.patch', async () => {
      await patchData(mockResource, mockData, mockMethod, mockParams, mockVersion, mockHost);
      expect(Relay).toHaveBeenCalledWith(mockResource, mockVersion, mockHost);
      expect(mockRelayInstance.patch).toHaveBeenCalledWith(mockData, mockMethod, mockParams);
    });
    it('should use default version and host if not provided for patchData', async () => {
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { VERSION: 'globalVPatch', HOST: 'globalHPatch' };
      await patchData(mockResource, mockData, mockMethod, mockParams);
      expect(Relay).toHaveBeenCalledWith(mockResource, 'globalVPatch', 'globalHPatch');
      global.RELAY = originalGlobalRelay;
    });
  });

  describe('patchFormData', () => {
    it('should call Relay.patchForm', async () => {
      await patchFormData(mockResource, mockData, mockMethod, mockParams, mockVersion, mockHost);
      expect(Relay).toHaveBeenCalledWith(mockResource, mockVersion, mockHost);
      expect(mockRelayInstance.patchForm).toHaveBeenCalledWith(mockData, mockMethod, mockParams);
    });
    it('should use default version and host if not provided for patchFormData', async () => {
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { VERSION: 'globalVPatchForm', HOST: 'globalHPatchForm' };
      await patchFormData(mockResource, mockData, mockMethod, mockParams);
      expect(Relay).toHaveBeenCalledWith(mockResource, 'globalVPatchForm', 'globalHPatchForm');
      global.RELAY = originalGlobalRelay;
    });
  });

  describe('deleteData', () => {
    it('should call Relay.deleter', async () => {
      await deleteData(mockResource, mockData, mockMethod, mockParams, mockVersion, mockHost);
      expect(Relay).toHaveBeenCalledWith(mockResource, mockVersion, mockHost);
      expect(mockRelayInstance.deleter).toHaveBeenCalledWith(mockMethod, mockParams, mockData);
    });
    it('should use default version and host if not provided for deleteData', async () => {
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { VERSION: 'globalVDelete', HOST: 'globalHDelete' };
      await deleteData(mockResource, mockData, mockMethod, mockParams);
      expect(Relay).toHaveBeenCalledWith(mockResource, 'globalVDelete', 'globalHDelete');
      global.RELAY = originalGlobalRelay;
    });
  });

  describe('analytics', () => {
    const mockType = 'testType';
    const mockIdUser = 123;
    const mockIdAccount = 456;
    const mockCall = jest.fn();

    beforeEach(() => {
      mockCall.mockClear();
      // For analytics, postData is called, which uses mockRelayInstance.post
      // We need postData's promise to resolve so its .then(call) is executed.
      mockRelayInstance.post.mockResolvedValue({ success_analytics: true });
    });

    it('should call the callback directly if TRACKING flag is false', async () => {
      flag.mockReturnValue(false);
      await analytics(mockType, mockIdUser, mockIdAccount, mockCall);
      expect(flag).toHaveBeenCalledWith('TRACKING');
      expect(mockCall).toHaveBeenCalled();
      expect(Relay).not.toHaveBeenCalled(); 
    });

    it('should call postData and then the callback if TRACKING flag is true', async () => {
      flag.mockReturnValue(true);
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { VERSION: 'defaultVAnalytics', HOST: 'defaultHAnalytics' };

      await analytics(mockType, mockIdUser, mockIdAccount, mockCall);
      
      expect(flag).toHaveBeenCalledWith('TRACKING');
      // Relay is called by postData
      expect(Relay).toHaveBeenCalledWith('analytics', 'defaultVAnalytics', 'defaultHAnalytics');
      expect(mockRelayInstance.post).toHaveBeenCalledWith(
        { type: mockType, user_id: mockIdUser, user_account_id: mockIdAccount },
        'tracking',
        {} 
      );
      expect(mockCall).toHaveBeenCalledWith({ success_analytics: true }); // postData promise resolves, then mockCall is called
      global.RELAY = originalGlobalRelay;
    });

    it('should handle analytics call with only type', async () => {
      flag.mockReturnValue(true);
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { VERSION: 'defaultVAnalytics', HOST: 'defaultHAnalytics' };
      await analytics(mockType, 0, 0, mockCall);
      expect(mockRelayInstance.post).toHaveBeenCalledWith(
        { type: mockType },
        'tracking',
        {}
      );
      expect(mockCall).toHaveBeenCalledWith({ success_analytics: true });
      global.RELAY = originalGlobalRelay;
    });

    it('should handle analytics call with no optional params (type, idUser, idAccount are falsey)', async () => {
      flag.mockReturnValue(true);
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { VERSION: 'defaultVAnalytics', HOST: 'defaultHAnalytics' };
      await analytics('', 0, 0, mockCall); 
      expect(mockRelayInstance.post).toHaveBeenCalledWith(
        {}, 
        'tracking',
        {}
      );
      expect(mockCall).toHaveBeenCalledWith({ success_analytics: true });
      global.RELAY = originalGlobalRelay;
    });

    it('should use default empty object for params if not provided in analytics (via postData)', async () => {
      flag.mockReturnValue(true);
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { VERSION: 'defaultVAnalytics', HOST: 'defaultHAnalytics' };
      // analytics itself doesn't take params for postData, postData defaults it to {}
      await analytics(mockType, mockIdUser, mockIdAccount, mockCall);
      expect(mockRelayInstance.post.mock.calls[0][2]).toEqual({}); // Check params argument to post
      global.RELAY = originalGlobalRelay;
    });
  });
});
