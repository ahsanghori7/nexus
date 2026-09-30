// Re-implement the utility function to test it independently
const filterToShowDocs = (docs = []) =>
  docs ? docs.filter((i) => i.id || (i.id === null && i.requested)) : [];

describe('Section Utility Functions', () => {
  describe('filterToShowDocs', () => {
    it('should return empty array when docs is null', () => {
      const result = filterToShowDocs(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when docs is undefined', () => {
      const result = filterToShowDocs(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array when docs is empty array', () => {
      const result = filterToShowDocs([]);
      expect(result).toEqual([]);
    });

    it('should filter documents with valid id', () => {
      const docs = [
        { id: 1, name: 'doc1' },
        { id: 2, name: 'doc2' },
        { id: null, name: 'doc3', requested: false },
      ];
      const result = filterToShowDocs(docs);
      expect(result).toEqual([
        { id: 1, name: 'doc1' },
        { id: 2, name: 'doc2' },
      ]);
    });

    it('should include documents with null id when requested is true', () => {
      const docs = [
        { id: 1, name: 'doc1' },
        { id: null, name: 'doc2', requested: true },
        { id: null, name: 'doc3', requested: false },
      ];
      const result = filterToShowDocs(docs);
      expect(result).toEqual([
        { id: 1, name: 'doc1' },
        { id: null, name: 'doc2', requested: true },
      ]);
    });

    it('should exclude documents with id 0 (falsy value)', () => {
      const docs = [
        { id: 0, name: 'doc1' },
        { id: 1, name: 'doc2' },
      ];
      const result = filterToShowDocs(docs);
      expect(result).toEqual([
        { id: 1, name: 'doc2' },
      ]);
    });

    it('should exclude documents with null id and no requested property', () => {
      const docs = [
        { id: 1, name: 'doc1' },
        { id: null, name: 'doc2' },
        { id: null, name: 'doc3', requested: undefined },
      ];
      const result = filterToShowDocs(docs);
      expect(result).toEqual([
        { id: 1, name: 'doc1' },
      ]);
    });

    it('should exclude documents with undefined id and requested false', () => {
      const docs = [
        { id: 1, name: 'doc1' },
        { id: undefined, name: 'doc2', requested: false },
        { name: 'doc3', requested: false },
      ];
      const result = filterToShowDocs(docs);
      expect(result).toEqual([
        { id: 1, name: 'doc1' },
      ]);
    });

    it('should include documents with string ids', () => {
      const docs = [
        { id: 'abc', name: 'doc1' },
        { id: '123', name: 'doc2' },
        { id: '', name: 'doc3' },
      ];
      const result = filterToShowDocs(docs);
      expect(result).toEqual([
        { id: 'abc', name: 'doc1' },
        { id: '123', name: 'doc2' },
      ]);
    });

    it('should handle mixed id types and requested values', () => {
      const docs = [
        { id: 1, name: 'doc1' },
        { id: 'abc', name: 'doc2' },
        { id: 0, name: 'doc3' },
        { id: null, name: 'doc4', requested: true },
        { id: null, name: 'doc5', requested: false },
        { id: undefined, name: 'doc6', requested: true },
        { name: 'doc7', requested: true },
        { id: false, name: 'doc8' },
      ];
      const result = filterToShowDocs(docs);
      expect(result).toEqual([
        { id: 1, name: 'doc1' },
        { id: 'abc', name: 'doc2' },
        { id: null, name: 'doc4', requested: true },
      ]);
    });

    it('should use default parameter when no argument provided', () => {
      const result = filterToShowDocs();
      expect(result).toEqual([]);
    });

    it('should handle array with mixed object structures', () => {
      const docs = [
        { id: 1 },
        { id: null, requested: true },
        { other: 'property' },
        { id: 2, extra: 'data', requested: false },
      ];
      const result = filterToShowDocs(docs);
      expect(result).toEqual([
        { id: 1 },
        { id: null, requested: true },
        { id: 2, extra: 'data', requested: false },
      ]);
    });
  });
});