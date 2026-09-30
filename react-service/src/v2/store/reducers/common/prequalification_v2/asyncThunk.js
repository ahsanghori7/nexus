import { createAsyncThunk } from '@reduxjs/toolkit';
import httpRequest from 'v2/services/httpHelper';
import {
  fetchData,
  patchData,
  postData,
  postFormData,
  deleteData,
} from 'services/helpers';
import {
  fetchData as getData,
  postData as postDataV1,
} from 'services/clinkHelpers';

const fetchPrequalificationSections = createAsyncThunk(
  'prequalificationV2/fetchPrequalificationSections',
  async (_, thunkAPI) => {
    try {
      const result = await fetchData('user', {}, `default_certificates`);
      return result.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const fetchPrequalification = createAsyncThunk(
  'prequalificationV2/fetchPrequalification',
  async (aid, thunkAPI) => {
    try {
      const result = await fetchData('prequalification', {}, aid);
      return result.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const patchCompanyInformation = createAsyncThunk(
  'prequalificationV2/patchCompanyInformation',
  async (data, thunkAPI) => {
    const { aid, ...rest } = data;
    try {
      const result = await patchData('prequalification', rest, `${aid}/company_profile`);
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const postPrequalFile = createAsyncThunk(
  'prequalificationV2/postPrequalFile',
  async (data, thunkAPI) => {
    const { aid, section, label, custom_label, ...rest } = data;
    const labelToSend = custom_label || label;
    const url = `${aid}/create_certificate/${section}`;
    try {
      const result = await postFormData('prequalification', { ...rest, label: labelToSend }, url);
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const patchTurnover = createAsyncThunk(
  'prequalificationV2/patchTurnover',
  async (data, thunkAPI) => {
    const { aid, ...rest } = data;
    try {
      const result = await patchData('prequalification', rest, `${aid}/turnover`);
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const postReferences = createAsyncThunk(
  'prequalificationV2/postReferences',
  async (data, thunkAPI) => {
    const { aid, ...rest } = data;
    try {
      const result = await postFormData('prequalification', rest, `${aid}/references`);
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const resendReferences = createAsyncThunk(
  'prequalificationV2/resendReferences',
  async (data, thunkAPI) => {
    const { aid, id } = data;
    try {
      const result = await postData('prequalification', {}, `${aid}/reference/${id}/resend`);
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const patchOrganization = createAsyncThunk(
  'prequalificationV2/patchOrganization',
  async (data, thunkAPI) => {
    const { aid, ...rest } = data;
    try {
      const result = await patchData('prequalification', rest, `${aid}/organisation`);
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const postOrganization = createAsyncThunk(
  'prequalificationV2/postOrganization',
  async (data, thunkAPI) => {
    const { aid, ...rest } = data;
    try {
      // TODO: upload foto doesn't work (postFormData)
      const result = await postData('team_manager', rest, `${aid}/member/invite`);
      const jsonData = await result.json();
      return jsonData.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const patchOrganizationV2 = createAsyncThunk(
  'prequalificationV2/patchOrganizationV2',
  async (data, thunkAPI) => {
    const { aid, id, ...rest } = data;
    try {
      // TODO: upload foto doesn't work (postFormData/patchFormData)
      const result = await patchData('team_manager', rest, `${aid}/member/${id}/update`);
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const deleteTeamMember = createAsyncThunk(
  'prequalificationV2/deleteTeamMember',
  async (data, thunkAPI) => {
    const { aid, id } = data;
    try {
      const result = await deleteData('team_manager', {}, `${aid}/member/${id}/delete`);
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const deletePrequalificationSection = createAsyncThunk(
  'prequalificationV2/deletePrequalificationSection',
  async ({ id, aid }, thunkAPI) => {
    try {
      const result = await deleteData('prequalification', null, `${aid}/section/${id}`);
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const deletePrequalificationReference = createAsyncThunk(
  'prequalificationV2/deletePrequalificationSection', // Action type name seems to be a copy-paste
  async ({ id, aid }, thunkAPI) => {
    try {
      const result = await deleteData('prequalification', null, `${aid}/reference/${id}`);
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const getPrequalification = createAsyncThunk(
  'prequalificationV2/getPrequalification',
  async (id, thunkAPI) => {
    try {
      const result = await getData('prequalification', `getPrequalification`, { subcontractor: id });
      return result.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const getPrequalificationSections = createAsyncThunk(
  'prequalificationV2/getPrequalificationSections',
  async (_, thunkAPI) => {
    try {
      const result = await getData('prequalification', 'getDefaultCertificates');
      return result.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const requestDocument = createAsyncThunk(
  'prequalificationV2/requestDocument',
  async (data, thunkAPI) => {
    const { aid, type, data: objData } = data;
    const body = {
      id: objData.id || null,
      section: type,
      name: objData.label,
      request_type: objData.request_type,
    };
    try {
      const result = await postDataV1('prequalification', 'requestDocument', body, { subcontractor: aid });
      return result.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const getPrequalificationStatuses = createAsyncThunk(
  'prequalificationV2/getPrequalificationStatuses',
  async (_, thunkAPI) => {
    try {
      return await httpRequest({ url: `prequalification/sections` });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

export {
  fetchPrequalification,
  patchCompanyInformation,
  fetchPrequalificationSections,
  patchTurnover,
  postPrequalFile,
  resendReferences,
  postReferences,
  patchOrganization,
  postOrganization,
  patchOrganizationV2,
  deletePrequalificationSection,
  deletePrequalificationReference,
  getPrequalification,
  getPrequalificationSections,
  requestDocument,
  deleteTeamMember,
  getPrequalificationStatuses,
};
