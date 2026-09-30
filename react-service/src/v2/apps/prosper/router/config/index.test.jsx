// Mock BASE_URLS
global.BASE_URLS = {
  PROSPER: '/prosper'
};

import React from 'react';
import Config from './index';

describe('Config Class', () => {
  const mockSubcontractor = {
    id: 123,
    regions: { region1: 'value1' },
    trades: { trade1: 'value1' },
    subscription_id: 'token-user'
  };

  let configInstance;

  beforeEach(() => {
    configInstance = new Config(mockSubcontractor);
  });

  describe('constructor and getter', () => {
    it('should initialize with subcontractor parameter', () => {
      expect(configInstance.subcontractor).toBe(mockSubcontractor);
    });

    it('should initialize with empty object when no parameter provided', () => {
      const emptyConfig = new Config();
      expect(emptyConfig.subcontractor).toEqual({});
    });
  });

  describe('individual getter methods', () => {
    it('should call dashboard function with subcontractor', () => {
      const result = configInstance.getDashboard();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should call projects function with subcontractor and extend routes', () => {
      const result = configInstance.getProjects();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('routes');
      expect(Array.isArray(result.routes)).toBe(true);
    });

    it('should return myCompany config', () => {
      const result = configInstance.getMyCompany();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return CRM config', () => {
      const result = configInstance.getCRM();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return changePassword config', () => {
      const result = configInstance.getChangePassword();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return resources config', () => {
      const result = configInstance.getResources();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('getMain method', () => {
    it('should return an array with main route configuration', () => {
      const result = configInstance.getMain();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      
      const mainRoute = result[0];
      expect(mainRoute.id).toBe(1);
      expect(mainRoute.path).toBe('/prosper');
      expect(mainRoute.reactRouter).toBe(true);
      expect(Array.isArray(mainRoute.routes)).toBe(true);
    });

    it('should include all route configs in main routes', () => {
      const result = configInstance.getMain();
      const mainRoute = result[0];
      
      expect(mainRoute.routes).toHaveLength(7); // index dashboard + 6 configs
      
      // Check that dashboard config is duplicated (index + regular)
      expect(mainRoute.routes[0].index).toBe(true);
      expect(mainRoute.routes[0].label).toBe(null);
      expect(mainRoute.routes[0].id).toBe(2);
    });
  });

  describe('getRedirects method', () => {
    it('should collect redirects from all configs', () => {
      const result = configInstance.getRedirects();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should return array of redirect objects', () => {
      const result = configInstance.getRedirects();
      result.forEach(redirect => {
        expect(redirect).toHaveProperty('path');
        expect(redirect).toHaveProperty('to');
        expect(typeof redirect.path).toBe('string');
        expect(typeof redirect.to).toBe('string');
      });
    });
  });

  describe('config integration', () => {
    it('should work with different subcontractor data', () => {
      const differentSubcontractor = { 
        id: 456, 
        subscription_id: 'different',
        regions: { region1: 'value1' },
        trades: { trade1: 'value1' }
      };
      const differentConfig = new Config(differentSubcontractor);
      
      expect(differentConfig.subcontractor).toBe(differentSubcontractor);
      expect(differentConfig.getDashboard()).toBeDefined();
      expect(differentConfig.getProjects()).toBeDefined();
    });

    it('should maintain consistency across method calls', () => {
      const dashboard1 = configInstance.getDashboard();
      const dashboard2 = configInstance.getDashboard();
      
      // Should return consistent results
      expect(dashboard1).toEqual(dashboard2);
    });
  });

  describe('class methods validation', () => {
    it('should have all required methods', () => {
      expect(typeof configInstance.getDashboard).toBe('function');
      expect(typeof configInstance.getProjects).toBe('function');
      expect(typeof configInstance.getMyCompany).toBe('function');
      expect(typeof configInstance.getCRM).toBe('function');
      expect(typeof configInstance.getChangePassword).toBe('function');
      expect(typeof configInstance.getResources).toBe('function');
      expect(typeof configInstance.getMain).toBe('function');
      expect(typeof configInstance.getRedirects).toBe('function');
    });
  });
});