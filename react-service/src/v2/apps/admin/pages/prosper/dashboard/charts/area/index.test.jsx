import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AreaComponent from './index';
import areaData from './area.json';

// Mock the Chart component from clink-components
jest.mock('clink-components', () => ({
  Chart: ({ type, data, options }) => (
    <div 
      data-testid="chart"
      data-type={type}
    >
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}));

// Mock the styled components
jest.mock('v2/apps/admin/pages/prosper/dashboard/charts/Mui.styled', () => ({
  MuiChartsContainer: ({ children }) => (
    <div data-testid="charts-container">{children}</div>
  ),
  MuiChartsList: ({ children }) => (
    <div data-testid="charts-list">{children}</div>
  ),
}));

describe('AreaComponent', () => {
  it('should render without crashing', () => {
    render(<AreaComponent />);
    
    expect(screen.getByTestId('charts-container')).toBeInTheDocument();
    expect(screen.getByTestId('charts-list')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should render Chart with correct type', () => {
    render(<AreaComponent />);
    
    const chart = screen.getByTestId('chart');
    expect(chart).toHaveAttribute('data-type', 'area');
  });

  it('should use default area data when no data prop provided', () => {
    render(<AreaComponent />);
    
    const chartData = screen.getByTestId('chart-data');
    expect(chartData).toHaveTextContent(JSON.stringify(areaData));
  });

  it('should use custom data when provided', () => {
    const customData = {
      labels: ['Test1', 'Test2'],
      datasets: [
        {
          label: 'Custom Area Dataset',
          data: [15, 25],
          backgroundColor: 'rgba(0, 255, 0, 0.3)',
        },
      ],
    };

    render(<AreaComponent data={customData} />);
    
    const chartData = screen.getByTestId('chart-data');
    expect(chartData).toHaveTextContent(JSON.stringify(customData));
  });

  it('should have correct chart options', () => {
    render(<AreaComponent />);
    
    const chartOptions = screen.getByTestId('chart-options');
    const options = JSON.parse(chartOptions.textContent);
    
    expect(options.responsive).toBe(true);
    expect(options.plugins.legend.position).toBe('top');
    expect(options.plugins.title.display).toBe(false);
    expect(options.plugins.title.text).toBe('Tokens');
  });

  it('should match snapshot', () => {
    const { container } = render(<AreaComponent />);
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot with custom data', () => {
    const customData = {
      labels: ['X', 'Y'],
      datasets: [{ label: 'Area Test', data: [5, 10], backgroundColor: 'blue' }],
    };

    const { container } = render(<AreaComponent data={customData} />);
    
    expect(container.firstChild).toMatchSnapshot();
  });
});