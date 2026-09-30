import { createTheme } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';
import useTheme from './themes';

const { avantGardeGothicPRO } = CONSTANTS.fonts;

const useMuiTheme = (context) => {
  const themeContext = useTheme(context);
  const theme = createTheme({
    ...themeContext,
  });

  if (context === 'prosper') {
    theme.typography.widget1 = {
      fontSize: '28pt',
      fontWeight: 600,
      fontFamily: avantGardeGothicPRO, // TODO: why is not taking the font family from above?
      [theme.breakpoints.down('md')]: {
        fontSize: '18pt',
      },
    };

    theme.typography.widget2 = {
      fontSize: '32pt',
      fontWeight: 600,
      fontFamily: avantGardeGothicPRO, // TODO: why is not taking the font family from above?
      [theme.breakpoints.down('md')]: {
        fontSize: '25pt',
      },
    };
  }
  return theme;
};

export default useMuiTheme;
