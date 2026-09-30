import React from 'react';
import Wrapper from 'v2/apps/prosper/pages/sign-up/shared/Wrapper';
import UKQualification from './UK';
import ANZQualification from './ANZ';
import { ANZ_CODE_REGIONS } from 'v2/helpers/region';

function Qualification({ styles, codeRegion, setCodeRegion }) {
  if (ANZ_CODE_REGIONS.includes(REGION?.CODE)) {
    return (
      <ANZQualification
        styles={styles}
        codeRegion={codeRegion}
        setCodeRegion={setCodeRegion}
      />
    );
  }
  return <UKQualification styles={styles} />;
}

const QualificationStep = (props) => (
  <Wrapper Component={Qualification} {...props} />
);

export default QualificationStep;
