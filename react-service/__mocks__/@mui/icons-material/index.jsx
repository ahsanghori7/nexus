/* eslint-disable react/display-name */
import React from 'react';

// Create a factory function to generate mock icon components
const createMockIcon = (displayName) => {
  const Component = (props) => (
    <span data-testid={`mui-icon-${displayName.toLowerCase()}`} {...props}>
      {displayName}
    </span>
  );
  Component.displayName = displayName;
  return Component;
};

module.exports = {
  WarningAmber: createMockIcon('WarningAmberIcon'),
  FileDownload: createMockIcon('FileDownloadIcon'),
  ExpandMore: createMockIcon('ExpandMore'),
  ChevronRight: createMockIcon('ChevronRight'),
  Search: createMockIcon('Search'),
  // Add any other icons you need here
};
