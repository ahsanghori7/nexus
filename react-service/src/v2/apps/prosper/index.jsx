import ReactDOM from 'react-dom';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import getTheme from 'v2/apps/shared/components/muiTheme';
import 'v2/apps/shared';
import 'v2/helpers/i18n/changeLangOnLoadSub';
import 'v2/apps/prosper/assets/styles/index.scss';
import App from './App';

const theme = getTheme('prosper');

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>,
  document.getElementById('app'),
);
