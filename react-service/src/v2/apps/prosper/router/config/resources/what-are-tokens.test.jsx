import React from 'react';
import { render, screen } from '@testing-library/react';
import whatAreTokensConfig from './what-are-tokens';

describe('What Are Tokens Router Config', () => {
  describe('config structure', () => {
    it('should have required properties', () => {
      expect(whatAreTokensConfig).toHaveProperty('id');
      expect(whatAreTokensConfig).toHaveProperty('path');
      expect(whatAreTokensConfig).toHaveProperty('element');
      expect(whatAreTokensConfig).toHaveProperty('label');
      expect(whatAreTokensConfig).toHaveProperty('filter');
      expect(whatAreTokensConfig).toHaveProperty('filterCountry');
      expect(whatAreTokensConfig).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(whatAreTokensConfig.id).toBe(16);
      expect(whatAreTokensConfig.path).toBe('tokens');
    });

    it('should have correct label', () => {
      expect(whatAreTokensConfig.label).toBe('what-are-tokens');
    });

    it('should have filter property', () => {
      // The filter comes from subscription helper, we just check it exists
      expect(whatAreTokensConfig).toHaveProperty('filter');
      expect(whatAreTokensConfig.filterCountry).toEqual(['EU', 'NZ', 'AUS']);
    });

    it('should have empty redirects array', () => {
      expect(whatAreTokensConfig.redirects).toEqual([]);
    });
  });

  describe('element rendering', () => {
    it('should render Prosper component with WhatAreTokens', () => {
      render(whatAreTokensConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('what-are-tokens-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      render(whatAreTokensConfig.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'tokens');
    });
  });

  describe('configuration validation', () => {
    it('should export config as default', () => {
      expect(whatAreTokensConfig).toBeDefined();
      expect(typeof whatAreTokensConfig).toBe('object');
    });

    it('should have correct property types', () => {
      expect(typeof whatAreTokensConfig.id).toBe('number');
      expect(typeof whatAreTokensConfig.path).toBe('string');
      expect(typeof whatAreTokensConfig.label).toBe('string');
      expect(React.isValidElement(whatAreTokensConfig.element)).toBe(true);
      expect(Array.isArray(whatAreTokensConfig.filterCountry)).toBe(true);
      expect(Array.isArray(whatAreTokensConfig.redirects)).toBe(true);
    });
  });

  describe('subscription helper integration', () => {
    it('should have filter property from Subscription helper', () => {
      expect(whatAreTokensConfig).toHaveProperty('filter');
      // Filter can be any value returned by getNonTokenUsers()
    });
  });
});