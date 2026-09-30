import React from 'react';
import { render, screen } from '@testing-library/react';
import ExecutiveSummaryTable from './table';

// Mock uuid to ensure consistent snapshot with unique IDs
jest.mock('uuid', () => {
  let counter = 0;
  return {
    v4: () => `test-id-${counter++}`,
  };
});

// Reset counter between tests to ensure predictable IDs
beforeEach(() => {
  jest.resetModules();
  // Reset the counter in uuid mock
  const uuidMock = jest.requireMock('uuid').v4;
  if (uuidMock && uuidMock.mockClear) {
    uuidMock.mockClear();
  }
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

// Sample data for testing
const mockData = {
  analysis_results: {
  executive_summary: {
    key_findings: [
      "Finding 1: HKL's base price is approximately 10% higher than DG Glass",
      'Finding 2: Different window systems proposed',
    ],
    price_comparison: [
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
    ],
    programme_comparison: [
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
    ],
    quote_quality_assessment: [
      {
        subcontractor: 'DG Glass Designs',
        quality: 'Medium',
        strengths: [
          'Detailed breakdown of window and door types',
          'Clear identification of PAS24 certification status',
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
    ],
    recommendations: [
      'Request programme information from DG Glass',
      'Clarify with both subcontractors the required door swing direction',
      'Confirm with design team whether Reynaers SL38 or CS 24-SL system is preferred',
    ],
  },
  },
};

describe('ExecutiveSummaryTable rendering', () => {
  test('renders all sections when full data is provided', () => {
    render(<ExecutiveSummaryTable data={mockData} />);

    expect(screen.getByText(/Key Findings/)).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes(mockData.analysis_results.executive_summary.key_findings[0])
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Price Comparison/)).toBeInTheDocument();
    expect(screen.getAllByText('DG Glass Designs').length).toBeGreaterThan(0);
    expect(screen.getByText(/Programme Comparison/)).toBeInTheDocument();
    expect(screen.getByText(/Quote Quality Assessment/)).toBeInTheDocument();
    expect(screen.getByText(/Recommendations/)).toBeInTheDocument();
  });

  test('renders fallback message when data is null', () => {
    render(<ExecutiveSummaryTable data={null} />);
    expect(
      screen.getByText('No executive summary data available')
    ).toBeInTheDocument();
  });

  test('renders headings even when executive summary arrays are empty', () => {
    const emptyData = {
      analysis_results: {
        executive_summary: {
          key_findings: [],
          price_comparison: [],
          programme_comparison: [],
          quote_quality_assessment: [],
          recommendations: [],
        },
      },
    };

    render(<ExecutiveSummaryTable data={emptyData} />);

    expect(screen.getByText(/Key Findings/)).toBeInTheDocument();
    expect(screen.getByText(/Price Comparison/)).toBeInTheDocument();
    expect(screen.getByText(/Programme Comparison/)).toBeInTheDocument();
    expect(screen.getByText(/Quote Quality Assessment/)).toBeInTheDocument();
    expect(screen.getByText(/Recommendations/)).toBeInTheDocument();
  });

  test('renders key findings section when only key findings data is present', () => {
    const keyFindingsOnlyData = {
      analysis_results: {
        executive_summary: {
          key_findings: mockData.analysis_results.executive_summary.key_findings,
          price_comparison: [],
          programme_comparison: [],
          quote_quality_assessment: [],
          recommendations: [],
        },
      },
    };

    render(<ExecutiveSummaryTable data={keyFindingsOnlyData} />);

    expect(screen.getByText(/Key Findings/)).toBeInTheDocument();
    mockData.analysis_results.executive_summary.key_findings.forEach((finding) => {
      expect(
        screen.getByText((content) => content.includes(finding))
      ).toBeInTheDocument();
    });
  });
});
