import React from 'react';
import { Tooltip } from 'clink-components';
import Spinner from '../../../../global/public/images/svg/icon-clink-logo-static-small.svg';

// Todo: make it reusable in the future
const InputIcon = () => (
  <Tooltip text="C-Link network member" offset={{ top: -25, left: -80 }}>
    <Spinner />
  </Tooltip>
);

export default InputIcon;
