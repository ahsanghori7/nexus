import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from './index';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('v2/helpers/php-globals', () => ({
    PHPAppClinkGloblals: jest.fn(() => ({ isCostPlaningTool: false })),
}));

jest.mock('v2/hooks/useDeepCompareEffect', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('v2/helpers/url', () => ({
    getQueryStringVars: jest.fn(() => ({})),
}));

jest.mock('lodash/isEmpty', () => ({
    __esModule: true,
    default: jest.fn((obj) => Object.keys(obj).length === 0),
}));

jest.mock('react-router-dom', () => ({
    useParams: jest.fn(() => ({})),
    useLocation: jest.fn(() => ({ pathname: '/test' })),
}));

jest.mock('react-redux', () => ({
    connect: jest.fn(() => (component) => component),
}));

jest.mock('hooks/context', () => ({
    useContext: jest.fn(() => ({
        actions: {
            setBreadcrumbs: jest.fn(),
            fetchProjectGantt: jest.fn(),
            fetchProject: jest.fn(),
            setLoaded: jest.fn(),
            resetProject: jest.fn(),
        },
    })),
}));

// Direct mocks for MUI components
jest.mock('@mui/material/Container', () => ({
    __esModule: true,
    default: ({ children }) => <div data-testid="container">{children}</div>,
}));

jest.mock('@mui/material/Box', () => ({
    __esModule: true,
    default: ({ children }) => <div data-testid="box">{children}</div>,
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
    useLocation: () => ({ pathname: '/' }),
}));

jest.mock('clink-components', () => ({
    CONSTANTS: {
        colors: {
            general: {
                clinkBackgroundPurple: '#E6E6FA',
            },
        },
    },
}));

jest.mock('./ClinkBreadcrumbs', () => ({
    __esModule: true,
    default: ({ title }) => <div>ClinkBreadcrumbs: {title}</div>,
}));

jest.mock('./navbar', () => ({
    __esModule: true,
    default: () => <div>NavBar</div>,
}));

jest.mock('./sidebar', () => ({
    __esModule: true,
    default: () => <div>Sidebar</div>,
}));

jest.mock('./ScrollToTop', () => ({
    __esModule: true,
    default: () => <div>ScrollToTop</div>,
}));


describe('Layout', () => {
  it('renders without crashing', () => {
    const mockLayout = {
      breadcrumbs: [],
      slugHack: '',
      projectNameHack: '',
      projectLoaded: false,
    };
    const mockDispatch = jest.fn();
    render(
        <MemoryRouter>
            <Layout layout={mockLayout} dispatch={mockDispatch} />
        </MemoryRouter>
    );
    // Check for a basic element or text that should be present
    expect(screen.getByText(/ClinkBreadcrumbs:\s*/)).toBeInTheDocument();
  });
});
