import { produce } from 'immer';
import extraReducers, {
  fetchProject,
  fetchProjectGantt,
  updateTender,
  fetchProjectSummary,
  fetchPackageDependency,
  addProject,
  updateProject,
  fetchTeamApi,
  postMember,
  deleteMember,
  fetchIfsProjects,
  fetchLinkedIfsProject,
} from './extraReducers';

// Mock lodash functions
jest.mock('lodash/find', () =>
  jest.fn((collection, predicate) => {
    if (!collection) return undefined;
    return collection.find(predicate);
  }),
);

describe('project extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      data: null,
      status: '',
      instructions: [],
      summary: {},
      dependency: {},
      statusSummary: '',
      members: [],
    };
  });

  // fetchProject and fetchProjectGantt (share same reducers)
  describe('fetchProject and fetchProjectGantt', () => {
    const sharedTests = (thunk) => {
      it(`should handle ${thunk.pending.type} correctly`, () => {
        const action = { type: thunk.pending.type };
        const state = produce(initialState, (draft) => {
          extraReducers[thunk.pending.type](draft, action);
        });
        expect(state.status).toBe('');
      });

      it(`should handle ${thunk.fulfilled.type} correctly with valid payload`, () => {
        const mockPayload = { id: 1, name: 'Project A' };
        const action = { type: thunk.fulfilled.type, payload: mockPayload };
        const state = produce(initialState, (draft) => {
          extraReducers[thunk.fulfilled.type](draft, action);
        });
        expect(state.data).toEqual(mockPayload);
        expect(state.status).toBe('');
      });

      it(`should handle ${thunk.fulfilled.type} correctly with error payload (number)`, () => {
        const action = { type: thunk.fulfilled.type, payload: 404 };
        const state = produce(initialState, (draft) => {
          extraReducers[thunk.fulfilled.type](draft, action);
        });
        expect(state.data).toBeNull();
        expect(state.status).toBe('Error loading project (404)');
      });

      it(`should handle ${thunk.fulfilled.type} correctly with error payload (object)`, () => {
        const action = {
          type: thunk.fulfilled.type,
          payload: { error: 'Not Found' },
        };
        const state = produce(initialState, (draft) => {
          extraReducers[thunk.fulfilled.type](draft, action);
        });
        expect(state.data).toBeNull();
        expect(state.status).toBe('Error loading project (Not Found)');
      });

      it(`should handle ${thunk.rejected.type} correctly`, () => {
        const action = { type: thunk.rejected.type };
        const state = produce(initialState, (draft) => {
          extraReducers[thunk.rejected.type](draft, action);
        });
        expect(state.status).toBe('Error loading project');
      });
    };

    sharedTests(fetchProject);
    sharedTests(fetchProjectGantt);
  });

  // fetchProjectSummary
  describe('fetchProjectSummary', () => {
    it('should handle fetchProjectSummary.pending correctly', () => {
      const action = { type: fetchProjectSummary.pending.type };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchProjectSummary.pending.type](draft, action);
      });
      expect(state.statusSummary).toBe('');
    });

    it('should handle fetchProjectSummary.fulfilled correctly with payload', () => {
      const mockPayload = { data: { total: 100 } };
      const action = {
        type: fetchProjectSummary.fulfilled.type,
        payload: mockPayload,
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchProjectSummary.fulfilled.type](draft, action);
      });
      expect(state.summary).toEqual({ total: 100 });
      expect(state.statusSummary).toBe('');
    });

    it('should handle fetchProjectSummary.fulfilled correctly with empty payload', () => {
      const action = {
        type: fetchProjectSummary.fulfilled.type,
        payload: null,
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchProjectSummary.fulfilled.type](draft, action);
      });
      expect(state.summary).toEqual({});
      expect(state.statusSummary).toBe('');
    });

    it('should handle fetchProjectSummary.rejected correctly', () => {
      const action = { type: fetchProjectSummary.rejected.type };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchProjectSummary.rejected.type](draft, action);
      });
      expect(state.statusSummary).toBe('Error loading project summary');
    });
  });

  // fetchPackageDependency
  describe('fetchPackageDependency', () => {
    it('should handle fetchPackageDependency.pending correctly', () => {
      const action = { type: fetchPackageDependency.pending.type };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchPackageDependency.pending.type](draft, action);
      });
      expect(state.status).toBe('Loading package dependency');
    });

    it('should handle fetchPackageDependency.fulfilled correctly with payload', () => {
      const mockPayload = { data: { dep1: 'value1' } };
      const action = {
        type: fetchPackageDependency.fulfilled.type,
        payload: mockPayload,
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchPackageDependency.fulfilled.type](draft, action);
      });
      expect(state.dependency).toEqual({ dep1: 'value1' });
      expect(state.status).toBe('');
    });

    it('should handle fetchPackageDependency.fulfilled correctly with empty payload', () => {
      const action = {
        type: fetchPackageDependency.fulfilled.type,
        payload: null,
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchPackageDependency.fulfilled.type](draft, action);
      });
      expect(state.dependency).toEqual({});
      expect(state.status).toBe('');
    });

    it('should handle fetchPackageDependency.rejected correctly', () => {
      const action = { type: fetchPackageDependency.rejected.type };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchPackageDependency.rejected.type](draft, action);
      });
      expect(state.status).toBe('Error loading package dependency');
    });
  });

  // updateTender
  describe('updateTender', () => {
    it('should handle updateTender.pending without state change', () => {
      const action = { type: updateTender.pending.type };
      const state = produce(initialState, (draft) => {
        extraReducers[updateTender.pending.type](draft, action);
      });
      expect(state).toEqual(initialState);
    });

    it('should handle updateTender.fulfilled correctly', () => {
      initialState.data = {
        tender: [
          { id: 1, name: 'Tender A' },
          { id: 2, name: 'Tender B' },
        ],
      };
      const action = {
        type: updateTender.fulfilled.type,
        meta: {
          arg: {
            tid: 1,
            data: { name: 'Updated Tender A', status: 'Approved' },
          },
        },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[updateTender.fulfilled.type](draft, action);
      });
      expect(state.data.tender).toEqual([
        { id: 1, name: 'Updated Tender A', status: 'Approved' },
        { id: 2, name: 'Tender B' },
      ]);
    });

    it('should handle updateTender.rejected correctly', () => {
      const action = { type: updateTender.rejected.type };
      const state = produce(initialState, (draft) => {
        extraReducers[updateTender.rejected.type](draft, action);
      });
      expect(state.status).toBe('Error Updating tender');
    });
  });

  // addProject
  describe('addProject', () => {
    it('should handle addProject.pending without state change', () => {
      const action = { type: addProject.pending.type };
      const state = produce(initialState, (draft) => {
        extraReducers[addProject.pending.type](draft, action);
      });
      expect(state).toEqual(initialState);
    });

    it('should handle addProject.fulfilled without state change', () => {
      const action = { type: addProject.fulfilled.type };
      const state = produce(initialState, (draft) => {
        extraReducers[addProject.fulfilled.type](draft, action);
      });
      expect(state).toEqual(initialState);
    });

    it('should handle addProject.rejected correctly', () => {
      const action = { type: addProject.rejected.type };
      const state = produce(initialState, (draft) => {
        extraReducers[addProject.rejected.type](draft, action);
      });
      expect(state.status).toBe('Error Adding Project');
    });
  });

  // updateProject
  describe('updateProject', () => {
    it('should handle updateProject.pending without state change', () => {
      const action = { type: updateProject.pending.type };
      const state = produce(initialState, (draft) => {
        extraReducers[updateProject.pending.type](draft, action);
      });
      expect(state).toEqual(initialState);
    });

    it('should handle updateProject.fulfilled correctly', () => {
      initialState.data = { id: 1, name: 'Old Name' };
      const action = {
        type: updateProject.fulfilled.type,
        meta: { arg: { data: { name: 'New Name', status: 'Active' } } },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[updateProject.fulfilled.type](draft, action);
      });
      expect(state.data).toEqual({ id: 1, name: 'New Name', status: 'Active' });
    });

    it('should handle updateProject.rejected correctly', () => {
      const action = { type: updateProject.rejected.type };
      const state = produce(initialState, (draft) => {
        extraReducers[updateProject.rejected.type](draft, action);
      });
      expect(state.status).toBe('Error Updating Project');
    });
  });

  // fetchTeamApi
  describe('fetchTeamApi', () => {
    it('should handle fetchTeamApi.pending correctly', () => {
      const action = { type: fetchTeamApi.pending.type };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchTeamApi.pending.type](draft, action);
      });
      expect(state.status).toBe('Loading Fetching Team Members');
    });

    it('should handle fetchTeamApi.fulfilled correctly', () => {
      const mockPayload = { data: [{ user_id: 1, name: 'Member A' }] };
      const action = {
        type: fetchTeamApi.fulfilled.type,
        payload: mockPayload,
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchTeamApi.fulfilled.type](draft, action);
      });
      expect(state.members).toEqual([{ user_id: 1, name: 'Member A' }]);
      expect(state.status).toBe('');
    });

    it('should handle fetchTeamApi.fulfilled with empty payload', () => {
      const mockPayload = { data: null };
      const action = {
        type: fetchTeamApi.fulfilled.type,
        payload: mockPayload,
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchTeamApi.fulfilled.type](draft, action);
      });
      expect(state.members).toEqual([]);
      expect(state.status).toBe('');
    });

    it('should handle fetchTeamApi.rejected correctly', () => {
      const action = { type: fetchTeamApi.rejected.type };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchTeamApi.rejected.type](draft, action);
      });
      expect(state.status).toBe('Error Fetching Team Members');
    });
  });

  // postMember
  describe('postMember', () => {
    it('should handle postMember.pending correctly', () => {
      const action = { type: postMember.pending.type };
      const state = produce(initialState, (draft) => {
        extraReducers[postMember.pending.type](draft, action);
      });
      expect(state.status).toBe('Loading Post Team Member');
    });

    it('should handle postMember.fulfilled for existing member', () => {
      initialState.members = [
        { user_id: 1, name: 'Old Member', member: { position: { id: 1 } } },
      ];
      const action = {
        type: postMember.fulfilled.type,
        meta: { arg: { id: 1, name: 'Updated Member', position: 2 } },
        payload: { data: { user_id: 1, member_id: 101 } },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[postMember.fulfilled.type](draft, action);
      });
      expect(state.members).toEqual([
        {
          id: 101,
          user_id: 1,
          name: 'Updated Member',
          position: 2,
          member: { id: 1, name: 'Updated Member', position: { id: 2 } },
        },
      ]);
      expect(state.status).toBe('');
    });

    it('should handle postMember.fulfilled for new member', () => {
      initialState.members = [];
      const action = {
        type: postMember.fulfilled.type,
        meta: { arg: { id: 2, name: 'New Member', position: 3 } },
        payload: { data: { user_id: 2, member_id: 102 } },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[postMember.fulfilled.type](draft, action);
      });
      expect(state.members).toEqual([
        {
          id: 102,
          user_id: 2,
          name: 'New Member',
          position: 3,
          member: { id: 2, name: 'New Member', position: { id: 3 } },
        },
      ]);
      expect(state.status).toBe('');
    });

    it('should handle postMember.rejected correctly', () => {
      const action = { type: postMember.rejected.type };
      const state = produce(initialState, (draft) => {
        extraReducers[postMember.rejected.type](draft, action);
      });
      expect(state.status).toBe('Error Post Team Member');
    });
  });

  // deleteMember
  describe('deleteMember', () => {
    it('should handle deleteMember.pending correctly', () => {
      const action = { type: deleteMember.pending.type };
      const state = produce(initialState, (draft) => {
        extraReducers[deleteMember.pending.type](draft, action);
      });
      expect(state.status).toBe('Loading Delete Team Member');
    });

    it('should handle deleteMember.fulfilled correctly', () => {
      initialState.members = [
        { id: 101, user_id: 1 },
        { id: 102, user_id: 2 },
      ];
      const action = {
        type: deleteMember.fulfilled.type,
        meta: { arg: { teamId: 101 } },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[deleteMember.fulfilled.type](draft, action);
      });
      expect(state.members).toEqual([{ id: 102, user_id: 2 }]);
      expect(state.status).toBe('');
    });

    it('should handle deleteMember.rejected correctly', () => {
      const action = { type: deleteMember.rejected.type };
      const state = produce(initialState, (draft) => {
        extraReducers[deleteMember.rejected.type](draft, action);
      });
      expect(state.status).toBe('Error Delete Team Member');
    });
  });

  describe('fetchIfsProjects', () => {
    beforeEach(() => {
      initialState.ifsProjects = {
        records: [],
        total: 0,
        page: 1,
        search: '',
        loading: false,
        loadingMore: false,
        error: null,
      };
    });

    it('should set loading on page 1 pending', () => {
      const action = {
        type: fetchIfsProjects.pending.type,
        meta: { arg: { page: 1, search: '' } },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchIfsProjects.pending.type](draft, action);
      });
      expect(state.ifsProjects.loading).toBe(true);
      expect(state.ifsProjects.loadingMore).toBe(false);
      expect(state.ifsProjects.error).toBeNull();
    });

    it('should set loadingMore on later pages pending', () => {
      const action = {
        type: fetchIfsProjects.pending.type,
        meta: { arg: { page: 2, search: 'x' } },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchIfsProjects.pending.type](draft, action);
      });
      expect(state.ifsProjects.loadingMore).toBe(true);
      expect(state.ifsProjects.loading).toBe(false);
    });

    it('should replace records on page 1 fulfilled', () => {
      initialState.ifsProjects.records = [{ id: 1 }];
      const action = {
        type: fetchIfsProjects.fulfilled.type,
        meta: { arg: { page: 1, search: 'depot' } },
        payload: {
          records: [{ id: 7, project_code: 'MCL-0042' }],
          total: 137,
        },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchIfsProjects.fulfilled.type](draft, action);
      });
      expect(state.ifsProjects.records).toEqual([
        { id: 7, project_code: 'MCL-0042' },
      ]);
      expect(state.ifsProjects.total).toBe(137);
      expect(state.ifsProjects.page).toBe(1);
      expect(state.ifsProjects.search).toBe('depot');
      expect(state.ifsProjects.loading).toBe(false);
    });

    it('should append and dedupe records on later pages', () => {
      initialState.ifsProjects.records = [{ id: 7, project_code: 'A' }];
      const action = {
        type: fetchIfsProjects.fulfilled.type,
        meta: { arg: { page: 2, search: '' } },
        payload: {
          records: [
            { id: 7, project_code: 'A' },
            { id: 8, project_code: 'B' },
          ],
          total: 2,
        },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchIfsProjects.fulfilled.type](draft, action);
      });
      expect(state.ifsProjects.records).toEqual([
        { id: 7, project_code: 'A' },
        { id: 8, project_code: 'B' },
      ]);
      expect(state.ifsProjects.page).toBe(2);
    });

    it('should handle rejected', () => {
      const action = {
        type: fetchIfsProjects.rejected.type,
        error: { message: 'boom' },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchIfsProjects.rejected.type](draft, action);
      });
      expect(state.ifsProjects.loading).toBe(false);
      expect(state.ifsProjects.loadingMore).toBe(false);
      expect(state.ifsProjects.error).toBe('boom');
    });

    it('should prefer payload.message on rejected', () => {
      const action = {
        type: fetchIfsProjects.rejected.type,
        payload: { message: 'from-payload' },
        error: { message: 'from-error' },
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchIfsProjects.rejected.type](draft, action);
      });
      expect(state.ifsProjects.error).toBe('from-payload');
    });

    it('should handle fulfilled with empty payload', () => {
      const action = {
        type: fetchIfsProjects.fulfilled.type,
        meta: { arg: { page: 1, search: '' } },
        payload: {},
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchIfsProjects.fulfilled.type](draft, action);
      });
      expect(state.ifsProjects.records).toEqual([]);
      expect(state.ifsProjects.total).toBe(0);
    });
  });

  describe('fetchLinkedIfsProject', () => {
    beforeEach(() => {
      initialState.linkedIfsProject = {
        data: null,
        loading: false,
        error: null,
      };
    });

    it('stores linked project data on success', () => {
      const linked = { id: 7, project_code: 'MCL-0042' };
      const action = {
        type: fetchLinkedIfsProject.fulfilled.type,
        payload: linked,
      };
      const state = produce(initialState, (draft) => {
        extraReducers[fetchLinkedIfsProject.fulfilled.type](draft, action);
      });
      expect(state.linkedIfsProject.data).toEqual(linked);
      expect(state.linkedIfsProject.loading).toBe(false);
    });

    it('clears linked project data on rejection', () => {
      const action = {
        type: fetchLinkedIfsProject.rejected.type,
        payload: { message: 'boom' },
        error: { message: 'boom' },
      };
      const state = produce(initialState, (draft) => {
        draft.linkedIfsProject.data = { id: 1 };
        extraReducers[fetchLinkedIfsProject.rejected.type](draft, action);
      });
      expect(state.linkedIfsProject.data).toBeNull();
      expect(state.linkedIfsProject.error).toBe('boom');
    });
  });
});
