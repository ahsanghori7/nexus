import React from 'react';
import { render, screen } from '@testing-library/react';
import resourcesConfig from './index';
import howItWorks from './how-it-works';
import successStories from './success-stories';
import whatAreTokens from './what-are-tokens';

describe('Resources Router Config', () => {
  describe('config structure', () => {
    it('should have required properties', () => {
      expect(resourcesConfig).toHaveProperty('id');
      expect(resourcesConfig).toHaveProperty('path');
      expect(resourcesConfig).toHaveProperty('element');
      expect(resourcesConfig).toHaveProperty('filter');
      expect(resourcesConfig).toHaveProperty('filterCountry');
      expect(resourcesConfig).toHaveProperty('label');
      expect(resourcesConfig).toHaveProperty('routes');
      expect(resourcesConfig).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(resourcesConfig.id).toBe(14);
      expect(resourcesConfig.path).toBe('resources');
    });

    it('should have correct label', () => {
      expect(resourcesConfig.label).toBe('resources');
    });

    it('should have empty filter and specific filterCountry', () => {
      expect(resourcesConfig.filter).toEqual([]);
      expect(resourcesConfig.filterCountry).toEqual(['EU', 'NZ', 'AUS']);
    });

    it('should have empty redirects array', () => {
      expect(resourcesConfig.redirects).toEqual([]);
    });

    it('should have routes array with 3 items', () => {
      expect(resourcesConfig.routes).toHaveLength(3);
    });
  });

  describe('routes configuration', () => {
    it('should include how-it-works route', () => {
      expect(resourcesConfig.routes).toContain(howItWorks);
    });

    it('should include success-stories route', () => {
      expect(resourcesConfig.routes).toContain(successStories);
    });

    it('should include what-are-tokens route', () => {
      expect(resourcesConfig.routes).toContain(whatAreTokens);
    });

    it('should have correct order of routes', () => {
      expect(resourcesConfig.routes[0]).toBe(howItWorks);
      expect(resourcesConfig.routes[1]).toBe(successStories);
      expect(resourcesConfig.routes[2]).toBe(whatAreTokens);
    });
  });

  describe('element rendering', () => {
    it('should render Prosper component with HowItWorks', () => {
      render(resourcesConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('how-it-works-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      render(resourcesConfig.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'how-it-works');
    });
  });

  describe('configuration validation', () => {
    it('should export config as default', () => {
      expect(resourcesConfig).toBeDefined();
      expect(typeof resourcesConfig).toBe('object');
    });

    it('should have correct property types', () => {
      expect(typeof resourcesConfig.id).toBe('number');
      expect(typeof resourcesConfig.path).toBe('string');
      expect(typeof resourcesConfig.label).toBe('string');
      expect(React.isValidElement(resourcesConfig.element)).toBe(true);
      expect(Array.isArray(resourcesConfig.filter)).toBe(true);
      expect(Array.isArray(resourcesConfig.filterCountry)).toBe(true);
      expect(Array.isArray(resourcesConfig.routes)).toBe(true);
      expect(Array.isArray(resourcesConfig.redirects)).toBe(true);
    });

    it('should have all imported route configs', () => {
      expect(resourcesConfig.routes).toEqual([howItWorks, successStories, whatAreTokens]);
    });
  });
});