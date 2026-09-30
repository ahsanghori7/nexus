// Mock for react-i18next
export const useTranslation = () => ({
  t: (key) => key, // Return the key as the translation
  i18n: {
    changeLanguage: jest.fn(),
    language: 'en',
  },
});

export const Trans = ({ children }) => children;

export const initReactI18next = {
  type: '3rdParty',
  init: jest.fn(),
};
