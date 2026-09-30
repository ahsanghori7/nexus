import React from 'react';
import i18next from 'v2/helpers/i18n';
import { Provider } from 'react-redux';
import configureStore from 'store';
import { UK } from 'v2/helpers/region';

import Viewer from './Viewer';

// TODO: Check for changing this to a widget configuration
const store = configureStore(BASE_DIRS.V2.PROSPER);

export default function StoreWrapper({
  title = i18next.t('prosper-opportunity-title'),
  show = true,
  discover = false,
  idRegion = UK.id,
}) {
  return (
    <Provider store={store}>
      <Viewer
        title={title}
        show={show}
        discover={discover}
        idRegion={idRegion}
      />
    </Provider>
  );
}
