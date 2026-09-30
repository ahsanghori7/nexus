import { renderHook, act } from '@testing-library/react-hooks';
import useActions from './useActions';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// Mock GridActionsCellItem
jest.mock('@mui/x-data-grid-pro', () => ({
  GridActionsCellItem: ({ icon, label, onClick, ...props }) => {
    const mockElement = {
      props: {
        'data-testid': `grid-action-${label?.replace(/\s+/g, '-')?.toLowerCase()}`,
        onClick,
        label,
        ...props,
      },
      key: label,
    };
    return mockElement;
  },
}));

describe('useActions', () => {
  const mockRows = [
    {
      id: 1,
      name: 'Row 1',
      type: 'item',
      boq_item_id: 'boq1',
      item_version: { version: 1, status: 1 },
      quantity: 10,
      budget_rate: 5,
      budget_total: 50,
    },
    {
      id: 2,
      name: 'Row 2',
      type: 'grouped_heading',
      boq_item_id: 'boq2',
      item_version: { version: 1, status: 1 },
    },
    {
      id: 3,
      name: 'Row 3',
      type: 'section',
      boq_item_id: 'boq3',
      item_version: { version: 1, status: 1 },
    },
  ];

  const mockSetRows = jest.fn();
  const mockUseRows = [mockRows, mockSetRows];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the expected array structure', () => {
    const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
    
    expect(result.current).toHaveLength(5);
    expect(result.current[0]).toBe(mockRows); // rows
    expect(typeof result.current[1]).toBe('object'); // actions
    expect(typeof result.current[2]).toBe('function'); // processRowUpdate
    expect(typeof result.current[3]).toBe('function'); // processRowUpdateProsper
    expect(typeof result.current[4]).toBe('function'); // handleRowOrderChange
  });

  it('returns actions object with correct structure', () => {
    const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
    const [, actions] = result.current;
    
    expect(actions.field).toBe('actions');
    expect(actions.type).toBe('actions');
    expect(actions.headerName).toBe('');
    expect(actions.flex).toBe(70);
    expect(actions.cellClassName).toBe('actions');
    expect(typeof actions.getActions).toBe('function');
  });

  it('returns empty actions when noAction is true', () => {
    const { result } = renderHook(() => useActions(mockUseRows, true, mockRows));
    const [, actions] = result.current;
    
    const actionsResult = actions.getActions({ id: 1, row: mockRows[0] });
    expect(actionsResult).toEqual([]);
  });

  describe('processRowUpdate', () => {
    it('updates row and marks as edited when data changes', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, , processRowUpdate] = result.current;
      
      const updatedData = { id: 1, name: 'Updated Row 1', quantity: 15 };
      
      act(() => {
        const returnValue = processRowUpdate(updatedData);
        expect(returnValue).toEqual(updatedData);
      });
      
      expect(mockSetRows).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: 'Updated Row 1',
            quantity: 15,
            edited: true,
          }),
        ])
      );
    });

    it('calculates budget_total when quantity or budget_rate changes', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, , processRowUpdate] = result.current;
      
      const updatedData = { id: 1, quantity: 20, budget_rate: 8 };
      
      act(() => {
        processRowUpdate(updatedData);
      });
      
      expect(mockSetRows).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            quantity: 20,
            budget_rate: 8,
            budget_total: 160, // 20 * 8
            edited: true,
          }),
        ])
      );
    });

    it('does not mark as edited when no data actually changes', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, , processRowUpdate] = result.current;
      
      const sameData = { id: 1, name: 'Row 1', type: 'item' };
      
      act(() => {
        processRowUpdate(sameData);
      });
      
      expect(mockSetRows).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            edited: false,
          }),
        ])
      );
    });

    it('removes edited property from input data', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, , processRowUpdate] = result.current;
      
      const dataWithEdited = { id: 1, name: 'Updated', edited: true };
      
      act(() => {
        const returnValue = processRowUpdate(dataWithEdited);
        expect(returnValue).not.toHaveProperty('edited');
      });
    });
  });

  describe('processRowUpdateProsper', () => {
    it('updates row and marks as edited when data changes', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, , , processRowUpdateProsper] = result.current;
      
      const updatedData = { id: 1, name: 'Updated Row 1' };
      
      act(() => {
        const returnValue = processRowUpdateProsper(updatedData);
        expect(returnValue).toEqual(updatedData);
      });
      
      expect(mockSetRows).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: 'Updated Row 1',
            edited: true,
          }),
        ])
      );
    });

    it('removes edited property from input data', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, , , processRowUpdateProsper] = result.current;
      
      const dataWithEdited = { id: 1, name: 'Updated', edited: true };
      
      act(() => {
        const returnValue = processRowUpdateProsper(dataWithEdited);
        expect(returnValue).not.toHaveProperty('edited');
      });
    });
  });

  describe('handleRowOrderChange', () => {
    it('reorders rows correctly', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, , , , handleRowOrderChange] = result.current;
      
      act(() => {
        handleRowOrderChange({ oldIndex: 0, targetIndex: 2 });
      });
      
      expect(mockSetRows).toHaveBeenCalledWith([
        mockRows[1], // Row 2
        mockRows[2], // Row 3
        mockRows[0], // Row 1 moved to end
      ]);
    });
  });

  describe('getActions for different row types', () => {
    it('returns only up/down actions for section type', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const sectionRow = mockRows[2]; // type: 'section'
      const actionsResult = actions.getActions({ id: 3, row: sectionRow });
      
      expect(actionsResult).toHaveLength(4); // Only move up, move down, add up, add down
    });

    it('returns all actions including toggle for grouped_heading type', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const groupedHeadingRow = mockRows[1]; // type: 'grouped_heading'
      const actionsResult = actions.getActions({ id: 2, row: groupedHeadingRow });
      
      expect(actionsResult.length).toBeGreaterThan(4); // Should include toggle + common actions
    });

    it('returns all actions including toggle for item type', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const itemRow = mockRows[0]; // type: 'item'
      const actionsResult = actions.getActions({ id: 1, row: itemRow });
      
      expect(actionsResult.length).toBeGreaterThan(4); // Should include toggle + common actions
    });
  });

  describe('action handlers', () => {
    it('handles delete action correctly', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const itemRow = mockRows[0];
      const actionsResult = actions.getActions({ id: 1, row: itemRow });
      
      // Find and trigger delete action
      const deleteAction = actionsResult.find(action => 
        action.props.label === 'Remove Row'
      );
      
      act(() => {
        deleteAction.props.onClick();
      });
      
      expect(mockSetRows).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            item_version: expect.objectContaining({
              status: 4, // DELETE_STATUS
            }),
          }),
        ])
      );
    });

    it('handles clear action correctly', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const itemRow = mockRows[0];
      const actionsResult = actions.getActions({ id: 1, row: itemRow });
      
      // Find and trigger clear action
      const clearAction = actionsResult.find(action => 
        action.props.label === 'Clear Row'
      );
      
      act(() => {
        clearAction.props.onClick();
      });
      
      expect(mockSetRows).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: null, // Should be cleared
            quantity: null, // Should be cleared
            budget_rate: null, // Should be cleared
            budget_total: null, // Should be cleared
            // Note: item_version remains the same since fullClean preserves it
            item_version: expect.objectContaining({
              status: 1, // Original status is preserved by fullClean
            }),
          }),
        ])
      );
    });

    it('handles toggle action for item to grouped_heading', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const itemRow = mockRows[0]; // type: 'item'
      const actionsResult = actions.getActions({ id: 1, row: itemRow });
      
      // Find and trigger toggle action
      const toggleAction = actionsResult.find(action => 
        action.props.label === 'Turn into Group Heading'
      );
      
      act(() => {
        toggleAction.props.onClick();
      });
      
      expect(mockSetRows).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            type: 'grouped_heading',
          }),
        ])
      );
    });

    it('handles toggle action for grouped_heading to item', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const groupedHeadingRow = mockRows[1]; // type: 'grouped_heading'
      const actionsResult = actions.getActions({ id: 2, row: groupedHeadingRow });
      
      // Find and trigger toggle action
      const toggleAction = actionsResult.find(action => 
        action.props.label === 'Turn into Item'
      );
      
      act(() => {
        toggleAction.props.onClick();
      });
      
      expect(mockSetRows).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 2,
            type: 'item',
          }),
        ])
      );
    });

    it('handles move up action', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const secondRow = mockRows[1]; // index 1
      const actionsResult = actions.getActions({ id: 2, row: secondRow });
      
      // Find and trigger move up action
      const moveUpAction = actionsResult.find(action => 
        action.props.label === 'Move Up'
      );
      
      act(() => {
        moveUpAction.props.onClick();
      });
      
      expect(mockSetRows).toHaveBeenCalledWith([
        mockRows[1], // Moved up
        mockRows[0], // Moved down
        mockRows[2], // Unchanged
      ]);
    });

    it('handles move down action', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const firstRow = mockRows[0]; // index 0
      const actionsResult = actions.getActions({ id: 1, row: firstRow });
      
      // Find and trigger move down action
      const moveDownAction = actionsResult.find(action => 
        action.props.label === 'Move Down'
      );
      
      act(() => {
        moveDownAction.props.onClick();
      });
      
      expect(mockSetRows).toHaveBeenCalledWith([
        mockRows[1], // Unchanged
        mockRows[0], // Moved down
        mockRows[2], // Unchanged
      ]);
    });

    it('handles add row on top action', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const firstRow = mockRows[0]; // index 0
      const actionsResult = actions.getActions({ id: 1, row: firstRow });
      
      // Find and trigger add row on top action
      const addTopAction = actionsResult.find(action => 
        action.props.label === 'Add 1 Row on Top'
      );
      
      act(() => {
        addTopAction.props.onClick();
      });
      
      expect(mockSetRows).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'mock-uuid',
          type: 'item',
        }),
        ...mockRows,
      ]);
    });

    it('handles add row on bottom action', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const lastRow = mockRows[2]; // index 2 (last)
      const actionsResult = actions.getActions({ id: 3, row: lastRow });
      
      // Find and trigger add row on bottom action
      const addBottomAction = actionsResult.find(action => 
        action.props.label === 'Add 1 Row on Bottom'
      );
      
      act(() => {
        addBottomAction.props.onClick();
      });
      
      expect(mockSetRows).toHaveBeenCalledWith([
        ...mockRows,
        expect.objectContaining({
          id: 'mock-uuid',
          type: 'item',
        }),
      ]);
    });

    it('does not move up when already at top', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const firstRow = mockRows[0]; // index 0
      const actionsResult = actions.getActions({ id: 1, row: firstRow });
      
      // Find and trigger move up action
      const moveUpAction = actionsResult.find(action => 
        action.props.label === 'Move Up'
      );
      
      act(() => {
        moveUpAction.props.onClick();
      });
      
      // Should not change rows since already at top
      expect(mockSetRows).not.toHaveBeenCalled();
    });

    it('does not move down when already at bottom', () => {
      const { result } = renderHook(() => useActions(mockUseRows, false, mockRows));
      const [, actions] = result.current;
      
      const lastRow = mockRows[2]; // index 2 (last)
      const actionsResult = actions.getActions({ id: 3, row: lastRow });
      
      // Find and trigger move down action
      const moveDownAction = actionsResult.find(action => 
        action.props.label === 'Move Down'
      );
      
      act(() => {
        moveDownAction.props.onClick();
      });
      
      // Should not change rows since already at bottom
      expect(mockSetRows).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles empty rows array', () => {
      const emptyUseRows = [[], mockSetRows];
      const { result } = renderHook(() => useActions(emptyUseRows, false, []));
      
      expect(result.current[0]).toEqual([]);
      expect(typeof result.current[1]).toBe('object');
    });

    it('handles row without item_version', () => {
      const rowsWithoutVersion = [{ id: 1, name: 'Test' }];
      const useRowsWithoutVersion = [rowsWithoutVersion, mockSetRows];
      
      const { result } = renderHook(() => 
        useActions(useRowsWithoutVersion, false, rowsWithoutVersion)
      );
      
      const [, , processRowUpdate] = result.current;
      
      act(() => {
        processRowUpdate({ id: 1, name: 'Updated' });
      });
      
      expect(mockSetRows).toHaveBeenCalled();
    });
  });
});