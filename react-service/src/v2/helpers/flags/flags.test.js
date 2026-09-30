import flag from './index';

const FLAGS_TEST = {
  LOL: true,
  PROSPER_DASHBOARD_LAYOUT: 'grid',
  PROSPER_ENQUIRIES_MUI_PAGINATION: 6,
  OPP_VIEWER_NEWSLETTER: false,
  OPP_VIEWER_VALUE: 'false',
  TEAM_MANAGER: false,
  OPPORTUNITY_DASHBOARD_V3_SHARE: 'true',
  OPPORTUNITY_DASHBOARD_V3_STATUS: true,
  TRACKING: true,
  PROTOTYPE: true,
  PREQUALIFICATION_V2_PROFILE_PICTURE_DROP: false,
  PEGASUS_TOKEN_DASHBOARD_V2: true,
  ULTIMATE_FREE_TRIAL: true,
  LOGIN_LINK: true,
  SESSION_VULNERABILITY: 'false',
  PROTOTYPE_2: true,
  CUSTOMER_HEALTH_SCORE: true,
  CUSTOMER_HEALTH_SCORE_SEARCH: true,
  HOW_TO_WIN: true,
  PROTOTYPE_DOCUSIGN: true,
};

describe('flag function', () => {
  it('returns true when key is in FLAGS and value is "true"', () => {
    const key = 'LOL';
    expect(flag(key, FLAGS_TEST)).toBe(true);
  });

  it('returns false when key is in FLAGS and value is "false"', () => {
    const key = 'OPP_VIEWER_NEWSLETTER';
    expect(flag(key, FLAGS_TEST)).toBe(false);
  });

  it('returns true when key is in FLAGS and value is "true" and a string', () => {
    const key = 'OPPORTUNITY_DASHBOARD_V3_SHARE';
    expect(flag(key, FLAGS_TEST)).toBe(true);
  });

  it('returns false when key is in FLAGS and value is "false" and a string', () => {
    const key = 'OPP_VIEWER_VALUE';
    expect(flag(key, FLAGS_TEST)).toBe(false);
  });

  it('returns another value when key is in FLAGS and value is not related to boolean', () => {
    let key = 'PROSPER_DASHBOARD_LAYOUT';
    expect(flag(key, FLAGS_TEST)).toBe('grid');
    key = 'PROSPER_ENQUIRIES_MUI_PAGINATION';
    expect(flag(key, FLAGS_TEST)).toBe(6);
  });

  it('returns proper value by trimming the key first', () => {
    let key = '   PEGASUS_TOKEN_DASHBOARD_V2     ';
    expect(flag(key, FLAGS_TEST)).toBe(true);
    key = '   PREQUALIFICATION_V2_PROFILE_PICTURE_DROP     ';
    expect(flag(key, FLAGS_TEST)).toBe(false);
  });

  it('returns undefined when key is not in FLAGS', () => {
    const key = 'NON_EXISTENT_KEY';
    expect(flag(key, FLAGS_TEST)).toBeUndefined();
  });

  it('returns undefined when key is undefined', () => {
    const key = undefined;
    expect(flag(key, FLAGS_TEST)).toBeUndefined();
  });

  it('returns undefined when key is null', () => {
    const key = null;
    expect(flag(key, FLAGS_TEST)).toBeUndefined();
  });

  it('returns undefined when key is not a string', () => {
    const key = 123;
    expect(flag(key, FLAGS_TEST)).toBeUndefined();
  });

  it('returns undefined when flags is undefined', () => {
    const key = 'LOL';
    expect(flag(key, undefined)).toBeUndefined();
  });

  it('returns undefined when flags is null', () => {
    const key = 'LOL';
    expect(flag(key, null)).toBeUndefined();
  });
});
