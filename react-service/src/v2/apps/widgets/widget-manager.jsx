import React from 'react';
import { UK, NZ, AUS } from 'v2/helpers/region';
import OpportunityViewer from './opportunity-viewer';

const regionEnv = {
  nz: NZ.id,
  aus: AUS.id,
  anz: NZ.id,
};
const manager = (widget = '') => {
  const idRegion = (regionEnv && regionEnv[ENV]) || UK.id;
  switch (widget) {
    case 'opportunity-viewer':
      return () => <OpportunityViewer idRegion={idRegion} />;
    default:
      return () => <div>NOT FOUND</div>;
  }
};

export default manager;
