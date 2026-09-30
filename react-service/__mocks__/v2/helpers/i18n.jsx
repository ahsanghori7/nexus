const i18next = {
  t: (key, options = {}) => {
    // Return the key itself or a default value for testing
    if (key === 'currency') return '£';
    if (key === 'email') return 'Email';
    return key;
  },
  language: 'en',
  changeLanguage: jest.fn(),
  exists: jest.fn(() => true),
};

export default i18next;
