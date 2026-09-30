import { renderHook, act } from '@testing-library/react-hooks';
import * as reactRedux from 'react-redux';
import { useHandleDeleteMember } from './useDeleteMember';

// Mock the react-redux hooks
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

describe('useHandleDeleteMember', () => {
  let mockDispatch;
  let mockSetInfoModalState;
  let mockActions;
  let mockGetRoleLevel;
  
  beforeEach(() => {
    mockDispatch = jest.fn();
    mockSetInfoModalState = jest.fn();
    mockActions = {
      removeMemberTeam: jest.fn(),
    };
    mockGetRoleLevel = jest.fn();
    
    // Setup react-redux mock
    reactRedux.useDispatch.mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return handleDeleteMember function', () => {
    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount: { user: { id: 1 } },
        team: { user_role: 'super_admin', members: [] },
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    expect(result.current).toHaveProperty('handleDeleteMember');
    expect(typeof result.current.handleDeleteMember).toBe('function');
  });

  test('should prevent super_admin from deleting themselves', () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { user_role: 'super_admin', members: [] };

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    act(() => {
      result.current.handleDeleteMember(1); // Same ID as user
    });

    expect(mockSetInfoModalState).toHaveBeenCalledWith({
      open: true,
      titleKey: 'delete-self-error-title',
      messageKey: 'delete-self-error-msg',
    });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('should allow super_admin to delete other members', () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { user_role: 'super_admin', members: [] };
    
    // Mock successful deletion - dispatch should return a promise
    const mockPromise = Promise.resolve({
      payload: { success: true }
    });
    mockActions.removeMemberTeam.mockReturnValue(mockPromise);
    mockDispatch.mockReturnValue(mockPromise);

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    act(() => {
      result.current.handleDeleteMember(2); // Different ID
    });

    expect(mockActions.removeMemberTeam).toHaveBeenCalledWith(2);
    expect(mockDispatch).toHaveBeenCalled();
    expect(mockSetInfoModalState).not.toHaveBeenCalled();
  });

  test('should handle failed deletion for super_admin', async () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { user_role: 'super_admin', members: [] };
    
    // Mock failed deletion - dispatch should return a promise
    const mockPromise = Promise.resolve({
      payload: { success: false }
    });
    mockActions.removeMemberTeam.mockReturnValue(mockPromise);
    mockDispatch.mockReturnValue(mockPromise);

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    await act(async () => {
      result.current.handleDeleteMember(2);
    });

    expect(mockActions.removeMemberTeam).toHaveBeenCalledWith(2);
    expect(mockDispatch).toHaveBeenCalled();
  });

  test('should allow team_assistant to delete themselves', () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { user_role: 'team_assistant', members: [] };
    
    // Mock successful deletion - dispatch should return a promise
    const mockPromise = Promise.resolve({
      payload: { success: true }
    });
    mockActions.removeMemberTeam.mockReturnValue(mockPromise);
    mockDispatch.mockReturnValue(mockPromise);

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    act(() => {
      result.current.handleDeleteMember(1); // Same ID as user
    });

    expect(mockActions.removeMemberTeam).toHaveBeenCalledWith(1);
    expect(mockDispatch).toHaveBeenCalled();
  });

  test('should prevent team_assistant from deleting others', () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { user_role: 'team_assistant', members: [] };

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    act(() => {
      result.current.handleDeleteMember(2); // Different ID
    });

    expect(mockSetInfoModalState).toHaveBeenCalledWith({
      open: true,
      titleKey: 'delete-not-allowed-title',
      messageKey: 'delete-not-allowed-msg',
    });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('should show fallback error for unhandled roles', () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { user_role: 'unknown_role', members: [] };

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    act(() => {
      result.current.handleDeleteMember(2);
    });

    expect(mockSetInfoModalState).toHaveBeenCalledWith({
      open: true,
      titleKey: 'delete-error-title',
      messageKey: 'delete-error-msg',
    });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('should handle team_admin role permissions correctly', () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { 
      user_role: 'team_admin', 
      members: [
        { id: 2, role: { id: 3, level: 3 } }, // Lower role level
      ]
    };
    
    mockGetRoleLevel.mockImplementation((role) => {
      if (role === 'team_admin') return 2;
      return 3;
    });
    
    const mockPromise = Promise.resolve({
      payload: { success: true }
    });
    mockActions.removeMemberTeam.mockReturnValue(mockPromise);
    mockDispatch.mockReturnValue(mockPromise);

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    act(() => {
      result.current.handleDeleteMember(2);
    });

    expect(mockActions.removeMemberTeam).toHaveBeenCalledWith(2);
    expect(mockDispatch).toHaveBeenCalled();
  });

  test('should prevent team_admin from deleting higher role level members', () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { 
      user_role: 'team_admin', 
      members: [
        { id: 2, role: { id: 1, level: 1 } }, // Higher role level
      ]
    };
    
    mockGetRoleLevel.mockImplementation((role) => {
      if (role === 'team_admin') return 2;
      return 1;
    });

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    act(() => {
      result.current.handleDeleteMember(2);
    });

    expect(mockSetInfoModalState).toHaveBeenCalledWith({
      open: true,
      titleKey: 'delete-role-error-title',
      messageKey: 'delete-role-error-msg',
    });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('should handle failed deletion for team roles', async () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { user_role: 'team_assistant', members: [] };
    
    const mockPromise = Promise.resolve({
      payload: { success: false }
    });
    mockActions.removeMemberTeam.mockReturnValue(mockPromise);
    mockDispatch.mockReturnValue(mockPromise);

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    await act(async () => {
      result.current.handleDeleteMember(1);
    });

    expect(mockActions.removeMemberTeam).toHaveBeenCalledWith(1);
  });

  test('should handle approver role like team_assistant', () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { user_role: 'approver', members: [] };
    
    const mockPromise = Promise.resolve({
      payload: { success: true }
    });
    mockActions.removeMemberTeam.mockReturnValue(mockPromise);
    mockDispatch.mockReturnValue(mockPromise);

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    act(() => {
      result.current.handleDeleteMember(1); // Same ID as user
    });

    expect(mockActions.removeMemberTeam).toHaveBeenCalledWith(1);
    expect(mockDispatch).toHaveBeenCalled();
  });

  test('should prevent approver from deleting others', () => {
    const clinkAccount = { user: { id: 1 } };
    const team = { user_role: 'approver', members: [] };

    const { result } = renderHook(() =>
      useHandleDeleteMember({
        clinkAccount,
        team,
        setInfoModalState: mockSetInfoModalState,
        actions: mockActions,
        getRoleLevel: mockGetRoleLevel,
      })
    );

    act(() => {
      result.current.handleDeleteMember(2); // Different ID
    });

    expect(mockSetInfoModalState).toHaveBeenCalledWith({
      open: true,
      titleKey: 'delete-not-allowed-title',
      messageKey: 'delete-not-allowed-msg',
    });
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});