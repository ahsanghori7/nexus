import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectManagementTable from './ProjectManagementTable';

// Mock MUI components
jest.mock('@mui/material/Box', () => {
  return function MockBox({ children, sx }) {
    return (
      <div data-testid="mui-box" style={sx}>
        {children}
      </div>
    );
  };
});

// Mock clink-components Table
jest.mock('clink-components', () => ({
  Table: ({ theme, columns, rows }) => (
    <table data-testid="clink-table" data-theme={theme}>
      <thead>
        <tr>
          {columns.map((col, index) => (
            <th key={index} data-testid={`column-${index}`}>
              {col.name || col.label || col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} data-testid={`row-${rowIndex}`}>
            {columns.map((col, colIndex) => (
              <td key={colIndex} data-testid={`cell-${rowIndex}-${colIndex}`}>
                {row[col.key] || row[colIndex] || ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe('ProjectManagementTable', () => {
  const defaultColumns = [
    { name: 'ID', key: 'id' },
    { name: 'Name', key: 'name' },
    { name: 'Status', key: 'status' },
  ];

  const defaultRows = [
    { id: '1', name: 'Task 1', status: 'Active' },
    { id: '2', name: 'Task 2', status: 'Completed' },
  ];

  it('renders without crashing', () => {
    render(<ProjectManagementTable />);
    
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByTestId('clink-table')).toBeInTheDocument();
  });

  it('renders with default props when no props provided', () => {
    render(<ProjectManagementTable />);
    
    const table = screen.getByTestId('clink-table');
    expect(table).toHaveAttribute('data-theme', 'project-management');
    
    // Should have no columns or rows with defaults
    expect(screen.queryByTestId('column-0')).not.toBeInTheDocument();
    expect(screen.queryByTestId('row-0')).not.toBeInTheDocument();
  });

  it('renders with provided columns and rows', () => {
    render(
      <ProjectManagementTable 
        columns={defaultColumns} 
        rows={defaultRows}
      />
    );
    
    // Check columns are rendered
    expect(screen.getByTestId('column-0')).toHaveTextContent('ID');
    expect(screen.getByTestId('column-1')).toHaveTextContent('Name');
    expect(screen.getByTestId('column-2')).toHaveTextContent('Status');
    
    // Check rows are rendered
    expect(screen.getByTestId('row-0')).toBeInTheDocument();
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
  });

  it('passes custom theme to Table component', () => {
    const customTheme = 'custom-theme';
    
    render(
      <ProjectManagementTable 
        theme={customTheme}
        columns={defaultColumns}
        rows={defaultRows}
      />
    );
    
    const table = screen.getByTestId('clink-table');
    expect(table).toHaveAttribute('data-theme', customTheme);
  });

  it('handles empty columns array', () => {
    render(
      <ProjectManagementTable 
        columns={[]}
        rows={defaultRows}
      />
    );
    
    expect(screen.getByTestId('clink-table')).toBeInTheDocument();
    expect(screen.queryByTestId('column-0')).not.toBeInTheDocument();
  });

  it('handles empty rows array', () => {
    render(
      <ProjectManagementTable 
        columns={defaultColumns}
        rows={[]}
      />
    );
    
    expect(screen.getByTestId('clink-table')).toBeInTheDocument();
    expect(screen.getByTestId('column-0')).toBeInTheDocument();
    expect(screen.queryByTestId('row-0')).not.toBeInTheDocument();
  });

  it('applies custom styling through Box component', () => {
    render(<ProjectManagementTable />);
    
    const box = screen.getByTestId('mui-box');
    expect(box).toBeInTheDocument();
    
    // The Box component receives complex sx props for styling
    // We can verify it exists without testing the exact styles
  });

  it('renders with single column and row', () => {
    const singleColumn = [{ name: 'Title', key: 'title' }];
    const singleRow = [{ title: 'Single Item' }];
    
    render(
      <ProjectManagementTable 
        columns={singleColumn}
        rows={singleRow}
      />
    );
    
    expect(screen.getByTestId('column-0')).toHaveTextContent('Title');
    expect(screen.getByTestId('row-0')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <ProjectManagementTable 
        columns={defaultColumns}
        rows={defaultRows}
        theme="custom-theme"
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});