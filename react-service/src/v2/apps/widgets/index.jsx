import ReactDOM from 'react-dom';
import React from 'react';
import { getQueryStringVars } from 'v2/helpers/url';
import PHPGloblals from 'v2/helpers/php-globals';
import manager from './widget-manager';

const urlVars = getQueryStringVars();

/*
    IMPORTANT: FOR THE NEXT WIDGET

    Consider using this in order to encapsulate styles
    https://www.npmjs.com/package/react-shadow
*/

let elementId = 'app';
let Component = () => <div>QUERY PARAMS NOT FOUND</div>;
if (urlVars && urlVars.widget) {
  const { widget, parentId } = urlVars;
  elementId = parentId || 'app';
  Component = manager(widget);
}
const conf = PHPGloblals();
if (conf && conf.widget) {
  const { widget, parentId } = conf;
  elementId = parentId || 'app';
  Component = manager(widget);
}

ReactDOM.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>,
  document.getElementById(elementId)
);
