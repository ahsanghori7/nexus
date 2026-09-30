import {
  boqFetchListArg,
  normalizeFetchBoQListArg,
  releaseBoqBusyFlagsForPackage,
} from './asyncThunk';

describe('fetchBoqListArgs', () => {
  describe('normalizeFetchBoQListArg', () => {
    it('accepts a slug string', () => {
      expect(normalizeFetchBoQListArg('my-slug')).toEqual({
        slug: 'my-slug',
        releaseBusyForPackageId: undefined,
      });
    });

    it('accepts slug and releaseBusyForPackageId', () => {
      expect(
        normalizeFetchBoQListArg({ slug: 'my-slug', releaseBusyForPackageId: 7 })
      ).toEqual({
        slug: 'my-slug',
        releaseBusyForPackageId: 7,
      });
    });
  });

  describe('boqFetchListArg', () => {
    it('returns a string when no package id', () => {
      expect(boqFetchListArg('slug')).toBe('slug');
    });

    it('returns an object when package id is set', () => {
      expect(boqFetchListArg('slug', 3)).toEqual({
        slug: 'slug',
        releaseBusyForPackageId: 3,
      });
    });
  });

  describe('releaseBoqBusyFlagsForPackage', () => {
    it('clears busy flags only for the given package', () => {
      const uiLoading = {
        boqList: false,
        updateEntityById: { 1: true, 2: true },
        newBoqResetById: { 1: true },
      };
      const next = releaseBoqBusyFlagsForPackage(uiLoading, 1);
      expect(next.updateEntityById).toEqual({ 2: true });
      expect(next.newBoqResetById).toEqual({});
      expect(next.boqList).toBe(false);
    });

    it('returns uiLoading unchanged when packageId is omitted', () => {
      const uiLoading = { updateEntityById: { 1: true } };
      expect(releaseBoqBusyFlagsForPackage(uiLoading, null)).toBe(uiLoading);
    });
  });
});
