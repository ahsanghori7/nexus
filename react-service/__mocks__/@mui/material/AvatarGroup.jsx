import React from 'react';

const AvatarGroup = ({ children, max, ...props }) => (
  <div data-testid="mui-avatar-group" {...props}>
    {children}
  </div>
);

AvatarGroup.displayName = 'AvatarGroup';

export default AvatarGroup;
