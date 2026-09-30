// Mock muiTheme helper
const getTheme = (themeName) => ({
  name: themeName,
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default getTheme;
