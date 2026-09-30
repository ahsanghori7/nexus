import companyReducer, {
  selectOption,
  updateCompanyDetails,
  fetchCompany,
  updateProfile,
  updateOffering,
  updateCompanyImage,
  removeCompanyImage,
  updateOfferingsRegions,
  updateOfferingsTrades,
  getCompanyProfile,
} from './index';
import status from 'store/reducers/common/constants';

describe('common company reducer', () => {
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

  it('should return the initial state', () => {
    expect(companyReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle undefined state', () => {
    expect(companyReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('selectOption action', () => {
    it('should update offering with provided data and typeData', () => {
      const action = selectOption({
        data: [{ id: 1, name: 'Trade 1' }],
        typeData: 'trades',
      });
      const state = companyReducer(initialState, action);

      expect(state.offering.trades).toEqual([{ id: 1, name: 'Trade 1' }]);
      expect(state.offering.regions).toEqual([]);
      expect(state.offering.types).toEqual([]);
    });

    it('should update offering regions', () => {
      const action = selectOption({
        data: [{ id: 1, name: 'Region 1' }],
        typeData: 'regions',
      });
      const state = companyReducer(initialState, action);

      expect(state.offering.regions).toEqual([{ id: 1, name: 'Region 1' }]);
      expect(state.offering.trades).toEqual([]);
    });

    it('should update offering types', () => {
      const action = selectOption({
        data: [{ id: 1, name: 'Type 1' }],
        typeData: 'types',
      });
      const state = companyReducer(initialState, action);

      expect(state.offering.types).toEqual([{ id: 1, name: 'Type 1' }]);
    });

    it('should handle empty data', () => {
      const action = selectOption({
        data: [],
        typeData: 'trades',
      });
      const state = companyReducer(initialState, action);

      expect(state.offering.trades).toEqual([]);
    });
  });

  describe('updateCompanyDetails action', () => {
    it('should merge new details with existing details', () => {
      const action = updateCompanyDetails({
        name: 'New Company Name',
        email: 'test@example.com',
      });
      const state = companyReducer(initialState, action);

      expect(state.details.name).toBe('New Company Name');
      expect(state.details.email).toBe('test@example.com');
      expect(state.details.firstname).toBe(''); // Existing field remains
    });

    it('should handle partial updates', () => {
      const currentState = {
        ...initialState,
        details: {
          ...initialState.details,
          name: 'Existing Name',
          email: 'existing@example.com',
        },
      };

      const action = updateCompanyDetails({
        name: 'Updated Name',
      });
      const state = companyReducer(currentState, action);

      expect(state.details.name).toBe('Updated Name');
      expect(state.details.email).toBe('existing@example.com'); // Unchanged
    });

    it('should handle empty payload', () => {
      const action = updateCompanyDetails({});
      const state = companyReducer(initialState, action);

      expect(state.details).toEqual(initialState.details);
    });
  });

  describe('async thunk exports', () => {
    it('should export fetchCompany thunk', () => {
      expect(fetchCompany).toBeDefined();
      expect(fetchCompany.typePrefix).toBe('company/fetchCompany');
    });

    it('should export updateProfile thunk', () => {
      expect(updateProfile).toBeDefined();
      expect(updateProfile.typePrefix).toBe('company/updateProfile');
    });

    it('should export updateOffering thunk', () => {
      expect(updateOffering).toBeDefined();
      expect(updateOffering.typePrefix).toBe('company/updateOffering');
    });

    it('should export updateCompanyImage thunk', () => {
      expect(updateCompanyImage).toBeDefined();
      expect(updateCompanyImage.typePrefix).toBe('company/updateProfileLogo');
    });

    it('should export removeCompanyImage thunk', () => {
      expect(removeCompanyImage).toBeDefined();
      expect(removeCompanyImage.typePrefix).toBe('company/removeProfileLogo');
    });

    it('should export updateOfferingsRegions thunk', () => {
      expect(updateOfferingsRegions).toBeDefined();
      expect(updateOfferingsRegions.typePrefix).toBe('company/updateOfferingsRegions');
    });

    it('should export updateOfferingsTrades thunk', () => {
      expect(updateOfferingsTrades).toBeDefined();
      expect(updateOfferingsTrades.typePrefix).toBe('company/updateOfferingsTrades');
    });

    it('should export getCompanyProfile thunk', () => {
      expect(getCompanyProfile).toBeDefined();
      expect(getCompanyProfile.typePrefix).toBe('company_profile/getCompanyProfile');
    });
  });

  describe('edge cases', () => {
    it('should handle unknown action type', () => {
      const action = { type: 'unknown/action' };
      const state = companyReducer(initialState, action);

      expect(state).toEqual(initialState);
    });

    it('should preserve existing state for unknown actions', () => {
      const currentState = {
        ...initialState,
        details: { ...initialState.details, name: 'Test Company' },
      };
      const action = { type: 'unknown/action' };
      const state = companyReducer(currentState, action);

      expect(state).toEqual(currentState);
    });
  });
});
