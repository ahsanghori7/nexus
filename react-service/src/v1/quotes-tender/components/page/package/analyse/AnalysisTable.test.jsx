import React from 'react';
import { render, screen } from '@testing-library/react';
import ExecutiveSummaryTable from './table';

// Mock uuid with counter to ensure unique keys
jest.mock('uuid', () => {
  let counter = 0;
  return {
    v4: () => `test-id-${counter++}`,
  };
});

// Reset counter between tests to ensure predictable IDs
beforeEach(() => {
  jest.resetModules();
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkLightPurple: '#e0e0ff',
        clinkGreen: '#4caf50',
      },
    },
  },
}));

const createMockData = (options = {}) => {
  const defaultData = {
    analysis_results: {
    executive_summary: {
      key_findings:
        options.includeKeyFindings !== false
          ? [
              'Finding 1: Test finding description',
              'Finding 2: Another test finding',
            ]
          : [],
      price_comparison:
        options.includePriceComparison !== false
          ? [
              {
                subcontractor: 'DG Glass Designs',
                total_price: '£169,267.20',
                vat_included: 'Yes',
              },
              {
                subcontractor: 'HKL Specialists',
                total_price: '£192,179.76',
                vat_included: 'No',
              },
            ]
          : [],
      programme_comparison:
        options.includeProgrammeComparison !== false
          ? [
              {
                subcontractor: 'DG Glass Designs',
                lead_in_period: 'Not Specified',
                total_weeks: 'Not Specified',
                constraints: 'Delivery lead time begins after deposit',
              },
              {
                subcontractor: 'HKL Specialists',
                lead_in_period: '6-8 weeks',
                total_weeks: '6',
                constraints: 'Requires continuous and uninterrupted visit',
              },
            ]
          : [],
      quote_quality_assessment:
        options.includeQualityAssessment !== false
          ? [
              {
                subcontractor: 'DG Glass Designs',
                quality: 'Medium',
                strengths: [
                  'Detailed breakdown of window and door types',
                  'Specific technical specifications',
                ],
                weaknesses: [
                  'No programme information or lead times specified',
                  'Limited information on commercial terms',
                ],
              },
              {
                subcontractor: 'HKL Specialists',
                quality: 'High',
                strengths: [
                  'Comprehensive breakdown with separate design costs',
                  'Clear programme information',
                ],
                weaknesses: [
                  'Significant Extra Overs creating cost uncertainty',
                  'No specific mention of acoustic performance',
                ],
              },
            ]
          : [],
      recommendations:
        options.includeRecommendations !== false
          ? [
              'Request programme information from DG Glass',
              'Clarify with both subcontractors the required door swing direction',
              'Confirm with design team whether Reynaers SL38 or CS 24-SL system is preferred',
            ]
          : [],
    },
    },
  };

  // Return or modify data based on options
  return options.emptyData
    ? {
        analysis_results: {
          executive_summary: {
            key_findings: [],
            price_comparison: [],
            programme_comparison: [],
            quote_quality_assessment: [],
            recommendations: [],
          },
        },
      }
    : defaultData;
};

describe('ExecutiveSummaryTable Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    test('renders without crashing with complete data', () => {
      render(<ExecutiveSummaryTable data={createMockData()} />);
      // Check for accordions
      expect(screen.getAllByTestId('mui-accordion')).toHaveLength(5); // 5 accordion sections
    });

    test('renders with null data', () => {
      render(<ExecutiveSummaryTable data={null} />);
      // Should show "No executive summary data available" message
      expect(screen.getByTestId('mui-typography')).toBeInTheDocument();
    });

    test('renders with empty data', () => {
      render(
        <ExecutiveSummaryTable data={createMockData({ emptyData: true })} />,
      );

      // Should still have 5 accordions (one for each section)
      expect(screen.getAllByTestId('mui-accordion')).toHaveLength(5);
    });
  });

  // Test different data variations
  describe('Data Variations', () => {
    test('renders with only key findings data', () => {
      const dataWithOnlyKeyFindings = createMockData({
        includePriceComparison: false,
        includeProgrammeComparison: false,
        includeQualityAssessment: false,
        includeRecommendations: false,
      });

      render(<ExecutiveSummaryTable data={dataWithOnlyKeyFindings} />);

      // Should still have 5 accordions
      expect(screen.getAllByTestId('mui-accordion')).toHaveLength(5);
    });

    test('renders with missing executive_summary section', () => {
      // Create data without executive_summary
      const partialData = {};

      render(<ExecutiveSummaryTable data={partialData} />);

      // Should show no data available message
      expect(screen.getByTestId('mui-typography')).toBeInTheDocument();
    });
  });

  // Test content sections
  describe('Content Sections', () => {
    test('renders all expected sections', () => {
      render(<ExecutiveSummaryTable data={createMockData()} />);

      // 5 accordions for the 5 sections
      const accordions = screen.getAllByTestId('mui-accordion');
      expect(accordions).toHaveLength(5);

      // All sections should have accordion summary and details
      expect(screen.getAllByTestId('mui-accordion-summary')).toHaveLength(5);
      expect(screen.getAllByTestId('mui-accordion-details')).toHaveLength(5);
    });
  });

  // Test edge cases
  describe('Edge Cases', () => {
    test('handles data with missing properties', () => {
      const incompleteData = {
        analysis_results: {
          executive_summary: {
            key_findings: ['Test finding'],
            quote_quality_assessment: [
              {
                subcontractor: 'Test Contractor',
                quality: 'Medium',
                weaknesses: ['Test weakness'],
              },
            ],
          },
        },
      };

      // Component should render without crashing
      render(<ExecutiveSummaryTable data={incompleteData} />);
      expect(screen.getAllByTestId('mui-accordion')).toHaveLength(5);
    });
  });
});
