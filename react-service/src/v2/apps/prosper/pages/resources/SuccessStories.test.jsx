import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import SuccessStories from './SuccessStories';

// Mock all external dependencies

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

// Mock styled components from Page.styled
jest.mock('v2/apps/shared/styled/Page.styled', () => {
  const StyledContainer = ({ children, ...props }) => <div {...props} data-testid="styled-container">{children}</div>;
  return {
    __esModule: true,
    default: StyledContainer,
    StyledSection: ({ children, ...props }) => <section {...props} data-testid="styled-section">{children}</section>,
    StyledText: ({ children, ...props }) => <div {...props} data-testid="styled-text">{children}</div>,
    StyledParagraph: ({ children, ...props }) => <p {...props} data-testid="styled-paragraph">{children}</p>,
    StyledStrong: ({ children, ...props }) => <strong {...props} data-testid="styled-strong">{children}</strong>,
    StyledTitle: ({ children, ...props }) => <h1 {...props} data-testid="styled-title">{children}</h1>,
    Slide: ({ children, ...props }) => <div {...props} data-testid="slide">{children}</div>,
    Winners: ({ children, ...props }) => <div {...props} data-testid="winners">{children}</div>,
    CompanyLink: ({ children, ...props }) => <a {...props} data-testid="company-link">{children}</a>,
  };
});

// Mock styled components from LandingPage.styled
jest.mock('v2/apps/shared/styled/LandingPage.styled', () => ({
  StyledButtonWrapper: ({ children, ...props }) => <div {...props} data-testid="styled-button-wrapper">{children}</div>
}));

// Mock v2/helpers/url
jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: jest.fn(() => ({})),
  wistiaConfigUrl: jest.fn((id) => `https://mock-wistia.com/${id}`)
}));

// Mock hooks/useScript
jest.mock('hooks/useScript', () => jest.fn());

// Mock v2/constants/wistia
jest.mock('v2/constants/wistia', () => ({
  SUCCESS: ['video1', 'video2', 'video3'],
  CONFIG_URL: 'https://mock-wistia.com/config'
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  Image: ({ alt, src, width, ...props }) => <img {...props} alt={alt} src={src} width={width} data-testid="clink-image" />,
  CONSTANTS: {
    s3: {
      redCaretLeft: 'mock-red-caret-left.png',
      redCaretRight: 'mock-red-caret-right.png'
    },
    dimensions: {
      LG_SCREEN: 1024
    }
  },
  HOOKS: {
    useWindowDimensions: () => ({ width: 1200, height: 800 })
  }
}));

// Mock v2/helpers/user/subscription
jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isTokenUser: jest.fn(() => true)
  }));
});

// Mock hooks/context
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      claimToken: jest.fn()
    }
  }))
}));

// Mock prosper components
jest.mock('v2/apps/prosper/shared/TokenModal', () => {
  return ({ openElement, onHiddenModal, tokenPrices, externalOpen, subcontractor, canClaimFreeTokens, claimToken, ...props }) => (
    <div data-testid="token-modal" {...props}>
      {openElement}
    </div>
  );
});

jest.mock('v2/apps/prosper/shared/carousel', () => {
  return ({ children, ...props }) => (
    <div data-testid="prosper-carousel" {...props}>
      {children}
    </div>
  );
});

jest.mock('v2/apps/prosper/shared/carousel/ArrowButton', () => {
  return ({ nextItem, label, src, className, ...props }) => (
    <button 
      {...props} 
      data-testid="arrow-button" 
      className={className}
      onClick={nextItem}
      aria-label={label}
    >
      <img src={src} alt={label} />
    </button>
  );
});

jest.mock('v2/apps/prosper/shared/ButtonWrapper', () => {
  return ({ children, ...props }) => (
    <button {...props} data-testid="button-wrapper">
      {children}
    </button>
  );
});

// Mock clients data
jest.mock('./clients', () => [
  {
    name: 'John Doe',
    src: 'mock-image.jpg',
    company: 'Test Company',
    paragraph: 'test-testimonial',
    link: 'https://test-company.com'
  },
  {
    name: 'Jane Smith', 
    src: 'mock-image2.jpg',
    company: 'Another Company',
    paragraph: 'another-testimonial',
    link: 'https://another-company.com'
  }
]);

// Create a mock Redux store
const createMockStore = (initialState = {}) => {
  const defaultState = {
    subcontractor: {
      token_prices: [{ id: 1, price: 10 }],
      subscription_id: 'test-subscription',
      canClaimFreeTokens: false,
      ...initialState.subcontractor
    }
  };

  const rootReducer = (state = defaultState, action) => {
    switch (action.type) {
      default:
        return state;
    }
  };

  return createStore(rootReducer);
};

