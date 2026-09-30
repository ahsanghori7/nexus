import React from 'react';
import { render, screen } from '@testing-library/react';
import QuoteHistoryTableRows, { Columns } from './index.jsx';

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#ffffff',
      },
    },
  },
}));

const mockMenuComponent = jest.fn();
jest.mock('./Menu', () => (props) => {
  mockMenuComponent(props);
  return <div data-testid={`menu-${props.row.id}`} />;
});

describe('Quote History Config', () => {
  beforeEach(() => {
    mockMenuComponent.mockClear();
  });

  it('renders columns with headers in the defined order', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Columns />
          </tr>
        </tbody>
      </table>
    );

    const headers = screen.getAllByTestId('mui-tablecell');
    const headerTexts = headers.map((cell) => cell.textContent.trim());

    expect(headerTexts).toEqual([
      'Reception date',
      'Quotation price',
      'Measured work',
      'Prelims',
      'Prov Sums / Other Items',
      'Weeks',
    ]);
  });

  it('renders rows and passes data to Menu component', () => {
    const rows = [
      {
        id: 'row-1',
        date: '2024-02-01',
        price: '£1200',
        work: 'Framing',
        prelims: 'Preparation',
        sums: '£300',
        weeks: '4',
      },
    ];

    render(
      <table>
        <tbody>
          <QuoteHistoryTableRows rows={rows} />
        </tbody>
      </table>
    );

    expect(screen.getByText('2024-02-01')).toBeInTheDocument();
    expect(screen.getByText('£1200')).toBeInTheDocument();
    expect(screen.getByText('Framing')).toBeInTheDocument();
    expect(screen.getByText('Preparation')).toBeInTheDocument();
    expect(screen.getByText('£300')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByTestId('menu-row-1')).toBeInTheDocument();
    expect(mockMenuComponent).toHaveBeenCalledWith(
      expect.objectContaining({ row: rows[0] })
    );
  });
});
