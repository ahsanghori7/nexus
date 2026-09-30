import { getEditUrl, getPreviewLink } from './helpers';

// Mock the getBaseUrl function
jest.mock('v2/helpers/url', () => ({
  getBaseUrl: jest.fn((app) => `http://localhost/${app}`),
}));

describe('Clink Helpers', () => {
  describe('getEditUrl', () => {
    it('should return the correct edit URL for instruction type', () => {
      const slug = 'test-project';
      const typeUid = 'instruction';
      const id = '123';
      const expectedUrl = 'http://localhost/clink/project/test-project/form_instruction?type=instructions-variations&id=123';
      expect(getEditUrl(slug, typeUid, id)).toBe(expectedUrl);
    });

    it('should return the correct edit URL for ncr type', () => {
      const slug = 'test-project';
      const typeUid = 'ncr';
      const id = '456';
      const expectedUrl = 'http://localhost/clink/project/test-project/form_instruction?type=ncr&id=456';
      expect(getEditUrl(slug, typeUid, id)).toBe(expectedUrl);
    });
  });

  describe('getPreviewLink', () => {
    it('should return the correct preview link for instructions-variations type', () => {
      const type = 'instructions-variations';
      const id = '123';
      const expectedLink = '/document-creator/instruction/123/preview';
      expect(getPreviewLink(type, id)).toBe(expectedLink);
    });

    it('should return the correct preview link for instruction type', () => {
      const type = 'instruction';
      const id = '456';
      const expectedLink = '/document-creator/instruction/456/preview';
      expect(getPreviewLink(type, id)).toBe(expectedLink);
    });

    it('should return the correct preview link for ncr type', () => {
      const type = 'ncr';
      const id = '789';
      const expectedLink = '/document-creator/ncr/789/preview';
      expect(getPreviewLink(type, id)).toBe(expectedLink);
    });
  });
});
