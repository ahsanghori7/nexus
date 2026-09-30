import {
  getAccountLogo,
  getProfileLogo,
  getCompanyLogo,
  getMemberLogo,
} from './index';

jest.mock('md5', () => jest.fn((input) => `mocked-md5-${input}`));

describe('Logo URL Generator Functions', () => {
  const BASE_URLS = { S3_URL: 'https://mocked-base-url/' };
  const ENV = 'development';

  beforeEach(() => {
    jest.resetModules();
    global.BASE_URLS = BASE_URLS;
    global.ENV = ENV;
  });

  afterEach(() => {
    delete global.BASE_URLS;
    delete global.ENV;
  });

  describe('getAccountLogo', () => {
    it('should generate the correct account logo URL', () => {
      const id = 123;
      const prodMode = false;
      const expectedUrl = `https://mocked-base-url/development/account/logo/mocked-md5-123/logo.png?current=`;

      const result = getAccountLogo(id, prodMode);
      expect(result.startsWith(expectedUrl)).toBe(true);
    });

    it('should handle production mode', () => {
      const id = 123;
      const prodMode = true;
      const expectedUrl = `https://mocked-base-url/production/account/logo/mocked-md5-123/logo.png?current=`;

      const result = getAccountLogo(id, prodMode);
      expect(result.startsWith(expectedUrl)).toBe(true);
    });
  });

  describe('getProfileLogo', () => {
    it('should generate the correct profile logo URL', () => {
      const id = 456;
      const prodMode = false;
      const expectedUrl = `https://mocked-base-url/development/project/logo/mocked-md5-456/profile.png?current=`;

      const result = getProfileLogo(id, prodMode);
      expect(result.startsWith(expectedUrl)).toBe(true);
    });
  });

  describe('getCompanyLogo', () => {
    it('should generate the correct company logo URL', () => {
      const id = 789;
      const prodMode = false;
      const expectedUrl = `https://mocked-base-url/development/account/logo/mocked-md5-789/company.png?current=`;

      const result = getCompanyLogo(id, prodMode);
      expect(result.startsWith(expectedUrl)).toBe(true);
    });
  });

  describe('getMemberLogo', () => {
    it('should generate the correct member logo URL', () => {
      const id = 101;
      const memberId = 202;
      const expectedUrl = `https://mocked-base-url/development/account/logo/mocked-md5-101/organisation/mocked-md5-202/logo.png?current=`;

      const result = getMemberLogo(id, memberId);
      expect(result.startsWith(expectedUrl)).toBe(true);
    });
  });
});
