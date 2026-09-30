import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Search from './Search';

jest.mock('clink-components', () => ({
  Searchbox: ({ name, value, handleChange, placeholder }) => (
    <input
      name={name}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
    />
  ),
}));

describe('Search', () => {
  const defaultProps = {
    setTerm: jest.fn(),
    term: '',
    placeholder: 'Search by company',
  };

  it('renders wrapper with data-testid="supply-chain-search"', () => {
    render(<Search {...defaultProps} />);
    expect(screen.getByTestId('supply-chain-search')).toBeInTheDocument();
  });

  it('sets data-testid="supply-chain-search-input" on the input element after mount', () => {
    render(<Search {...defaultProps} />);
    expect(screen.getByTestId('supply-chain-search-input')).toBeInTheDocument();
  });

  it('renders an input inside the supply-chain-search wrapper', () => {
    render(<Search {...defaultProps} />);
    const wrapper = screen.getByTestId('supply-chain-search');
    expect(wrapper.querySelector('input')).toBeInTheDocument();
  });
});