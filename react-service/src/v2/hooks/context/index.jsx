import React, { useContext as hookUseContext } from 'react';
import contextConf from './config';

function useContext(context = 'admin') {
  const Context = React.createContext(contextConf[context]);
  return hookUseContext(Context);
}

export { contextConf, useContext };
