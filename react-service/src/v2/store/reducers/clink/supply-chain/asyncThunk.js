import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  mapData,
  getDataFromForm,
  transformFormData,
} from 'v1/supply-chain-v2/helpers/isolated-functions';
import { httpHelperV2 as httpHelperService } from 'v2/services/httpHelper';
import isEmpty from 'lodash/isEmpty';
import { analytics } from 'v1/global/helpers/services';

const fetchAll = createAsyncThunk(
  'account/supply-chain',
  async (params = {}) => {
    const queryUrl = isEmpty(params)
      ? ''
      : `?${new URLSearchParams(params).toString()}`;
    return httpHelperService({ url: `account/supply-chain${queryUrl}` }).then(
      (result) => {
        const data = (result?.data && Object.values(result.data)) ?? [];
        const info = result?.info ?? { total: 0 };
        const aid = result?.aid ?? 0;
        return {
          data: data.map((item) => mapData(item)),
          info,
          aid,
        };
      },
    );
  },
);
const fetchBySubcontractorId = createAsyncThunk(
  'account/get-by-subcontractorId-supply-chain',
  async ({ subcontractor_id }) => {
    const response = await httpHelperService({
      url: `account/supply-chain/${subcontractor_id}`,
      method: 'GET',
    });
    return response;
  },
);
const addData = createAsyncThunk(
  'account/add-supply-chain',
  async (data, thunkAPI) => {
    try {
      const body = getDataFromForm(data);

      const response = await httpHelperService({
        url: 'account/supply-chain',
        method: 'POST',
        body: body.data,
      });

      if (response?.data?.success && response?.data?.subcontractor?.id) {
        analytics(
          'supply_chain.invite',
          Number(response?.data?.subcontractor?.id),
        );
        const sub = {
          ...body.data,
          ...response.data.subcontractor,
        };
        return {
          ...sub,
          users: [sub],
        };
      }
      return thunkAPI.rejectWithValue({
        message:
          response?.data?.message ||
          'An error occurred when creating a subcontractor',
        response,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error?.response?.data?.message || error?.message,
        status: error?.status,
        response: error?.response,
      });
    }
  },
);

const editData = createAsyncThunk(
  'account/edit-supply-chain',
  async ({ data, params }) => {
    const body = getDataFromForm(data);
    return httpHelperService({
      url: `account/supply-chain/${params?.id || 0}`,
      method: 'PATCH',
      body: body.data,
    }).then((response) => {
      if (response?.data?.status) {
        return transformFormData(params.id, data);
      }
      throw new Error('An error ocurred when editing a subcontractor');
    });
  },
);

const removeData = createAsyncThunk(
  'account/remove-supply-chain',
  async (data) => {
    return httpHelperService({
      url: `account/supply-chain/${data?.id || 0}`,
      method: 'DELETE',
    });
  },
);

const getContacts = createAsyncThunk(
  'account/getContacts',
  async (subcontractorId) => {
    return httpHelperService({
      url: `account/supply-chain/${subcontractorId}/users`,
      method: 'GET',
    });
  },
);

const addContact = createAsyncThunk(
  'account/addContact',
  async ({ contact, subcontractorId }, thunkAPI) => {
    try {
      return await httpHelperService({
        url: `account/supply-chain/${subcontractorId}/user`,
        method: 'POST',
        body: contact,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message,
        status: error.status,
        response: error.response,
      });
    }
  },
);

const updateContact = createAsyncThunk(
  'account/updateContact',
  async ({ subcontractorId, userId, contact }) => {
    return httpHelperService({
      url: `account/supply-chain/${subcontractorId}/user/${userId}`,
      method: 'PATCH',
      body: contact,
    });
  },
);

const removeContact = createAsyncThunk(
  'account/removeContact',
  async ({ subcontractorId, userId }) => {
    return httpHelperService({
      url: `account/supply-chain/${subcontractorId}/user/${userId}`,
      method: 'DELETE',
    });
  },
);

const setMainContact = createAsyncThunk(
  'account/setMainContact',
  async ({ data, params }) => {
    return httpHelperService({
      url: `account/supply-chain/${params?.account_id}/user/${params?.id}/update-main-contact`,
      method: 'PATCH',
      body: data,
    }).then((response) => {
      if (response?.status) {
        return response;
      }
      throw new Error('An error ocurred when editing a subcontractor');
    });
  },
);

export {
  fetchAll,
  fetchBySubcontractorId,
  addData,
  editData,
  removeData,
  getContacts,
  addContact,
  updateContact,
  removeContact,
  setMainContact,
};
