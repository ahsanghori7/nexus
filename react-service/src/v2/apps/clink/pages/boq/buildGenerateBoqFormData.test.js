import { buildGenerateBoqFormData, normalizeSelectedSheets } from './buildGenerateBoqFormData';

describe('normalizeSelectedSheets', () => {
  it('dedupes and trims sheet names', () => {
    expect(
      normalizeSelectedSheets([' BoQ Test1 ', 'BoQ Test3', 'BoQ Test3', '', '  ']),
    ).toEqual(['BoQ Test1', 'BoQ Test3']);
  });
});

describe('buildGenerateBoqFormData selected_sheets', () => {
  const file = new File(['abc'], 'boq.xlsx');

  it('sends boq_files as a single file field (not an array)', () => {
    const formData = buildGenerateBoqFormData({
      file,
      packageName: 'Subcontractors testing',
      packageId: 20,
    });

    expect(formData.get('boq_files')).toBe(file);
    expect(formData.has('boq_files[]')).toBe(false);
  });

  it('sends selected_sheets as one JSON array field', () => {
    const formData = buildGenerateBoqFormData({
      file,
      selectedSheets: ['BoQ Test1', 'BoQ Test3', 'BoQ Test3', 'BoQ Test3_2'],
      packageName: 'Subcontractors testing',
      packageId: 20,
    });

    expect(JSON.parse(formData.get('selected_sheets'))).toEqual([
      'BoQ Test1',
      'BoQ Test3',
      'BoQ Test3_2',
    ]);
    expect(formData.has('selected_sheets[]')).toBe(false);
  });

  it('sends selected_sheets as an empty JSON array when no sheets are selected', () => {
    const formData = buildGenerateBoqFormData({
      file,
      selectedSheets: [],
      packageName: 'Subcontractors testing',
      packageId: 20,
    });

    expect(JSON.parse(formData.get('selected_sheets'))).toEqual([]);
  });
});
