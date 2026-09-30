import React from 'react';

const DescriptionOutlined = React.forwardRef((props, ref) =>
  React.createElement('div', { ...props, ref, 'data-testid': 'DescriptionOutlinedIcon' }),
);

export default DescriptionOutlined;
