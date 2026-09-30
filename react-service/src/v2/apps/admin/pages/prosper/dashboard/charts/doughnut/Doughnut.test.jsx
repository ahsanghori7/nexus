import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BarComponent from './Doughnut';
import pieData from './pie-chart.json';

// Mock react-chartjs-2 and chart.js
jest.mock('react-chartjs-2', () => ({
  Doughnut: ({ data }) => (
    <div data-testid="doughnut-chart">
      <div data-testid="doughnut-data">{JSON.stringify(data)}</div>
    </div>
  ),
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  ArcElement: {},
  Tooltip: {},
  Legend: {},
}));

describe('BarComponent (Doughnut.jsx)', () => {
  it('should render without crashing', () => {
    render(<BarComponent />);
    
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
  });

  it('should render Doughnut chart with pie data', () => {
    render(<BarComponent />);
    
    const doughnutData = screen.getByTestId('doughnut-data');
    expect(doughnutData).toHaveTextContent(JSON.stringify(pieData));
  });

  it('should match snapshot', () => {
    const { container } = render(<BarComponent />);
    
    expect(container.firstChild).toMatchSnapshot();
  });
});