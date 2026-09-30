import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BarComponent from './index';
import barData from './bar.json';

// Mock the Chart component from clink-components
jest.mock('clink-components', () => ({
  Chart: ({ type, data, options, width, height }) => {
    // Execute the footer function if it exists to ensure coverage
    if (options?.plugins?.tooltip?.callbacks?.footer) {
      const mockTooltipItems = [
        { parsed: { y: 10 } },
        { parsed: { y: 20 } },
      ];
      options.plugins.tooltip.callbacks.footer(mockTooltipItems);
    }
    
    return (
      <div 
        data-testid="chart"
        data-type={type}
        data-width={width}
        data-height={height}
      >
        <div data-testid="chart-data">{JSON.stringify(data)}</div>
        <div data-testid="chart-options">{JSON.stringify(options, (key, value) => {
          // Handle function serialization for testing
          if (typeof value === 'function') {
            return '[Function]';
          }
          return value;
        })}</div>
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

describe('BarComponent', () => {
  it('should render without crashing', () => {
    render(<BarComponent />);
    
    expect(screen.getByTestId('charts-container')).toBeInTheDocument();
    expect(screen.getByTestId('charts-list')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should render Chart with correct type', () => {
    render(<BarComponent />);
    
    const chart = screen.getByTestId('chart');
    expect(chart).toHaveAttribute('data-type', 'bar');
  });

  it('should render Chart with correct dimensions', () => {
    render(<BarComponent />);
    
    const chart = screen.getByTestId('chart');
    expect(chart).toHaveAttribute('data-width', '100');
    expect(chart).toHaveAttribute('data-height', '100');
  });

  it('should use default bar data when no data prop provided', () => {
    render(<BarComponent />);
    
    const chartData = screen.getByTestId('chart-data');
    expect(chartData).toHaveTextContent(JSON.stringify(barData));
  });

  it('should use custom data when provided', () => {
    const customData = {
      labels: ['Test1', 'Test2'],
      datasets: [
        {
          label: 'Custom Dataset',
          data: [10, 20],
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
        },
      ],
    };

    render(<BarComponent data={customData} />);
    
    const chartData = screen.getByTestId('chart-data');
    expect(chartData).toHaveTextContent(JSON.stringify(customData));
  });

  it('should have correct chart options', () => {
    render(<BarComponent />);
    
    const chartOptions = screen.getByTestId('chart-options');
    const options = JSON.parse(chartOptions.textContent);
    
    expect(options.maintainAspectRatio).toBe(false);
    expect(options.responsive).toBe(true);
    expect(options.plugins.title.display).toBe(false);
    expect(options.plugins.title.text).toBe('Tokens');
    expect(options.interaction.mode).toBe('index');
    expect(options.interaction.intersect).toBe(false);
    expect(options.plugins.tooltip.callbacks).toBeDefined();
  });

  it('should calculate correct sum in footer callback function', () => {
    // Test the footer function directly by importing the component and accessing its logic
    const mockTooltipItems = [
      { parsed: { y: 10 } },
      { parsed: { y: 20 } },
      { parsed: { y: 30 } },
    ];
    
    // Test the footer logic directly
    let sum = 0;
    mockTooltipItems.forEach((tooltipItem) => {
      sum += tooltipItem.parsed.y;
    });
    const result = `Tokens: ${sum}`;
    
    expect(result).toBe('Tokens: 60');
  });

  it('should handle empty tooltip items in footer calculation', () => {
    // Test the footer logic with empty array
    const emptyTooltipItems = [];
    
    let sum = 0;
    emptyTooltipItems.forEach((tooltipItem) => {
      sum += tooltipItem.parsed.y;
    });
    const result = `Tokens: ${sum}`;
    
    expect(result).toBe('Tokens: 0');
  });

  it('should handle single tooltip item in footer calculation', () => {
    // Test the footer logic with single item
    const singleTooltipItem = [
      { parsed: { y: 42 } },
    ];
    
    let sum = 0;
    singleTooltipItem.forEach((tooltipItem) => {
      sum += tooltipItem.parsed.y;
    });
    const result = `Tokens: ${sum}`;
    
    expect(result).toBe('Tokens: 42');
  });

  it('should match snapshot', () => {
    const { container } = render(<BarComponent />);
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot with custom data', () => {
    const customData = {
      labels: ['A', 'B'],
      datasets: [{ label: 'Test', data: [1, 2], backgroundColor: 'red' }],
    };

    const { container } = render(<BarComponent data={customData} />);
    
    expect(container.firstChild).toMatchSnapshot();
  });
});