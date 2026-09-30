import { createTheme } from '@mui/material/styles';

export const chipTextFieldTheme = createTheme({
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            alignItems: 'flex-start',
            minHeight: 40,
            paddingTop: '8px',
            paddingBottom: '8px',
          },
          '& .MuiInputBase-input': {
            display: 'none',
          },
        },
      },
    },
  },
});
