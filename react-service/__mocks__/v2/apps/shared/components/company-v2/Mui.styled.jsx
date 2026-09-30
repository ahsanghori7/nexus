import React from 'react';

const MuiSubtitle = ({ children, ...props }) => (
  <div data-testid="mui-subtitle" {...props}>
    {children}
  </div>
);

MuiSubtitle.displayName = 'MuiSubtitle';

const MuiCompanyAvatar = ({ picSrc, onDelete, ...props }) => (
  <div data-testid="mui-company-avatar" data-pic-src={picSrc} {...props}>
    {picSrc && <img src={picSrc} alt="Company Avatar" data-testid="avatar-image" />}
    {onDelete && (
      <button data-testid="avatar-delete-button" onClick={onDelete}>
        Delete
      </button>
    )}
  </div>
);

MuiCompanyAvatar.displayName = 'MuiCompanyAvatar';

export { MuiSubtitle, MuiCompanyAvatar };
