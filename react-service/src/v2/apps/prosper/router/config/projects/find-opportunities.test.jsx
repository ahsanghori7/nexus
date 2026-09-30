import React from 'react';
import { render, screen } from '@testing-library/react';
import findOpportunitiesConfig from './find-opportunities';

describe('Find Opportunities Router Config', () => {
  const mockSubcontractorWithSettings = {
    id: 123,
    regions: { region1: 'value1', region2: 'value2' },
    trades: { trade1: 'value1', trade2: 'value2' }
  };

  const mockSubcontractorNoSettings = {
    id: 456,
    regions: {},
    trades: {}
  };

  const mockSubcontractorNoId = {
    regions: { region1: 'value1' },
    trades: { trade1: 'value1' }
  };

  describe('config function structure', () => {
    it('should be a function', () => {
      expect(typeof findOpportunitiesConfig).toBe('function');
    });

    it('should return object with findOpportunities and opportunityWidget', () => {
      const result = findOpportunitiesConfig(mockSubcontractorWithSettings);
      expect(result).toHaveProperty('findOpportunities');
      expect(result).toHaveProperty('opportunityWidget');
    });
  });

  describe('subcontractor with complete settings', () => {
    let config;

    beforeEach(() => {
      config = findOpportunitiesConfig(mockSubcontractorWithSettings);
    });

    it('should return findOpportunities config', () => {
      const { findOpportunities } = config;
      
      expect(findOpportunities.id).toBe(5);
      expect(findOpportunities.path).toBe('find-opportunities');
      expect(findOpportunities.label).toBe('find-opportunities');
      expect(findOpportunities.filter).toEqual(['activated-supply-chain']);
      expect(findOpportunities.filterCountry).toEqual(['EU']);
      expect(findOpportunities.redirects).toEqual([]);
    });

    it('should render Projects component in findOpportunities element', () => {
      render(config.findOpportunities.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('projects-component')).toBeInTheDocument();
    });

    it('should return opportunityWidget config', () => {
      const { opportunityWidget } = config;
      
      expect(opportunityWidget.id).toBe(18);
      expect(opportunityWidget.path).toBe('opportunity-viewer');
      expect(opportunityWidget.filter).toEqual(['activated-supply-chain']);
      expect(opportunityWidget.filterCountry).toEqual(['EU']);
      expect(opportunityWidget.redirects).toEqual([]);
    });

    it('should render OptViewer component in opportunityWidget element', () => {
      render(config.opportunityWidget.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('opt-viewer-component')).toBeInTheDocument();
    });
  });

  describe('subcontractor with no settings', () => {
    let config;

    beforeEach(() => {
      config = findOpportunitiesConfig(mockSubcontractorNoSettings);
    });

    it('should use opportunityWidget config for findOpportunities when no settings', () => {
      const { findOpportunities } = config;
      
      expect(findOpportunities.id).toBe(5);
      expect(findOpportunities.path).toBe('find-opportunities');
      expect(findOpportunities.label).toBe('find-opportunities');
    });

    it('should render OptViewer component when no settings', () => {
      render(config.findOpportunities.element);
      
      expect(screen.getByTestId('prosper-layout')).toBeInTheDocument();
      expect(screen.getByTestId('opt-viewer-component')).toBeInTheDocument();
    });
  });

  describe('subcontractor without id', () => {
    it('should use default findOpportunities config when no id', () => {
      const config = findOpportunitiesConfig(mockSubcontractorNoId);
      
      render(config.findOpportunities.element);
      expect(screen.getByTestId('projects-component')).toBeInTheDocument();
    });
  });

  describe('configuration validation', () => {
    it('should have correct element types', () => {
      const config = findOpportunitiesConfig(mockSubcontractorWithSettings);
      
      expect(React.isValidElement(config.findOpportunities.element)).toBe(true);
      expect(React.isValidElement(config.opportunityWidget.element)).toBe(true);
    });

    it('should handle subscription helper correctly', () => {
      const config = findOpportunitiesConfig(mockSubcontractorWithSettings);
      
      expect(config.findOpportunities.filter).toEqual(['activated-supply-chain']);
      expect(config.opportunityWidget.filter).toEqual(['activated-supply-chain']);
    });
  });
});