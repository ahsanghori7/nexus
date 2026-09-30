import React from 'react';

// Mock for v2/apps/prosper/shared/crm-components/Description
const Description = ({
  gridSx,
  text,
  fontSx,
  descFontSx,
  loading,
  ...props
}) => {
  if (loading) {
    return <div data-testid="description-loading">Loading description...</div>;
  }

  if (!text) {
    return null;
  }

  return (
    <div
      data-testid="description"
      data-text={text}
      {...props}
    >
      {text}
    </div>
  );
};

export default Description;
