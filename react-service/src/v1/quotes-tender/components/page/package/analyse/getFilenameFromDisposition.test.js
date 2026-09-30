import getFilenameFromDisposition from './getFilenameFromDisposition';

describe('getFilenameFromDisposition', () => {
  it('returns fallback when disposition is null', () => {
    expect(getFilenameFromDisposition(null, 'fallback.xlsx')).toBe('fallback.xlsx');
  });

  it('returns fallback when disposition is undefined', () => {
    expect(getFilenameFromDisposition(undefined, 'fallback.xlsx')).toBe('fallback.xlsx');
  });

  it('returns fallback when disposition has no filename', () => {
    expect(getFilenameFromDisposition('attachment', 'fallback.xlsx')).toBe('fallback.xlsx');
  });

  it('extracts a quoted filename', () => {
    expect(
      getFilenameFromDisposition('attachment; filename="report.xlsx"', 'fallback.xlsx'),
    ).toBe('report.xlsx');
  });

  it('extracts an unquoted filename', () => {
    expect(
      getFilenameFromDisposition('attachment; filename=report.xlsx', 'fallback.xlsx'),
    ).toBe('report.xlsx');
  });

  it('extracts a filename with hyphens and underscores', () => {
    expect(
      getFilenameFromDisposition(
        'attachment; filename="comparison_analysis-AI_Testing_2026-Composite_Windows-20260605"',
        'fallback',
      ),
    ).toBe('comparison_analysis-AI_Testing_2026-Composite_Windows-20260605');
  });

  it('extracts tender levelling export filename from unquoted Content-Disposition', () => {
    expect(
      getFilenameFromDisposition(
        'attachment; filename=tender_levelling-Joffs_Project-3d_Laser_Scanning_Survey-20260625.xlsx',
        'fallback.xlsx',
      ),
    ).toBe('tender_levelling-Joffs_Project-3d_Laser_Scanning_Survey-20260625.xlsx');
  });

  it('prefers filename* when present', () => {
    expect(
      getFilenameFromDisposition(
        "attachment; filename=\"fallback.xlsx\"; filename*=UTF-8''tender_levelling-export.xlsx",
        'fallback.xlsx',
      ),
    ).toBe('tender_levelling-export.xlsx');
  });

  it('ignores trailing parameters after the filename', () => {
    expect(
      getFilenameFromDisposition(
        'attachment; filename="report.xlsx"; other=value',
        'fallback.xlsx',
      ),
    ).toBe('report.xlsx');
  });
});
