import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MuiChartsContainer, MuiDateRangeContainer, MuiCalendarContainer } from './Mui.styled';

describe('Charts Mui.styled Components', () => {
  describe('MuiChartsContainer', () => {
    it('should render without crashing', () => {
      render(
        <MuiChartsContainer>
          <div>Chart Content</div>
        </MuiChartsContainer>
      );
      
      expect(screen.getByText('Chart Content')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <MuiChartsContainer>
          <div data-testid="chart-child-1">Chart 1</div>
          <div data-testid="chart-child-2">Chart 2</div>
        </MuiChartsContainer>
      );
      
      expect(screen.getByTestId('chart-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('chart-child-2')).toBeInTheDocument();
    });

    it('should match snapshot', () => {
      const { container } = render(
        <MuiChartsContainer>
          <div>Snapshot Test</div>
        </MuiChartsContainer>
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('MuiDateRangeContainer', () => {
    it('should render without crashing', () => {
      render(
        <MuiDateRangeContainer>
          <div>Date Range Content</div>
        </MuiDateRangeContainer>
      );
      
      expect(screen.getByText('Date Range Content')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <MuiDateRangeContainer>
          <div data-testid="date-range-child">Date Range Child</div>
        </MuiDateRangeContainer>
      );
      
      expect(screen.getByTestId('date-range-child')).toBeInTheDocument();
    });

    it('should match snapshot', () => {
      const { container } = render(
        <MuiDateRangeContainer>
          <div>Date Range Snapshot</div>
        </MuiDateRangeContainer>
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('MuiCalendarContainer', () => {
    it('should render without crashing', () => {
      render(
        <MuiCalendarContainer>
          <div>Calendar Content</div>
        </MuiCalendarContainer>
      );
      
      expect(screen.getByText('Calendar Content')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <MuiCalendarContainer>
          <div data-testid="calendar-child">Calendar Child</div>
        </MuiCalendarContainer>
      );
      
      expect(screen.getByTestId('calendar-child')).toBeInTheDocument();
    });

    it('should match snapshot', () => {
      const { container } = render(
        <MuiCalendarContainer>
          <div>Calendar Snapshot</div>
        </MuiCalendarContainer>
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});