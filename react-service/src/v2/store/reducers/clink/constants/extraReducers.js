import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData } from 'services/clinkHelpers';
import i18next from 'v2/helpers/i18n';

// TODO: Remove this file when attibutes are fully migrated to the new system
const fetchConstants = createAsyncThunk('clink/fetchConstants', async () =>
  fetchData('project', 'getConstants'),
);

export default {
  [fetchConstants.pending]: () => {},
  [fetchConstants.fulfilled]: (state, { payload }) => {
    state.default_categories = payload.default_categories;
    state.pricing_document = payload.pricing_document;
    /* BEGINING OF HACKING BACKEND VALUES */
    const tender = payload.tender || {};
    const project = payload.project || {};

    const newSize = {};
    if (tender.size) {
      for (const [key, value] of Object.entries(tender.size)) {
        newSize[key] = value.replaceAll('£', i18next.t('currency'));
      }
    }

    state.tender = {
      ...tender,
      size: newSize,
    };

    const newInsurances = (project.insurances || []).map((i) =>
      i.replaceAll('£', i18next.t('currency')),
    );

    state.project = {
      ...project,
      insurances: newInsurances,
    };
    /* END OF HACKING BACKEND VALUES */
  },
  [fetchConstants.rejected]: () => {},
};

export { fetchConstants };
