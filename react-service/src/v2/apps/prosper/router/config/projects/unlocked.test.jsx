import React from 'react';
import { render, screen } from '@testing-library/react';
import unlockedConfig from './unlocked';

describe('Unlocked Router Config', () => {
  const mockTokenSubscriber = {
    subscription_id: 'token-user'
  };

  const mockNonTokenSubscriber = {
    subscription_id: 'non-token-user'
  };

  describe('config function structure', () => {
    it('should be a function', () => {
      expect(typeof unlockedConfig).toBe('function');
    });

    it('should return config object when called', () => {
      const config = unlockedConfig(mockTokenSubscriber);
      expect(typeof config).toBe('object');
    });
  });

  describe('config with token user', () => {
    let config;

    beforeEach(() => {
      config = unlockedConfig(mockTokenSubscriber);
    });

    it('should have correct configuration for token user', () => {
      expect(config.id).toBe(6);
      expect(config.path).toBe('unlocked-projects');
      expect(config.label).toBe('unlocked-projects');
      expect(config.filter).toEqual(['activated-supply-chain']);
      expect(config.filterCountry).toEqual(['EU']);
      expect(config.redirects).toEqual([]);
    });

    it('should render RegisteredInterests with unlocked_projects method', () => {
      render(config.element);
      
      const component = screen.getByTestId('registered-interests-component');
      expect(component).toBeInTheDocument();
      expect(component).toHaveAttribute('data-resource', 'interests');
      expect(component).toHaveAttribute('data-method', 'unlocked_projects');
      expect(component).toHaveAttribute('data-version', 'v2');
    });

    it('should render with unlocked-projects title', () => {
      render(config.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'unlocked-projects');
    });
  });

  describe('config with non-token user', () => {
    let config;

    beforeEach(() => {
      config = unlockedConfig(mockNonTokenSubscriber);
    });

    it('should have correct configuration for non-token user', () => {
      expect(config.id).toBe(6);
      expect(config.path).toBe('registered-interests');
      expect(config.label).toBe('registered-interests');
      expect(config.filter).toEqual(['activated-supply-chain']);
      expect(config.filterCountry).toEqual(['EU']);
      expect(config.redirects).toEqual([]);
    });

    it('should render RegisteredInterests with latest method', () => {
      render(config.element);
      
      const component = screen.getByTestId('registered-interests-component');
      expect(component).toBeInTheDocument();
      expect(component).toHaveAttribute('data-resource', 'interests');
      expect(component).toHaveAttribute('data-method', 'latest');
      expect(component).toHaveAttribute('data-version', 'v1');
    });

    it('should render with registered-interests title', () => {
      render(config.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'registered-interests');
    });
  });

  describe('configuration validation', () => {
    it('should have correct property types for token user', () => {
      const config = unlockedConfig(mockTokenSubscriber);
      
      expect(typeof config.id).toBe('number');
      expect(typeof config.path).toBe('string');
      expect(typeof config.label).toBe('string');
      expect(React.isValidElement(config.element)).toBe(true);
      expect(Array.isArray(config.filter)).toBe(true);
      expect(Array.isArray(config.filterCountry)).toBe(true);
      expect(Array.isArray(config.redirects)).toBe(true);
    });

    it('should handle subscription dependency correctly', () => {
      const tokenConfig = unlockedConfig(mockTokenSubscriber);
      const nonTokenConfig = unlockedConfig(mockNonTokenSubscriber);

      expect(tokenConfig.path).toBe('unlocked-projects');
      expect(nonTokenConfig.path).toBe('registered-interests');
    });
  });
});