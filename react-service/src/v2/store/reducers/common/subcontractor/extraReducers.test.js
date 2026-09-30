import { produce } from 'immer';
import { renderTextWithoutHtml } from 'v2/helpers/data';
import extraReducers, {
  fetchSubcontractorInfo,
  updateSubcontractorDescription,
  fetchRooms,
  unlockProject,
  claimToken,
} from './extraReducers';
import status from 'store/reducers/common/constants';

// Mock external dependencies
jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
  postData: jest.fn(),
  patchData: jest.fn(),
}));

jest.mock('v2/helpers/clarity', () => jest.fn());

jest.mock('v2/helpers/data', () => ({
  renderTextWithoutHtml: jest.fn((text) => text || ''),
}));

// Mock global variables
global.CLARITY = {
  PROJECT_ID: 'test-project',
  DEBUG: true,
};
global.ENV = 'staging';

const initialState = {
  id: null,
  accountId: null,
  created_at: null,
  title: '',
  subtitle: '',
  membership: {},
  tokens_top_up: 1,
  info: {},
  trades: [],
  regions: [],
  subscription_id: null,
  token_prices: {},
  contractor_id: null,
  firstname: '',
  lastname: '',
  email: '',
  job_description: '',
  account_owner: false,
  unlocked_projects: [],
  prosperProBanner: false,
  canClaimFreeTokens: false,
  how_to_win_work_opted: false,
  country: '',
  features: [],
  rooms: [],
  status: { severity: '', message: '', type: status.IDLE_STATUS },
  statusActions: { severity: '', message: '', type: status.IDLE_STATUS },
  statusRoom: '',
};

