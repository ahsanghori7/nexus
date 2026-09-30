import React from 'react';
import { render, screen } from '@testing-library/react';
import howItWorksConfig from './how-it-works';

describe('How It Works Router Config', () => {
  describe('config structure', () => {
    it('should have required properties', () => {
      expect(howItWorksConfig).toHaveProperty('id');
      expect(howItWorksConfig).toHaveProperty('path');
      expect(howItWorksConfig).toHaveProperty('element');
      expect(howItWorksConfig).toHaveProperty('label');
      expect(howItWorksConfig).toHaveProperty('filter');
      expect(howItWorksConfig).toHaveProperty('filterCountry');
      expect(howItWorksConfig).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(howItWorksConfig.id).toBe(15);
      expect(howItWorksConfig.path).toBe('how-it-works');
    });

    it('should have correct label', () => {
      expect(howItWorksConfig.label).toBe('how-it-works');
    });

    it('should have empty filter array and country filter', () => {
      expect(howItWorksConfig.filter).toEqual([]);
      expect(howItWorksConfig.filterCountry).toEqual(['EU', 'NZ', 'AUS']);
    });

    it('should have empty redirects array', () => {
      expect(howItWorksConfig.redirects).toEqual([]);
    });
  });

  describe('element rendering', () => {
    it('should render Prosper component with HowItWorks', () => {
      render(howItWorksConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('how-it-works-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      render(howItWorksConfig.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'how-it-works');
    });
  });

  describe('configuration validation', () => {
    it('should export config as default', () => {
      expect(howItWorksConfig).toBeDefined();
      expect(typeof howItWorksConfig).toBe('object');
    });

    it('should have correct property types', () => {
      expect(typeof howItWorksConfig.id).toBe('number');
      expect(typeof howItWorksConfig.path).toBe('string');
      expect(typeof howItWorksConfig.label).toBe('string');
      expect(React.isValidElement(howItWorksConfig.element)).toBe(true);
      expect(Array.isArray(howItWorksConfig.filter)).toBe(true);
      expect(Array.isArray(howItWorksConfig.filterCountry)).toBe(true);
      expect(Array.isArray(howItWorksConfig.redirects)).toBe(true);
    });
  });
});