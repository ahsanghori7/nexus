import { createAsyncThunk } from '@reduxjs/toolkit';
import sortBy from 'lodash/sortBy';
import orderBy from 'lodash/orderBy';
import i18next from 'v2/helpers/i18n';
import { fetchData } from 'services/helpers';
import status from 'store/reducers/common/constants';

const fetchActivities = createAsyncThunk(
  'activity/fetchActivities',
  async (id) =>
    fetchData(`account/activities/${id}`).then((result) => result.data)
);

export default {
  [fetchActivities.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading activities',
      type: status.LOADING_STATUS,
    };
  },
  [fetchActivities.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };

    const statuses = [
      i18next.t('unawarded'),
      i18next.t('unsuccessful'),
      i18next.t('awarded'),
    ];
    const noData = 'N/A';

    let list = payload.map((i) => {
      const { enquiry_recieved, interest_registered, quotes_uploaded } = i;
      let last_activity = noData;
      const datesToCheck = [
        enquiry_recieved
          ? {
              date: enquiry_recieved,
              formattedDate: new Date(enquiry_recieved),
            }
          : null,
        interest_registered
          ? {
              date: interest_registered,
              formattedDate: new Date(interest_registered),
            }
          : null,
        quotes_uploaded
          ? {
              date: quotes_uploaded,
              formattedDate: new Date(quotes_uploaded),
            }
          : null,
      ].filter((d) => d);
      if (datesToCheck.length) {
        const dateObj = sortBy(datesToCheck, ['formattedDate']).pop();
        last_activity = dateObj.date;
      }
      const result = {
        ...i,
        last_activity,
        project_package: `${i.project}/${i.package}`,
        interest_registered: interest_registered || noData,
        enquiry_recieved: enquiry_recieved || noData,
        quotes_uploaded: quotes_uploaded || noData,
        packaged_awarded_status: i.packaged_awarded_status
          ? statuses[Number(i.packaged_awarded_status)]
          : statuses[0],
      };
      return result;
    });
    list = orderBy(list, ['last_activity'], ['desc']);
    state.list = list;
  },
  [fetchActivities.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'Error fetchActivities',
      type: status.FAILURE_STATUS,
    };
  },
};
export { fetchActivities };
