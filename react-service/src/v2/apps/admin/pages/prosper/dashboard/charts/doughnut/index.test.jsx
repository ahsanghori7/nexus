import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DoughnutComponent from './index';
import pieData from './pie-chart.json';

// Mock the Chart component from clink-components
jest.mock('clink-components', () => ({
  Chart: ({ type, data, options, height }) => (
    <div 
      data-testid="chart"
      data-type={type}
      data-height={height}
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
  MuiChartsList: ({ children, doughnut }) => (
    <div data-testid="charts-list" data-doughnut={doughnut}>{children}</div>
  ),
}));

describe('DoughnutComponent', () => {
  it('should render without crashing', () => {
    render(<DoughnutComponent />);
    
    expect(screen.getByTestId('charts-container')).toBeInTheDocument();
    expect(screen.getByTestId('charts-list')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should render Chart with correct type', () => {
    render(<DoughnutComponent />);
    
    const chart = screen.getByTestId('chart');
    expect(chart).toHaveAttribute('data-type', 'doughnut');
  });

  it('should render Chart with correct height', () => {
    render(<DoughnutComponent />);
    
    const chart = screen.getByTestId('chart');
    expect(chart).toHaveAttribute('data-height', '400');
  });

  it('should pass doughnut prop to MuiChartsList', () => {
    render(<DoughnutComponent />);
    
    const chartsList = screen.getByTestId('charts-list');
    expect(chartsList).toHaveAttribute('data-doughnut', 'true');
  });

  it('should use default pie data when no data prop provided', () => {
    render(<DoughnutComponent />);
    
    const chartData = screen.getByTestId('chart-data');
    expect(chartData).toHaveTextContent(JSON.stringify(pieData));
  });

  it('should use custom data when provided', () => {
    const customData = {
      labels: ['Red', 'Blue', 'Yellow'],
      datasets: [
        {
          label: 'Custom Doughnut',
          data: [300, 50, 100],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        },
      ],
    };

    render(<DoughnutComponent data={customData} />);
    
    const chartData = screen.getByTestId('chart-data');
    expect(chartData).toHaveTextContent(JSON.stringify(customData));
  });

  it('should have correct chart options', () => {
    render(<DoughnutComponent />);
    
    const chartOptions = screen.getByTestId('chart-options');
    const options = JSON.parse(chartOptions.textContent);
    
    expect(options.responsive).toBe(false);
    expect(options.plugins.legend.position).toBe('top');
    expect(options.plugins.title.display).toBe(true);
    expect(options.plugins.title.text).toBe('Supply Chain Activation');
  });

  it('should match snapshot', () => {
    const { container } = render(<DoughnutComponent />);
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot with custom data', () => {
    const customData = {
      labels: ['A', 'B'],
      datasets: [{ label: 'Test', data: [70, 30], backgroundColor: ['red', 'blue'] }],
    };

    const { container } = render(<DoughnutComponent data={customData} />);
    
    expect(container.firstChild).toMatchSnapshot();
  });
});