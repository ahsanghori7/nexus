// Mock for i18next
const mockI18n = {
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockReturnThis(),
  changeLanguage: jest.fn().mockImplementation((lng) => Promise.resolve(lng)),
  t: jest.fn((key) => key),
  language: 'UK',
  languages: ['UK', 'EU', 'NZ', 'AUS'],
};

export default mockI18n;
