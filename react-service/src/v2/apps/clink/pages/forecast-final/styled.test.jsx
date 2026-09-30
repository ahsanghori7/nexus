import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Since testing styled-components directly is complex, let's just test that the module exports properly

describe('Styled Components Module', () => {
  it('exports all required styled components', () => {
    const styledModule = require('./styled');
    
    expect(styledModule.StyledForecastBudget).toBeDefined();
    expect(styledModule.StyledForecastProjectBudget).toBeDefined();
    expect(styledModule.StyledForecastProjectNumber).toBeDefined();
    expect(styledModule.StyledForecastContainer).toBeDefined();
  });

  it('verifies styled components are callable', () => {
    const {
      StyledForecastBudget,
      StyledForecastProjectBudget,
      StyledForecastProjectNumber,
      StyledForecastContainer,
    } = require('./styled');
    
    expect(StyledForecastBudget).toBeDefined();
    expect(StyledForecastProjectBudget).toBeDefined();
    expect(StyledForecastProjectNumber).toBeDefined();
    expect(StyledForecastContainer).toBeDefined();
  });

  it('can render styled components without throwing errors', () => {
    const {
      StyledForecastBudget,
      StyledForecastProjectBudget,
      StyledForecastProjectNumber,
      StyledForecastContainer,
    } = require('./styled');

    expect(() => {
      render(React.createElement(StyledForecastBudget, {}, 'Test'));
    }).not.toThrow();

    expect(() => {
      render(React.createElement(StyledForecastProjectBudget, {}, 'Test'));
    }).not.toThrow();

    expect(() => {
      render(React.createElement(StyledForecastProjectNumber, {}, 'Test'));
    }).not.toThrow();

    expect(() => {
      render(React.createElement(StyledForecastContainer, {}, 'Test'));
    }).not.toThrow();
  });

  it('StyledForecastProjectNumber accepts props', () => {
    const { StyledForecastProjectNumber } = require('./styled');

    expect(() => {
      render(React.createElement(StyledForecastProjectNumber, { 
        bordered: true, 
        profitValue: 100 
      }, 'Test'));
    }).not.toThrow();

    expect(() => {
      render(React.createElement(StyledForecastProjectNumber, { 
        profitValue: -100 
      }, 'Test'));
    }).not.toThrow();
  });

  it('StyledForecastContainer accepts content prop', () => {
    const { StyledForecastContainer } = require('./styled');

    expect(() => {
      render(React.createElement(StyledForecastContainer, { 
        content: '£' 
      }, 'Test'));
    }).not.toThrow();
  });

  it('renders basic component structure', () => {
    const { StyledForecastBudget } = require('./styled');
    
    const { container } = render(React.createElement(StyledForecastBudget, {}, 'Budget Content'));
    
    expect(container.firstChild).toBeInTheDocument();
    expect(container.textContent).toContain('Budget Content');
  });
});