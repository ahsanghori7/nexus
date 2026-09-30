import ReactDOM from 'react-dom';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import 'v2/apps/shared';
import 'v2/helpers/i18n/changeLangOnLoad';
import 'v2/apps/clink/assets/styles/index.scss';
import getTheme from 'v2/apps/shared/components/muiTheme';
import App from './App';

const theme = getTheme('clink');

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>,
  document.getElementById('app')
);
