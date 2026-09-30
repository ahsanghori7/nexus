# Frontend Development Guidelines and Best Practices

## Overview
This document outlines the frontend development guidelines and best practices for the Construction Link React Service V2 project. These guidelines ensure consistency, maintainability, and scalability across the codebase.

## 🎨 UI/UX Framework Guidelines

### 1. Material-UI (MUI) as Primary UI Framework

**All new implementations must use Material-UI as the primary UI/UX tool.**

#### ✅ Best Practices:
- Use MUI components for all new feature development
- Follow MUI design principles and component patterns
- Leverage MUI's built-in accessibility features
- Use MUI's responsive breakpoint system
- Implement MUI's theming system for consistent design

#### Example Implementation:
```jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Autocomplete,
  TextField,
  ThemeProvider
} from '@mui/material';
import { Add } from '@mui/icons-material';
import useTheme from 'v2/apps/shared/components/muiTheme';
import { CONSTANTS } from 'clink-components';

const { ruby, white } = CONSTANTS.colors.general;

const SupplyChainModal = ({ onSubmit, options }) => {
  const theme = useTheme('clink');
  const [selectedSubcontractors, setSelectedSubcontractors] = useState([]);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    setDisabled(selectedSubcontractors.length === 0);
  }, [selectedSubcontractors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDisabled(true);
    await onSubmit({ supplyChain: selectedSubcontractors });
    setSelectedSubcontractors([]);
  };

  return (
    <ThemeProvider theme={theme}>
      <form onSubmit={handleSubmit}>
        <Box sx={{ p: 2 }}>
          <Autocomplete
            multiple
            options={options}
            getOptionLabel={(option) => option.label}
            onChange={(event, newValue) => setSelectedSubcontractors(newValue)}
            value={selectedSubcontractors}
            filterSelectedOptions
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Add subcontractors"
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
          />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              sx={{
                color: ruby,
                borderColor: ruby,
                '&:hover': {
                  backgroundColor: `${ruby}10`,
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Add />}
              disabled={disabled}
              sx={{ borderRadius: '20px' }}
            >
              Add Subcontractors
            </Button>
          </Box>
        </Box>
      </form>
    </ThemeProvider>
  );
};
```

