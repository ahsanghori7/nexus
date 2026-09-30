import {
  fetchAll,
  addData,
  editData,
  removeData,
  getContacts,
  addContact,
  updateContact,
  removeContact,
  setMainContact,
} from './asyncThunk';
import { httpHelperV2 } from 'v2/services/httpHelper';
import { analytics } from 'v1/global/helpers/services';
import isEmpty from 'lodash/isEmpty';
import {
  getDataFromForm,
  transformFormData,
} from 'v1/supply-chain-v2/helpers/isolated-functions';

// Mock the dependencies
jest.mock('v1/supply-chain-v2/helpers/isolated-functions', () => ({
  mapData: jest.fn((data) => ({ ...data, mapped: true })),
  getDataFromForm: jest.fn((data) => ({ data: { ...data, processed: true } })),
  transformFormData: jest.fn((id, data) => ({ id, ...data, transformed: true })),
}));

jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: jest.fn(),
}));

jest.mock('v1/global/helpers/services', () => ({
  analytics: jest.fn(),
}));

jest.mock('lodash/isEmpty', () => jest.fn());

describe('supply-chain asyncThunk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAll', () => {
    it('should create fetchAll with correct type', () => {
      expect(fetchAll.typePrefix).toBe('account/supply-chain');
    });

    it('should fetch data with empty params', async () => {
      const mockResponse = {
        data: {
          1: { id: 1, name: 'Company 1' },
          2: { id: 2, name: 'Company 2' },
        },
        info: { total: 2 },
        aid: 123,
      };

      isEmpty.mockReturnValue(true);
      httpHelperV2.mockResolvedValue(mockResponse);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await fetchAll()(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain',
      });
      expect(result.payload).toEqual({
        data: [
          { id: 1, name: 'Company 1', mapped: true },
          { id: 2, name: 'Company 2', mapped: true },
        ],
        info: { total: 2 },
        aid: 123,
      });
    });

    it('should fetch data with query params', async () => {
      const params = { search: 'test', limit: 10 };
      const mockResponse = {
        data: { 1: { id: 1, name: 'Test Company' } },
        info: { total: 1 },
        aid: 456,
      };

      isEmpty.mockReturnValue(false);
      httpHelperV2.mockResolvedValue(mockResponse);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await fetchAll(params)(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain?search=test&limit=10',
      });
      expect(result.payload.data).toHaveLength(1);
      expect(result.payload.aid).toBe(456);
    });

    it('should handle response with no data', async () => {
      const mockResponse = {};

      isEmpty.mockReturnValue(true);
      httpHelperV2.mockResolvedValue(mockResponse);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await fetchAll()(dispatch, getState, undefined);

      expect(result.payload).toEqual({
        data: [],
        info: { total: 0 },
        aid: 0,
      });
    });
  });

  describe('addData', () => {
    it('should create addData with correct type', () => {
      expect(addData.typePrefix).toBe('account/add-supply-chain');
    });

    it('should add data successfully', async () => {
      const inputData = { name: 'New Company', email: 'test@example.com' };
      const mockResponse = {
        data: {
          success: true,
          subcontractor: { id: 123, name: 'New Company' },
        },
      };

      getDataFromForm.mockReturnValue({
        data: { ...inputData, processed: true },
      });
      httpHelperV2.mockResolvedValue(mockResponse);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await addData(inputData)(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain',
        method: 'POST',
        body: { ...inputData, processed: true },
      });
      expect(analytics).toHaveBeenCalledWith('supply_chain.invite', 123);
      expect(result.payload.users).toHaveLength(1);
    });

    it('should handle add data failure', async () => {
      const inputData = { name: 'New Company' };
      
      getDataFromForm.mockReturnValue({
        data: { ...inputData, processed: true },
      });
      httpHelperV2.mockRejectedValue(new Error('Network error'));

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await addData(inputData)(dispatch, getState, undefined);

      expect(result.type).toBe('account/add-supply-chain/rejected');
    });
  });

  describe('editData', () => {
    it('should create editData with correct type', () => {
      expect(editData.typePrefix).toBe('account/edit-supply-chain');
    });

    it('should edit data successfully', async () => {
      const inputData = { name: 'Updated Company' };
      const params = { id: 123 };
      const mockResponse = { data: { status: true } };

      getDataFromForm.mockReturnValue({
        data: { ...inputData, processed: true },
      });
      httpHelperV2.mockResolvedValue(mockResponse);
      transformFormData.mockReturnValue({ id: 123, transformed: true });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await editData({ data: inputData, params })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain/123',
        method: 'PATCH',
        body: { ...inputData, processed: true },
      });
      expect(transformFormData).toHaveBeenCalledWith(123, inputData);
      expect(result.payload).toEqual({ id: 123, transformed: true });
    });

    it('should handle edit data failure', async () => {
      const inputData = { name: 'Updated Company' };
      const params = { id: 123 };
      const mockResponse = { data: { status: false } };

      getDataFromForm.mockReturnValue({
        data: { ...inputData, processed: true },
      });
      httpHelperV2.mockResolvedValue(mockResponse);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await editData({ data: inputData, params })(dispatch, getState, undefined);

      expect(result.type).toBe('account/edit-supply-chain/rejected');
      expect(result.error.message).toBe('An error ocurred when editing a subcontractor');
    });
  });

  describe('removeData', () => {
    it('should create removeData with correct type', () => {
      expect(removeData.typePrefix).toBe('account/remove-supply-chain');
    });

    it('should remove data successfully', async () => {
      const data = { id: 123 };
      httpHelperV2.mockResolvedValue({ success: true });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await removeData(data)(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain/123',
        method: 'DELETE',
      });
      expect(result.payload).toEqual({ success: true });
    });

    it('should handle remove data with no id', async () => {
      const data = {};
      httpHelperV2.mockResolvedValue({ success: true });

      const dispatch = jest.fn();
      const getState = jest.fn();

      await removeData(data)(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain/0',
        method: 'DELETE',
      });
    });
  });

  describe('getContacts', () => {
    it('should create getContacts with correct type', () => {
      expect(getContacts.typePrefix).toBe('account/getContacts');
    });

    it('should get contacts successfully', async () => {
      const subcontractorId = 123;
      const mockResponse = { data: [{ id: 1, name: 'Contact 1' }] };

      httpHelperV2.mockResolvedValue(mockResponse);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await getContacts(subcontractorId)(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain/123/users',
        method: 'GET',
      });
      expect(result.payload).toEqual(mockResponse);
    });
  });

  describe('addContact', () => {
    it('should create addContact with correct type', () => {
      expect(addContact.typePrefix).toBe('account/addContact');
    });

    it('should add contact successfully', async () => {
      const contactData = {
        contact: { name: 'New Contact', email: 'contact@example.com' },
        subcontractorId: 123,
      };
      const mockResponse = { data: { id: 1, ...contactData.contact } };

      httpHelperV2.mockResolvedValue(mockResponse);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await addContact(contactData)(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain/123/user',
        method: 'POST',
        body: contactData.contact,
      });
      expect(result.payload).toEqual(mockResponse);
    });
  });

  describe('updateContact', () => {
    it('should create updateContact with correct type', () => {
      expect(updateContact.typePrefix).toBe('account/updateContact');
    });

    it('should update contact successfully', async () => {
      const contactData = {
        subcontractorId: 123,
        userId: 456,
        contact: { id: 1, name: 'Updated Contact' },
      };
      const mockResponse = { data: contactData.contact };

      httpHelperV2.mockResolvedValue(mockResponse);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await updateContact(contactData)(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain/123/user/456',
        method: 'PATCH',
        body: contactData.contact,
      });
      expect(result.payload).toEqual(mockResponse);
    });
  });

  describe('removeContact', () => {
    it('should create removeContact with correct type', () => {
      expect(removeContact.typePrefix).toBe('account/removeContact');
    });

    it('should remove contact successfully', async () => {
      const params = { subcontractorId: 123, userId: 456 };
      const mockResponse = { success: true };

      httpHelperV2.mockResolvedValue(mockResponse);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await removeContact(params)(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain/123/user/456',
        method: 'DELETE',
      });
      expect(result.payload).toEqual(mockResponse);
    });
  });

  describe('setMainContact', () => {
    it('should create setMainContact with correct type', () => {
      expect(setMainContact.typePrefix).toBe('account/setMainContact');
    });

    it('should handle setMainContact call', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      
      httpHelperV2.mockResolvedValue(mockResponse);

      const params = { 
        data: { mainUserId: 456 },
        params: { account_id: 123, id: 456 }
      };

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await setMainContact(params)(dispatch, getState, undefined);

      // The async thunk should return the response from httpHelper
      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/supply-chain/123/user/456/update-main-contact',
        method: 'PATCH',
        body: { mainUserId: 456 },
      });
      expect(result.payload).toEqual(mockResponse);
    });
  });
});