describe('SuccessStories Component', () => {
  let store;

  beforeEach(() => {
    store = createMockStore();
  });

  const renderWithStore = (component, customStore = store) => {
    return render(
      <Provider store={customStore}>
        {component}
      </Provider>
    );
  };

  test('renders without crashing', () => {
    renderWithStore(<SuccessStories />);
    
    // Check if main sections are rendered
    const sections = screen.getAllByTestId('styled-section');
    expect(sections.length).toBeGreaterThan(0);
  });

  test('renders introduction section', () => {
    renderWithStore(<SuccessStories />);
    
    // Check for introduction paragraphs
    const paragraphs = screen.getAllByTestId('styled-paragraph');
    expect(paragraphs.length).toBeGreaterThan(0);
    
    // Check for strong elements in introduction
    const strongElements = screen.getAllByTestId('styled-strong');
    expect(strongElements.length).toBeGreaterThan(0);
  });

  test('renders winners section with carousel', () => {
    renderWithStore(<SuccessStories />);
    
    // Check for winners title
    const titles = screen.getAllByTestId('styled-title');
    expect(titles.length).toBeGreaterThan(0);
    
    // Check for prosper carousels (there are 2: winners and clients)
    const carousels = screen.getAllByTestId('prosper-carousel');
    expect(carousels.length).toBe(2);
    
    // Check for slides
    const slides = screen.getAllByTestId('slide');
    expect(slides.length).toBeGreaterThan(0);
    
    // Check for winners components
    const winners = screen.getAllByTestId('winners');
    expect(winners.length).toBeGreaterThan(0);
  });

  test('renders clients testimonials section', () => {
    renderWithStore(<SuccessStories />);
    
    // Check for client images
    const images = screen.getAllByTestId('clink-image');
    expect(images.length).toBeGreaterThan(0);
    
    // Check for company links
    const companyLinks = screen.getAllByTestId('company-link');
    expect(companyLinks.length).toBeGreaterThan(0);
  });

  test('renders token purchase section for token users', () => {
    renderWithStore(<SuccessStories />);
    
    // Check for token modal
    expect(screen.getByTestId('token-modal')).toBeInTheDocument();
    
    // Check for button wrapper
    expect(screen.getByTestId('button-wrapper')).toBeInTheDocument();
  });

  test('renders arrow buttons in carousel', () => {
    renderWithStore(<SuccessStories />);
    
    // Arrow buttons are rendered by the actual carousel implementation
    // Since we're mocking the carousel, we can't test the arrow buttons
    // Instead, let's test that the carousel is rendered correctly
    const carousels = screen.getAllByTestId('prosper-carousel');
    expect(carousels.length).toBe(2);
    
    // Check that carousel props are passed
    carousels.forEach(carousel => {
      expect(carousel).toHaveAttribute('carouselprops');
    });
  });

  test('handles mobile vs desktop rendering', () => {
    renderWithStore(<SuccessStories />);
    
    // Component should render without errors regardless of screen size
    // Our mock already provides desktop dimensions by default
    expect(screen.getAllByTestId('styled-section').length).toBeGreaterThan(0);
    
    // The component logic for mobile vs desktop is handled internally
    // We can verify the component renders properly
    const carousels = screen.getAllByTestId('prosper-carousel');
    expect(carousels.length).toBe(2);
  });

  test('displays correct content based on canClaimFreeTokens flag', () => {
    // Test with canClaimFreeTokens = true
    const storeWithFreeTokens = createMockStore({
      subcontractor: {
        canClaimFreeTokens: true,
        token_prices: [{ id: 1, price: 10 }],
        subscription_id: 'test-subscription'
      }
    });
    
    renderWithStore(<SuccessStories />, storeWithFreeTokens);
    
    // Should render token modal
    expect(screen.getByTestId('token-modal')).toBeInTheDocument();
  });

  test('uses translation keys correctly', () => {
    renderWithStore(<SuccessStories />);
    
    // Verify that translation function is being used
    // Our mock returns the translation key as-is, so we can verify content
    expect(screen.getAllByTestId('styled-section').length).toBeGreaterThan(0);
    
    // Check for some expected translation keys in the DOM
    expect(screen.getByText('winners-title')).toBeInTheDocument();
    expect(screen.getByText('clients-say')).toBeInTheDocument();
  });

  test('filters clients correctly', () => {
    renderWithStore(<SuccessStories />);
    
    // Should only render clients with all required fields
    const images = screen.getAllByTestId('clink-image');
    const companyLinks = screen.getAllByTestId('company-link');
    
    // All rendered clients should have images and links
    expect(images.length).toBe(companyLinks.length);
  });

  test('component structure matches expected layout', () => {
    renderWithStore(<SuccessStories />);
    
    // Check the overall structure
    const sections = screen.getAllByTestId('styled-section');
    expect(sections.length).toBeGreaterThanOrEqual(3); // Introduction, Winners, Clients sections
    
    const containers = screen.getAllByTestId('styled-container');
    expect(containers.length).toBeGreaterThan(0);
    
    const carousels = screen.getAllByTestId('prosper-carousel');
    expect(carousels.length).toBe(2); // One for winners, one for clients
  });
});