#### 🚫 Avoid:
- Using inline styles when MUI theme options are available (This doesn't need inline styles are forbidden. They can be used where is needed)
- Creating custom components that duplicate MUI functionality
- Inconsistent spacing and typography patterns

### 2. Theme-First Approach

**All UI changes should be global and implemented through theme files.**

#### Theme Configuration Location:
- **V2 Apps**: `src/v2/apps/shared/components/muiTheme/`
- **Theme Context**: Use `useTheme()` hook for theme-aware components

#### ✅ Best Practices:
- Define all design tokens (colors, typography, spacing) in theme files
- Use theme breakpoints for responsive design
- Extend theme with custom variants when needed
- Apply theme consistently across all components

#### Example Theme Extension:
```jsx
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    // Custom typography variants
    widget1: {
      fontSize: '28pt',
      fontWeight: 600,
      fontFamily: 'AvantGarde Gothic PRO',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});
```

#### 🚫 Avoid:
- Hardcoding colors, fonts, or spacing values
- Creating app-specific styles that should be global
- Overriding theme values with inline styles

## 🗃️ Data Layer Guidelines

### 3. Redux for State Management

**Use Redux as the primary data layer solution. Prioritize creating or extending use cases in the store folder.**

#### Store Structure:
```
src/v2/store/
├── enhancers/       # Store enhancers
├── middlewares/     # Custom middlewares
├── reducers/        # Redux reducers and actions
└── index.js         # Store configuration
```

#### ✅ Best Practices:
- Use Redux Toolkit (@reduxjs/toolkit) for reducer creation
- Organize actions and reducers by feature/domain
- Use async thunks for API calls
- Implement proper error handling in reducers
- Use selectors for derived state

#### Example Redux Slice:
```jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for API calls
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params, { rejectWithValue }) => {
    try {
      const response = await projectsAPI.getProjects(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateProject: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateProject } = projectsSlice.actions;
export default projectsSlice.reducer;
```

#### 🚫 Avoid:
- Using local component state for data that should be shared
- Direct API calls in components (use thunks instead)
- Mutating state directly (Redux Toolkit handles this with Immer)
- Large, monolithic reducers

## 📁 Project Structure Guidelines

### 4. V1 vs V2 Development

#### V2 Development (Preferred for New Features):
- **Location**: `src/v2/`
- **Architecture**: Modern, modular approach
- **Components**: Use MUI exclusively
- **State**: Redux with Redux Toolkit
- **Structure**: Feature-based organization within apps

#### V1 Maintenance (Legacy Support):
- **Location**: `src/v1/`
- **Architecture**: Feature-based legacy structure
- **Migration Goal**: Gradually migrate to V2
- **Bootstrap Warning**: ⚠️ Bootstrap is pending removal - minimize new Bootstrap dependencies

#### ✅ Best Practices for V1 Fixes:
- Apply these guidelines when working on V1 fixes
- Replace Bootstrap components with MUI when possible
- Use the shared theme system from V2
- Gradually refactor state management to use Redux
- Document migration opportunities

### 5. Component Organization

#### V2 App Structure:
```
apps/[app-name]/
├── App.jsx                 # Main app component
├── index.jsx              # Entry point
├── helpers.js             # App-specific utilities
├── assets/                # App-specific assets
├── layout/                # Layout components
├── pages/                 # Page components
└── router/                # App routing
```

#### Shared Components:
```
apps/shared/
├── components/
│   ├── muiTheme/         # Theme configuration
│   ├── layout/           # Shared layout components
│   └── ui/               # Reusable UI components
└── utils/                # Shared utilities
```

## 🧪 Development Practices

### 6. Component Development

#### ✅ Best Practices:
- Use functional components with hooks
- Implement proper prop types
- Follow React performance best practices
- Write tests for new components
- Use React Hook Form for form management

#### Example Component Structure:
```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';

const ProjectCard = ({ project, onEdit }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.projects);

  const handleUpdate = () => {
    dispatch(updateProject(project.id));
  };

  return (
    <Box
      sx={{
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Typography variant="h6" gutterBottom>
        {project.name}
      </Typography>
      <Button
        variant="contained"
        onClick={handleUpdate}
        disabled={loading}
      >
        Update
      </Button>
    </Box>
  );
};

ProjectCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func,
};

ProjectCard.defaultProps = {
  onEdit: () => {},
};

export default ProjectCard;
```

### 7. API Integration

#### ✅ Best Practices:
- Use services layer for API calls (`src/v2/services/`)
- Implement proper error handling
- Use Redux thunks for async operations
- Handle loading states consistently

#### Example Service:
```jsx

import { patchData } from 'v2/services/clinkHelpers';
import { httpHelperV2 } from 'v2/services/httpHelper';

const fetchTeamApi = createAsyncThunk(
  'project/fetchTeamApi',
  async (pid, thunkAPI) => {
    try {
      return await httpHelperV2({
        url: `project/${pid}/team`,
        method: 'GET',
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

const updateTender = createAsyncThunk(
  'project/updateTender',
  async ({ tid, data }) => {
    patchData('tender', 'update', data, { tid }).then((result) =>
      result.status === 200 ? result.json() : result.status,
    );
  },
);

```

- `v2/services/httpHelper` is for `api` specific endpoints
- `v2/services/clinkHelpers` is for app.c-link relay specific endpoints
- `v2/services/helpers` is for framework specific endpoints

## 🔧 Development Tools and Standards

### 8. Code Quality

#### Linting and Formatting:
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Pre-commit hooks**: Ensure code quality

#### Testing:
- **Framework**: Jest with React Testing Library
- **Coverage**: Maintain test coverage
- **Location**: Tests alongside source files (`.test.js`)

#### Example Test:
```jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProjectCard from './ProjectCard';

const mockStore = configureStore({
  reducer: {
    projects: (state = { loading: false }) => state,
  },
});

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
  };

  it('renders project name', () => {
    render(
      <Provider store={mockStore}>
        <ProjectCard project={mockProject} />
      </Provider>
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('calls update on button click', () => {
    const onEdit = jest.fn();
    render(
      <Provider store={mockStore}>
        <ProjectCard project={mockProject} onEdit={onEdit} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Update'));
    // Add assertions based on expected behavior
  });
});
```

## 🚀 Performance Guidelines

### 9. Optimization Best Practices

#### ✅ Performance Tips:
- Use React.memo for expensive components
- Implement proper key props in lists
- Lazy load components when appropriate
- Optimize bundle size with code splitting
- Use MUI's sx prop efficiently

#### Example Optimization:
```jsx
import React, { memo, useMemo } from 'react';
import { Box, List, ListItem } from '@mui/material';

const ProjectList = memo(({ projects, filter }) => {
  const filteredProjects = useMemo(() => {
    return projects.filter(project =>
      project.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [projects, filter]);

  return (
    <Box>
      <List>
        {filteredProjects.map(project => (
          <ListItem key={project.id}>
            {project.name}
          </ListItem>
        ))}
      </List>
    </Box>
  );
});

export default ProjectList;
```

## 🔄 Migration Strategy

### 10. V1 to V2 Migration

#### When Working on V1:
1. **Assess Migration Opportunity**: Can this be moved to V2?
2. **Apply V2 Patterns**: Use MUI and Redux where possible
3. **Document Dependencies**: Note Bootstrap usage for future removal
4. **Gradual Refactoring**: Replace Bootstrap with MUI incrementally

#### Migration Checklist:
- [ ] Replace Bootstrap components with MUI equivalents
- [ ] Move component state to Redux store
- [ ] Apply consistent theming
- [ ] Update component structure to match V2 patterns
- [ ] Add proper testing
- [ ] Update documentation

## 📋 Checklist for New Features

### Before Starting:
- [ ] Confirm this is a V2 implementation
- [ ] Review existing MUI theme for applicable styles
- [ ] Check if Redux state structure needs extension
- [ ] Identify reusable components

### During Development:
- [ ] Use MUI components exclusively
- [ ] Apply theme-based styling
- [ ] Implement Redux for shared state
- [ ] Write component tests
- [ ] Follow naming conventions

### Before PR:
- [ ] Run linting and tests
- [ ] Verify responsive design
- [ ] Check accessibility compliance
- [ ] Update relevant documentation
- [ ] Ensure proper error handling

## 🆘 Common Pitfalls to Avoid

1. **Bootstrap in New Code**: Don't add new Bootstrap dependencies
2. **Inline Styles**: Use theme and sx prop instead
3. **Component State for Shared Data**: Use Redux for data that needs to be shared
4. **Hardcoded Values**: Use theme tokens and constants
5. **Missing Error Handling**: Always handle loading and error states
6. **Poor Accessibility**: Leverage MUI's built-in accessibility features

## 🔗 Resources

- [Material-UI Documentation](https://mui.com/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Project Structure Documentation](./PROJECT_STRUCTURE.md)

---

**Remember**: These guidelines ensure consistency, maintainability, and the gradual modernization of our frontend codebase. When in doubt, prioritize MUI implementation and Redux state management for new features.
