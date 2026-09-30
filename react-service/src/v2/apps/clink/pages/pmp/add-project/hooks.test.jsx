import { renderHook, act } from '@testing-library/react-hooks';
import { goTo } from 'v2/helpers/url';
import useAddProject from './hooks';
import {
  mockContext,
  mockDispatch,
  mockPostData
} from 'v2/apps/clink/pages/pmp/add-project/mocks/add-project-setup';

jest.mock('v2/hooks/context', () => ({
  useContext: jest.fn()
}));

jest.mock('v2/services/clinkHelpers', () => ({
  postData: jest.fn()
}));

describe('useAddProject hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('v2/hooks/context').useContext.mockReturnValue(mockContext);
    require('v2/services/clinkHelpers').postData.mockImplementation(mockPostData);
  });

  test('initializes with default values', () => {
    const { result } = renderHook(() => useAddProject(mockDispatch, {}, null, false, true));

    const {
      useProjectName,
      useProjectReference,
      useGroup,
      useLocation,
      useType,
      useErrors
    } = result.current;

    expect(useProjectName[0]).toBe(''); // projectName
    expect(useProjectReference[0]).toBe(''); // projectReference
    expect(useGroup[0]).toBe(''); // group
    expect(useLocation[0]).toBe(''); // region
    expect(useType[0]).toBe(''); // type
    expect(useErrors[0]).toEqual([]); // errors
  });

  test('initializes with provided project data', () => {
    const projectData = {
      name: 'Test Project',
      reference: 'REF001',
      group: '5',
      region: '1',
      type: 'residential'
    };

    const { result } = renderHook(() => useAddProject(mockDispatch, projectData, null, false, true));

    const {
      useProjectName,
      useProjectReference,
      useGroup,
      useLocation,
      useType
    } = result.current;

    expect(useProjectName[0]).toBe('Test Project');
    expect(useProjectReference[0]).toBe('REF001');
    expect(useGroup[0]).toBe('5');
    expect(useLocation[0]).toBe('1');
    expect(useType[0]).toBe('residential');
  });

  test('handleAddProject validates required fields', async () => {
    const { result } = renderHook(() => useAddProject(mockDispatch, {}, null, false, true));

    await act(async () => {
      await result.current.handleAddProject();
    });

    const errors = result.current.useErrors[0];
    expect(errors).toContain('project-name-error');
    expect(errors).toContain('project-reference-error');
    expect(errors).toContain('location-error');
    expect(errors).toContain('group-error');
    expect(errors).toContain('type-error');
  });

  test('handleAddProject successfully creates project and navigates', async () => {
    // Mock dispatch to return the expected result
    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' }
    });

    const { result } = renderHook(() => useAddProject(mockDispatchWithResult, {}, null, false, true));

    // Set valid project data
    act(() => {
      result.current.useProjectName[1]('Valid Project');
      result.current.useProjectReference[1]('REF001');
      result.current.useLocation[1]('1');
      result.current.useGroup[1]('5');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    expect(mockDispatchWithResult).toHaveBeenCalledWith(mockContext.actions.addProject({
      region: '1',
      reference: 'REF001',
      name: 'Valid Project',
      type: 'residential',
      account_group_id: [5]
    }));

    expect(goTo).toHaveBeenCalledWith('/projects/valid-project/setup');
  });

  test('handleAddProject handles API errors', async () => {
    const errorResponse = {
      error: {
        message: 'API Error'
      },
      payload: 'Error details'
    };

    // Mock dispatch to return the error response
    const mockDispatchWithError = jest.fn().mockResolvedValue(errorResponse);

    const { result } = renderHook(() => useAddProject(mockDispatchWithError, {}, null, false, true));

    // Set valid project data
    act(() => {
      result.current.useProjectName[1]('Valid Project');
      result.current.useProjectReference[1]('REF001');
      result.current.useLocation[1]('1');
      result.current.useGroup[1]('5');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    const errors = result.current.useErrors[0];
    expect(errors).toContain('API Error - Error details');
  });

  test('setters update state correctly', () => {
    const { result } = renderHook(() => useAddProject(mockDispatch, {}, null, false, true));

    act(() => {
      result.current.useProjectName[1]('New Name');
      result.current.useProjectReference[1]('NEW_REF');
      result.current.useGroup[1]('9');
      result.current.useLocation[1]('2');
      result.current.useType[1]('commercial');
    });

    expect(result.current.useProjectName[0]).toBe('New Name');
    expect(result.current.useProjectReference[0]).toBe('NEW_REF');
    expect(result.current.useGroup[0]).toBe('9');
    expect(result.current.useLocation[0]).toBe('2');
    expect(result.current.useType[0]).toBe('commercial');
  });

  test('handleAddProject includes Asite folder data when feature is enabled', async () => {
    const asiteFolderData = {
      id: '142353537$$quZZrN',
      name: 'All Workspace Documents',
      uri: 'https://dmsak.asite.com/api/workspace/2225710$$QNZY7b/folder/142353537$$quZZrN/firstpage_doclist'
    };

    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' }
    });

    const { result } = renderHook(() => useAddProject(mockDispatchWithResult, {}, asiteFolderData, true, true));

    // Set valid project data
    act(() => {
      result.current.useProjectName[1]('Valid Project');
      result.current.useProjectReference[1]('REF001');
      result.current.useLocation[1]('1');
      result.current.useGroup[1]('5');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    expect(mockDispatchWithResult).toHaveBeenCalledWith(mockContext.actions.addProject({
      region: '1',
      reference: 'REF001',
      name: 'Valid Project',
      type: 'residential',
      account_group_id: [5],
      integration_id: '142353537$$quZZrN',
      integration_name: 'All Workspace Documents',
      integration_uri: 'https://dmsak.asite.com/api/workspace/2225710$$QNZY7b/folder/142353537$$quZZrN/firstpage_doclist'
    }));
  });

  test('resetForm clears all fields and errors', () => {
    const { result } = renderHook(() => useAddProject(mockDispatch, {}, null, false, true));

    // Set some values first
    act(() => {
      result.current.useProjectName[1]('Some Project');
      result.current.useProjectReference[1]('REF-XYZ');
      result.current.useLocation[1]('1');
      result.current.useType[1]('commercial');
      result.current.useGroup[1]('5');
    });

    expect(result.current.useProjectName[0]).toBe('Some Project');
    expect(result.current.useGroup[0]).toBe('5');

    // Reset
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.useProjectName[0]).toBe('');
    expect(result.current.useProjectReference[0]).toBe('');
    expect(result.current.useLocation[0]).toBe('');
    expect(result.current.useType[0]).toBe('');
    expect(result.current.useGroup[0]).toBe('');
    expect(result.current.useErrors[0]).toEqual([]);
  });

  test('handleAddProject does not include Asite folder data when feature is disabled', async () => {
    const asiteFolderData = {
      id: '142353537$$quZZrN',
      name: 'All Workspace Documents',
      uri: 'https://dmsak.asite.com/api/workspace/2225710$$QNZY7b/folder/142353537$$quZZrN/firstpage_doclist'
    };

    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' }
    });

    const { result } = renderHook(() => useAddProject(mockDispatchWithResult, {}, asiteFolderData, false, true));

    // Set valid project data
    act(() => {
      result.current.useProjectName[1]('Valid Project');
      result.current.useProjectReference[1]('REF001');
      result.current.useLocation[1]('1');
      result.current.useGroup[1]('5');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    // Should not include integration data
    expect(mockDispatchWithResult).toHaveBeenCalledWith(mockContext.actions.addProject({
      region: '1',
      reference: 'REF001',
      name: 'Valid Project',
      type: 'residential',
      account_group_id: [5]
    }));
  });

  test('handleAddProject validates Asite folder is required when feature is enabled', async () => {
    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' }
    });

    const { result } = renderHook(() => useAddProject(mockDispatchWithResult, {}, null, true, true));

    // Set valid project data
    act(() => {
      result.current.useProjectName[1]('Valid Project');
      result.current.useProjectReference[1]('REF001');
      result.current.useLocation[1]('1');
      result.current.useGroup[1]('5');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    // Should have validation error for missing Asite folder
    const errors = result.current.useErrors[0];
    expect(errors).toContain('asite-folder-error');
    // Should not call dispatch when validation fails
    expect(mockDispatchWithResult).not.toHaveBeenCalled();
  });

  test('handleAddProject validates IFS project is required when feature is enabled', async () => {
    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' },
    });

    const { result } = renderHook(() =>
      useAddProject(mockDispatchWithResult, {}, null, false, false, true, null),
    );

    act(() => {
      result.current.useProjectName[1]('Valid Project');
      result.current.useProjectReference[1]('REF001');
      result.current.useLocation[1]('1');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    expect(result.current.useErrors[0]).toContain('ifs-project-error');
    expect(mockDispatchWithResult).not.toHaveBeenCalled();
  });

  test('handleAddProject includes partner_project_catalogue_id when IFS is enabled', async () => {
    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' },
    });
    const ifsProject = {
      id: 7,
      external_id: 'IFS-PRJ-0042',
      project_code: 'MCL-0042',
      project_name: 'Riverside Depot Refurbishment',
    };

    const { result } = renderHook(() =>
      useAddProject(
        mockDispatchWithResult,
        {},
        null,
        false,
        false,
        true,
        ifsProject,
      ),
    );

    act(() => {
      result.current.useProjectName[1]('Riverside Depot Refurbishment');
      result.current.useProjectReference[1]('MCL-0042');
      result.current.useLocation[1]('1');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    expect(mockDispatchWithResult).toHaveBeenCalledWith(
      mockContext.actions.addProject({
        region: '1',
        reference: 'MCL-0042',
        name: 'Riverside Depot Refurbishment',
        type: 'residential',
        partner_project_catalogue_id: 7,
      }),
    );
  });

  test('handleAddProject does not include partner_project_catalogue_id when IFS is disabled', async () => {
    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' },
    });
    const ifsProject = { id: 7 };

    const { result } = renderHook(() =>
      useAddProject(
        mockDispatchWithResult,
        {},
        null,
        false,
        false,
        false,
        ifsProject,
      ),
    );

    act(() => {
      result.current.useProjectName[1]('Valid Project');
      result.current.useProjectReference[1]('REF001');
      result.current.useLocation[1]('1');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    expect(mockDispatchWithResult).toHaveBeenCalledWith(
      mockContext.actions.addProject({
        region: '1',
        reference: 'REF001',
        name: 'Valid Project',
        type: 'residential',
      }),
    );
  });

  test('handleAddProject requires both Asite and IFS when both features are enabled', async () => {
    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' },
    });

    const { result } = renderHook(() =>
      useAddProject(mockDispatchWithResult, {}, null, true, false, true, null),
    );

    act(() => {
      result.current.useProjectName[1]('Valid Project');
      result.current.useProjectReference[1]('REF001');
      result.current.useLocation[1]('1');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    const errors = result.current.useErrors[0];
    expect(errors).toContain('asite-folder-error');
    expect(errors).toContain('ifs-project-error');
    expect(mockDispatchWithResult).not.toHaveBeenCalled();
  });

  test('handleAddProject still requires Asite when IFS project is selected', async () => {
    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' },
    });
    const ifsProject = {
      id: 7,
      external_id: 'IFS-PRJ-0042',
      project_code: 'MCL-0042',
      project_name: 'Riverside Depot Refurbishment',
    };

    const { result } = renderHook(() =>
      useAddProject(
        mockDispatchWithResult,
        {},
        null,
        true,
        false,
        true,
        ifsProject,
      ),
    );

    act(() => {
      result.current.useProjectName[1]('Riverside Depot Refurbishment');
      result.current.useProjectReference[1]('MCL-0042');
      result.current.useLocation[1]('1');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    expect(result.current.useErrors[0]).toContain('asite-folder-error');
    expect(mockDispatchWithResult).not.toHaveBeenCalled();
  });

  test('handleAddProject includes Asite and IFS data when both are selected', async () => {
    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' },
    });
    const asiteFolderData = {
      id: '142353537$$quZZrN',
      name: 'All Workspace Documents',
      uri: 'https://dmsak.asite.com/api/workspace/2225710$$QNZY7b/folder/142353537$$quZZrN/firstpage_doclist',
    };
    const ifsProject = {
      id: 7,
      external_id: 'IFS-PRJ-0042',
      project_code: 'MCL-0042',
      project_name: 'Riverside Depot Refurbishment',
    };

    const { result } = renderHook(() =>
      useAddProject(
        mockDispatchWithResult,
        {},
        asiteFolderData,
        true,
        false,
        true,
        ifsProject,
      ),
    );

    act(() => {
      result.current.useProjectName[1]('Riverside Depot Refurbishment');
      result.current.useProjectReference[1]('MCL-0042');
      result.current.useLocation[1]('1');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    expect(mockDispatchWithResult).toHaveBeenCalledWith(
      mockContext.actions.addProject({
        region: '1',
        reference: 'MCL-0042',
        name: 'Riverside Depot Refurbishment',
        type: 'residential',
        integration_id: '142353537$$quZZrN',
        integration_name: 'All Workspace Documents',
        integration_uri:
          'https://dmsak.asite.com/api/workspace/2225710$$QNZY7b/folder/142353537$$quZZrN/firstpage_doclist',
        partner_project_catalogue_id: 7,
      }),
    );
  });

  test('handleAddProject skips group validation when ACCOUNT_GROUP is disabled', async () => {
    const mockDispatchWithResult = jest.fn().mockResolvedValue({
      payload: { id: '123' }
    });

    const { result } = renderHook(() => useAddProject(mockDispatchWithResult, {}, null, false, false));

    act(() => {
      result.current.useProjectName[1]('Valid Project');
      result.current.useProjectReference[1]('REF001');
      result.current.useLocation[1]('1');
      result.current.useType[1]('residential');
    });

    await act(async () => {
      await result.current.handleAddProject();
    });

    expect(result.current.useErrors[0]).not.toContain('group-error');
    expect(mockDispatchWithResult).toHaveBeenCalledWith(mockContext.actions.addProject({
      region: '1',
      reference: 'REF001',
      name: 'Valid Project',
      type: 'residential'
    }));
    expect(goTo).toHaveBeenCalledWith('/projects/valid-project/setup');
  });
});
