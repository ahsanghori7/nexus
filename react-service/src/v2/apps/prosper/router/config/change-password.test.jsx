import React from 'react';
import { render, screen } from '@testing-library/react';
import changePasswordConfig from './change-password';

describe('Change Password Router Config', () => {
  describe('config structure', () => {
    it('should have required properties', () => {
      expect(changePasswordConfig).toHaveProperty('id');
      expect(changePasswordConfig).toHaveProperty('path');
      expect(changePasswordConfig).toHaveProperty('element');
      expect(changePasswordConfig).toHaveProperty('filter');
      expect(changePasswordConfig).toHaveProperty('filterCountry');
      expect(changePasswordConfig).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(changePasswordConfig.id).toBe(12);
      expect(changePasswordConfig.path).toBe('change-password');
    });

    it('should have empty filter arrays', () => {
      expect(changePasswordConfig.filter).toEqual([]);
      expect(changePasswordConfig.filterCountry).toEqual([]);
    });

    it('should have empty redirects array', () => {
      expect(changePasswordConfig.redirects).toEqual([]);
    });
  });

  describe('element rendering', () => {
    it('should render Prosper component with ChangePassword', () => {
      render(changePasswordConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('change-password-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      render(changePasswordConfig.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'change-password');
    });
  });

  describe('configuration validation', () => {
    it('should export config as default', () => {
      expect(changePasswordConfig).toBeDefined();
      expect(typeof changePasswordConfig).toBe('object');
    });

    it('should have correct property types', () => {
      expect(typeof changePasswordConfig.id).toBe('number');
      expect(typeof changePasswordConfig.path).toBe('string');
      expect(React.isValidElement(changePasswordConfig.element)).toBe(true);
      expect(Array.isArray(changePasswordConfig.filter)).toBe(true);
      expect(Array.isArray(changePasswordConfig.filterCountry)).toBe(true);
      expect(Array.isArray(changePasswordConfig.redirects)).toBe(true);
    });
  });
});