describe('common subcontractor extraReducers', () => {
  describe('updateSubcontractorDescription', () => {
    it('should handle updateSubcontractorDescription.pending', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[updateSubcontractorDescription.pending](draft);
      });

      expect(state.statusActions).toEqual({
        severity: 'info',
        message: 'Updating subcontractor details',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle updateSubcontractorDescription.fulfilled', () => {
      const meta = {
        arg: {
          data: {
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com',
            job_description: 'Developer',
          },
        },
      };

      const state = produce(initialState, (draft) => {
        extraReducers[updateSubcontractorDescription.fulfilled](draft, { meta });
      });

      expect(state.firstname).toBe('John');
      expect(state.lastname).toBe('Doe');
      expect(state.email).toBe('john@example.com');
      expect(state.job_description).toBe('Developer');
      expect(state.statusActions).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle updateSubcontractorDescription.fulfilled with partial data', () => {
      const initialStateWithData = {
        ...initialState,
        firstname: 'Jane',
        lastname: 'Smith',
        email: 'jane@example.com',
        job_description: 'Manager',
      };

      const meta = {
        arg: {
          data: {
            firstname: 'John',
            // Only updating firstname
          },
        },
      };

      const state = produce(initialStateWithData, (draft) => {
        extraReducers[updateSubcontractorDescription.fulfilled](draft, { meta });
      });

      expect(state.firstname).toBe('John');
      expect(state.lastname).toBe('Smith'); // Should keep existing value
      expect(state.email).toBe('jane@example.com'); // Should keep existing value
      expect(state.job_description).toBe('Manager'); // Should keep existing value
    });

    it('should handle updateSubcontractorDescription.rejected', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[updateSubcontractorDescription.rejected](draft);
      });

      expect(state.statusActions).toEqual({
        severity: 'error',
        message: 'Updating subcontractor details failed',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('fetchSubcontractorInfo', () => {
    it('should handle fetchSubcontractorInfo.pending', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[fetchSubcontractorInfo.pending](draft);
      });

      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading fetchAdminInfo',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle fetchSubcontractorInfo.fulfilled with complete payload', () => {
      const payload = {
        id: 123,
        account_id: 456,
        created_at: '2023-01-01',
        display_name: 'John Doe',
        company_name: 'Acme Corp',
        membership: { tokens: 10 },
        tokens_top_up: 5,
        trades: ['Plumbing', 'Electrical'],
        regions: ['North', 'South'],
        subscription_id: 789,
        token_prices: { premium: 5.99 },
        contractor_id: 'CONT123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@acme.com',
        job_description: 'Senior Contractor',
        account_owner: true,
        unlocked_projects: [1, 2, 3],
        prosper_pro_banner: true,
        can_claim_free_tokens: true,
        how_to_win_work_opted: true,
        country: 'UK',
        features: ['feature1', 'feature2'],
      };

      const state = produce(initialState, (draft) => {
        extraReducers[fetchSubcontractorInfo.fulfilled](draft, { payload });
      });

      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.id).toBe(123);
      expect(state.accountId).toBe(456);
      expect(state.created_at).toBe('2023-01-01');
      expect(state.title).toBe('John Doe');
      expect(state.subtitle).toBe('Acme Corp');
      expect(state.membership).toEqual({ tokens: 10 });
      expect(state.tokens_top_up).toBe(5);
      expect(state.trades).toEqual(['Plumbing', 'Electrical']);
      expect(state.regions).toEqual(['North', 'South']);
      expect(state.subscription_id).toBe(789);
      expect(state.token_prices).toEqual({ premium: 5.99 });
      expect(state.contractor_id).toBe('CONT123');
      expect(state.firstname).toBe('John');
      expect(state.lastname).toBe('Doe');
      expect(state.email).toBe('john@acme.com');
      expect(state.job_description).toBe('Senior Contractor');
      expect(state.account_owner).toBe(true);
      expect(state.unlocked_projects).toEqual([1, 2, 3]);
      expect(state.prosperProBanner).toBe(true);
      expect(state.canClaimFreeTokens).toBe(true);
      expect(state.how_to_win_work_opted).toBe(true);
      expect(state.country).toBe('UK');
      expect(state.features).toEqual(['feature1', 'feature2']);
      expect(state.info).toEqual(payload);
    });

    it('should handle fetchSubcontractorInfo.fulfilled with partial payload', () => {
      const initialStateWithData = {
        ...initialState,
        id: 999,
        title: 'Existing Title',
        membership: { existing: 'data' },
      };

      const payload = {
        id: 123,
        display_name: 'New Title',
        // Missing other fields to test fallback to existing values
      };

      const state = produce(initialStateWithData, (draft) => {
        extraReducers[fetchSubcontractorInfo.fulfilled](draft, { payload });
      });

      expect(state.id).toBe(123); // Updated
      expect(state.title).toBe('New Title'); // Updated
      expect(state.membership).toEqual({ existing: 'data' }); // Kept existing since payload.membership is undefined
    });

    it('should handle fetchSubcontractorInfo.fulfilled with empty payload', () => {
      const payload = {};

      const state = produce(initialState, (draft) => {
        extraReducers[fetchSubcontractorInfo.fulfilled](draft, { payload });
      });

      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      // All values should remain as initial state since payload is empty
      expect(state.id).toBeNull();
      expect(state.title).toBe('');
      expect(state.info).toEqual({});
    });

    it('should handle fetchSubcontractorInfo.rejected', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[fetchSubcontractorInfo.rejected](draft);
      });

      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('fetchRooms', () => {
    it('should handle fetchRooms.pending', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[fetchRooms.pending](draft);
      });

      expect(state.statusRoom).toBe('loading');
    });

    it('should handle fetchRooms.fulfilled with valid rooms', () => {
      const payload = [
        {
          id: 1,
          company: { name: 'Company A' },
          author: { name: 'Author 1' },
          recipient: { name: 'Recipient 1' },
          project: { name: 'Project 1' },
          lastUpdate: '2023-01-01',
        },
        {
          id: 2,
          company: { name: 'Company B' },
          author: { name: 'Author 2' },
          recipient: { name: 'Recipient 2' },
          project: { name: 'Project 2' },
          lastUpdate: '2023-01-02',
        },
        {
          id: 3,
          // Invalid room - missing required fields
          company: { name: 'Company C' },
          // author: { name: 'Author 3' }, // Missing
          recipient: { name: 'Recipient 3' },
          project: { name: 'Project 3' },
          lastUpdate: '2023-01-03',
        },
      ];

      const state = produce(initialState, (draft) => {
        extraReducers[fetchRooms.fulfilled](draft, { payload });
      });

      expect(state.statusRoom).toBe('');
      // Should only include valid rooms (rooms 1 and 2), sorted by lastUpdate in reverse
      expect(state.rooms).toHaveLength(2);
      expect(state.rooms[0].id).toBe(2); // Latest first
      expect(state.rooms[1].id).toBe(1);
    });

    it('should handle fetchRooms.fulfilled with empty array', () => {
      const payload = [];

      const state = produce(initialState, (draft) => {
        extraReducers[fetchRooms.fulfilled](draft, { payload });
      });

      expect(state.statusRoom).toBe('');
      expect(state.rooms).toEqual([]);
    });

    it('should handle fetchRooms.fulfilled with non-array payload', () => {
      const payload = null;

      const state = produce(initialState, (draft) => {
        extraReducers[fetchRooms.fulfilled](draft, { payload });
      });

      expect(state.statusRoom).toBe('');
      expect(state.rooms).toEqual([]);
    });

    it('should handle fetchRooms.rejected', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[fetchRooms.rejected](draft);
      });

      expect(state.statusRoom).toBe('error');
      expect(state.rooms).toEqual([]);
    });
  });

  describe('unlockProject', () => {
    it('should handle unlockProject.pending', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[unlockProject.pending](draft);
      });

      // Pending handler is empty, so state should remain unchanged
      expect(state).toEqual(initialState);
    });

    it('should handle unlockProject.fulfilled with success', () => {
      const initialStateWithProjects = {
        ...initialState,
        unlocked_projects: [1, 2],
      };

      const meta = { arg: 3 }; // Project ID to unlock
      const payload = { success: true };

      const state = produce(initialStateWithProjects, (draft) => {
        extraReducers[unlockProject.fulfilled](draft, { meta, payload });
      });

      expect(state.unlocked_projects).toEqual([1, 2, 3]);
    });

    it('should handle unlockProject.fulfilled without success', () => {
      const initialStateWithProjects = {
        ...initialState,
        unlocked_projects: [1, 2],
      };

      const meta = { arg: 3 };
      const payload = { success: false };

      const state = produce(initialStateWithProjects, (draft) => {
        extraReducers[unlockProject.fulfilled](draft, { meta, payload });
      });

      expect(state.unlocked_projects).toEqual([1, 2]); // Unchanged
    });

    it('should handle unlockProject.rejected', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[unlockProject.rejected](draft);
      });

      // Rejected handler is empty, so state should remain unchanged
      expect(state).toEqual(initialState);
    });
  });

  describe('claimToken', () => {
    it('should handle claimToken.pending', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[claimToken.pending](draft);
      });

      // Pending handler is empty, so state should remain unchanged
      expect(state).toEqual(initialState);
    });

    it('should handle claimToken.fulfilled with success', () => {
      const initialStateWithTokens = {
        ...initialState,
        membership: { tokens: 5 },
        tokens_top_up: 3,
        canClaimFreeTokens: true,
      };

      const payload = { success: true };

      const state = produce(initialStateWithTokens, (draft) => {
        extraReducers[claimToken.fulfilled](draft, { payload });
      });

      expect(state.membership.tokens).toBe(8); // 5 + 3
      expect(state.canClaimFreeTokens).toBe(false);
    });

    it('should handle claimToken.fulfilled with success and no existing tokens', () => {
      const initialStateNoTokens = {
        ...initialState,
        membership: {},
        tokens_top_up: 2,
        canClaimFreeTokens: true,
      };

      const payload = { success: true };

      const state = produce(initialStateNoTokens, (draft) => {
        extraReducers[claimToken.fulfilled](draft, { payload });
      });

      expect(state.membership.tokens).toBe(2); // 0 + 2
      expect(state.canClaimFreeTokens).toBe(false);
    });

    it('should handle claimToken.fulfilled with success and no tokens_top_up', () => {
      const initialStateNoTopUp = {
        ...initialState,
        membership: { tokens: 10 },
        tokens_top_up: null,
        canClaimFreeTokens: true,
      };

      const payload = { success: true };

      const state = produce(initialStateNoTopUp, (draft) => {
        extraReducers[claimToken.fulfilled](draft, { payload });
      });

      expect(state.membership.tokens).toBe(11); // 10 + 1 (default)
      expect(state.canClaimFreeTokens).toBe(false);
    });

    it('should handle claimToken.fulfilled without success', () => {
      const initialStateWithTokens = {
        ...initialState,
        membership: { tokens: 5 },
        tokens_top_up: 3,
        canClaimFreeTokens: true,
      };

      const payload = { success: false };

      const state = produce(initialStateWithTokens, (draft) => {
        extraReducers[claimToken.fulfilled](draft, { payload });
      });

      expect(state.membership.tokens).toBe(5); // Unchanged
      expect(state.canClaimFreeTokens).toBe(true); // Unchanged
    });

    it('should handle claimToken.rejected', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[claimToken.rejected](draft);
      });

      // Rejected handler is empty, so state should remain unchanged
      expect(state).toEqual(initialState);
    });
  });

  describe('edge cases and integration', () => {
    it('should preserve other state properties during updates', () => {
      const stateWithExtraProperties = {
        ...initialState,
        customProperty: 'should be preserved',
        id: 999,
      };

      const payload = { id: 123 };

      const state = produce(stateWithExtraProperties, (draft) => {
        extraReducers[fetchSubcontractorInfo.fulfilled](draft, { payload });
      });

      expect(state.customProperty).toBe('should be preserved');
      expect(state.id).toBe(123); // Updated
    });

    it('should handle multiple room filtering conditions', () => {
      const payload = [
        {
          id: 1,
          company: { name: 'Company A' },
          author: { name: 'Author 1' },
          recipient: { name: 'Recipient 1' },
          project: { name: 'Project 1' },
          lastUpdate: '2023-01-01',
        },
        {
          id: 2,
          company: null, // Invalid
          author: { name: 'Author 2' },
          recipient: { name: 'Recipient 2' },
          project: { name: 'Project 2' },
          lastUpdate: '2023-01-02',
        },
        {
          id: 3,
          company: { name: '' }, // Invalid - empty name
          author: { name: 'Author 3' },
          recipient: { name: 'Recipient 3' },
          project: { name: 'Project 3' },
          lastUpdate: '2023-01-03',
        },
        {
          id: 4,
          company: { name: 'Company D' },
          author: null, // Invalid
          recipient: { name: 'Recipient 4' },
          project: { name: 'Project 4' },
          lastUpdate: '2023-01-04',
        },
      ];

      const state = produce(initialState, (draft) => {
        extraReducers[fetchRooms.fulfilled](draft, { payload });
      });

      expect(state.rooms).toHaveLength(1); // Only the first room is valid
      expect(state.rooms[0].id).toBe(1);
    });

    it('should handle renderTextWithoutHtml for display fields', () => {
      renderTextWithoutHtml.mockImplementation((text) => `cleaned_${text}`);

      const payload = {
        display_name: '<script>alert("xss")</script>John',
        company_name: '<b>Acme</b> Corp',
      };

      const state = produce(initialState, (draft) => {
        extraReducers[fetchSubcontractorInfo.fulfilled](draft, { payload });
      });

      expect(state.title).toBe('cleaned_<script>alert("xss")</script>John');
      expect(state.subtitle).toBe('cleaned_<b>Acme</b> Corp');
    });
  });
});
