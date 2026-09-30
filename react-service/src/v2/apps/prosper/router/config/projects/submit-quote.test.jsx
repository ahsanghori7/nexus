import React from 'react';
import { render, screen } from '@testing-library/react';
import submitQuoteConfig from './submit-quote';

// Mock react-redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector({
    boq: {
      loading: { message: null },
      entity: {
        tender: {
          label: 'Test Tender'
        }
      }
    }
  }))
}));

describe('Submit Quote Router Config', () => {
  describe('config structure', () => {
    it('should export an array of configs', () => {
      expect(Array.isArray(submitQuoteConfig)).toBe(true);
      expect(submitQuoteConfig).toHaveLength(2);
    });

    it('should have first config with correct properties', () => {
      const firstConfig = submitQuoteConfig[0];
      
      expect(firstConfig).toHaveProperty('id');
      expect(firstConfig).toHaveProperty('path');
      expect(firstConfig).toHaveProperty('element');
      expect(firstConfig).toHaveProperty('filter');
      expect(firstConfig).toHaveProperty('filterCountry');
      expect(firstConfig).toHaveProperty('redirects');
    });

    it('should have second config with correct properties', () => {
      const secondConfig = submitQuoteConfig[1];
      
      expect(secondConfig).toHaveProperty('id');
      expect(secondConfig).toHaveProperty('path');
      expect(secondConfig).toHaveProperty('element');
      expect(secondConfig).toHaveProperty('filter');
      expect(secondConfig).toHaveProperty('filterCountry');
      expect(secondConfig).toHaveProperty('redirects');
    });
  });

  describe('first config (submit quote page)', () => {
    const firstConfig = submitQuoteConfig[0];

    it('should have correct id and path', () => {
      expect(firstConfig.id).toBe(28);
      expect(firstConfig.path).toBe('enquiries/submit-quote/:slug');
    });

    it('should have empty filter arrays', () => {
      expect(firstConfig.filter).toEqual([]);
      expect(firstConfig.filterCountry).toEqual([]);
      expect(firstConfig.redirects).toEqual([]);
    });

    it('should render Prosper with SubmitQuote component', () => {
      render(firstConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('submit-quote-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      render(firstConfig.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'submit-quote');
    });

    it('should pass correct contextType to SubmitQuote', () => {
      render(firstConfig.element);
      
      const component = screen.getByTestId('submit-quote-component');
      expect(component).toHaveAttribute('data-context-type', 'prosper');
    });
  });

  describe('second config (submit quote with tid)', () => {
    const secondConfig = submitQuoteConfig[1];

    it('should have correct id and path', () => {
      expect(secondConfig.id).toBe(29);
      expect(secondConfig.path).toBe('enquiries/submit-quote/:slug/:tid');
    });

    it('should have empty filter arrays', () => {
      expect(secondConfig.filter).toEqual([]);
      expect(secondConfig.filterCountry).toEqual([]);
      expect(secondConfig.redirects).toEqual([]);
    });

    it('should render SubmitQuoteTitle component', () => {
      render(secondConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('submit-quote-component')).toBeInTheDocument();
    });
  });

  describe('configuration validation', () => {
    it('should have correct property types for first config', () => {
      const config = submitQuoteConfig[0];
      
      expect(typeof config.id).toBe('number');
      expect(typeof config.path).toBe('string');
      expect(React.isValidElement(config.element)).toBe(true);
      expect(Array.isArray(config.filter)).toBe(true);
      expect(Array.isArray(config.filterCountry)).toBe(true);
      expect(Array.isArray(config.redirects)).toBe(true);
    });

    it('should have correct property types for second config', () => {
      const config = submitQuoteConfig[1];
      
      expect(typeof config.id).toBe('number');
      expect(typeof config.path).toBe('string');
      expect(React.isValidElement(config.element)).toBe(true);
      expect(Array.isArray(config.filter)).toBe(true);
      expect(Array.isArray(config.filterCountry)).toBe(true);
      expect(Array.isArray(config.redirects)).toBe(true);
    });

    it('should have different ids for each config', () => {
      expect(submitQuoteConfig[0].id).not.toBe(submitQuoteConfig[1].id);
      expect(submitQuoteConfig[0].id).toBe(28);
      expect(submitQuoteConfig[1].id).toBe(29);
    });
  });
});