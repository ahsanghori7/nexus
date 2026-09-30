import {
  sizeFileIsCorrect,
  typeFileIsAccepted,
  DEFAULT_ACCEPTED_TYPE,
} from 'helpers/files';

describe('file helper utilities', () => {
  describe('sizeFileIsCorrect', () => {
    it('accepts files within the default limit', () => {
      const smallFile = { size: 5 * 1024 * 1024 };

      expect(sizeFileIsCorrect(smallFile)).toBe(true);
    });

    it('rejects files above the provided limit', () => {
      const largeFile = { size: 3 * 1024 * 1024 };

      expect(sizeFileIsCorrect(largeFile, 2)).toBe(false);
    });
  });

  describe('typeFileIsAccepted', () => {
    it('accepts files that declare an allowed mime type', () => {
      expect(
        typeFileIsAccepted({ type: DEFAULT_ACCEPTED_TYPE[0] })
      ).toBe(true);
    });

    it('falls back to support .msg, .dwg and .dxf extensions', () => {
      expect(
        typeFileIsAccepted({ type: '', name: 'mail.msg' })
      ).toBe(true);
      expect(
        typeFileIsAccepted({ type: '', name: 'drawing.dwg' })
      ).toBe(true);
      expect(
        typeFileIsAccepted({ type: null, name: 'layout.dxf' })
      ).toBe(true);
    });

    it('rejects files when the type is not recognised', () => {
      expect(
        typeFileIsAccepted({ type: '', name: 'archive.zip' })
      ).toBeFalsy();
    });
  });
});
