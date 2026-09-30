import {
  normalizeBoqLineBreaks,
  normalizeBoqRowTextFields,
  countBoqTextLines,
  estimateWrappedParagraphLines,
  estimateBoqDescriptionVisualLines,
  estimateBoqTextFieldLines,
  estimateBoqRowHeight,
  BOQ_ROW_MIN_HEIGHT,
} from './boqLineText';

describe('normalizeBoqLineBreaks', () => {
  it('normalizes line endings without removing breaks', () => {
    expect(normalizeBoqLineBreaks('Grid lines\nS/O from grid lines')).toBe(
      'Grid lines\nS/O from grid lines'
    );
    expect(normalizeBoqLineBreaks('Hand loading\r\nBackground lighting')).toBe(
      'Hand loading\nBackground lighting'
    );
  });

  it('returns empty string for nullish values', () => {
    expect(normalizeBoqLineBreaks(null)).toBe('');
    expect(normalizeBoqLineBreaks(undefined)).toBe('');
  });

  it('removes leading whitespace from continuation lines', () => {
    expect(
      normalizeBoqLineBreaks('Setting Out\n Grid lines and datum\n  S/O from grid lines')
    ).toBe('Setting Out\nGrid lines and datum\nS/O from grid lines');
  });

  it('removes blank lines from AI-generated text', () => {
    expect(normalizeBoqLineBreaks('Setting Out\n\nGrid lines')).toBe(
      'Setting Out\nGrid lines'
    );
  });
});

describe('countBoqTextLines', () => {
  it('counts newline-separated lines', () => {
    expect(countBoqTextLines('one\ntwo')).toBe(2);
    expect(countBoqTextLines('single')).toBe(1);
  });
});

describe('estimateWrappedParagraphLines', () => {
  it('counts wrapped lines from long text', () => {
    const longText = 'Main Contractor; Main Contractor; Stancold; Stancold';
    expect(estimateWrappedParagraphLines(longText, 20)).toBeGreaterThan(1);
  });

  it('counts explicit newlines plus wrapping', () => {
    expect(
      estimateWrappedParagraphLines('Barriers and labour\nexclusion zones', 52)
    ).toBe(2);
  });
});

describe('estimateBoqDescriptionVisualLines', () => {
  const mineralFibreDesc =
    'Ground floor to first floor (vertical) - Supply and install 150mm Mineral Fibre Cored Panel system complete with flashings, trims and fixings in accordance with the manufacturers recommended instructions. Finish - Unprofiled, White RAL9010 Polyester 25 Micron thick paint to exposed faces, primer to unexposed faces. Installation Orientation - vertical / horizontal. Installation Fire Rating - 60 Mins. Panel U-Value - 0.25 W/m²K';

  it('counts only explicit newlines, not word wrap', () => {
    expect(estimateBoqDescriptionVisualLines(mineralFibreDesc)).toBe(1);
    expect(estimateBoqRowHeight({ description: mineralFibreDesc })).toBe(
      BOQ_ROW_MIN_HEIGHT
    );
  });

  it('counts explicit newline-separated lines', () => {
    const hsDesc =
      'H&S documentation, risk assement, method statement & COSHH\nassessment';
    expect(estimateBoqDescriptionVisualLines(hsDesc)).toBe(2);
    expect(estimateBoqRowHeight({ description: hsDesc })).toBe(56);
  });

  it('still grows for many explicit note lines', () => {
    expect(
      estimateBoqDescriptionVisualLines(
        'Setting Out\nGrid lines\nS/O from grid lines\nSite survey'
      )
    ).toBe(4);
  });
});

describe('normalizeBoqRowTextFields', () => {
  it('normalizes description, tenderee_note, and item_no', () => {
    expect(
      normalizeBoqRowTextFields({
        description: 'A\r\nB',
        tenderee_note: 'note\nline',
        item_no: '1',
        quantity: 1,
      })
    ).toEqual({
      description: 'A\nB',
      tenderee_note: 'note\nline',
      item_no: '1',
      quantity: 1,
    });
  });
});

describe('estimateBoqRowHeight', () => {
  it('grows with multiline description text', () => {
    expect(
      estimateBoqRowHeight({
        description: 'line one\nline two\nline three',
      })
    ).toBeGreaterThan(BOQ_ROW_MIN_HEIGHT);
  });

  it('does not grow from wrapped notes when description is short', () => {
    expect(
      estimateBoqRowHeight({
        description: 'short',
        tenderee_note: 'Main Contractor; Main Contractor; Stancold; Stancold',
      })
    ).toBe(BOQ_ROW_MIN_HEIGHT);
  });

  it('returns min height for single-line rows', () => {
    expect(
      estimateBoqRowHeight({
        description: 'single line',
      })
    ).toBe(BOQ_ROW_MIN_HEIGHT);
  });

  it('sizes rows from description, not wrapped notes', () => {
    const fromDescription = estimateBoqRowHeight({
      description: 'one\ntwo\nthree\nfour',
      tenderee_note: 'short',
    });
    const fromNotesOnly = estimateBoqRowHeight({
      description: 'short',
      tenderee_note: 'Main Contractor; Main Contractor; Stancold; Stancold',
    });
    expect(fromDescription).toBeGreaterThan(fromNotesOnly);
    expect(fromNotesOnly).toBe(BOQ_ROW_MIN_HEIGHT);
  });

  it('does not count blank lines toward row height', () => {
    const compact = estimateBoqRowHeight({
      description: 'Setting Out\nGrid lines\nS/O from grid lines',
    });
    const withBlankLines = estimateBoqRowHeight({
      description: 'Setting Out\n\nGrid lines\n\nS/O from grid lines',
    });
    expect(withBlankLines).toBe(compact);
  });
});
