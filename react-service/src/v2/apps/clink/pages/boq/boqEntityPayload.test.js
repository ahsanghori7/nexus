import {
  buildBoqEntityUpdatePayload,
  buildNewBoqUpdatePayload,
  resolveUnitId,
  mapAiApiEntryToBoqDraftRow,
  mapAiResultEntriesToBoqDraftRows,
  mapAiNoteToDraft,
  resolveBoqEditingAfterListFetch,
  shouldShowBoqEditButton,
} from './boqEntityPayload';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

const DELETE = 4;

describe('boqEntityPayload', () => {
  const note = { id: 1, text: 'hello' };

  describe('buildBoqEntityUpdatePayload (Save)', () => {
    it('renumbers positions and coerces numbers for non-deleted rows', () => {
      const rows = [
        {
          id: 1,
          item_version: { status: 2, version: 1, id: 10 },
          budget_rate: '10',
          budget_total: 20,
          quantity: '2',
        },
        {
          id: 2,
          item_version: { status: 2, version: 1, id: 11 },
          budget_rate: 0,
          budget_total: 0,
          quantity: 1,
        },
      ];
      const out = buildBoqEntityUpdatePayload(note, rows, DELETE);
      expect(out.notes).toEqual({ id: 1, text: 'hello' });
      expect(out.entries[0].position).toBe(1);
      expect(out.entries[1].position).toBe(2);
      expect(out.entries[0].budget_rate).toBe(10);
      expect(out.entries[0].quantity).toBe(2);
    });

    it('passes through rows already marked deleted without position renumber', () => {
      const rows = [
        {
          id: 1,
          position: 3,
          item_version: { status: DELETE, version: 1, id: 10 },
        },
      ];
      const out = buildBoqEntityUpdatePayload(note, rows, DELETE);
      expect(out.entries[0].position).toBeUndefined();
    });
  });

  describe('buildNewBoqUpdatePayload (New BoQ)', () => {
    it('marks all rows deleted and drops position', () => {
      const rows = [
        {
          id: 1,
          position: 1,
          budget_rate: 5,
          budget_total: 10,
          quantity: 2,
          item_version: { status: 2, version: 1, id: 99 },
        },
      ];
      const out = buildNewBoqUpdatePayload(note, rows, DELETE);
      expect(out.is_new).toBe(true);
      expect(out.notes).toEqual({ id: 1, text: 'hello' });
      expect(out.entries[0].position).toBeUndefined();
      expect(out.entries[0].item_version.status).toBe(DELETE);
      expect(out.entries[0].item_version.id).toBe(99);
    });

    it('uses default item_version when missing before applying delete', () => {
      const rows = [
        {
          id: 'c',
          budget_rate: 0,
          budget_total: 0,
          quantity: 0,
        },
      ];
      const out = buildNewBoqUpdatePayload(note, rows, DELETE);
      expect(out.entries[0].item_version.status).toBe(DELETE);
      expect(out.entries[0].item_version.version).toBe(1);
    });
  });

  describe('resolveUnitId', () => {
    it('returns existingUnitId when provided', () => {
      expect(resolveUnitId('m', [{ symbol: 'm', value: 2 }], 99)).toBe(99);
    });

    it('returns undefined when unitSymbol is missing or units list empty', () => {
      expect(resolveUnitId('', [{ symbol: 'm', value: 2 }])).toBeUndefined();
      expect(resolveUnitId('m', [])).toBeUndefined();
      expect(resolveUnitId('m', null)).toBeUndefined();
    });

    it('matches unit symbol case-insensitively and returns value', () => {
      expect(resolveUnitId('WK', [{ symbol: 'wk', value: 7 }])).toBe(7);
    });
  });

  describe('AI mapping helpers', () => {
    it('maps a single AI entry into a draft row with defaults', () => {
      const row = mapAiApiEntryToBoqDraftRow(
        {
          type: 'Section',
          description: 'prelims',
          quantity: '2',
          budget_rate: '10',
          budget_total: '20',
          unit: 'wk',
          position: 5,
          // AI may include item_version/id but we should not carry it forward
          id: 123,
          item_version: { id: 999, status: 1, version: 9 },
        },
        { units: [{ symbol: 'wk', value: 44 }], index: 0 }
      );

      expect(row).toMatchObject({
        id: 'mock-uuid',
        type: 'section',
        description: 'prelims',
        quantity: 2,
        budget_rate: 10,
        budget_total: 20,
        unit_id: 44,
        position: 5,
        item_version: { id: undefined, boq_item_mapping_id: undefined, status: 2, version: 1 },
      });
    });

    it('normalizes newline characters in AI text fields', () => {
      const row = mapAiApiEntryToBoqDraftRow(
        {
          type: 'item',
          description: 'Grid lines\r\nS/O from grid lines',
          tenderee_note: 'note\nline',
          item_no: 'E',
        },
        { units: [], index: 0 }
      );

      expect(row.description).toBe('Grid lines\nS/O from grid lines');
      expect(row.tenderee_note).toBe('note\nline');
      expect(row.item_no).toBe('E');
    });

    it('maps result entries array and assigns fallback position when missing', () => {
      const rows = mapAiResultEntriesToBoqDraftRows(
        [
          { type: 'item', description: 'A' },
          { type: 'item', description: 'B', position: 10 },
        ],
        { units: [] }
      );
      expect(rows).toHaveLength(2);
      expect(rows[0].position).toBe(1);
      expect(rows[1].position).toBe(10);
    });

    it('maps AI notes to draft shape', () => {
      expect(mapAiNoteToDraft({ id: 5, text: 'x' })).toEqual({ id: 5, text: 'x' });
      expect(mapAiNoteToDraft({ id: 5, text: 'line one\nline two' })).toEqual({
        id: 5,
        text: 'line one\nline two',
      });
      expect(mapAiNoteToDraft(null)).toEqual({ id: null, text: '' });
    });
  });

  describe('editing / Edit button after list fetch', () => {
    const projectStatuses = { published: { id: 99 } };
    const draftRow = {
      type: 'item',
      item_version: { status: 2, version: 1 },
    };
    const publishedRow = {
      type: 'item',
      item_version: { status: 99, version: 1 },
    };

    it('keeps editing true for published package with draft-only rows (upload/scratch)', () => {
      expect(
        resolveBoqEditingAfterListFetch(
          { has_published_version: true },
          [draftRow],
          projectStatuses
        )
      ).toBe(true);
    });

    it('sets editing false for published package with published rows', () => {
      expect(
        resolveBoqEditingAfterListFetch(
          { has_published_version: true },
          [publishedRow],
          projectStatuses
        )
      ).toBe(false);
    });

    it('stays read-only when published rows exist but project statuses are not loaded yet', () => {
      expect(
        resolveBoqEditingAfterListFetch(
          { has_published_version: true },
          [publishedRow],
          null
        )
      ).toBe(false);
      expect(
        resolveBoqEditingAfterListFetch(
          { has_published_version: true },
          [draftRow],
          {}
        )
      ).toBe(false);
    });

    it('hides Edit for draft-only rows on a published package', () => {
      expect(
        shouldShowBoqEditButton({
          editing: false,
          isSmartBoqFailedResult: false,
          hasPublishedVersion: true,
          entries: [draftRow],
          projectStatuses,
        })
      ).toBe(false);
    });

    it('shows Edit for published read-only BoQ', () => {
      expect(
        shouldShowBoqEditButton({
          editing: false,
          isSmartBoqFailedResult: false,
          hasPublishedVersion: true,
          entries: [publishedRow],
          projectStatuses,
        })
      ).toBe(true);
    });
  });
});
