/**
 * FormData for POST ai/generate-boq/:packageId. `boq_files` is a single file field
 * BoqMiddleware::relayToQsai() reads server-side ($_FILES['boq_files']) — do not
 * rename without a matching PHP change.
 * `selected_sheets` is always a single JSON array field (use `[]` when none apply).
 */
export function normalizeSelectedSheets(selectedSheets = []) {
  const seen = new Set();
  const normalized = [];
  selectedSheets.forEach((name) => {
    if (typeof name !== 'string') {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }
    seen.add(trimmed);
    normalized.push(trimmed);
  });
  return normalized;
}

export function buildGenerateBoqFormData({ file, selectedSheets = [], packageName, packageId }) {
  const formData = new FormData();
  formData.append('boq_files', file);
  formData.append('package_name', packageName || '');
  formData.append('package_id', String(packageId));
  formData.append('processing_type', 'NORMALISATION');
  const sheets = normalizeSelectedSheets(selectedSheets);
  formData.append('selected_sheets', JSON.stringify(sheets));
  return formData;
}
