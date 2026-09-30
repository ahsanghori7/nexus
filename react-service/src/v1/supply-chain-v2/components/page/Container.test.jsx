import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Container from './Container';

jest.mock('./list', () => () => <div data-testid="mock-supply-chain-list" />);
jest.mock('v2/apps/shared/components/responseAlert', () => () => null);
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const defaultProps = {
  term: '',
  contractors: [],
  removeData: jest.fn(),
  editData: jest.fn(),
  addData: jest.fn(),
  regions: [],
  trades: [],
  total: 0,
  paginationRowsPerPage: 10,
  setPaginationRowsPerPage: jest.fn(),
  setOffset: jest.fn(),
  order: '',
  statuses: [],
  setOrder: jest.fn(),
  desc: 0,
  setDesc: jest.fn(),
  paginationPage: 0,
  setPaginationPage: jest.fn(),
  accountData: {},
  accountType: '1',
  loadingContractors: false,
  setAlertOpen: jest.fn(),
};

describe('Container', () => {
  it('renders data-testid="supply-chain-no-results" when contractors list is empty', () => {
    render(<Container {...defaultProps} contractors={[]} />);
    expect(screen.getByTestId('supply-chain-no-results')).toBeInTheDocument();
  });

  it('does not render "supply-chain-no-results" when contractors exist', () => {
    render(<Container {...defaultProps} contractors={[{ id: 1 }]} />);
    expect(screen.queryByTestId('supply-chain-no-results')).not.toBeInTheDocument();
  });

  it('renders the List component when contractors exist', () => {
    render(<Container {...defaultProps} contractors={[{ id: 1 }]} />);
    expect(screen.getByTestId('mock-supply-chain-list')).toBeInTheDocument();
  });
});