# React Service V2 - Project Structure Documentation

## Overview
This is a React-based frontend repository for Construction Link's multiple React/JS applications (Version 2). The project uses Webpack, pnpm, Babel, and follows a modular architecture supporting both legacy (v1) and modern (v2) application structures.

## Project Information
- **Name**: react-service-v2
- **Description**: Frontend repository for multiple react/JS applications, version 2
- **Package Manager**: pnpm
- **Build Tool**: Webpack
- **Testing**: Jest
- **Author**: Jesua Betancor Alemán

## Root Directory Structure

```
react-service/
├── config.json                    # Environment configuration (local only)
├── package.json                   # Project dependencies and scripts
├── pnpm-lock.yaml                 # Package lock file for pnpm
├── webpack.config.js              # Webpack build configuration
├── jest.config.js                 # Jest testing configuration
├── jsconfig.json                  # JavaScript project configuration
├── README.md                      # Project documentation
├── entrypoint.sh                  # Docker entrypoint script
├── setupTests.js                  # Jest test setup
├── resolver.js                    # Module resolution configuration
├── testServer.js                  # Test server configuration
├── pull_request_template.md       # GitHub PR template
├── __mocks__/                     # Jest mocks directory
├── helpers/                       # Build helpers
├── vendor/                        # Third-party vendor files
└── src/                          # Main source code directory
```

## Main Source Structure (`src/`)

```
src/
├── clink-components.js            # Component library exports
├── index.html                     # Main HTML template
├── v1/                           # Legacy applications (Version 1)
└── v2/                           # Modern applications (Version 2)
```

## Version 1 Structure (`src/v1/`)

The v1 directory contains legacy applications organized by feature:

```
v1/
├── company-assets/               # Company asset management
├── document-creator/             # Document creation tools
├── edit-project/                 # Project editing interface
├── file-manager/                 # File management system
├── global/                       # Global v1 components and utilities
├── procurement-schedule/         # Procurement scheduling tools
├── projects/                     # Project management
├── public/                       # Public-facing pages
├── quotes-tender/                # Quote and tender management
├── supply-chain-v2/             # Supply chain management
├── tender-templates/             # Tender template management
└── transactions/                 # Transaction processing
```

## Version 2 Structure (`src/v2/`)

The v2 directory follows a modern, modular architecture:

```
v2/
├── apps/                         # Application modules
│   ├── admin/                   # Administration interface
│   ├── clink/                   # Main C-Link application
│   ├── prosper/                 # Prosper application
│   ├── shared/                  # Shared components across apps
│   └── widgets/                 # Reusable widget components
├── assets/                       # Static assets (fonts, styles, images)
├── constants/                    # Application constants
├── helpers/                      # Utility functions and helpers
├── hooks/                        # Custom React hooks
│   └── context/                 # React Context configurations
├── services/                     # API services and external integrations
│   └── relay/                   # Relay endpoint services
└── store/                        # Redux state management
    ├── enhancers/               # Store enhancers
    ├── middlewares/             # Custom middlewares
    └── reducers/                # Redux reducers and actions
```

## V2 Application Structure

Each application in `v2/apps/` follows a consistent structure (using `clink` as example):

```
apps/clink/
├── App.jsx                      # Main application component
├── App.test.jsx                 # Application tests
├── index.jsx                    # Application entry point
├── helpers.js                   # App-specific helper functions
├── helpers.test.js              # Helper function tests
├── assets/                      # App-specific assets
├── layout/                      # Layout components
├── pages/                       # Page components
└── router/                      # Application routing
```

## Key Components and Libraries

### Dependencies
- **React**: Main UI framework
- **Material-UI (@mui)**: UI component library
- **Redux**: State management
- **React Hook Form**: Form management
- **FontAwesome**: Icon library
- **@construction-link/react-components**: Custom component library
- **Moment.js**: Date manipulation
- **Quill**: Rich text editor

### Build and Development Tools
- **Webpack**: Module bundler and build tool
- **Babel**: JavaScript compiler
- **ESLint**: Code linting
- **Jest**: Testing framework
- **Prettier**: Code formatting
- **webpack-bundle-analyzer**: Bundle analysis

## Scripts and Commands

### Development
```bash
pnpm start                       # Start development server
pnpm run devWatch               # Development build with watch mode
pnpm run buildDev               # Development build
```

### Production
```bash
pnpm run build                  # Production build
```

### Testing
```bash
pnpm test                       # Run tests
pnpm run testWatch              # Run tests in watch mode
pnpm run coverage               # Generate test coverage report
pnpm run testList               # List all test files
```

### Code Quality
```bash
pnpm run lint                   # Run ESLint
pnpm prettier --write src       # Format code with Prettier
```

### Bundle Analysis
```bash
pnpm run build --env analyzer=true     # Analyze production bundle
pnpm run buildDev --env analyzer=true  # Analyze development bundle
```

## Configuration Files

### Environment Configuration (`config.json`)
- Contains environment-specific settings
- Must be created locally (not committed to git)
- Controls API endpoints, feature flags, and app configuration

### NPM Registry Configuration (`.npmrc`)
```
@construction-link:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=[TOKEN]
strict-peer-dependencies=true
```

### Component Library Integration
The project uses both local and external component libraries:
- External: `@construction-link/react-components`
- Local development: Configurable via `src/clink-components.js`

## Testing Strategy

### Unit Tests
- Jest framework with React Testing Library
- Tests located alongside source files (`.test.js` or `.test.jsx`)
- Mock files in `__mocks__/` directory
- Setup configuration in `setupTests.js`

### Mocking Strategy
Comprehensive mocking for:
- Material-UI components
- FontAwesome icons
- Quill editor
- File operations
- External component libraries

## Build Process

### Webpack Configuration
- Multi-entry point setup for different applications
- Environment-specific configurations
- Dynamic public path configuration
- Bundle optimization with code splitting
- CSS extraction and minification
- Development server with hot reloading

### Environment Support
- Development (local)
- Staging
- UAT (User Acceptance Testing)
- Production
- Demo
- Beta

## Architecture Patterns

### State Management
- Redux for global state
- React Context for specific app states
- Custom hooks for shared logic

### Code Organization
- Feature-based directory structure in v1
- Modular app-based structure in v2
- Shared utilities and components
- Service layer for API interactions

### Component Strategy
- Reusable component library
- App-specific components
- Layout and page components
- Widget system for modular features

## Development Guidelines

### Prerequisites
1. Install pnpm globally: `npm install -g pnpm`
2. Create `config.json` file (ask development team)
3. Create `.npmrc` file with GitHub package registry credentials
4. Install dependencies: `pnpm install`

### Local Development
1. Configure `src/clink-components.js` for local component development
2. Use development server: `pnpm start`
3. Follow ESLint Airbnb rules for code formatting
4. Write tests for new features

### Deployment
- Automated builds for different environments
- S3 deployment for static assets
- Environment-specific bundle paths

## Migration Strategy (V1 to V2)

The project supports both v1 (legacy) and v2 (modern) applications:
- V1: Feature-based organization, legacy patterns
- V2: Modern React patterns, modular architecture
- Gradual migration path from v1 to v2
- Shared utilities and components between versions

This documentation provides a comprehensive overview of the project structure and development practices for the React Service V2 project.
