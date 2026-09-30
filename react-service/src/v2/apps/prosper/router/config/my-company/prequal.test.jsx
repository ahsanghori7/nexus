import React from 'react';
import { render, screen } from '@testing-library/react';
import prequalConfig from './prequal';

describe('Prequal Router Config', () => {
  describe('config structure', () => {
    it('should have required properties', () => {
      expect(prequalConfig).toHaveProperty('id');
      expect(prequalConfig).toHaveProperty('path');
      expect(prequalConfig).toHaveProperty('element');
      expect(prequalConfig).toHaveProperty('filter');
      expect(prequalConfig).toHaveProperty('filterCountry');
      expect(prequalConfig).toHaveProperty('label');
      expect(prequalConfig).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(prequalConfig.id).toBe(10);
      expect(prequalConfig.path).toBe('prequalification');
    });

    it('should have empty filter arrays', () => {
      expect(prequalConfig.filter).toEqual([]);
      expect(prequalConfig.filterCountry).toEqual([]);
    });

    it('should have empty redirects array', () => {
      expect(prequalConfig.redirects).toEqual([]);
    });

    it('should have correct label', () => {
      expect(prequalConfig.label).toBe('users-table-column-prequalification');
    });
  });

  describe('element rendering', () => {
    it('should render Prosper component with PrequalificationV2', () => {
      render(prequalConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('prequalification-v2-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      render(prequalConfig.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'users-table-column-prequalification');
    });
  });

  describe('configuration validation', () => {
    it('should export config as default', () => {
      expect(prequalConfig).toBeDefined();
      expect(typeof prequalConfig).toBe('object');
    });

    it('should have correct property types', () => {
      expect(typeof prequalConfig.id).toBe('number');
      expect(typeof prequalConfig.path).toBe('string');
      expect(React.isValidElement(prequalConfig.element)).toBe(true);
      expect(Array.isArray(prequalConfig.filter)).toBe(true);
      expect(Array.isArray(prequalConfig.filterCountry)).toBe(true);
      expect(Array.isArray(prequalConfig.redirects)).toBe(true);
      expect(typeof prequalConfig.label).toBe('string');
    });
  });
});