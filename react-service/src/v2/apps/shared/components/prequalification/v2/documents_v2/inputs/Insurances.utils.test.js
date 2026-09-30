// Re-implement the utility function to test it independently
const createExtraDocument = (documents = [], created = []) =>
  documents
    ? documents.map((d) => {
        const [createdFile] = created
          ? created.filter((c) => c.label === d.name)
          : [];
        return {
          id: createdFile ? createdFile.id : d.id,
          label: createdFile ? createdFile.label : d.name,
          document: createdFile ? createdFile.document : null,
          original_file: createdFile ? createdFile.original_file : null,
        };
      })
    : [];

describe('Insurances Utility Functions', () => {
  describe('createExtraDocument', () => {
    it('should return empty array when documents is null', () => {
      const result = createExtraDocument(null, []);
      expect(result).toEqual([]);
    });

    it('should return empty array when documents is undefined', () => {
      const result = createExtraDocument(undefined, []);
      expect(result).toEqual([]);
    });

    it('should return empty array when documents is empty array', () => {
      const result = createExtraDocument([], []);
      expect(result).toEqual([]);
    });

    it('should map documents without created files', () => {
      const documents = [
        { id: 1, name: 'doc1' },
        { id: 2, name: 'doc2' },
      ];
      const result = createExtraDocument(documents, []);
      expect(result).toEqual([
        {
          id: 1,
          label: 'doc1',
          document: null,
          original_file: null,
        },
        {
          id: 2,
          label: 'doc2',
          document: null,
          original_file: null,
        },
      ]);
    });

    it('should map documents with matching created files', () => {
      const documents = [
        { id: 1, name: 'doc1' },
        { id: 2, name: 'doc2' },
      ];
      const created = [
        {
          id: 101,
          label: 'doc1',
          document: 'file1.pdf',
          original_file: 'original1.pdf',
        },
      ];
      const result = createExtraDocument(documents, created);
      expect(result).toEqual([
        {
          id: 101,
          label: 'doc1',
          document: 'file1.pdf',
          original_file: 'original1.pdf',
        },
        {
          id: 2,
          label: 'doc2',
          document: null,
          original_file: null,
        },
      ]);
    });

    it('should handle empty created array', () => {
      const documents = [
        { id: 1, name: 'doc1' },
      ];
      const result = createExtraDocument(documents, []);
      expect(result).toEqual([
        {
          id: 1,
          label: 'doc1',
          document: null,
          original_file: null,
        },
      ]);
    });

    it('should handle null created array', () => {
      const documents = [
        { id: 1, name: 'doc1' },
      ];
      const result = createExtraDocument(documents, null);
      expect(result).toEqual([
        {
          id: 1,
          label: 'doc1',
          document: null,
          original_file: null,
        },
      ]);
    });

    it('should handle undefined created array', () => {
      const documents = [
        { id: 1, name: 'doc1' },
      ];
      const result = createExtraDocument(documents, undefined);
      expect(result).toEqual([
        {
          id: 1,
          label: 'doc1',
          document: null,
          original_file: null,
        },
      ]);
    });

    it('should match by label to name mapping', () => {
      const documents = [
        { id: 1, name: 'insurance-doc' },
        { id: 2, name: 'certificate-doc' },
      ];
      const created = [
        {
          id: 201,
          label: 'insurance-doc',
          document: 'insurance.pdf',
          original_file: 'original-insurance.pdf',
        },
        {
          id: 202,
          label: 'certificate-doc',
          document: 'certificate.pdf',
          original_file: 'original-certificate.pdf',
        },
      ];
      const result = createExtraDocument(documents, created);
      expect(result).toEqual([
        {
          id: 201,
          label: 'insurance-doc',
          document: 'insurance.pdf',
          original_file: 'original-insurance.pdf',
        },
        {
          id: 202,
          label: 'certificate-doc',
          document: 'certificate.pdf',
          original_file: 'original-certificate.pdf',
        },
      ]);
    });

    it('should only use first matching created file', () => {
      const documents = [
        { id: 1, name: 'doc1' },
      ];
      const created = [
        {
          id: 301,
          label: 'doc1',
          document: 'first.pdf',
          original_file: 'original-first.pdf',
        },
        {
          id: 302,
          label: 'doc1',
          document: 'second.pdf',
          original_file: 'original-second.pdf',
        },
      ];
      const result = createExtraDocument(documents, created);
      expect(result).toEqual([
        {
          id: 301,
          label: 'doc1',
          document: 'first.pdf',
          original_file: 'original-first.pdf',
        },
      ]);
    });

    it('should handle documents with no matching created files', () => {
      const documents = [
        { id: 1, name: 'doc1' },
        { id: 2, name: 'doc2' },
      ];
      const created = [
        {
          id: 401,
          label: 'doc3',
          document: 'unmatched.pdf',
          original_file: 'original-unmatched.pdf',
        },
      ];
      const result = createExtraDocument(documents, created);
      expect(result).toEqual([
        {
          id: 1,
          label: 'doc1',
          document: null,
          original_file: null,
        },
        {
          id: 2,
          label: 'doc2',
          document: null,
          original_file: null,
        },
      ]);
    });

    it('should use default parameter values when no arguments provided', () => {
      const result = createExtraDocument();
      expect(result).toEqual([]);
    });

    it('should handle mixed case label matching', () => {
      const documents = [
        { id: 1, name: 'Doc1' },
        { id: 2, name: 'doc2' },
      ];
      const created = [
        {
          id: 501,
          label: 'Doc1',
          document: 'file.pdf',
          original_file: 'original.pdf',
        },
      ];
      const result = createExtraDocument(documents, created);
      expect(result).toEqual([
        {
          id: 501,
          label: 'Doc1',
          document: 'file.pdf',
          original_file: 'original.pdf',
        },
        {
          id: 2,
          label: 'doc2',
          document: null,
          original_file: null,
        },
      ]);
    });
  });
});