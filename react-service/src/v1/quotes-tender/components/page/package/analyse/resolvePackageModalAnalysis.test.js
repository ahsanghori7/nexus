import resolvePackageModalAnalysis from './resolvePackageModalAnalysis';

describe('resolvePackageModalAnalysis', () => {
  it('uses modal analysisData when redux holds another package error', () => {
    const tenderSuccess = {
      status: 'SUCCESS',
      package_id: 43788,
      executive_summary: {},
    };

    const result = resolvePackageModalAnalysis({
      packageId: 43788,
      openModal: {
        id: 'analyse-quote-with-ai',
        packageId: 43788,
        analysisData: tenderSuccess,
      },
      analysis: {
        data: null,
        error: 'Rejected',
        currentTender: 43788,
      },
    });

    expect(result.hasData).toBe(true);
    expect(result.analysisError).toBeNull();
    expect(result.analysisData).toEqual(tenderSuccess);
  });

  it('shows error only when modal has no success data for this package', () => {
    const result = resolvePackageModalAnalysis({
      packageId: 42755,
      openModal: { id: 'analyse-quote-with-ai', packageId: 42755 },
      analysis: {
        data: null,
        error: 'Rejected',
        currentTender: 42755,
      },
    });

    expect(result.hasData).toBe(false);
    expect(result.analysisError).toBe('Rejected');
  });
});
