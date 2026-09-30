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
import { fetchData, patchData } from 'services/helpers';
import { fetchData as getData } from 'services/clinkHelpers';
import { getAccountLogo, getCompanyLogo } from 'v2/helpers/user';
import status from 'store/reducers/common/constants';

// Mock dependencies
jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
  patchData: jest.fn(),
  postFormData: jest.fn(),
  deleteData: jest.fn(),
}));

jest.mock('services/clinkHelpers', () => ({
  fetchData: jest.fn(),
}));

jest.mock('v2/helpers/user', () => ({
  getAccountLogo: jest.fn(),
  getCompanyLogo: jest.fn(),
}));

jest.mock('v2/helpers/data', () => ({
  renderTextWithoutHtml: jest.fn((text) => text),
}));

describe('common company extraReducers', () => {
  const dispatch = jest.fn();
  const getState = jest.fn();
  
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCompany async thunk', () => {
    it('should create action with correct type prefix', () => {
      expect(fetchCompany.typePrefix).toBe('company/fetchCompany');
    });

    it('should call fetchData with correct parameters', async () => {
      const mockResponse = { data: { id: 1, name: 'Test Company' } };
      fetchData.mockResolvedValue(mockResponse);

      const thunk = fetchCompany({ id: 1 });
      const result = await thunk(dispatch, getState, undefined);

      expect(fetchData).toHaveBeenCalledWith('company_profile/1');
      expect(result.payload).toEqual(mockResponse.data);
    });

    it('should handle fetchCompany.pending', () => {
      const state = { ...initialState };
      const action = { type: fetchCompany.pending.type };

      extraReducers[fetchCompany.pending](state, action);

      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading company',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle fetchCompany.fulfilled', () => {
      const state = { ...initialState };
      const payload = {
        id: 1,
        name: 'Test Company',
        email: 'test@example.com',
      };
      const meta = { arg: { id: 1 } };
      const action = { type: fetchCompany.fulfilled.type, payload, meta };

      getAccountLogo.mockReturnValue('logo-url');
      getCompanyLogo.mockReturnValue('company-logo-url');

      extraReducers[fetchCompany.fulfilled](state, action);

      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.logos).toEqual({
        logo: 'logo-url',
        company: 'company-logo-url',
      });
    });

    it('should handle fetchCompany.rejected', () => {
      const state = { ...initialState };
      const action = { type: fetchCompany.rejected.type };

      extraReducers[fetchCompany.rejected](state, action);

      expect(state.status).toEqual({
        severity: 'error',
        message: 'Error fetchCompany',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('updateProfile async thunk', () => {
    it('should create action with correct type prefix', () => {
      expect(updateProfile.typePrefix).toBe('company/updateProfile');
    });

    it('should call patchData with correct parameters', async () => {
      const mockResponse = { json: () => Promise.resolve({ success: true }) };
      patchData.mockResolvedValue(mockResponse);

      const thunk = updateProfile({
        id: 1,
        data: { id: 1, name: 'Updated Company' },
      });
      await thunk(dispatch, getState, undefined);

      expect(patchData).toHaveBeenCalledWith(
        'company_profile',
        { name: 'Updated Company' },
        '1/company_information'
      );
    });

    it('should handle updateProfile.pending', () => {
      const state = { ...initialState };
      const meta = { arg: { typeData: 'details' } };
      const action = { type: updateProfile.pending.type, meta };

      extraReducers[updateProfile.pending](state, action);

      expect(state.statusActions).toEqual({
        severity: 'info',
        message: 'Updating company details',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle updateProfile.fulfilled', () => {
      const state = { ...initialState };
      const meta = {
        arg: {
          data: { name: 'Updated Company' },
          typeData: 'details',
        },
      };
      const action = { type: updateProfile.fulfilled.type, meta };

      extraReducers[updateProfile.fulfilled](state, action);

      expect(state.statusActions).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle updateProfile.rejected', () => {
      const state = { ...initialState };
      const meta = { arg: { typeData: 'details' } };
      const action = { type: updateProfile.rejected.type, meta };

      extraReducers[updateProfile.rejected](state, action);

      expect(state.statusActions).toEqual({
        severity: 'error',
        message: 'Error updating details',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('updateOffering async thunk', () => {
    it('should create action with correct type prefix', () => {
      expect(updateOffering.typePrefix).toBe('company/updateOffering');
    });

    it('should call patchData with correct parameters for all offering types', async () => {
      const mockResponse = { json: () => Promise.resolve({ success: true }) };
      patchData.mockResolvedValue(mockResponse);

      const data = {
        regions: [{ id: '1' }, { id: '2' }],
        trades: [{ id: '3' }, { id: '4' }],
        types: [{ id: '5' }, { id: '6' }],
      };

      const thunk = updateOffering({ id: 1, data });
      await thunk(dispatch, getState, undefined);

      expect(patchData).toHaveBeenCalledWith(
        'company_profile',
        {
          regions: [1, 2],
          trades: [3, 4],
          types: [5, 6],
        },
        '1/oferrings'
      );
    });

    it('should handle updateOffering.pending', () => {
      const state = { ...initialState };
      const action = { type: updateOffering.pending.type };

      extraReducers[updateOffering.pending](state, action);

      expect(state.statusActions).toEqual({
        severity: 'info',
        message: 'Updating company offering',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle updateOffering.fulfilled', () => {
      const state = { ...initialState };
      const meta = { arg: { data: { trades: [], regions: [], types: [] } } };
      const action = { type: updateOffering.fulfilled.type, meta };

      extraReducers[updateOffering.fulfilled](state, action);

      expect(state.statusActions).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle updateOffering.rejected', () => {
      const state = { ...initialState };
      const action = { type: updateOffering.rejected.type };

      extraReducers[updateOffering.rejected](state, action);

      expect(state.statusActions).toEqual({
        severity: 'error',
        message: 'Error updating offering',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('updateCompanyImage async thunk', () => {
    it('should create action with correct type prefix', () => {
      expect(updateCompanyImage.typePrefix).toBe('company/updateProfileLogo');
    });

    it('should handle updateCompanyImage.fulfilled with success', () => {
      const state = { ...initialState };
      const payload = { success: true };
      const meta = { arg: { id: 1, type: 'logo' } };
      const action = { type: updateCompanyImage.fulfilled.type, payload, meta };

      getAccountLogo.mockReturnValue('new-logo-url');

      extraReducers[updateCompanyImage.fulfilled](state, action);

      expect(state.logos.logo).toBe('new-logo-url');
    });

    it('should handle updateCompanyImage.fulfilled with company type', () => {
      const state = { ...initialState };
      const payload = { success: true };
      const meta = { arg: { id: 1, type: 'company' } };
      const action = { type: updateCompanyImage.fulfilled.type, payload, meta };

      getCompanyLogo.mockReturnValue('new-company-logo-url');

      extraReducers[updateCompanyImage.fulfilled](state, action);

      expect(state.logos.company).toBe('new-company-logo-url');
    });

    it('should handle updateCompanyImage.pending', () => {
      const state = { ...initialState };
      const action = { type: updateCompanyImage.pending.type };

      // Should not change state
      const originalState = JSON.parse(JSON.stringify(state));
      extraReducers[updateCompanyImage.pending](state, action);
      expect(state).toEqual(originalState);
    });

    it('should handle updateCompanyImage.rejected', () => {
      const state = { ...initialState };
      const action = { type: updateCompanyImage.rejected.type };

      // Should not change state
      const originalState = JSON.parse(JSON.stringify(state));
      extraReducers[updateCompanyImage.rejected](state, action);
      expect(state).toEqual(originalState);
    });
  });

  describe('removeCompanyImage async thunk', () => {
    it('should create action with correct type prefix', () => {
      expect(removeCompanyImage.typePrefix).toBe('company/removeProfileLogo');
    });

    it('should handle removeCompanyImage.fulfilled', () => {
      const state = {
        ...initialState,
        logos: { logo: 'existing-logo', company: 'existing-company' },
      };
      const meta = { arg: { type: 'logo' } };
      const action = { type: removeCompanyImage.fulfilled.type, meta };

      extraReducers[removeCompanyImage.fulfilled](state, action);

      expect(state.logos.logo).toBe('');
      expect(state.logos.company).toBe('existing-company'); // Unchanged
    });
  });

  describe('getCompanyProfile async thunk', () => {
    it('should create action with correct type prefix', () => {
      expect(getCompanyProfile.typePrefix).toBe('company_profile/getCompanyProfile');
    });

    it('should call getData with correct parameters', async () => {
      const mockResponse = { data: { id: 1, name: 'Test Company' } };
      getData.mockResolvedValue(mockResponse);

      const thunk = getCompanyProfile({ id: 1 });
      const result = await thunk(dispatch, getState, undefined);

      expect(getData).toHaveBeenCalledWith('company_profile', 'getCompanyProfile', {
        subcontractor: 1,
      });
      expect(result.payload).toEqual(mockResponse.data);
    });

    it('should handle getCompanyProfile.pending', () => {
      const state = { ...initialState };
      const action = { type: getCompanyProfile.pending.type };

      extraReducers[getCompanyProfile.pending](state, action);

      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading company',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle getCompanyProfile.fulfilled', () => {
      const state = { ...initialState };
      const payload = { id: 1, name: 'Test Company' };
      const meta = { arg: { id: 1 } };
      const action = { type: getCompanyProfile.fulfilled.type, payload, meta };

      getAccountLogo.mockReturnValue('logo-url');
      getCompanyLogo.mockReturnValue('company-logo-url');

      extraReducers[getCompanyProfile.fulfilled](state, action);

      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.logos).toEqual({
        logo: 'logo-url',
        company: 'company-logo-url',
      });
    });

    it('should handle getCompanyProfile.rejected', () => {
      const state = { ...initialState };
      const action = { type: getCompanyProfile.rejected.type };

      extraReducers[getCompanyProfile.rejected](state, action);

      expect(state.status).toEqual({
        severity: 'error',
        message: 'Error fetchCompany',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('empty reducer handlers', () => {
    it('should handle updateOfferingsRegions actions without errors', () => {
      const state = { ...initialState };
      
      // Should not throw or modify state
      expect(() => {
        extraReducers[updateOfferingsRegions.pending](state, {});
        extraReducers[updateOfferingsRegions.fulfilled](state, {});
        extraReducers[updateOfferingsRegions.rejected](state, {});
      }).not.toThrow();
    });

    it('should handle updateOfferingsTrades actions without errors', () => {
      const state = { ...initialState };
      
      // Should not throw or modify state
      expect(() => {
        extraReducers[updateOfferingsTrades.pending](state, {});
        extraReducers[updateOfferingsTrades.fulfilled](state, {});
        extraReducers[updateOfferingsTrades.rejected](state, {});
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle updateCompanyImage.fulfilled with no success flag', () => {
      const state = { ...initialState };
      const payload = { success: false };
      const meta = { arg: { id: 1, type: 'logo' } };
      const action = { type: updateCompanyImage.fulfilled.type, payload, meta };

      const originalLogos = { ...state.logos };
      extraReducers[updateCompanyImage.fulfilled](state, action);

      expect(state.logos).toEqual(originalLogos); // Should not change
    });

    it('should handle updateCompanyImage.fulfilled with null payload', () => {
      const state = { ...initialState };
      const payload = null;
      const meta = { arg: { id: 1, type: 'logo' } };
      const action = { type: updateCompanyImage.fulfilled.type, payload, meta };

      const originalLogos = { ...state.logos };
      extraReducers[updateCompanyImage.fulfilled](state, action);

      expect(state.logos).toEqual(originalLogos); // Should not change
    });
  });
});
