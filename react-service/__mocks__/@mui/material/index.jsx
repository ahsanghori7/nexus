// __mocks__/@mui/material/index.js
import * as React from 'react';
import TextField from './TextField.jsx';
import FormControl from './FormControl.jsx';
import InputAdornment from './InputAdornment.jsx';
import Divider from './Divider.jsx';

// Create a mock factory function that uses a proper lowercase HTML element
const createMuiComponentMock = (name) => {
  const Component = React.forwardRef((props, ref) => {
    // Use a div element with classname and data-testid to avoid casing issues
    // while still making the component identifiable in tests
    return React.createElement('div', {
      className: `Mui${name}-root`,
      'data-testid': name.toLowerCase(),
      ...props,
      ref,
    });
  });

  Component.displayName = name;
  return Component;
};

// Define common MUI components
const Button = createMuiComponentMock('Button');

// Add MUI-specific class handling to Button
const EnhancedButton = React.forwardRef((props, ref) => {
  // Add the MUI class names based on the variant and color
  const getClassName = () => {
    const baseClass = 'MuiButton-root';
    const variantClass = props.variant ? `MuiButton-${props.variant}` : '';
    const colorClass = props.color
      ? `MuiButton-${props.variant || 'contained'}${
          props.color.charAt(0).toUpperCase() + props.color.slice(1)
        }`
      : '';
    return [baseClass, variantClass, colorClass, props.className]
      .filter(Boolean)
      .join(' ');
  };

  return React.createElement('button', {
    type: 'button',
    className: getClassName(),
    'data-testid': 'mui-button',
    ...props,
    ref,
  });
});
EnhancedButton.displayName = 'Button';

// Export common components with proper enhancements
module.exports = {
  Button: EnhancedButton,
  IconButton: createMuiComponentMock('IconButton'),
  TextField: TextField,
  Grid: createMuiComponentMock('Grid'),
  Grid2: createMuiComponentMock('Grid2'),
  Box: createMuiComponentMock('Box'),
  Container: createMuiComponentMock('Container'),
  Avatar: createMuiComponentMock('Avatar'),
  Typography: createMuiComponentMock('Typography'),
  CircularProgress: createMuiComponentMock('CircularProgress'),
  Dialog: createMuiComponentMock('Dialog'),
  DialogTitle: createMuiComponentMock('DialogTitle'),
  DialogContent: createMuiComponentMock('DialogContent'),
  DialogActions: createMuiComponentMock('DialogActions'),
  Tooltip: createMuiComponentMock('Tooltip'),
  Snackbar: createMuiComponentMock('Snackbar'),
  Alert: createMuiComponentMock('Alert'),
  Paper: createMuiComponentMock('Paper'),
  Card: createMuiComponentMock('Card'),
  CardHeader: createMuiComponentMock('CardHeader'),
  CardContent: createMuiComponentMock('CardContent'),
  FormControl: FormControl,
  FormHelperText: createMuiComponentMock('FormHelperText'),
  Select: createMuiComponentMock('Select'),
  MenuItem: createMuiComponentMock('MenuItem'),
  InputLabel: createMuiComponentMock('InputLabel'),
  Checkbox: createMuiComponentMock('Checkbox'),
  FormControlLabel: createMuiComponentMock('FormControlLabel'),
  LinearProgress: createMuiComponentMock('LinearProgress'),
  InputAdornment: InputAdornment,
  Divider: Divider,
  Autocomplete: createMuiComponentMock('Autocomplete'),
  Chip: createMuiComponentMock('Chip'),
  Skeleton: createMuiComponentMock('Skeleton'),
  Stack: createMuiComponentMock('Stack'),

  // Table components
  Table: createMuiComponentMock('Table'),
  TableHead: createMuiComponentMock('TableHead'),
  TableBody: createMuiComponentMock('TableBody'),
  TableRow: React.forwardRef((props, ref) => {
    return React.createElement('tr', {
      className: 'MuiTableRow-root',
      'data-testid': 'mui-tablerow',
      ...props,
      ref,
    });
  }),
  TableCell: React.forwardRef((props, ref) => {
    return React.createElement('td', {
      className: 'MuiTableCell-root',
      'data-testid': 'mui-tablecell',
      ...props,
      ref,
    });
  }),

  // Create semantic List components
  List: React.forwardRef((props, ref) => {
    return React.createElement('ul', {
      className: 'MuiList-root',
      'data-testid': 'list',
      ...props,
      ref,
    });
  }),

  ListItem: React.forwardRef((props, ref) => {
    return React.createElement('li', {
      className: 'MuiListItem-root',
      'data-testid': 'listitem',
      role: 'listitem',
      ...props,
      ref,
    });
  }),

  ListItemText: React.forwardRef(({ primary, ...props }, ref) => {
    return React.createElement('div', {
      className: 'MuiListItemText-root',
      'data-testid': 'listitemtext',
      ...props,
      ref,
      children: React.createElement('span', {
        className: 'MuiListItemText-primary',
      }, primary)
    });
  }),

  ListItemSecondaryAction: React.forwardRef((props, ref) => {
    return React.createElement('div', {
      className: 'MuiListItemSecondaryAction-root',
      'data-testid': 'listitemsecondaryaction',
      ...props,
      ref,
    });
  }),

  // This is a Proxy that returns a mock for any requested component that isn't explicitly defined above
  __esModule: true,
  default: new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === '__esModule') {
          return true;
        }
        if (typeof prop === 'string' && !module.exports[prop]) {
          return createMuiComponentMock(prop);
        }
        return module.exports[prop] || undefined;
      },
    }
  ),
};
