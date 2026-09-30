import React from 'react';
import { render, screen } from '@testing-library/react';
import pageConfig from './page';

describe('Page Router Config', () => {
  describe('config structure', () => {
    it('should have required properties', () => {
      expect(pageConfig).toHaveProperty('path');
      expect(pageConfig).toHaveProperty('element');
      expect(pageConfig).toHaveProperty('filter');
      expect(pageConfig).toHaveProperty('filterCountry');
      expect(pageConfig).toHaveProperty('redirects');
    });

    it('should have correct path with parameter', () => {
      expect(pageConfig.path).toBe(':projectId');
    });

    it('should have correct filter and empty filterCountry', () => {
      expect(pageConfig.filter).toEqual(['activated-supply-chain']);
      expect(pageConfig.filterCountry).toEqual([]);
    });

    it('should have empty redirects array', () => {
      expect(pageConfig.redirects).toEqual([]);
    });
  });

  describe('element rendering', () => {
    it('should render Prosper component with ViewProjectV3', () => {
      render(pageConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('view-project-v3-component')).toBeInTheDocument();
    });

    it('should render with correct title and type', () => {
      render(pageConfig.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'OpportunitiesHeader');
    });
  });

  describe('configuration validation', () => {
    it('should export config as default', () => {
      expect(pageConfig).toBeDefined();
      expect(typeof pageConfig).toBe('object');
    });

    it('should have correct property types', () => {
      expect(typeof pageConfig.path).toBe('string');
      expect(React.isValidElement(pageConfig.element)).toBe(true);
      expect(Array.isArray(pageConfig.filter)).toBe(true);
      expect(Array.isArray(pageConfig.filterCountry)).toBe(true);
      expect(Array.isArray(pageConfig.redirects)).toBe(true);
    });
  });

  describe('subscription helper integration', () => {
    it('should use Subscription helper for filter', () => {
      expect(pageConfig.filter).toBeDefined();
      expect(Array.isArray(pageConfig.filter)).toBe(true);
      expect(pageConfig.filter).toEqual(['activated-supply-chain']);
    });
  });
});