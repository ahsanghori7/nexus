import { getJobDataForPackage, getScopedTenderJob } from './packageJobScope';

describe('packageJobScope', () => {
  it('returns package data when package_id matches tid', () => {
    const data = { status: 'STARTED', package_id: 43788 };
    expect(getJobDataForPackage(43788, data)).toEqual(data);
    expect(getJobDataForPackage(200, data)).toBeNull();
  });

  it('returns package data even when currentTender points at another package', () => {
    const scoped = getScopedTenderJob(
      43788,
      999,
      { status: 'STARTED', package_id: 43788 },
      null,
    );
    expect(scoped.data?.status).toBe('STARTED');
  });

  it('falls back to currentTender when package_id is missing', () => {
    const data = { status: 'SUCCESS' };
    expect(getJobDataForPackage(100, data, 100)).toEqual(data);
    expect(getJobDataForPackage(200, data, 100)).toBeNull();
  });

  it('scopes data away when package_id does not match', () => {
    const scoped = getScopedTenderJob(
      200,
      100,
      { status: 'STARTED', package_id: 100 },
      null,
    );
    expect(scoped.data).toBeNull();
  });
});
