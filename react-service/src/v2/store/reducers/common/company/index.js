import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import extraReducers, {
  fetchCompany,
  updateProfile,
  updateOffering,
  updateCompanyImage,
  removeCompanyImage,
  updateOfferingsRegions,
  updateOfferingsTrades,
  getCompanyProfile,
} from './extraReducers';

const initialState = {
  details: {
    firstname: '',
    lastname: '',
    name: '',
    email: '',
    registered_address: '',
    operating_company_address: '',
    reg_number: '',
    status: '',
    landline: '',
    mobile: '',
    website: '',
    linkedin: '',
    vat_number: '',
    description: '',
    strapline: '',
  },
  userDetails: {
    firstname: '',
    lastname: '',
    email: '',
    job_description: '',
  },
  description: {
    description: '',
    strapline: '',
  },
  offering: {
    trades: [],
    regions: [],
    types: [],
  },
  status: {
    severity: 'info',
    message: 'Loading company',
    type: status.LOADING_STATUS,
  },
  logos: {
    logo: '',
    company: '',
  },
  statusActions: {
    severity: false,
    message: '',
    type: status.IDLE_STATUS,
  },
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    selectOption(state, action) {
      const { data, typeData } = action.payload;
      state.offering[typeData] = data;
    },
    updateCompanyDetails(state, action) {
      const { payload } = action;
      state.details = { ...state.details, ...payload };
    },
  },
  extraReducers,
});

export const { selectOption, updateCompanyDetails } = companySlice.actions;
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
export default companySlice.reducer;
