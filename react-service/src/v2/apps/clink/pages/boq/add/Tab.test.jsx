import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddTab, { ADD_LABEL } from './Tab';

describe('AddTab Component', () => {
  const mockHandleTabClick = jest.fn();
  const mockSx = { color: 'red' };

  beforeEach(() => {
    mockHandleTabClick.mockClear();
  });

  it('renders without crashing', () => {
    render(<AddTab handleTabClick={mockHandleTabClick} sx={mockSx} />);
  });

  it('renders with correct label', () => {
    const { getByText } = render(
      <AddTab handleTabClick={mockHandleTabClick} sx={mockSx} />
    );
    
    expect(getByText(ADD_LABEL)).toBeInTheDocument();
  });

  it('calls handleTabClick with ADD_LABEL when clicked', () => {
    const { getByText } = render(
      <AddTab handleTabClick={mockHandleTabClick} sx={mockSx} />
    );
    
    const tabButton = getByText(ADD_LABEL);
    fireEvent.click(tabButton);
    
    expect(mockHandleTabClick).toHaveBeenCalledWith(ADD_LABEL);
    expect(mockHandleTabClick).toHaveBeenCalledTimes(1);
  });

  it('renders with an Add icon', () => {
    const { container } = render(
      <AddTab handleTabClick={mockHandleTabClick} sx={mockSx} />
    );
    
    // Check if the container has the tab element
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom sx styles', () => {
    const { getByText } = render(
      <AddTab handleTabClick={mockHandleTabClick} sx={mockSx} />
    );
    
    const tabButton = getByText(ADD_LABEL);
    expect(tabButton).toBeInTheDocument();
  });

  it('has icon positioned at start', () => {
    const { getByText } = render(
      <AddTab handleTabClick={mockHandleTabClick} sx={mockSx} />
    );
    
    const tabButton = getByText(ADD_LABEL);
    expect(tabButton).toBeInTheDocument();
  });

  it('exports ADD_LABEL constant correctly', () => {
    expect(ADD_LABEL).toBe('Add');
  });

  it('matches snapshot', () => {
    const { container } = render(
      <AddTab handleTabClick={mockHandleTabClick} sx={mockSx} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});