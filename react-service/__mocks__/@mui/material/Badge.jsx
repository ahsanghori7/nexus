import React from 'react';

const Badge = React.forwardRef(({ children, badgeContent, color, variant, ...props }, ref) => {
  if (badgeContent) {
    return (
      <div data-testid="badge-wrapper" ref={ref} {...props}>
        {children}
        <span data-testid="badge-content">{badgeContent}</span>
      </div>
    );
  }

  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

Badge.displayName = 'Badge';

export default Badge;
