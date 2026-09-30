import entries, { PRELIMS, MEASURED_WORK, OTHER } from './initialEntries';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('InitialEntries', () => {
  describe('Constants', () => {
    it('exports PRELIMS constant correctly', () => {
      expect(PRELIMS).toBe('Prelims');
    });

    it('exports MEASURED_WORK constant correctly', () => {
      expect(MEASURED_WORK).toBe('Measured work');
    });

    it('exports OTHER constant correctly', () => {
      expect(OTHER).toBe('Other items');
    });
  });

  describe('Entries array', () => {
    it('exports an array of entries', () => {
      expect(Array.isArray(entries)).toBe(true);
      expect(entries).toHaveLength(6);
    });

    it('contains entries with correct structure', () => {
      entries.forEach((entry) => {
        expect(entry).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            item_no: expect.any(String),
            description: expect.any(String),
            type: expect.stringMatching(/^(Section|Item)$/),
            unit_id: undefined,
            quantity: expect.any(Number),
            tenderee_note: expect.any(String),
            budget_rate: expect.any(Number),
            budget_total: expect.any(Number),
            item_version: expect.objectContaining({
              boq_item_mapping_id: undefined,
              id: undefined,
              status: 2,
              version: 1,
            }),
            position: expect.any(Number),
          })
        );
      });
    });

    it('contains entries with correct positions', () => {
      entries.forEach((entry, index) => {
        expect(entry.position).toBe(index + 1);
      });
    });

    it('contains section entries with correct descriptions', () => {
      const sections = entries.filter((entry) => entry.type === 'Section');
      expect(sections).toHaveLength(3);
      
      expect(sections[0].description).toBe(PRELIMS);
      expect(sections[1].description).toBe(MEASURED_WORK);
      expect(sections[2].description).toBe(OTHER);
    });

    it('contains item entries with empty descriptions', () => {
      const items = entries.filter((entry) => entry.type === 'Item');
      expect(items).toHaveLength(3);
      
      items.forEach((item) => {
        expect(item.description).toBe('');
      });
    });

    it('alternates between Section and Item types', () => {
      const expectedPattern = ['Section', 'Item', 'Section', 'Item', 'Section', 'Item'];
      
      entries.forEach((entry, index) => {
        expect(entry.type).toBe(expectedPattern[index]);
      });
    });

    it('has correct default values for all entries', () => {
      entries.forEach((entry) => {
        expect(entry.item_no).toBe('');
        expect(entry.unit_id).toBeUndefined();
        expect(entry.quantity).toBe(0);
        expect(entry.tenderee_note).toBe('');
        expect(entry.budget_rate).toBe(0);
        expect(entry.budget_total).toBe(0);
      });
    });

    it('has correct item_version structure for all entries', () => {
      entries.forEach((entry) => {
        expect(entry.item_version).toEqual({
          boq_item_mapping_id: undefined,
          id: undefined,
          status: 2,
          version: 1,
        });
      });
    });
  });
});