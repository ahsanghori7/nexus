import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAccountLogo, getCompanyLogo } from 'v2/helpers/user';
import {
  fetchData,
  patchData,
  postFormData,
  deleteData,
} from 'services/helpers';
import { renderTextWithoutHtml } from 'v2/helpers/data';
import { fetchData as getData } from 'services/clinkHelpers';
import status from 'store/reducers/common/constants';

const fetchCompany = createAsyncThunk('company/fetchCompany', async ({ id }) =>
  fetchData(`company_profile/${id}`).then((result) => result.data)
);

const updateProfile = createAsyncThunk(
  'company/updateProfile',
  async ({ id: aid, data }) => {
    const { id, ...company } = data;
    return patchData(
      'company_profile',
      company,
      `${aid}/company_information`
    ).then((result) => result.json());
  }
);

const updateOffering = createAsyncThunk(
  'company/updateOffering',
  async ({ id: aid, data }) => {
    const body = {};
    if (data.regions) {
      body.regions = data.regions.map((r) => Number(r.id));
    }
    if (data.trades) {
      body.trades = data.trades.map((t) => Number(t.id));
    }
    if (data.types) {
      body.types = data.types.map((t) => Number(t.id));
    }
    return patchData('company_profile', body, `${aid}/oferrings`).then(
      (result) => result.json()
    );
  }
);

const updateCompanyImage = createAsyncThunk(
  'company/updateProfileLogo',
  async ({ id: aid, files, type }) => {
    return postFormData(
      'company_profile',
      { logo: files },
      `${aid}/${type === 'logo' ? 'profile_logo' : 'company_logo'}`
    ).then((result) => result.json());
  }
);

const removeCompanyImage = createAsyncThunk(
  'company/removeProfileLogo',
  async ({ id: aid, files, type }) => {
    return deleteData(
      'company_profile',
      { logo: files },
      `${aid}/${type === 'logo' ? 'profile_logo' : 'company_logo'}`
    )
      .then((result) => result.json())
      .catch(() => '');
  }
);

const updateOfferingsRegions = createAsyncThunk(
  'company/updateOfferingsRegions',
  async ({ aid, regions }) => {
    return patchData(
      'company_profile',
      { regions },
      `${aid}/offerings/regions`
    ).then((result) => result.json());
  }
);

const updateOfferingsTrades = createAsyncThunk(
  'company/updateOfferingsTrades',
  async ({ aid, trades }) => {
    return patchData(
      'company_profile',
      { trades },
      `${aid}/offerings/trades
`
    ).then((result) => result.json());
  }
);

const getCompanyProfile = createAsyncThunk(
  'company_profile/getCompanyProfile',
  async ({ id }) =>
    getData('company_profile', `getCompanyProfile`, {
      subcontractor: id,
    }).then((result) => result.data)
);

const setData = (payload, typeData) => {
  if (payload) {
    switch (typeData) {
      case 'details':
        return {
          id: Number(payload.id ?? 0),
          firstname: renderTextWithoutHtml(payload.firstname ?? ''),
          lastname: renderTextWithoutHtml(payload.lastname ?? ''),
          email: payload.email ?? '',
          name: renderTextWithoutHtml(payload.name ?? payload.name ?? ''),
          registered_address: payload.registered_address ?? '',
          operating_company_address: payload.operating_company_address ?? '',
          reg_number: payload.reg_number ?? '',
          status: payload.status ?? '',
          landline: payload.landline ?? '',
          vat_number: payload.vat_number ?? '',
          mobile: payload.mobile ?? '',
          website: payload.website ?? '',
          linkedin: payload.linkedin ?? '',
          description: payload.description ?? '',
          strapline: payload.strapline ?? '',
          bank_name: payload.bank_name ?? '',
          address: payload.address ?? '',
          sort_code: payload.sort_code ?? '',
          account_number: payload.account_number ?? '',
          collateral_warranties: payload.collateral_warranties ?? '',
          performance_guarantee_bonds:
            payload.performance_guarantee_bonds ?? '',
        };
      case 'userDetails':
        return {
          id: payload.user_id ?? '',
          firstname: payload.firstname ?? '',
          lastname: payload.lastname ?? '',
          email: payload.email ?? '',
          job_description: payload.job_description ?? '',
        };
      case 'description':
        return {
          description: payload.description ?? '',
          strapline: payload.strapline ?? '',
        };
      case 'offering':
        return {
          trades: payload.trades ?? [],
          regions: payload.regions ?? [],
          types: payload.types ?? [],
        };
      default:
        return {};
    }
  }
  return {};
};

