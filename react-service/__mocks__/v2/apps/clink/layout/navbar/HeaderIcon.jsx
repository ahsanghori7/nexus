// Mock for v2/apps/clink/layout/navbar/HeaderIcon
import React from 'react';

const HeaderIcon = ({ handleClick, iconLink }) => (
  <div
    data-testid="header-icon"
    onClick={handleClick}
    data-link-component={iconLink?.LinkComponent?.name}
  >
    Header Icon
  </div>
);

HeaderIcon.displayName = 'HeaderIcon';

export default HeaderIcon;
