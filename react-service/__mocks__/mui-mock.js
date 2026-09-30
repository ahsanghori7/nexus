/* eslint-disable react/display-name */
import React from 'react';

// Create a mock component factory for Material UI components
const createMockComponent = (displayName) => {
  const Component = (props) => {
    const { children, ...otherProps } = props;
    return React.createElement(
      'div',
      {
        'data-testid': displayName.toLowerCase(),
        className: displayName,
        ...otherProps,
      },
      children
    );
  };
  Component.displayName = displayName;
  return Component;
};

// Create individual mock components for each Material UI component used
const Box = createMockComponent('Box');
const Accordion = createMockComponent('Accordion');
const AccordionSummary = createMockComponent('AccordionSummary');
const AccordionDetails = createMockComponent('AccordionDetails');
const Typography = createMockComponent('Typography');
const ListItemIcon = createMockComponent('ListItemIcon');
const List = createMockComponent('List');
const ListItem = createMockComponent('ListItem');
const Divider = createMockComponent('Divider');
const ListItemText = createMockComponent('ListItemText');
const ListItemAvatar = createMockComponent('ListItemAvatar');
const Avatar = createMockComponent('Avatar');

// Create mock icons
const ExpandMoreIcon = createMockComponent('ExpandMoreIcon');
const ChevronRightIcon = createMockComponent('ChevronRightIcon');
const Add = createMockComponent('Add');
const InfoOutlined = createMockComponent('InfoOutlined');

// Export all components
module.exports = {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  ListItemIcon,
  List,
  ListItem,
  Divider,
  ListItemText,
  ListItemAvatar,
  Avatar,
};

// Export icons separately to match the MUI imports
module.exports.icons = {
  ExpandMore: ExpandMoreIcon,
  ChevronRight: ChevronRightIcon,
  Add, InfoOutlined
};