export default {
  [fetchCompany.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading company',
      type: status.LOADING_STATUS,
    };
  },
  [fetchCompany.fulfilled]: (state, { payload, meta }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    const { arg } = meta;
    const { id } = arg;
    state.details = setData(payload, 'details');
    state.description = setData(payload, 'description');
    state.offering = setData(payload, 'offering');
    state.userDetails = setData(payload, 'userDetails');

    state.logos = {
      logo: getAccountLogo(id),
      company: getCompanyLogo(id),
    };
  },
  [fetchCompany.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'Error fetchCompany',
      type: status.FAILURE_STATUS,
    };
  },
  [updateProfile.pending]: (state, { meta }) => {
    const { arg } = meta;
    const { typeData } = arg;
    state.statusActions = {
      severity: 'info',
      message: `Updating company ${typeData}`,
      type: status.IDLE_STATUS,
    };
  },
  [updateProfile.fulfilled]: (state, { meta }) => {
    const { arg } = meta;
    const { data, typeData } = arg;
    state[typeData] = setData(data, typeData);
    state.statusActions = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [updateProfile.rejected]: (state, { meta }) => {
    const { arg } = meta;
    const { typeData } = arg;
    state.statusActions = {
      severity: 'error',
      message: `Error updating ${typeData}`,
      type: status.FAILURE_STATUS,
    };
  },
  [updateOffering.pending]: (state) => {
    state.statusActions = {
      severity: 'info',
      message: 'Updating company offering',
      type: status.IDLE_STATUS,
    };
  },
  [updateOffering.fulfilled]: (state, { meta }) => {
    const { arg } = meta;
    const { data } = arg;
    state.offering = setData(data, 'offering');
    state.statusActions = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [updateOffering.rejected]: (state) => {
    state.statusActions = {
      severity: 'error',
      message: 'Error updating offering',
      type: status.FAILURE_STATUS,
    };
  },
  [updateCompanyImage.pending]: () => {},
  [updateCompanyImage.fulfilled]: (state, { payload, meta }) => {
    const { arg } = meta;
    if (payload && payload.success) {
      const { id, type } = arg;
      const image = type === 'logo' ? getAccountLogo(id) : getCompanyLogo(id);
      state.logos[type] = image;
    }
  },
  [updateCompanyImage.rejected]: () => {},
  [removeCompanyImage.pending]: () => {},
  [removeCompanyImage.fulfilled]: (state, { meta }) => {
    const { arg } = meta;
    const { type } = arg;
    state.logos[type] = '';
  },
  [removeCompanyImage.rejected]: () => {},
  [updateOfferingsRegions.pending]: () => {},
  [updateOfferingsRegions.fulfilled]: () => {},
  [updateOfferingsRegions.rejected]: () => {},
  [updateOfferingsTrades.pending]: () => {},
  [updateOfferingsTrades.fulfilled]: () => {},
  [updateOfferingsTrades.rejected]: () => {},
  [getCompanyProfile.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading company',
      type: status.LOADING_STATUS,
    };
  },
  [getCompanyProfile.fulfilled]: (state, { payload, meta }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    const { arg } = meta;
    const { id } = arg;
    state.details = setData(payload, 'details');
    state.description = setData(payload, 'description');
    state.offering = setData(payload, 'offering');
    state.userDetails = setData(payload, 'userDetails');

    state.logos = {
      logo: getAccountLogo(id),
      company: getCompanyLogo(id),
    };
  },
  [getCompanyProfile.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'Error fetchCompany',
      type: status.FAILURE_STATUS,
    };
  },
};
export {
  fetchCompany,
  updateProfile,
  updateOffering,
  updateCompanyImage,
  removeCompanyImage,
  updateOfferingsRegions,
  updateOfferingsTrades,
  getCompanyProfile,
};
