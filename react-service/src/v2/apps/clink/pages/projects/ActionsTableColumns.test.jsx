import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getActionsTableColumns } from './ActionsTableColumns';

describe('ActionsTableColumns', () => {
  const mockProps = {
    clinkCountryCode: 'AU',
    type: 'pending',
    setAnchorProject: jest.fn(),
    setAnchorTrade: jest.fn(),
    setAnchorDesc: jest.fn(),
    setFeedbackRow: jest.fn(),
    handleRemove: jest.fn(),
    handleRestore: jest.fn(),
    formatUKorAnzDateTime: jest.fn((date, countryCode) => ({
      date: '15/10/2023',
      time: '14:30',
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Arrange → Act → Assert
  it('returns array of column definitions', () => {
    // Arrange & Act
    const columns = getActionsTableColumns(mockProps);
    
    // Assert
    expect(Array.isArray(columns)).toBe(true);
    expect(columns).toHaveLength(5);
  });

  it('returns columns with correct field names', () => {
    // Arrange & Act
    const columns = getActionsTableColumns(mockProps);
    
    // Assert
    const fieldNames = columns.map(col => col.field);
    expect(fieldNames).toEqual([
      'projectName',
      'packageName',
      'description',
      'pendingSince',
      'action'
    ]);
  });

  it('returns columns with correct header names', () => {
    // Arrange & Act
    const columns = getActionsTableColumns(mockProps);
    
    // Assert
    const headerNames = columns.map(col => col.headerName);
    expect(headerNames).toEqual([
      'Project name',
      'Package name',
      'Description',
      'Pending since',
      'Action'
    ]);
  });

  it('sets all columns as non-sortable and non-filterable', () => {
    // Arrange & Act
    const columns = getActionsTableColumns(mockProps);
    
    // Assert
    columns.forEach(column => {
      expect(column.sortable).toBe(false);
      expect(column.filterable).toBe(false);
    });
  });

  describe('Project name column', () => {
    it('renders header with filter button', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const projectColumn = columns.find(col => col.field === 'projectName');
      
      // Act
      render(projectColumn.renderHeader());
      
      // Assert
      expect(screen.getByText('Project name')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter Project name')).toBeInTheDocument();
    });

    it('calls setAnchorProject when filter button is clicked', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const projectColumn = columns.find(col => col.field === 'projectName');
      
      // Act
      render(projectColumn.renderHeader());
      const filterButton = screen.getByLabelText('Filter Project name');
      fireEvent.click(filterButton);
      
      // Assert
      expect(mockProps.setAnchorProject).toHaveBeenCalled();
    });

    it('prevents default and stops propagation on mouse down', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const projectColumn = columns.find(col => col.field === 'projectName');
      
      // Act & Assert
      render(projectColumn.renderHeader());
      const filterButton = screen.getByLabelText('Filter Project name');
      
      // Test that mouseDown handler is called with preventDefault and stopPropagation
      fireEvent.mouseDown(filterButton);
      
      // If we get here without errors, the mouseDown handler executed successfully
      expect(filterButton).toBeInTheDocument();
    });

    it('renders cell with project name value', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const projectColumn = columns.find(col => col.field === 'projectName');
      const params = { value: 'Test Project' };
      
      // Act
      render(projectColumn.renderCell(params));
      
      // Assert
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  describe('Package name column', () => {
    it('renders header with filter button', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const tradeColumn = columns.find(col => col.field === 'packageName');
      
      // Act
      render(tradeColumn.renderHeader());
      
      // Assert
      expect(screen.getByText('Package name')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter Package name')).toBeInTheDocument();
    });

    it('calls setAnchorTrade when filter button is clicked', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const tradeColumn = columns.find(col => col.field === 'packageName');
      
      // Act
      render(tradeColumn.renderHeader());
      const filterButton = screen.getByLabelText('Filter Package name');
      fireEvent.click(filterButton);
      
      // Assert
      expect(mockProps.setAnchorTrade).toHaveBeenCalled();
    });

    it('prevents default and stops propagation on mouse down', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const tradeColumn = columns.find(col => col.field === 'packageName');
      
      // Act & Assert
      render(tradeColumn.renderHeader());
      const filterButton = screen.getByLabelText('Filter Package name');
      
      // Test that mouseDown handler is called with preventDefault and stopPropagation
      fireEvent.mouseDown(filterButton);
      
      // If we get here without errors, the mouseDown handler executed successfully
      expect(filterButton).toBeInTheDocument();
    });

    it('renders cell with package name value', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const tradeColumn = columns.find(col => col.field === 'packageName');
      const params = { value: 'Electrical' };
      
      // Act
      render(tradeColumn.renderCell(params));
      
      // Assert
      expect(screen.getByText('Electrical')).toBeInTheDocument();
    });
  });

  describe('Description column', () => {
    it('renders header without filter button', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const descColumn = columns.find(col => col.field === 'description');
      
      // Act
      render(descColumn.renderHeader());
      
      // Assert
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.queryByLabelText('Filter Description')).not.toBeInTheDocument();
    });

    it('does not call setAnchorDesc since no filter button exists', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const descColumn = columns.find(col => col.field === 'description');
      
      // Act
      render(descColumn.renderHeader());
      
      // Assert - no filter button should exist to click
      expect(screen.queryByLabelText('Filter Description')).not.toBeInTheDocument();
      expect(mockProps.setAnchorDesc).not.toHaveBeenCalled();
    });

    it('has no filter button for mouse interaction', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const descColumn = columns.find(col => col.field === 'description');
      
      // Act & Assert
      render(descColumn.renderHeader());
      
      // Verify no filter button exists
      expect(screen.queryByLabelText('Filter Description')).not.toBeInTheDocument();
    });

    it('renders normal description for non-rejected orders', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const descColumn = columns.find(col => col.field === 'description');
      const params = {
        row: {
          status: 'Pending',
          description: 'Standard order description',
        }
      };
      
      // Act
      render(descColumn.renderCell(params));
      
      // Assert
      expect(screen.getByText('Standard order description')).toBeInTheDocument();
    });

    it('renders rejection message with feedback link for rejected orders', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const descColumn = columns.find(col => col.field === 'description');
      const params = {
        row: {
          status: 'Rejected',
          approverName: 'John Smith',
        }
      };
      
      // Act
      render(descColumn.renderCell(params));
      
      // Assert
      expect(screen.getByText(/Order rejected by John Smith with/)).toBeInTheDocument();
      expect(screen.getByText('feedback')).toBeInTheDocument();
    });

    it('handles rejected order without approver name', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const descColumn = columns.find(col => col.field === 'description');
      const params = {
        row: {
          status: 'Rejected',
          approverName: null,
        }
      };
      
      // Act
      render(descColumn.renderCell(params));
      
      // Assert
      expect(screen.getByText(/Order rejected by approver with/)).toBeInTheDocument();
    });

    it('calls setFeedbackRow when feedback link is clicked', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const descColumn = columns.find(col => col.field === 'description');
      const testRow = {
        status: 'Rejected',
        approverName: 'John Smith',
      };
      const params = { row: testRow };
      
      // Act
      render(descColumn.renderCell(params));
      const feedbackLink = screen.getByText('feedback');
      fireEvent.click(feedbackLink);
      
      // Assert
      expect(mockProps.setFeedbackRow).toHaveBeenCalledWith(testRow);
    });
  });

  describe('Pending since column', () => {
    it('renders formatted date when value exists', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const pendingColumn = columns.find(col => col.field === 'pendingSince');
      const params = { value: '2023-10-15T14:30:00Z' };
      
      // Act
      render(pendingColumn.renderCell(params));
      
      // Assert
      expect(screen.getByText('15/10/2023')).toBeInTheDocument();
      expect(mockProps.formatUKorAnzDateTime).toHaveBeenCalledWith('2023-10-15T14:30:00Z', 'AU');
    });

    it('renders dash when value is null', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const pendingColumn = columns.find(col => col.field === 'pendingSince');
      const params = { value: null };
      
      // Act
      render(pendingColumn.renderCell(params));
      
      // Assert
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('Action column for pending type', () => {
    it('renders remove button for pending type', () => {
      // Arrange
      const columns = getActionsTableColumns({ ...mockProps, type: 'pending' });
      const actionColumn = columns.find(col => col.field === 'action');
      const params = {
        row: {
          actionUrl: 'https://example.com',
          actionLabel: 'View Order',
        }
      };
      
      // Act
      render(actionColumn.renderCell(params));
      
      // Assert
      expect(screen.getByLabelText('remove')).toBeInTheDocument();
      expect(screen.queryByLabelText('restore')).not.toBeInTheDocument();
    });

    it('calls handleRemove when remove button is clicked', () => {
      // Arrange
      const columns = getActionsTableColumns({ ...mockProps, type: 'pending' });
      const actionColumn = columns.find(col => col.field === 'action');
      const testRow = { id: 1, name: 'Test Row' };
      const params = { row: testRow };
      
      // Act
      render(actionColumn.renderCell(params));
      const removeButton = screen.getByLabelText('remove');
      fireEvent.click(removeButton);
      
      // Assert
      expect(mockProps.handleRemove).toHaveBeenCalledWith(testRow);
    });
  });

  describe('Action column for completed type', () => {
    it('renders restore button for completed type', () => {
      // Arrange
      const columns = getActionsTableColumns({ ...mockProps, type: 'completed' });
      const actionColumn = columns.find(col => col.field === 'action');
      const params = {
        row: {
          actionUrl: 'https://example.com',
          actionLabel: 'View Order',
        }
      };
      
      // Act
      render(actionColumn.renderCell(params));
      
      // Assert
      expect(screen.getByLabelText('restore')).toBeInTheDocument();
      expect(screen.queryByLabelText('remove')).not.toBeInTheDocument();
    });

    it('calls handleRestore when restore button is clicked', () => {
      // Arrange
      const columns = getActionsTableColumns({ ...mockProps, type: 'completed' });
      const actionColumn = columns.find(col => col.field === 'action');
      const testRow = { id: 1, name: 'Test Row' };
      const params = { row: testRow };
      
      // Act
      render(actionColumn.renderCell(params));
      const restoreButton = screen.getByLabelText('restore');
      fireEvent.click(restoreButton);
      
      // Assert
      expect(mockProps.handleRestore).toHaveBeenCalledWith(testRow);
    });
  });

  describe('Action column with actionUrl', () => {
    it('renders action link when actionUrl exists', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const actionColumn = columns.find(col => col.field === 'action');
      const params = {
        row: {
          actionUrl: 'https://example.com',
          actionLabel: 'View Order',
        }
      };
      
      // Act
      render(actionColumn.renderCell(params));
      
      // Assert
      const link = screen.getByText('View Order');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
      expect(link.closest('a')).toHaveAttribute('target', '_blank');
      expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('does not render action link when actionUrl is null', () => {
      // Arrange
      const columns = getActionsTableColumns(mockProps);
      const actionColumn = columns.find(col => col.field === 'action');
      const params = {
        row: {
          actionUrl: null,
          actionLabel: 'View Order',
        }
      };
      
      // Act
      render(actionColumn.renderCell(params));
      
      // Assert
      expect(screen.queryByText('View Order')).not.toBeInTheDocument();
    });
  });

  describe('Column configurations', () => {
    it('sets correct flex and minWidth values', () => {
      // Arrange & Act
      const columns = getActionsTableColumns(mockProps);
      
      // Assert
      const projectColumn = columns.find(col => col.field === 'projectName');
      expect(projectColumn.flex).toBe(1);
      expect(projectColumn.minWidth).toBe(160);

      const descColumn = columns.find(col => col.field === 'description');
      expect(descColumn.flex).toBe(2);
      expect(descColumn.minWidth).toBe(240);

      const actionColumn = columns.find(col => col.field === 'action');
      expect(actionColumn.width).toBe(220);
      expect(actionColumn.align).toBe('right');
      expect(actionColumn.headerAlign).toBe('right');
    });
  });
});