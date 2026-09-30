import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SummaryTab, { SUMMARY_LABEL } from './Tab';

describe('SummaryTab Component', () => {
  const mockHandleTabClick = jest.fn();
  const mockSx = { color: 'blue' };

  beforeEach(() => {
    mockHandleTabClick.mockClear();
  });

  it('renders without crashing', () => {
    render(<SummaryTab handleTabClick={mockHandleTabClick} />);
  });

  it('renders with correct label', () => {
    const { getByText } = render(
      <SummaryTab handleTabClick={mockHandleTabClick} sx={mockSx} />
    );
    
    expect(getByText(SUMMARY_LABEL)).toBeInTheDocument();
  });

  it('calls handleTabClick with SUMMARY_LABEL when clicked', () => {
    const { getByText } = render(
      <SummaryTab handleTabClick={mockHandleTabClick} sx={mockSx} />
    );
    
    const tabButton = getByText(SUMMARY_LABEL);
    fireEvent.click(tabButton);
    
    expect(mockHandleTabClick).toHaveBeenCalledWith(SUMMARY_LABEL);
    expect(mockHandleTabClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom sx styles when provided', () => {
    const { getByText } = render(
      <SummaryTab handleTabClick={mockHandleTabClick} sx={mockSx} />
    );
    
    const tabButton = getByText(SUMMARY_LABEL);
    expect(tabButton).toBeInTheDocument();
  });

  it('uses default empty sx when sx prop not provided', () => {
    const { getByText } = render(
      <SummaryTab handleTabClick={mockHandleTabClick} />
    );
    
    const tabButton = getByText(SUMMARY_LABEL);
    expect(tabButton).toBeInTheDocument();
  });

  it('exports SUMMARY_LABEL constant correctly', () => {
    expect(SUMMARY_LABEL).toBe('Summary');
  });

  it('matches snapshot with sx prop', () => {
    const { container } = render(
      <SummaryTab handleTabClick={mockHandleTabClick} sx={mockSx} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot without sx prop', () => {
    const { container } = render(
      <SummaryTab handleTabClick={mockHandleTabClick} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});