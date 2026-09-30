import React from 'react';
import { render, screen } from '@testing-library/react';
import successStoriesConfig from './success-stories';

describe('Success Stories Router Config', () => {
  describe('config structure', () => {
    it('should have required properties', () => {
      expect(successStoriesConfig).toHaveProperty('id');
      expect(successStoriesConfig).toHaveProperty('path');
      expect(successStoriesConfig).toHaveProperty('element');
      expect(successStoriesConfig).toHaveProperty('label');
      expect(successStoriesConfig).toHaveProperty('filter');
      expect(successStoriesConfig).toHaveProperty('filterCountry');
      expect(successStoriesConfig).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(successStoriesConfig.id).toBe(17);
      expect(successStoriesConfig.path).toBe('success-stories');
    });

    it('should have correct label', () => {
      expect(successStoriesConfig.label).toBe('success-stories');
    });

    it('should have empty filter array and country filter', () => {
      expect(successStoriesConfig.filter).toEqual([]);
      expect(successStoriesConfig.filterCountry).toEqual(['EU', 'NZ', 'AUS']);
    });

    it('should have empty redirects array', () => {
      expect(successStoriesConfig.redirects).toEqual([]);
    });
  });

  describe('element rendering', () => {
    it('should render Prosper component with SuccessStories', () => {
      render(successStoriesConfig.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('success-stories-component')).toBeInTheDocument();
    });

    it('should render with correct title', () => {
      render(successStoriesConfig.element);
      
      const prosperLayout = screen.getByTestId('prosper-layout');
      expect(prosperLayout).toHaveAttribute('data-title', 'success-stories');
    });
  });

  describe('configuration validation', () => {
    it('should export config as default', () => {
      expect(successStoriesConfig).toBeDefined();
      expect(typeof successStoriesConfig).toBe('object');
    });

    it('should have correct property types', () => {
      expect(typeof successStoriesConfig.id).toBe('number');
      expect(typeof successStoriesConfig.path).toBe('string');
      expect(typeof successStoriesConfig.label).toBe('string');
      expect(React.isValidElement(successStoriesConfig.element)).toBe(true);
      expect(Array.isArray(successStoriesConfig.filter)).toBe(true);
      expect(Array.isArray(successStoriesConfig.filterCountry)).toBe(true);
      expect(Array.isArray(successStoriesConfig.redirects)).toBe(true);
    });
  });
});