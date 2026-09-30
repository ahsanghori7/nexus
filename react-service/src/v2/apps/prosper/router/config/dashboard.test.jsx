import React from 'react';
import { render, screen } from '@testing-library/react';
import dashboardConfig from './dashboard';

describe('Dashboard Router Config', () => {
  const mockSubscription = {
    subscription_id: 'regular-user'
  };

  const mockNonTokenSubscription = {
    subscription_id: 'non-token-user'
  };

  describe('config function structure', () => {
    it('should be a function', () => {
      expect(typeof dashboardConfig).toBe('function');
    });

    it('should return config object when called', () => {
      const config = dashboardConfig(mockSubscription);
      expect(typeof config).toBe('object');
    });
  });

  describe('config with regular subscription', () => {
    let config;

    beforeEach(() => {
      config = dashboardConfig(mockSubscription);
    });

    it('should have required properties', () => {
      expect(config).toHaveProperty('id');
      expect(config).toHaveProperty('path');
      expect(config).toHaveProperty('element');
      expect(config).toHaveProperty('filter');
      expect(config).toHaveProperty('filterCountry');
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(config.id).toBe(3);
      expect(config.path).toBe('dashboard');
    });

    it('should have correct label', () => {
      expect(config.label).toBe('clink-dashboard-title');
    });

    it('should have correct filter and empty filterCountry', () => {
      expect(config.filter).toEqual(['activated-supply-chain']);
      expect(config.filterCountry).toEqual([]);
    });

    it('should have empty redirects for regular user', () => {
      expect(config.redirects).toEqual([]);
    });

    it('should render dashboard element correctly', () => {
      render(config.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      render(config.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'clink-dashboard-title');
    });
  });

  describe('config with non-token subscription', () => {
    let config;

    beforeEach(() => {
      config = dashboardConfig(mockNonTokenSubscription);
    });

    it('should have redirect for non-token user', () => {
      expect(config.redirects).toHaveLength(1);
      expect(config.redirects[0]).toEqual({
        path: '/dashboard',
        to: '/projects/enquiries'
      });
    });

    it('should have same structure as regular user except redirects', () => {
      expect(config.id).toBe(3);
      expect(config.path).toBe('dashboard');
      expect(config.label).toBe('clink-dashboard-title');
      expect(config.filter).toEqual(['activated-supply-chain']);
      expect(config.filterCountry).toEqual([]);
    });
  });

  describe('configuration validation', () => {
    it('should have correct property types for regular user', () => {
      const config = dashboardConfig(mockSubscription);
      
      expect(typeof config.id).toBe('number');
      expect(typeof config.path).toBe('string');
      expect(typeof config.label).toBe('string');
      expect(React.isValidElement(config.element)).toBe(true);
      expect(Array.isArray(config.filter)).toBe(true);
      expect(Array.isArray(config.filterCountry)).toBe(true);
      expect(Array.isArray(config.redirects)).toBe(true);
    });

    it('should handle subscription dependency correctly', () => {
      const config1 = dashboardConfig(mockSubscription);
      const config2 = dashboardConfig(mockNonTokenSubscription);

      expect(config1.redirects).toHaveLength(0);
      expect(config2.redirects).toHaveLength(1);
    });
  });
});