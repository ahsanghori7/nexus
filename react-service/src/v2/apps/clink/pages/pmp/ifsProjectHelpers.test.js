import {
  getIfsBusinessUnitLabel,
  getIfsOptionLabel,
  isIfsLinkedProject,
  accountHasIfsFeature,
} from './ifsProjectHelpers';

describe('ifsProjectHelpers', () => {
  const mockRecord = {
    external_id: 'IFS-PRJ-0042',
    project_code: 'MCL-0042',
    project_name: 'Riverside Depot Refurbishment',
    business_unit_code: '10',
    business_unit_name: 'London',
  };

  it('formats project code, name, and business unit', () => {
    expect(getIfsOptionLabel(mockRecord)).toBe(
      'MCL-0042 - Riverside Depot Refurbishment - 10 - London',
    );
  });

  it('formats business unit label', () => {
    expect(getIfsBusinessUnitLabel(mockRecord)).toBe('10 - London');
  });

  it('returns empty string for missing option', () => {
    expect(getIfsOptionLabel(null)).toBe('');
    expect(getIfsBusinessUnitLabel(undefined)).toBe('');
  });

  it('detects IFS from clinkAccount.features by name', () => {
    expect(accountHasIfsFeature({ features: [{ name: 'IFS' }] })).toBe(true);
    expect(
      accountHasIfsFeature({ features: [{ name: 'ASITE_FOLDERS' }] }),
    ).toBe(false);
    expect(accountHasIfsFeature({ featureFlags: { ifs: true } })).toBe(false);
    expect(accountHasIfsFeature({ features: [] })).toBe(false);
    expect(accountHasIfsFeature(undefined)).toBe(false);
  });

  it('detects a linked IFS project from catalogue fields', () => {
    expect(isIfsLinkedProject({ data: { id: 7 } })).toBe(true);
    expect(isIfsLinkedProject({ data: { external_id: 'IFS-PRJ-0042' } })).toBe(
      true,
    );
    expect(isIfsLinkedProject({ data: [] })).toBe(false);
    expect(isIfsLinkedProject({ data: null })).toBe(false);
    expect(isIfsLinkedProject(undefined)).toBe(false);
  });
});
