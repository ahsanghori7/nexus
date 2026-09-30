import { createAsyncThunk } from '@reduxjs/toolkit';
import { postFormData } from 'services/helpers';

const activateTeamAccount = createAsyncThunk(
  'teamManagerActivation/activateTeamAccount',
  async ({ tokenId, data }) => {
    return postFormData('team_manager', data, `activate/${tokenId}`).then(
      (response) => {
        return response.json();
      }
    );
  }
);

export default {
  [activateTeamAccount.pending]: () => {},
  [activateTeamAccount.fulfilled]: () => {},
  [activateTeamAccount.rejected]: () => {},
};
export { activateTeamAccount };
