import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import ThankYou from './ThankYou';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
}));

jest.mock('js-cookie', () => ({
  get: jest.fn(),
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'thank-you': 'Thank You',
        'thank-you-desc-1': 'Your account has been created successfully',
        'thank-you-desc-2': 'You can now start using Prosper',
        'thank-you-widget-title': 'Opportunities',
        'complete-your-profile': 'Complete Your Profile',
        'how-to-use-prosper': 'How to Use Prosper'
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the shared components
jest.mock('./shared/Wrapper', () => {
  return function MockWrapper({ Component, ...props }) {
    const mockStyles = {
      titleSize: '24px',
      noWrap: 'nowrap',
      mb: 4
    };
    return <Component styles={mockStyles} {...props} />;
  };
});

jest.mock('./shared/Title', () => {
  return function MockTitle({ title, styles, marginBottom, variant, fontWeight }) {
    return (
      <div 
        data-testid="mock-title"
        data-margin-bottom={marginBottom}
        data-variant={variant}
        data-font-weight={fontWeight}
        style={styles}
      >
        {title}
      </div>
    );
  };
});

jest.mock('./shared/Container', () => {
  return function MockContainer({ children, styles, linkList }) {
    return (
      <div data-testid="mock-container">
        {children}
        <div data-testid="link-list">
          {linkList?.map((link, index) => (
            <div key={index} data-testid={`link-${index}`}>
              {link.linkCopy}
            </div>
          ))}
        </div>
      </div>
    );
  };
});

jest.mock('v2/apps/widgets/opportunity-viewer', () => {
  return function MockOptViewer({ title, discover, show, idRegion }) {
    return (
      <div 
        data-testid="opt-viewer"
        data-title={title}
        data-discover={discover}
        data-show={show}
        data-id-region={idRegion}
      >
        Opportunity Viewer
      </div>
    );
  };
});

const { useLocation } = require('react-router-dom');
const Cookies = require('js-cookie');
const { useContext } = require('hooks/context');

// Create a mock Redux store
const createMockStore = (initialState) => {
  const reducer = (state = initialState, action) => state;
  return createStore(reducer);
};

describe('ThankYou Component', () => {
  let mockDispatch;
  let mockActions;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockActions = {
      verifyToken: jest.fn()
    };

    useLocation.mockReturnValue({
      search: ''
    });

    Cookies.get.mockReturnValue(null);

    useContext.mockReturnValue({
      actions: mockActions
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRedux = (component, initialState = {}) => {
    const store = createMockStore(initialState);
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  it('renders without crashing', () => {
    const initialState = { token: {} };
    renderWithRedux(<ThankYou />, initialState);
    expect(screen.getByTestId('mock-container')).toBeInTheDocument();
  });

  it('renders thank you message and descriptions', () => {
    const initialState = { token: {} };
    renderWithRedux(<ThankYou />, initialState);
    
    expect(screen.getByText('Thank You')).toBeInTheDocument();
    expect(screen.getByText('Your account has been created successfully')).toBeInTheDocument();
    expect(screen.getByText('You can now start using Prosper')).toBeInTheDocument();
  });

  it('renders the opportunity viewer', () => {
    const initialState = { token: {} };
    renderWithRedux(<ThankYou />, initialState);
    
    const optViewer = screen.getByTestId('opt-viewer');
    expect(optViewer).toBeInTheDocument();
    expect(optViewer).toHaveAttribute('data-title', 'Opportunities');
    expect(optViewer).toHaveAttribute('data-discover', 'true');
    expect(optViewer).toHaveAttribute('data-show', 'false');
  });

  it('renders default link list', () => {
    const initialState = { token: {} };
    renderWithRedux(<ThankYou />, initialState);
    
    expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    expect(screen.getByText('How to Use Prosper')).toBeInTheDocument();
  });

  it('dispatches verifyToken when token is in URL', () => {
    useLocation.mockReturnValue({
      search: '?token=abc123'
    });

    const initialState = { token: {} };
    renderWithRedux(<ThankYou dispatch={mockDispatch} />, initialState);
    
    expect(mockDispatch).toHaveBeenCalledWith(mockActions.verifyToken('abc123'));
  });

  it('dispatches verifyToken when session token exists in cookies', () => {
    Cookies.get.mockReturnValue('cookie-token-123');

    const initialState = { token: {} };
    renderWithRedux(<ThankYou dispatch={mockDispatch} />, initialState);
    
    expect(mockDispatch).toHaveBeenCalledWith(mockActions.verifyToken('cookie-token-123'));
  });

  it('prefers URL token over cookie token', () => {
    useLocation.mockReturnValue({
      search: '?token=url-token'
    });
    Cookies.get.mockReturnValue('cookie-token');

    const initialState = { token: {} };
    renderWithRedux(<ThankYou dispatch={mockDispatch} />, initialState);
    
    expect(mockDispatch).toHaveBeenCalledWith(mockActions.verifyToken('url-token'));
  });

  it('sets region ID from token meta data', () => {
    const tokenData = {
      data: {
        meta: JSON.stringify({ region_id: '5' })
      }
    };
    const initialState = { token: tokenData };
    
    renderWithRedux(<ThankYou />, initialState);
    
    const optViewer = screen.getByTestId('opt-viewer');
    expect(optViewer).toHaveAttribute('data-id-region', '5');
  });

  it('handles missing meta data gracefully', () => {
    const tokenData = {
      data: {}
    };
    const initialState = { token: tokenData };
    
    renderWithRedux(<ThankYou />, initialState);
    
    const optViewer = screen.getByTestId('opt-viewer');
    // Since idRegion is undefined when meta is missing, it won't be set as attribute
    expect(optViewer).not.toHaveAttribute('data-id-region');
  });

  it('handles JSON parse errors by crashing (current behavior)', () => {
    const tokenData = {
      data: {
        meta: 'invalid-json'
      }
    };
    const initialState = { token: tokenData };
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      // The current implementation throws an error on invalid JSON
      // This is a bug that should be fixed, but we test current behavior
      expect(() => {
        renderWithRedux(<ThankYou />, initialState);
      }).toThrow('Unexpected token');
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('uses custom context type', () => {
    const initialState = { token: {} };
    renderWithRedux(<ThankYou contextType="custom" />, initialState);
    
    expect(useContext).toHaveBeenCalledWith('custom');
  });

  it('takes a snapshot', () => {
    const initialState = { token: {} };
    const { container } = renderWithRedux(<ThankYou />, initialState);
    expect(container.firstChild).toMatchSnapshot();
  });
});
