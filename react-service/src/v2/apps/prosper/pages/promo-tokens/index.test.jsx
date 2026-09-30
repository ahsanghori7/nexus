import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import PromoToken from './index';

// Mock @mui/material/styles
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    palette: {
      primary: {
        main: '#1976d2',
      },
      error: {
        main: '#d32f2f',
      },
    },
  }),
  ThemeProvider: jest.requireActual('@mui/material/styles').ThemeProvider,
  createTheme: jest.requireActual('@mui/material/styles').createTheme,
}));

// Mock react-redux
jest.mock('react-redux', () => ({
  connect: jest.fn((mapStateToProps) => (component) => component),
  useDispatch: () => jest.fn(),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'provided-token-success': 'Token validation successful',
        'provided-token-error': 'Token validation failed',
        'token-award': 'Token award: {{count}}'
      };
      if (options?.count) {
        return translations[key]?.replace('{{count}}', options.count) || key;
      }
      return translations[key] || key;
    }
  })
}));

// Mock hooks/context
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      checkToken: jest.fn(() => ({ type: 'CHECK_TOKEN' })),
    }
  }))
}));

// Mock v2/helpers/url
jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: jest.fn(() => ({
    token: 'test-token-123'
  }))
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  Image: ({ src, ...props }) => <img src={src} {...props} alt="Mock image" />,
  CONSTANTS: {
    s3: {
      prosperLogoFull: 'https://example.com/logo.png'
    }
  }
}));

// Mock Loading component
jest.mock('v2/apps/shared/components/Loading', () => ({ status }) => (
  <div data-testid="loading">{status}</div>
));

// Mock styled components
jest.mock('./styled', () => ({
  StyledPromoTokens: ({ children }) => <div data-testid="styled-promo-tokens">{children}</div>,
  StyledSubPanel: ({ children }) => <div data-testid="styled-sub-panel">{children}</div>,
  StyledH1: ({ children }) => <h1 data-testid="styled-h1">{children}</h1>,
}));

// Create a mock theme
const mockTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    error: {
      main: '#d32f2f',
    },
  },
});

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('PromoToken Component', () => {
  const defaultProps = {
    token: {
      tokenAward: 100,
      loading: false,
      success: true,
    },
    isValid: false,
    contextType: 'prosper',
    dispatch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    renderWithTheme(<PromoToken {...defaultProps} />);
    expect(screen.getByTestId('styled-promo-tokens')).toBeInTheDocument();
  });

  it('should display the prosper logo', () => {
    renderWithTheme(<PromoToken {...defaultProps} />);
    const logo = screen.getByAltText('Mock image');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('should display the main heading', () => {
    renderWithTheme(<PromoToken {...defaultProps} />);
    expect(screen.getByTestId('styled-h1')).toBeInTheDocument();
    expect(screen.getByText('Promo Tokens')).toBeInTheDocument();
  });

  it('should show loading component when loading is true', () => {
    const loadingProps = {
      ...defaultProps,
      token: {
        ...defaultProps.token,
        loading: true,
      }
    };
    renderWithTheme(<PromoToken {...loadingProps} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Checking token')).toBeInTheDocument();
  });

  it('should show success message when token is valid', () => {
    const successProps = {
      ...defaultProps,
      token: {
        ...defaultProps.token,
        loading: false,
        success: true,
        tokenAward: 150,
      }
    };
    renderWithTheme(<PromoToken {...successProps} />);
    
    expect(screen.getByText('Token validation successful')).toBeInTheDocument();
    expect(screen.getByText(/Token award: 150/)).toBeInTheDocument();
  });

  it('should show error message when token is invalid', () => {
    const errorProps = {
      ...defaultProps,
      token: {
        ...defaultProps.token,
        loading: false,
        success: false,
      }
    };
    renderWithTheme(<PromoToken {...errorProps} />);
    
    expect(screen.getByText('Token validation failed')).toBeInTheDocument();
  });

  it('should have correct structure with styled components', () => {
    renderWithTheme(<PromoToken {...defaultProps} />);
    
    expect(screen.getByTestId('styled-promo-tokens')).toBeInTheDocument();
    expect(screen.getByTestId('styled-sub-panel')).toBeInTheDocument();
    expect(screen.getByTestId('styled-h1')).toBeInTheDocument();
  });

  it('should handle different contextType prop', () => {
    const customProps = {
      ...defaultProps,
      contextType: 'custom',
    };
    renderWithTheme(<PromoToken {...customProps} />);
    expect(screen.getByTestId('styled-promo-tokens')).toBeInTheDocument();
  });

  it('should display token award amount correctly', () => {
    const awardProps = {
      ...defaultProps,
      token: {
        ...defaultProps.token,
        tokenAward: 250,
        success: true,
      }
    };
    renderWithTheme(<PromoToken {...awardProps} />);
    
    // Check for the part of the text and the bold number separately
    expect(screen.getByText((content, element) => {
      return content.includes('Token award: 250') && element.tagName.toLowerCase() === 'div';
    })).toBeInTheDocument();
    
    // Check for the bold number
    expect(screen.getByText((content, element) => {
      return content === '250' && element.tagName.toLowerCase() === 'b';
    })).toBeInTheDocument();
  });
});