import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import adminUK from './UK/admin.json';
import prosperUK from './UK/prosper.json';
import clinkUK from './UK/clink.json';
import adminEU from './EU/admin.json';
import prosperEU from './EU/prosper.json';
import clinkEU from './EU/clink.json';
import adminNZ from './NZ/admin.json';
import prosperNZ from './NZ/prosper.json';
import clinkNZ from './NZ/clink.json';
import adminAUS from './AUS/admin.json';
import prosperAUS from './AUS/prosper.json';
import clinkAUS from './AUS/clink.json';

// TODO: Check solutions to change texts online
// TODO2: remove duplications
const resources = {
  UK: {
    translation: {
      ...adminUK,
      ...prosperUK,
      ...clinkUK,
    },
  },
  EU: {
    translation: {
      ...adminEU,
      ...prosperEU,
      ...clinkEU,
    },
  },
  NZ: {
    translation: {
      ...adminNZ,
      ...prosperNZ,
      ...clinkNZ,
    },
  },
  AUS: {
    translation: {
      ...adminAUS,
      ...prosperAUS,
      ...clinkAUS,
    },
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'UK', // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option
    fallbackLng: 'UK',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
export { resources };
