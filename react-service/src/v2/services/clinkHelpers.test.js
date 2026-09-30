import {
  fetchData as clinkFetchData,
  postData as clinkPostData,
  postFormData as clinkPostFormData,
  patchData as clinkPatchData,
  deleteData as clinkDeleteData,
} from './clinkHelpers';

// Mock the underlying helper functions from 'v2/services/helpers'
jest.mock('v2/services/helpers', () => ({
  fetchData: jest.fn(),
  postData: jest.fn(),
  postFormData: jest.fn(),
  patchData: jest.fn(),
  deleteData: jest.fn(),
}));

// Import the mocked functions to be able to check them
const {
  fetchData,
  postData,
  postFormData,
  patchData,
  deleteData,
} = require('v2/services/helpers');


describe('Clink Service Helpers', () => {
  const CLINK_RESOURCE = 'relay';
  const mockAction = 'testAction';
  const mockMethod = 'testMethod';
  const mockParams = { id: 1, value: 'test' };
  const mockData = { name: 'dataName' };

  beforeEach(() => {
    // Clear all mock call history
    fetchData.mockClear();
    postData.mockClear();
    postFormData.mockClear();
    patchData.mockClear();
    deleteData.mockClear();
  });

  describe('fetchData', () => {
    it('should call helpers.fetchData with correct arguments', () => {
      clinkFetchData(mockAction, mockMethod, mockParams);
      expect(fetchData).toHaveBeenCalledWith(
        CLINK_RESOURCE,
        { action: mockAction, method: mockMethod, ...mockParams },
        '', // method for helpers.fetchData
        '', // version for helpers.fetchData
        ''  // host for helpers.fetchData
      );
    });

    it('should call helpers.fetchData with default empty params if not provided', () => {
      clinkFetchData(mockAction, mockMethod);
      expect(fetchData).toHaveBeenCalledWith(
        CLINK_RESOURCE,
        { action: mockAction, method: mockMethod }, // params defaults to {} internally, then spread
        '', '', ''
      );
    });
  });

  describe('postData', () => {
    it('should call helpers.postData with correct arguments', () => {
      clinkPostData(mockAction, mockMethod, mockData, mockParams);
      expect(postData).toHaveBeenCalledWith(
        CLINK_RESOURCE,
        mockData,
        '', // method for helpers.postData
        { action: mockAction, method: mockMethod, ...mockParams },
        '', // version
        '', // host
        ''  // This was an extra empty string in the original clinkHelpers, seems like a typo.
            // The actual postData in helpers.js takes (resource, data, method, params, version, host)
            // clinkHelpers.postData calls it with 7 args: (CLINK_RESOURCE, data, '', { action, method, ...params }, '', '', '')
            // The last '' is an extra argument. Let's match the actual call.
      );
    });
     it('should call helpers.postData with default empty params if not provided', () => {
      clinkPostData(mockAction, mockMethod, mockData);
      expect(postData).toHaveBeenCalledWith(
        CLINK_RESOURCE,
        mockData,
        '',
        { action: mockAction, method: mockMethod },
        '', '', ''
      );
    });
  });

  describe('postFormData', () => {
    it('should call helpers.postFormData with correct arguments', () => {
      clinkPostFormData(mockAction, mockMethod, mockData, mockParams);
      expect(postFormData).toHaveBeenCalledWith(
        CLINK_RESOURCE,
        mockData,
        '', // method for helpers.postFormData
        { action: mockAction, method: mockMethod, ...mockParams },
        '', // version
        '', // host
        ''  // Extra argument as in postData
      );
    });
  });

  describe('patchData', () => {
    it('should call helpers.patchData with correct arguments', () => {
      clinkPatchData(mockAction, mockMethod, mockData, mockParams);
      expect(patchData).toHaveBeenCalledWith(
        CLINK_RESOURCE,
        mockData,
        '', // method for helpers.patchData
        { action: mockAction, method: mockMethod, ...mockParams },
        '', // version
        '', // host
        ''  // Extra argument
      );
    });
  });

  describe('deleteData', () => {
    it('should call helpers.deleteData with correct arguments', () => {
      // deleteData in clinkHelpers: (action, method, params)
      // deleteData in helpers: (resource, data = {}, method = '', params = {}, version = RELAY.VERSION, host = RELAY.HOST)
      // clinkHelpers.deleteData calls: deleter(CLINK_RESOURCE, {}, '', { action, method, ...params }, '', '', '')
      // So, data is {}, method is '', params is {action, method, ...params}, version is '', host is '', extra ''
      clinkDeleteData(mockAction, mockMethod, mockParams);
      expect(deleteData).toHaveBeenCalledWith(
        CLINK_RESOURCE,
        {}, // data for helpers.deleteData
        '', // method for helpers.deleteData
        { action: mockAction, method: mockMethod, ...mockParams },
        '', // version
        '', // host
        ''  // Extra argument
      );
    });
  });
});
