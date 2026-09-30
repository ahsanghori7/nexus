import extraReducers, {
  fetchPrequalification,
  patchCompanyInformation,
  fetchPrequalificationSections,
  patchTurnover,
  postPrequalFile,
  resendReferences,
  postReferences,
  patchOrganization,
  postOrganization,
  deletePrequalificationSection,
  deletePrequalificationReference,
  patchOrganizationV2,
  getPrequalification,
  getPrequalificationSections,
  requestDocument,
  deleteTeamMember,
  getPrequalificationStatuses,
} from './extraReducers';
import { changeLoading, initPreqState } from './common';
import status from 'store/reducers/common/constants';

// Mock the common functions
jest.mock('./common', () => ({
  changeLoading: jest.fn(),
  initPreqState: jest.fn(),
}));

describe('prequalification_v2 extraReducers', () => {
  let mockState;
  const baseOrgMember = {
    id: 7,
    firstname: 'Alice',
    lastname: 'Jones',
    role: 'Director',
    email: 'alice@test.com',
  };

  beforeEach(() => {
    mockState = {
      statusPreq: {
        severity: 'info',
        message: 'Loading',
        type: status.LOADING_STATUS,
      },
      documents: {},
      organisation: [{ ...baseOrgMember, title: 'Director', name: 'Alice Jones' }],
      statuses: [],
      insurances: [{ label: 'Policy A', request: false }, { label: 'Policy B', request: true }],
    };
    jest.clearAllMocks();
  });

  const expectLoadingCall = (actionCreator, type, severity, message) => {
    extraReducers[actionCreator[type]](mockState, {});
    if (typeof severity === 'undefined' && typeof message === 'undefined') {
      expect(changeLoading).toHaveBeenCalledWith(mockState);
      return;
    }
    expect(changeLoading).toHaveBeenCalledWith(mockState, severity, message);
  };

  it('should handle fetchPrequalification pending', () => {
    extraReducers[fetchPrequalification.pending](mockState);
    expect(changeLoading).toHaveBeenCalledWith(mockState, 'info', 'Loading prequal info');
  });

  it('should handle fetchPrequalification fulfilled', () => {
    const payload = { data: 'test' };
    const meta = { arg: 'testArg' };
    const action = { payload, meta };
    
    extraReducers[fetchPrequalification.fulfilled](mockState, action);
    
    expect(initPreqState).toHaveBeenCalledWith(mockState, payload, meta.arg);
    expect(changeLoading).toHaveBeenCalledWith(mockState);
  });

  it('should handle fetchPrequalification rejected', () => {
    extraReducers[fetchPrequalification.rejected](mockState);
    expect(changeLoading).toHaveBeenCalledWith(mockState, 'error', 'Error fetching prequalification data');
  });

  it('calls changeLoading for simple status handlers', () => {
    expectLoadingCall(patchCompanyInformation, 'pending', 'info', 'Updating company information');
    expectLoadingCall(patchCompanyInformation, 'fulfilled');
    expectLoadingCall(patchCompanyInformation, 'rejected', 'error', 'Error updating company information');

    expectLoadingCall(patchTurnover, 'pending', 'info', 'Updating turnover information');
    expectLoadingCall(patchTurnover, 'fulfilled');
    expectLoadingCall(patchTurnover, 'rejected', 'error', 'Error updating turnover information');

    expectLoadingCall(postPrequalFile, 'pending', 'info', 'Updating prequal file');
    expectLoadingCall(postPrequalFile, 'fulfilled');
    expectLoadingCall(postPrequalFile, 'rejected', 'error', 'Error posting prequal file');

    expectLoadingCall(resendReferences, 'pending', 'info', 'Resend reference');
    expectLoadingCall(resendReferences, 'fulfilled');
    expectLoadingCall(resendReferences, 'rejected', 'error', 'Error resend reference');

    expectLoadingCall(postReferences, 'pending', 'info', 'Updating references information');
    expectLoadingCall(postReferences, 'fulfilled');
    expectLoadingCall(postReferences, 'rejected', 'error', 'Error posting references info');

    expectLoadingCall(patchOrganization, 'pending', 'info', 'Updating organization information');
    expectLoadingCall(patchOrganization, 'fulfilled');
    expectLoadingCall(patchOrganization, 'rejected', 'error', 'Error posting organization info');

    expectLoadingCall(deletePrequalificationReference, 'pending', 'info', 'Deleting prequalification reference');
    expectLoadingCall(deletePrequalificationReference, 'fulfilled');
    expectLoadingCall(deletePrequalificationReference, 'rejected', 'error', 'Error deleting prequalification reference');

    expectLoadingCall(getPrequalification, 'pending', 'info', 'Loading prequal info');
    expectLoadingCall(getPrequalification, 'rejected', 'error', 'Error fetching prequalification data');

    expectLoadingCall(fetchPrequalificationSections, 'pending', 'info', 'Loading prequalification sections');
    expectLoadingCall(fetchPrequalificationSections, 'rejected', 'error', 'Error loading prequalification sections');

    expectLoadingCall(getPrequalificationSections, 'pending', 'info', 'Loading prequalification sections');
    expectLoadingCall(getPrequalificationSections, 'rejected', 'error', 'Error loading prequalification sections');

    expectLoadingCall(getPrequalificationStatuses, 'pending', 'info', 'Loading prequalification sections');
    expectLoadingCall(getPrequalificationStatuses, 'rejected', 'error', 'Error loading prequalification sections');
  });

  it('uses the reference delete messages for delete section action type collisions', () => {
    extraReducers[deletePrequalificationSection.pending](mockState, {});
    extraReducers[deletePrequalificationSection.fulfilled](mockState, {});
    extraReducers[deletePrequalificationSection.rejected](mockState, {});

    expect(changeLoading).toHaveBeenCalledWith(
      mockState,
      'info',
      'Deleting prequalification reference',
    );
    expect(changeLoading).toHaveBeenCalledWith(mockState);
    expect(changeLoading).toHaveBeenCalledWith(
      mockState,
      'error',
      'Error deleting prequalification reference',
    );
  });

  it('handles getPrequalification fulfilled by passing documents as defaults', () => {
    mockState.documents = { insurances: { id: 1 } };
    const payload = { data: 'test' };
    const meta = { arg: 99 };

    extraReducers[getPrequalification.fulfilled](mockState, { payload, meta });

    expect(initPreqState).toHaveBeenCalledWith(
      mockState,
      payload,
      meta.arg,
      { insurances: { id: 1 } },
    );
    expect(changeLoading).toHaveBeenCalledWith(mockState);
  });

  it('handles postOrganization fulfilled when payload has id', () => {
    extraReducers[postOrganization.fulfilled](mockState, {
      payload: { id: 33 },
      meta: {
        arg: {
          firstname: 'John',
          lastname: 'Smith',
          role: 'Manager',
          picture: 'blob',
        },
      },
    });

    expect(mockState.organisation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 33,
          firstname: 'John',
          lastname: 'Smith',
          title: 'Manager',
          name: 'John Smith',
        }),
      ]),
    );
    expect(changeLoading).toHaveBeenCalledWith(mockState);
  });

  it('handles postOrganization fulfilled without id', () => {
    const before = [...mockState.organisation];
    extraReducers[postOrganization.fulfilled](mockState, {
      payload: {},
      meta: { arg: { firstname: 'No', lastname: 'Id', role: 'Member' } },
    });

    expect(mockState.organisation).toEqual(before);
    expect(changeLoading).toHaveBeenCalledWith(mockState);
  });

  it('handles postOrganization rejected', () => {
    extraReducers[postOrganization.rejected](mockState);
    expect(changeLoading).toHaveBeenCalledWith(mockState, 'error', 'Error posting organization info');
  });

  it('handles patchOrganizationV2 lifecycle', () => {
    extraReducers[patchOrganizationV2.pending](mockState);
    expect(changeLoading).toHaveBeenCalledWith(mockState, 'info', 'Patching organization information');

    extraReducers[patchOrganizationV2.fulfilled](mockState, {
      payload: { success: true },
      meta: {
        arg: {
          id: 7,
          firstname: 'Alice',
          lastname: 'Updated',
          role: 'Lead',
        },
      },
    });
    expect(mockState.organisation).toEqual([
      expect.objectContaining({
        id: 7,
        firstname: 'Alice',
        lastname: 'Updated',
        title: 'Lead',
        name: 'Alice Updated',
      }),
    ]);
    expect(changeLoading).toHaveBeenLastCalledWith(mockState);

    const callCountAfterSuccess = changeLoading.mock.calls.length;
    extraReducers[patchOrganizationV2.fulfilled](mockState, {
      payload: {},
      meta: { arg: { id: 999, firstname: 'Ignored', lastname: 'User', role: 'None' } },
    });
    expect(changeLoading).toHaveBeenCalledTimes(callCountAfterSuccess);

    extraReducers[patchOrganizationV2.rejected](mockState);
    expect(changeLoading).toHaveBeenLastCalledWith(mockState, 'error', 'Error patching organization info');
  });

  it('should handle getPrequalificationSections fulfilled with payload', () => {
    const payload = {
      section1: {
        id: 1,
        uid: 'uid1',
        label: 'Section 1',
        documents: ['doc1']
      }
    };
    const action = { payload };
    
    extraReducers[getPrequalificationSections.fulfilled](mockState, action);
    
    expect(mockState.documents).toEqual({
      uid1: {
        id: 1,
        label: 'Section 1',
        value: 'uid1',
        options: ['doc1']
      }
    });
    expect(changeLoading).toHaveBeenCalledWith(
      mockState,
      'error',
      'Error loading prequalification sections',
    );
  });

  it('should handle getPrequalificationSections fulfilled without payload', () => {
    const previous = mockState.documents;
    extraReducers[getPrequalificationSections.fulfilled](mockState, { payload: null });
    expect(mockState.documents).toBe(previous);
    expect(changeLoading).toHaveBeenCalledWith(
      mockState,
      'error',
      'Error loading prequalification sections',
    );
  });

  it('handles fetchPrequalificationSections fulfilled with and without payload', () => {
    extraReducers[fetchPrequalificationSections.fulfilled](mockState, {
      payload: [{ id: 1, uid: 'insurance', label: 'Insurance', documents: ['doc-a'] }],
    });
    expect(mockState.documents).toEqual({
      insurance: {
        id: 1,
        label: 'Insurance',
        value: 'insurance',
        options: ['doc-a'],
      },
    });
    expect(changeLoading).toHaveBeenCalledWith(mockState);

    const nextState = { ...mockState, documents: { unchanged: true } };
    extraReducers[fetchPrequalificationSections.fulfilled](nextState, { payload: [] });
    expect(nextState.documents).toEqual({ unchanged: true });
    expect(changeLoading).toHaveBeenLastCalledWith(nextState);
  });

  it('should handle getPrequalificationStatuses fulfilled', () => {
    const payload = { data: ['status1', 'status2'] };
    const action = { payload };
    
    extraReducers[getPrequalificationStatuses.fulfilled](mockState, action);
    
    expect(mockState.statuses).toEqual(['status1', 'status2']);
    expect(changeLoading).toHaveBeenCalledWith(mockState);
  });

  it('handles requestDocument fulfilled by toggling matching label request only', () => {
    extraReducers[requestDocument.fulfilled](mockState, {
      meta: {
        arg: {
          type: 'insurances',
          data: { label: 'Policy A' },
        },
      },
    });

    expect(mockState.insurances).toEqual([
      { label: 'Policy A', request: true },
      { label: 'Policy B', request: true },
    ]);
  });

  it('executes no-op handlers without changing state', () => {
    const original = JSON.parse(JSON.stringify(mockState));
    extraReducers[deleteTeamMember.pending](mockState);
    extraReducers[deleteTeamMember.fulfilled](mockState);
    extraReducers[deleteTeamMember.rejected](mockState);
    extraReducers[requestDocument.pending](mockState);
    extraReducers[requestDocument.rejected](mockState);
    expect(mockState).toEqual(original);
  });
});
