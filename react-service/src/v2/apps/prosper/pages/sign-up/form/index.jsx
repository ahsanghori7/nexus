import React from 'react';
import Wrapper from 'v2/apps/prosper/pages/sign-up/shared/Wrapper';
import { ANZ_CODE_REGIONS } from 'v2/helpers/region';
import UKForm from './UK';
import ANZForm from './ANZ';

function Form({ styles, codeRegion }) {
  if (ANZ_CODE_REGIONS.includes(REGION?.CODE)) {
    return <ANZForm styles={styles} codeRegion={codeRegion} />;
  }
  return <UKForm styles={styles} />;
}

const SignUpStep = (props) => {
  return <Wrapper Component={Form} {...props} />;
};

export default SignUpStep;
