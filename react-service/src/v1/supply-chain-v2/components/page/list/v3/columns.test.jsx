import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import columns, { StatusesDescription, ActivationDescription } from './columns';

// Simpler mock that just renders the tooltip content
jest.mock('@mui/material/Tooltip', () => {
  return function MockTooltip({ children, title }) {
    return (
      <>
        {title}
        {children}
      </>
    );
  };
});

describe('Columns Configuration', () => {
  describe('Basic Column Properties', () => {
    test('should have correct number of columns', () => {
      expect(columns).toHaveLength(10);
    });

    test('all columns should have required base properties', () => {
      columns.forEach((column) => {
        expect(column).toHaveProperty('field');
        expect(column).toHaveProperty('headerName');
        expect(column).toHaveProperty('flex');
        expect(column).toHaveProperty('disableColumnMenu', true);
      });
    });
  });

  describe('PQQ Status Column', () => {
    const statusColumn = columns.find((col) => col.field === 'status');

    test('should have correct basic properties', () => {
      expect(statusColumn).toMatchObject({
        field: 'status',
        headerName: 'PQQ Status',
        sortable: false,
        maxWidth: 100,
      });
    });

    test('renderHeader should render tooltip with status descriptions', () => {
      render(
        statusColumn.renderHeader({
          colDef: { headerName: 'PQQ Status' },
        }),
      );

      // Check for the presence of status descriptions text
      expect(screen.getByText('PQQ Status Descriptions')).toBeInTheDocument();
      expect(screen.getByText('Red - Not started')).toBeInTheDocument();
      expect(
        screen.getByText('Yellow - Partially completed'),
      ).toBeInTheDocument();
      expect(screen.getByText('Green - Completed')).toBeInTheDocument();
    });

    test('renderCell should return value directly', () => {
      const testValue = 'Test Status';
      const result = statusColumn.renderCell({ value: testValue });
      expect(result).toBe(testValue);
    });
  });

  describe('Activation Status Column', () => {
    const activationColumn = columns.find((col) => col.field === 'activated');

    test('should have correct basic properties', () => {
      expect(activationColumn).toMatchObject({
        field: 'activated',
        headerName: 'Activation Status',
        sortable: false,
        maxWidth: 150,
      });
    });

    test('renderHeader should render tooltip with activation descriptions', () => {
      render(
        activationColumn.renderHeader({
          colDef: { headerName: 'Activation Status' },
        }),
      );

      // Check for the presence of activation descriptions text
      expect(screen.getByText('Activation Descriptions')).toBeInTheDocument();
      expect(screen.getByText('Checked - Activated')).toBeInTheDocument();
      expect(screen.getByText('Unchecked - Not Activated')).toBeInTheDocument();
    });
  });

  describe('Company Column', () => {
    const companyColumn = columns.find((col) => col.field === 'company');

    test('should have correct properties', () => {
      expect(companyColumn).toMatchObject({
        field: 'company',
        headerName: 'Company',
        flex: 1,
        disableColumnMenu: true,
      });
    });

    test('should not have maxWidth restriction', () => {
      expect(companyColumn.maxWidth).toBeUndefined();
    });
  });

  describe('Non-sortable Columns', () => {
    const nonSortableFields = [
      'status',
      'activated',
      'contact-name',
      'email',
      'contact-number',
      'tradesCollapse',
      'locationsCollapse',
      'actions',
    ];

    test('specified columns should be non-sortable', () => {
      nonSortableFields.forEach((field) => {
        const column = columns.find((col) => col.field === field);
        expect(column.sortable).toBe(false);
      });
    });
  });

  describe('Collapsible Columns', () => {
    const collapsibleColumns = ['tradesCollapse', 'locationsCollapse'];

    test('collapsible columns should have render cell function', () => {
      collapsibleColumns.forEach((field) => {
        const column = columns.find((col) => col.field === field);
        expect(typeof column.renderCell).toBe('function');
      });
    });
  });

  describe('Actions Column', () => {
    const actionsColumn = columns.find((col) => col.field === 'actions');

    test('should have correct properties', () => {
      expect(actionsColumn).toMatchObject({
        field: 'actions',
        headerName: 'Actions',
        flex: 1,
        sortable: false,
        disableColumnMenu: true,
      });
    });
  });
});

// Test the description components separately
describe('Description Components', () => {
  describe('StatusesDescription', () => {
    test('renders all status descriptions', () => {
      render(<StatusesDescription />);

      expect(screen.getByText('PQQ Status Descriptions')).toBeInTheDocument();
      expect(screen.getByText('Red - Not started')).toBeInTheDocument();
      expect(
        screen.getByText('Yellow - Partially completed'),
      ).toBeInTheDocument();
      expect(screen.getByText('Green - Completed')).toBeInTheDocument();
    });
  });

  describe('ActivationDescription', () => {
    test('renders all activation descriptions', () => {
      render(<ActivationDescription />);

      expect(screen.getByText('Activation Descriptions')).toBeInTheDocument();
      expect(screen.getByText('Checked - Activated')).toBeInTheDocument();
      expect(screen.getByText('Unchecked - Not Activated')).toBeInTheDocument();
    });
  });
});
