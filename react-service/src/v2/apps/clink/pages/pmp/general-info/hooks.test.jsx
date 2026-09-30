import { renderHook, act } from '@testing-library/react-hooks';
import useUpdateProject from './hooks';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn()
}));

describe('useUpdateProject hook', () => {
  const mockNavigate = jest.fn();
  const mockDispatch = jest.fn();
  const mockActions = {
    updateProject: jest.fn()
  };
  const mockContext = {
    actions: mockActions
  };

  const mockAddProjectData = {
    useProjectName: ['Test Project', jest.fn()],
    useProjectReference: ['REF123', jest.fn()],
    useDescription: ['Test Description', jest.fn()],
    useLocation: ['Test Location', jest.fn()],
    useType: ['Test Type', jest.fn()]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    const { useNavigate } = require('react-router-dom');
    const { useContext } = require('hooks/context');
    
    useNavigate.mockReturnValue(mockNavigate);
    useContext.mockReturnValue(mockContext);
  });

  describe('initialization', () => {
    it('should initialize with default values when no project data provided', () => {
      const { result } = renderHook(() => 
        useUpdateProject(mockDispatch, {}, mockAddProjectData)
      );

      expect(result.current.useProjectStatus[0]).toBe('');
      expect(result.current.useStartDate[0]).toBeNull();
      expect(result.current.useCompletitionDate[0]).toBeNull();
      expect(result.current.useErrors[0]).toEqual([]);
      expect(typeof result.current.handleUpdateProject).toBe('function');
    });

    it('should initialize with project data when provided', () => {
      const projectData = {
        phase: 'active',
        start: '2023-01-01',
        end: '2023-12-31',
        name: 'Existing Project',
        reference: 'EXIST123',
        description: 'Existing Description',
        region: 'Existing Location',
        type: 'Existing Type'
      };

      const { result } = renderHook(() => 
        useUpdateProject(mockDispatch, projectData, mockAddProjectData)
      );

      expect(result.current.useProjectStatus[0]).toBe('active');
      expect(result.current.useStartDate[0]).toBe('2023-01-01');
      expect(result.current.useCompletitionDate[0]).toBe('2023-12-31');
    });
  });

  describe('state setters', () => {
    it('should allow updating status', () => {
      const { result } = renderHook(() => 
        useUpdateProject(mockDispatch, {}, mockAddProjectData)
      );

      act(() => {
        result.current.useProjectStatus[1]('new-status');
      });

      expect(result.current.useProjectStatus[0]).toBe('new-status');
    });

    it('should allow updating start date', () => {
      const { result } = renderHook(() => 
        useUpdateProject(mockDispatch, {}, mockAddProjectData)
      );

      act(() => {
        result.current.useStartDate[1]('2024-01-01');
      });

      expect(result.current.useStartDate[0]).toBe('2024-01-01');
    });

    it('should allow updating completion date', () => {
      const { result } = renderHook(() => 
        useUpdateProject(mockDispatch, {}, mockAddProjectData)
      );

      act(() => {
        result.current.useCompletitionDate[1]('2024-12-31');
      });

      expect(result.current.useCompletitionDate[0]).toBe('2024-12-31');
    });

    it('should allow updating errors', () => {
      const { result } = renderHook(() => 
        useUpdateProject(mockDispatch, {}, mockAddProjectData)
      );

      act(() => {
        result.current.useErrors[1](['error1', 'error2']);
      });

      expect(result.current.useErrors[0]).toEqual(['error1', 'error2']);
    });
  });

  describe('handleUpdateProject validation', () => {
    it('should set validation errors for missing required fields', async () => {
      const mockAddProjectDataEmpty = {
        useProjectName: ['', jest.fn()],
        useProjectReference: ['', jest.fn()],
        useDescription: ['', jest.fn()],
        useLocation: ['', jest.fn()],
        useType: ['', jest.fn()]
      };

      const { result } = renderHook(() => 
        useUpdateProject(mockDispatch, {}, mockAddProjectDataEmpty)
      );

      await act(async () => {
        await result.current.handleUpdateProject();
      });

      const errors = result.current.useErrors[0];
      expect(errors).toContain('project-name-error');
      expect(errors).toContain('project-reference-error');
      expect(errors).toContain('location-error');
      expect(errors).toContain('description-error');
      expect(errors).toContain('type-error');
      expect(errors).toContain('status-error');
      expect(errors).toContain('start-date-error');
      expect(errors).toContain('end-date-error');
    });

    it('should set error for invalid project name', async () => {
      const mockAddProjectDataInvalid = {
        useProjectName: ['Invalid@Name', jest.fn()],
        useProjectReference: ['REF123', jest.fn()],
        useDescription: ['Description', jest.fn()],
        useLocation: ['Location', jest.fn()],
        useType: ['Type', jest.fn()]
      };

      const { result } = renderHook(() => 
        useUpdateProject(mockDispatch, {}, mockAddProjectDataInvalid)
      );

      // Set required fields
      act(() => {
        result.current.useProjectStatus[1]('active');
        result.current.useStartDate[1]('2024-01-01');
        result.current.useCompletitionDate[1]('2024-12-31');
      });

      await act(async () => {
        await result.current.handleUpdateProject();
      });

      expect(result.current.useErrors[0]).toEqual([]);
    });
  });

  describe('successful update', () => {
    it('should call dispatch and navigate on successful update', async () => {
      const projectData = { id: 123, slug: 'test-project' };
      const updateProjectAction = { type: 'UPDATE_PROJECT', payload: 'test' };
      mockActions.updateProject.mockReturnValue(updateProjectAction);
      mockDispatch.mockResolvedValue({ success: true });

      const { result } = renderHook(() => 
        useUpdateProject(mockDispatch, projectData, mockAddProjectData)
      );

      // Set required fields
      act(() => {
        result.current.useProjectStatus[1]('active');
        result.current.useStartDate[1]('2024-01-01');
        result.current.useCompletitionDate[1]('2024-12-31');
      });

      await act(async () => {
        await result.current.handleUpdateProject();
      });

      expect(mockActions.updateProject).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Test Description',
          region: 'Test Location',
          reference: 'REF123',
          name: 'Test Project',
          type: 'Test Type',
          phase: 'active',
          start: '2024-01-01',
          end: '2024-12-31'
        }),
        pid: 123
      });

      expect(mockDispatch).toHaveBeenCalledWith(updateProjectAction);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/main-contractor/projects/test-project/setup/project_team'
      );
    });

    it('keeps original name and reference when IFS identity fields are locked', async () => {
      const projectData = {
        id: 123,
        slug: 'test-project',
        name: 'Riverside Depot',
        reference: 'MCL-0042',
      };
      const editedAddProjectData = {
        ...mockAddProjectData,
        useProjectName: ['Edited Name', jest.fn()],
        useProjectReference: ['EDIT-REF', jest.fn()],
      };
      const updateProjectAction = { type: 'UPDATE_PROJECT', payload: 'test' };
      mockActions.updateProject.mockReturnValue(updateProjectAction);
      mockDispatch.mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useUpdateProject(mockDispatch, projectData, editedAddProjectData, true),
      );

      act(() => {
        result.current.useProjectStatus[1]('active');
        result.current.useStartDate[1]('2024-01-01');
        result.current.useCompletitionDate[1]('2024-12-31');
      });

      await act(async () => {
        await result.current.handleUpdateProject();
      });

      expect(mockActions.updateProject).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Riverside Depot',
          reference: 'MCL-0042',
        }),
        pid: 123,
      });
    });

    it('should handle update errors', async () => {
      const projectData = { id: 123 };
      const updateProjectAction = { type: 'UPDATE_PROJECT', payload: 'test' };
      const errorResponse = { 
        error: { 
          name: 'UpdateError', 
          message: 'Update failed' 
        } 
      };
      mockActions.updateProject.mockReturnValue(updateProjectAction);
      mockDispatch.mockResolvedValue(errorResponse);

      const { result } = renderHook(() => 
        useUpdateProject(mockDispatch, projectData, mockAddProjectData)
      );

      // Set required fields
      act(() => {
        result.current.useProjectStatus[1]('active');
        result.current.useStartDate[1]('2024-01-01');
        result.current.useCompletitionDate[1]('2024-12-31');
      });

      await act(async () => {
        await result.current.handleUpdateProject();
      });

      const errors = result.current.useErrors[0];
      expect(errors).toContain('UpdateError - Update failed');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});