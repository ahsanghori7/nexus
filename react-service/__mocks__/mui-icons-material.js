import React from 'react';

// Create a mock component factory for Material UI Icons
const createMockIcon = (displayName) => {
  const Component = (props) => {
    return React.createElement(
      'span',
      {
        'data-testid': displayName.toLowerCase(),
        className: displayName,
        ...props,
      },
      displayName
    );
  };
  Component.displayName = displayName;
  return Component;
};

// Create individual mock icons
const ExpandMore = createMockIcon('ExpandMoreIcon');
const ChevronRight = createMockIcon('ChevronRightIcon');
const Add = createMockIcon('Add');
const InfoOutlined = createMockIcon('InfoOutlined');

// Export all icons
export { ExpandMore, ChevronRight, Add, InfoOutlined };

// Default export - used when someone does import xxx from '@mui/icons-material'
export default {
  ExpandMore,
  ChevronRight,
  Add,
  InfoOutlined,
};
