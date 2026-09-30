import i18next from 'v2/helpers/i18n';
import { createAsyncThunk } from '@reduxjs/toolkit';
import capitalize from 'lodash/capitalize';
import { renderTextWithoutHtml } from 'v2/helpers/data';
import { fetchData, postData } from 'services/helpers';
import status from 'store/reducers/common/constants';

const ACTIVATED_SUPPLY_CHAIN = 16;

const fetchUsers = createAsyncThunk('users/fetchUsers', async (params) => {
  const { page, ...rest } = params;
  const { limit, ...args } = rest;
  return fetchData('user', limit > 0 ? rest : args).then((result) => ({
    ...result,
    ...params,
  }));
});

const createAccount = createAsyncThunk('admin/createAccount', async (data) => {
  const sanitizedData = {}; // TODO: We should make this in a more globally way
  Object.keys(data).forEach((key) => {
    sanitizedData[key] = renderTextWithoutHtml(data[key]);
  });
  postData('account', sanitizedData).then((result) => result.json());
});

export default {
  [fetchUsers.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading users',
      type: status.LOADING_STATUS,
    };
    state.list = [];
  },
  [fetchUsers.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    const activatedText = i18next.t(
      'users-table-column-activated-supply-chain'
    );
    // TODO: Check user
    const users =
      payload && payload.data
        ? payload.data.map((user) => ({
            ...user,
            frequency: capitalize(user.frequency),
            'activated-supply-chain':
              Number(user.subscription_id) === ACTIVATED_SUPPLY_CHAIN
                ? activatedText
                : `Not ${activatedText.toLocaleLowerCase()}`,
            user: renderTextWithoutHtml(user.name),
            company: renderTextWithoutHtml(user.company),
            'registration-date': user.created_at,
            'last-login': '',
          }))
        : [];
    // To trick pagination component, we add the number of
    // offset object behind the current page
    let mockUserList = [...new Array(payload.offset).keys()];
    mockUserList = mockUserList.map((id) => ({ id: `mock-id-${id}` }));
    state.list = [...mockUserList, ...users];
    state.listCount = (payload && payload.info && payload.info.count) || 0;
  },
  [fetchUsers.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'Error loading users',
      type: status.FAILURE_STATUS,
    };
    state.list = [];
    state.listCount = 0;
  },
  [createAccount.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading createAccount',
      type: status.LOADING_STATUS,
    };
  },
  [createAccount.fulfilled]: (state) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [createAccount.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE',
      type: status.FAILURE_STATUS,
    };
  },
};
export { fetchUsers, createAccount };
