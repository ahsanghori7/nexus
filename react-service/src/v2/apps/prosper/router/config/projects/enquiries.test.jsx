import React from 'react';
import { render, screen } from '@testing-library/react';
import enquiriesConfig from './enquiries';

describe('Enquiries Router Config', () => {
  describe('config structure', () => {
    it('should have required properties', () => {
      expect(enquiriesConfig).toHaveProperty('id');
      expect(enquiriesConfig).toHaveProperty('path');
      expect(enquiriesConfig).toHaveProperty('element');
      expect(enquiriesConfig).toHaveProperty('filter');
      expect(enquiriesConfig).toHaveProperty('filterCountry');
      expect(enquiriesConfig).toHaveProperty('label');
      expect(enquiriesConfig).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(enquiriesConfig.id).toBe(7);
      expect(enquiriesConfig.path).toBe('enquiries');
    });

    it('should have correct label', () => {
      expect(enquiriesConfig.label).toBe('enquiries');
    });

    it('should have empty filter arrays', () => {
      expect(enquiriesConfig.filter).toEqual([]);
      expect(enquiriesConfig.filterCountry).toEqual([]);
    });

    it('should have empty redirects array', () => {
      expect(enquiriesConfig.redirects).toEqual([]);
    });
  });

  describe('element rendering', () => {
    it('should render Prosper component with EnquiriesV2 in ThemeProvider', () => {
      render(enquiriesConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('enquiries-v2-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      render(enquiriesConfig.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'enquiries');
    });
  });

  describe('configuration validation', () => {
    it('should export config as default', () => {
      expect(enquiriesConfig).toBeDefined();
      expect(typeof enquiriesConfig).toBe('object');
    });

    it('should have correct property types', () => {
      expect(typeof enquiriesConfig.id).toBe('number');
      expect(typeof enquiriesConfig.path).toBe('string');
      expect(typeof enquiriesConfig.label).toBe('string');
      expect(React.isValidElement(enquiriesConfig.element)).toBe(true);
      expect(Array.isArray(enquiriesConfig.filter)).toBe(true);
      expect(Array.isArray(enquiriesConfig.filterCountry)).toBe(true);
      expect(Array.isArray(enquiriesConfig.redirects)).toBe(true);
    });
  });

  describe('theme integration', () => {
    it('should wrap component in ThemeProvider', () => {
      // The component should render without errors, indicating theme is working
      expect(() => render(enquiriesConfig.element)).not.toThrow();
    });
  });
});