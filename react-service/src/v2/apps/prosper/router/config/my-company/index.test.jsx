import React from 'react';
import { render, screen } from '@testing-library/react';
import myCompanyConfig from './index';
import prequal from './prequal';

describe('My Company Router Config', () => {
  describe('config structure', () => {
    it('should have required properties', () => {
      expect(myCompanyConfig).toHaveProperty('id');
      expect(myCompanyConfig).toHaveProperty('path');
      expect(myCompanyConfig).toHaveProperty('element');
      expect(myCompanyConfig).toHaveProperty('filter');
      expect(myCompanyConfig).toHaveProperty('filterCountry');
      expect(myCompanyConfig).toHaveProperty('label');
      expect(myCompanyConfig).toHaveProperty('routes');
      expect(myCompanyConfig).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(myCompanyConfig.id).toBe(8);
      expect(myCompanyConfig.path).toBe('my-company');
    });

    it('should have correct label', () => {
      expect(myCompanyConfig.label).toBe('my-company');
    });

    it('should have empty filter arrays', () => {
      expect(myCompanyConfig.filter).toEqual([]);
      expect(myCompanyConfig.filterCountry).toEqual([]);
    });

    it('should have empty redirects array', () => {
      expect(myCompanyConfig.redirects).toEqual([]);
    });

    it('should have routes array with 3 items', () => {
      expect(myCompanyConfig.routes).toHaveLength(3);
    });
  });

  describe('routes configuration', () => {
    it('should have first route with correct properties', () => {
      const firstRoute = myCompanyConfig.routes[0];
      expect(firstRoute.id).toBe(9);
      expect(firstRoute.path).toBe('profile');
      expect(firstRoute.label).toBe('profile');
      expect(firstRoute.filter).toEqual([]);
      expect(firstRoute.filterCountry).toEqual([]);
    });

    it('should have second route with parameter', () => {
      const secondRoute = myCompanyConfig.routes[1];
      expect(secondRoute.id).toBe(25);
      expect(secondRoute.path).toBe('profile/:parameter');
      expect(secondRoute.filter).toEqual([]);
      expect(secondRoute.filterCountry).toEqual([]);
    });

    it('should include prequal config as third route', () => {
      const thirdRoute = myCompanyConfig.routes[2];
      expect(thirdRoute).toBe(prequal);
    });

    it('should render first route element correctly', () => {
      render(myCompanyConfig.routes[0].element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('my-company-component')).toBeInTheDocument();
    });

    it('should render second route element correctly', () => {
      render(myCompanyConfig.routes[1].element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('my-company-component')).toBeInTheDocument();
    });
  });

  describe('element rendering', () => {
    it('should render main Prosper component with MyCompany', () => {
      render(myCompanyConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('my-company-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      render(myCompanyConfig.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'profile');
    });
  });

  describe('configuration validation', () => {
    it('should export config as default', () => {
      expect(myCompanyConfig).toBeDefined();
      expect(typeof myCompanyConfig).toBe('object');
    });

    it('should have correct property types', () => {
      expect(typeof myCompanyConfig.id).toBe('number');
      expect(typeof myCompanyConfig.path).toBe('string');
      expect(typeof myCompanyConfig.label).toBe('string');
      expect(React.isValidElement(myCompanyConfig.element)).toBe(true);
      expect(Array.isArray(myCompanyConfig.filter)).toBe(true);
      expect(Array.isArray(myCompanyConfig.filterCountry)).toBe(true);
      expect(Array.isArray(myCompanyConfig.routes)).toBe(true);
      expect(Array.isArray(myCompanyConfig.redirects)).toBe(true);
    });

    it('should have all routes with valid elements', () => {
      myCompanyConfig.routes.forEach((route, index) => {
        if (route.element) {
          expect(React.isValidElement(route.element)).toBe(true);
        }
      });
    });
  });
});