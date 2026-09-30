import React from 'react';
import { render, screen } from '@testing-library/react';
import projectsConfig from './index';
import findOpt from './find-opportunities';
import viewProject from './page';
import unlocked from './unlocked';
import enquiries from './enquiries';
import submitQuote from './submit-quote';

describe('Projects Router Config', () => {
  const mockSubcontractor = {
    id: 123,
    regions: { region1: 'value1' },
    trades: { trade1: 'value1' },
    subscription_id: 'token-user'
  };

  describe('config function structure', () => {
    it('should be a function', () => {
      expect(typeof projectsConfig).toBe('function');
    });

    it('should return config object when called', () => {
      const config = projectsConfig(mockSubcontractor);
      expect(typeof config).toBe('object');
    });
  });

  describe('config structure', () => {
    let config;

    beforeEach(() => {
      config = projectsConfig(mockSubcontractor);
    });

    it('should have required properties', () => {
      expect(config).toHaveProperty('id');
      expect(config).toHaveProperty('path');
      expect(config).toHaveProperty('element');
      expect(config).toHaveProperty('filter');
      expect(config).toHaveProperty('filterCountry');
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('routes');
      expect(config).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(config.id).toBe(4);
      expect(config.path).toBe('projects');
    });

    it('should have correct label', () => {
      expect(config.label).toBe('clink-projects-title');
    });

    it('should have empty filter arrays', () => {
      expect(config.filter).toEqual([]);
      expect(config.filterCountry).toEqual([]);
    });

    it('should have correct redirects', () => {
      expect(config.redirects).toHaveLength(2);
      expect(config.redirects[0]).toEqual({
        path: '/projects',
        to: '/projects/find-opportunities'
      });
      expect(config.redirects[1]).toEqual({
        path: '/projects/enquiries/submit-quote',
        to: '/projects/enquiries'
      });
    });
  });

  describe('routes configuration', () => {
    let config;
    let findOptObj;

    beforeEach(() => {
      config = projectsConfig(mockSubcontractor);
      findOptObj = findOpt(mockSubcontractor);
    });

    it('should have routes array with correct length', () => {
      // findOpportunities, viewProject, unlocked, enquiries, ...submitQuote (2), opportunityWidget
      expect(config.routes).toHaveLength(7);
    });

    it('should include findOpportunities from findOpt', () => {
      expect(config.routes).toContainEqual(findOptObj.findOpportunities);
    });

    it('should include viewProject', () => {
      expect(config.routes).toContain(viewProject);
    });

    it('should include unlocked config', () => {
      const unlockedConfig = unlocked(mockSubcontractor);
      expect(config.routes[2]).toEqual(unlockedConfig);
    });

    it('should include enquiries config', () => {
      expect(config.routes).toContain(enquiries);
    });

    it('should include submitQuote configs', () => {
      expect(config.routes).toContain(submitQuote[0]);
      expect(config.routes).toContain(submitQuote[1]);
    });

    it('should include opportunityWidget from findOpt', () => {
      expect(config.routes).toContainEqual(findOptObj.opportunityWidget);
    });
  });

  describe('element rendering', () => {
    it('should render Prosper component with Projects', () => {
      const config = projectsConfig(mockSubcontractor);
      render(config.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('projects-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      const config = projectsConfig(mockSubcontractor);
      render(config.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'clink-projects-title');
    });
  });

  describe('configuration validation', () => {
    it('should have correct property types', () => {
      const config = projectsConfig(mockSubcontractor);
      
      expect(typeof config.id).toBe('number');
      expect(typeof config.path).toBe('string');
      expect(typeof config.label).toBe('string');
      expect(React.isValidElement(config.element)).toBe(true);
      expect(Array.isArray(config.filter)).toBe(true);
      expect(Array.isArray(config.filterCountry)).toBe(true);
      expect(Array.isArray(config.routes)).toBe(true);
      expect(Array.isArray(config.redirects)).toBe(true);
    });

    it('should handle subcontractor parameter correctly', () => {
      const config1 = projectsConfig(mockSubcontractor);
      const mockNonTokenSub = { ...mockSubcontractor, subscription_id: 'non-token-user' };
      const config2 = projectsConfig(mockNonTokenSub);

      expect(config1.routes).toHaveLength(7);
      expect(config2.routes).toHaveLength(7);
    });
  });

  describe('dependency integration', () => {
    it('should integrate with findOpt function correctly', () => {
      const config = projectsConfig(mockSubcontractor);
      const findOptResult = findOpt(mockSubcontractor);
      
      expect(config.routes[0]).toStrictEqual(findOptResult.findOpportunities);
      expect(config.routes[6]).toStrictEqual(findOptResult.opportunityWidget);
    });

    it('should integrate with unlocked function correctly', () => {
      const config = projectsConfig(mockSubcontractor);
      const unlockedResult = unlocked(mockSubcontractor);
      
      expect(config.routes[2]).toEqual(unlockedResult);
    });

    it('should spread submitQuote array correctly', () => {
      const config = projectsConfig(mockSubcontractor);
      
      expect(config.routes[3]).toBe(enquiries);
      expect(config.routes[4]).toBe(submitQuote[0]);
      // Index [4] might be shifted due to spread operation
    });
  });
});