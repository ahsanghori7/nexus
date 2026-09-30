import { createAsyncThunk } from '@reduxjs/toolkit';
import Relay from 'v2/services/relay';
import { postData, patchData } from 'services/clinkHelpers';

const relay = new Relay('relay', '', '');
const fetchInstructions = createAsyncThunk(
  'instructions/fetchInstructions',
  async ({ pid, method }) =>
    relay
      .get('', { action: 'project_management', method, pid })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status)
);

const fetchInstruction = createAsyncThunk(
  'instructions/fetchInstruction',
  async ({ id }) =>
    relay
      .get('', { action: 'project_management', method: 'getInstruction', id })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status)
);

const createInstruction = createAsyncThunk(
  'project/createInstruction',
  async ({ data }) =>
    postData('project_management', 'createInstruction', data)
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status)
);

const updateInstruction = createAsyncThunk(
  'project/updateInstruction',
  async ({ id, instruction }) =>
    patchData('project_management', 'updateInstruction', instruction, { id })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status)
);

const fetchSubcontractors = createAsyncThunk(
  'instructions/fetchSubcontractors',
  async (pid) =>
    relay
      .get('', {
        action: 'project_management',
        method: 'getSubcontractors',
        pid,
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status)
);

const fetchAsset = async (method) =>
  relay
    .get('', { action: 'project_management', method })
    .then((result) => (result.status === 200 ? result.json() : result.status))
    .catch((error) => error.status);

const fetchStatus = createAsyncThunk('instructions/fetchStatus', () =>
  fetchAsset('getStatus')
);

const fetchType = createAsyncThunk('instructions/fetchType', () =>
  fetchAsset('getType')
);

const deleteInstruction = createAsyncThunk(
  'instructions/deleteInstruction',
  async (id) =>
    relay
      .deleter('', {
        action: 'project_management',
        method: 'deleteInstruction',
        id,
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status)
);

const fetchForecastList = createAsyncThunk(
  'project/fetchForecastList',
  async (pid) =>
    relay
      .get('', { action: 'project_management', method: 'listForecast', pid })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status)
);

export {
  fetchInstructions,
  fetchInstruction,
  fetchType,
  fetchStatus,
  fetchSubcontractors,
  deleteInstruction,
  fetchForecastList,
  createInstruction,
  updateInstruction,
};
