import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BarStackedComponent from './index';
import barStackData from './barstack.json';

// Mock the Chart component from clink-components
jest.mock('clink-components', () => ({
  Chart: ({ type, data, options }) => {
    // Execute the footer function if it exists to ensure code coverage
    if (options?.plugins?.tooltip?.callbacks?.footer) {
      const mockTooltipItems = [
        { parsed: { y: 10 } },
        { parsed: { y: 20 } }
      ];
      options.plugins.tooltip.callbacks.footer(mockTooltipItems);
    }

    // Handle function serialization for JSON.stringify
    const serializableOptions = JSON.parse(JSON.stringify(options, (key, value) => {
      if (typeof value === 'function') {
        return '[Function]';
      }
      return value;
    }));

    return (
      <div 
        data-testid="chart"
        data-type={type}
      >
        <div data-testid="chart-data">{JSON.stringify(data)}</div>
        <div data-testid="chart-options">{JSON.stringify(serializableOptions)}</div>
      </div>
    );
  },
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

describe('BarStackedComponent', () => {
  it('should render without crashing', () => {
    render(<BarStackedComponent />);
    
    expect(screen.getByTestId('charts-container')).toBeInTheDocument();
    expect(screen.getByTestId('charts-list')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should render Chart with correct type', () => {
    render(<BarStackedComponent />);
    
    const chart = screen.getByTestId('chart');
    expect(chart).toHaveAttribute('data-type', 'barstack');
  });

  it('should use default bar stack data when no data prop provided', () => {
    render(<BarStackedComponent />);
    
    const chartData = screen.getByTestId('chart-data');
    expect(chartData).toHaveTextContent(JSON.stringify(barStackData));
  });

  it('should use custom data when provided', () => {
    const customData = {
      labels: ['Q1', 'Q2'],
      datasets: [
        {
          label: 'Stack 1',
          data: [30, 40],
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
        },
        {
          label: 'Stack 2',
          data: [20, 30],
          backgroundColor: 'rgba(0, 255, 0, 0.5)',
        },
      ],
    };

    render(<BarStackedComponent data={customData} />);
    
    const chartData = screen.getByTestId('chart-data');
    expect(chartData).toHaveTextContent(JSON.stringify(customData));
  });

  it('should have correct chart options with stacked scales', () => {
    render(<BarStackedComponent />);
    
    const chartOptions = screen.getByTestId('chart-options');
    const options = JSON.parse(chartOptions.textContent);
    
    expect(options.responsive).toBe(true);
    expect(options.plugins.title.display).toBe(true);
    expect(options.plugins.title.text).toBe('Subscriptions');
    expect(options.interaction.mode).toBe('index');
    expect(options.interaction.intersect).toBe(false);
    expect(options.scales.x.stacked).toBe(true);
    expect(options.scales.y.stacked).toBe(true);
    expect(options.plugins.tooltip.callbacks).toBeDefined();
  });

  it('should match snapshot', () => {
    const { container } = render(<BarStackedComponent />);
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot with custom data', () => {
    const customData = {
      labels: ['A', 'B'],
      datasets: [
        { label: 'Test1', data: [10, 20], backgroundColor: 'red' },
        { label: 'Test2', data: [5, 15], backgroundColor: 'blue' },
      ],
    };

    const { container } = render(<BarStackedComponent data={customData} />);
    
    expect(container.firstChild).toMatchSnapshot();
  });
});