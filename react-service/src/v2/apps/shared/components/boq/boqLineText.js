export const BOQ_ROW_MIN_HEIGHT = 40;
/** Matches grid cell lineHeight 1.45 × ~14px font. */
export const BOQ_ROW_LINE_HEIGHT = 21;
/** Total vertical cell padding (py: 0.75 top + bottom in theme spacing). */
export const BOQ_ROW_VERTICAL_PADDING = 12;
export const BOQ_ROW_HEIGHT_BUFFER = 2;

const BOQ_TEXT_FIELDS = ['description', 'tenderee_note', 'item_no'];
/** Only description drives row height; item no and notes align to the row top. */
const BOQ_ROW_HEIGHT_FIELDS = ['description'];

const BOQ_FIELD_CHARS_PER_LINE = {
  tenderee_note: 20,
  item_no: 10,
};

/** Normalize Windows/Mac line endings without removing intentional breaks. */
export function normalizeBoqLineBreaks(value) {
  if (value == null) return '';
  return String(value)
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

export function hasBoqExplicitLineBreaks(value) {
  return normalizeBoqLineBreaks(value).includes('\n');
}

export function countBoqTextLines(value) {
  const text = normalizeBoqLineBreaks(value);
  if (!text) return 1;
  return text.split('\n').length;
}

/** Row height uses explicit `\n` lines only — no word-wrap estimation. */
export function estimateBoqDescriptionVisualLines(value) {
  return countBoqTextLines(value);
}

/** Estimate wrapped visual lines for a single paragraph. */
export function estimateWrappedParagraphLines(text, charsPerLine = 40) {
  const normalized = normalizeBoqLineBreaks(text);
  if (!normalized) return 1;
  const safeChars = Math.max(charsPerLine, 1);
  return normalized.split('\n').reduce((total, paragraph) => {
    if (!paragraph) return total;
    return total + Math.max(1, Math.ceil(paragraph.length / safeChars));
  }, 0);
}

export function estimateBoqTextFieldLines(value, field) {
  if (field === 'description') {
    return estimateBoqDescriptionVisualLines(value);
  }
  const charsPerLine = BOQ_FIELD_CHARS_PER_LINE[field] ?? 40;
  return estimateWrappedParagraphLines(value, charsPerLine);
}

export function normalizeBoqRowTextFields(row) {
  if (!row || typeof row !== 'object') return row;
  const next = { ...row };
  BOQ_TEXT_FIELDS.forEach((field) => {
    if (typeof next[field] === 'string') {
      next[field] = normalizeBoqLineBreaks(next[field]);
    }
  });
  return next;
}

/** Pixel height for one BoQ row from its multiline / wrapped text cells. */
export function estimateBoqRowHeight(
  row,
  {
    minHeight = BOQ_ROW_MIN_HEIGHT,
    lineHeight = BOQ_ROW_LINE_HEIGHT,
    verticalPadding = BOQ_ROW_VERTICAL_PADDING,
    fields = BOQ_ROW_HEIGHT_FIELDS,
  } = {}
) {
  const maxLines = fields.reduce(
    (max, field) => Math.max(max, estimateBoqTextFieldLines(row?.[field], field)),
    1
  );
  return Math.max(
    minHeight,
    maxLines * lineHeight + verticalPadding + BOQ_ROW_HEIGHT_BUFFER
  );
}

/** Single-line cell: truncate with ellipsis; no automatic word wrap. */
export const boqMultilineCellSingleLineSx = {
  display: 'block',
  width: '100%',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: 1.45,
  textIndent: 0,
  padding: 0,
  margin: 0,
};

/** Multi-line cell: break only on explicit `\n`; no word wrap within a line. */
export const boqMultilineCellExplicitBreakSx = {
  display: 'block',
  width: '100%',
  whiteSpace: 'pre',
  overflow: 'hidden',
  lineHeight: 1.45,
  textIndent: 0,
  padding: 0,
  margin: 0,
};

/** @deprecated Use boqMultilineCellSingleLineSx or boqMultilineCellExplicitBreakSx */
export const boqMultilineCellSx = boqMultilineCellExplicitBreakSx;

export function getBoqMultilineCellSx(value) {
  return hasBoqExplicitLineBreaks(value)
    ? boqMultilineCellExplicitBreakSx
    : boqMultilineCellSingleLineSx;
}
