import { createSlice } from '@reduxjs/toolkit';
import min from 'lodash/min';
import extraReducers, {
  fetchPrequalification,
  patchCompanyInformation,
  fetchPrequalificationSections,
  patchTurnover,
  postPrequalFile,
  resendReferences,
  postReferences,
  postOrganization,
  patchOrganization,
  deletePrequalificationSection,
  deletePrequalificationReference,
  patchOrganizationV2,
  getPrequalification,
  getPrequalificationSections,
  requestDocument,
  deleteTeamMember,
  getPrequalificationStatuses,
} from './extraReducers';
import { INITIAL_TURNOVER, initPercentage } from './common';
import status from 'store/reducers/common/constants';

const initialState = {
  statusPreq: {
    severity: 'info',
    message: 'Loading',
    type: status.LOADING_STATUS,
  },
  documents: {},
  company_information: {
    trading_name: '',
    utr_number: '',
    num_current_employees: 0,
    num_current_contractors: 0,
    min_order_value: '',
    max_order_value: '',
    avg_order_value: '',
  },
  organisation: [],
  turnover: [INITIAL_TURNOVER],
  references: [],
  percentage: {
    finance: 0,
    documents: 0,
    references: 0,
  },
  statuses: [],
  // Initialize all known document data arrays
  insurances: [],
  accreditation: [],
  "management-system": [],
  "health-safety": [],
  "health-safety-environmental-qualifications": [],
  environmental: [],
  quality: [],
  "example-documents": [],
  "custom-certificate": [],
};

const MAX_TURNOVER = 3;
const prequalificationSlice = createSlice({
  name: 'prequalificationV2',
  initialState,
  reducers: {
    addCertificate(state) {
      state['custom-certificate'] = [
        ...state['custom-certificate'],
        {
          id: null,
          label: '',
          file: null,
          document: null,
          date: '',
          checked: false,
        },
      ];
    },
    addTurnover(state) {
      if (state.turnover.length < MAX_TURNOVER) {
        const minYear = min([...state.turnover].map((t) => Number(t.year)));
        const newTurnover = [
          ...state.turnover,
          { ...INITIAL_TURNOVER, year: String(minYear - 1) },
        ];
        state.turnover = newTurnover;
        initPercentage(state);
      }
    },
    updateTurnover(state, { payload }) {
      const newTurnover = state.turnover.map((t) => {
        if (Number(t.year) === Number(payload.year)) {
          return {
            ...t,
            [payload.name]: payload.value,
          };
        }
        return t;
      });
      state.turnover = newTurnover;
      initPercentage(state);
    },
    removeTurnover(state, { payload }) {
      state.turnover = state.turnover.filter(
        (t) => Number(t.year) !== Number(payload)
      );
      initPercentage(state);
    },
    updateSize(state, { payload }) {
      const { aid: _aid1, ...rest1 } = payload.bodyCompanyInfo;
      const { aid: _aid2, ...rest2 } = payload.bodyTurnover;
      state.company_information = { ...state.company_information, ...rest1 };
      state.turnover = Object.values(rest2);
    },
    changeLocalCompanyInfo(state, { payload }) {
      const { value, section } = payload;
      state.company_information[section] = value;
      initPercentage(state);
    },
  },
  extraReducers,
});

export const {
  addCertificate,
  addTurnover,
  updateTurnover,
  removeTurnover,
  updateSize,
  changeLocalCompanyInfo,
} = prequalificationSlice.actions;
export {
  fetchPrequalification,
  patchCompanyInformation,
  fetchPrequalificationSections,
  patchTurnover,
  postPrequalFile,
  resendReferences,
  postReferences,
  postOrganization,
  patchOrganization,
  deletePrequalificationSection,
  deletePrequalificationReference,
  patchOrganizationV2,
  getPrequalification,
  getPrequalificationSections,
  requestDocument,
  deleteTeamMember,
  getPrequalificationStatuses,
};
export default prequalificationSlice.reducer;
