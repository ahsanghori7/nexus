import ReactDOM from 'react-dom';
import React from 'react';
import getMuiTheme from 'v2/apps/shared/components/muiTheme';
import { ThemeProvider } from '@mui/material/styles';
import 'v2/apps/shared';
import 'v2/apps/admin/assets/styles/index.scss';
import App from './App';

const themeName = 'pegasus';
const theme = getMuiTheme(themeName);

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>,
  document.getElementById('app')
);
