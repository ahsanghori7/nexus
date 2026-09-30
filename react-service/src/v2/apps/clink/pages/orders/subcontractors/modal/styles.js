import { CONSTANTS } from 'clink-components';

const { white, japaneseIndigo, clinkRed, clinkGray, tealShade } =
  CONSTANTS.colors.general;
const { dimGray2 } = CONSTANTS.colors.prosper;

// TODO: Extract this to a shared component for app.c-link
const style = {
  color: japaneseIndigo,
  bgcolor: white,
  borderRadius: '8px',
};
const commons = {
  borderRadius: '40px',
  fontSize: '16px',
  height: '40px',
};
const greenStyle = {
  border: `1px solid ${tealShade}`,
  color: tealShade,
  bgcolor: white,
};
const cancelStyle = {
  ...commons,
  ...greenStyle,
  marginRight: '16px',
  '&:hover': {
    color: white,
    bgcolor: clinkRed,
    border: `1px solid ${clinkRed}`,
  },
};
const acceptStyle = {
  ...commons,
  color: white,
  bgcolor: tealShade,
  '&:hover': greenStyle,
  '&.Mui-disabled': {
    color: white,
    bgcolor: clinkGray,
  },
};
const textStyles = {
  color: dimGray2,
  fontSize: '16px',
  textAlign: 'justify',
  fontWeight: 'normal',
};

export { style, cancelStyle, acceptStyle, textStyles };
