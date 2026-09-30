import prosper from './prosper';
import clink from './clink';
import pegasus from './pegasus';
import prosperEnquiries from './prosperEnquiries';

const useTheme = (context) => {
  let themeContext;
  switch (context) {
    case 'clink':
      themeContext = clink;
      break;
    case 'pegasus':
      themeContext = pegasus;
      break;
    case 'prosperEnquiries':
      themeContext = prosperEnquiries;
      break;
    default:
      themeContext = prosper;
      break;
  }
  return themeContext;
};

export default useTheme;
