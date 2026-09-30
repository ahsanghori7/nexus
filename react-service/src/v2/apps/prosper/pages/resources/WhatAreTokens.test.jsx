import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import WhatAreTokens from './WhatAreTokens';

// Mock all external dependencies

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

// Mock styled components from LandingPage.styled
jest.mock('v2/apps/shared/styled/LandingPage.styled', () => ({
  StyledWrapper: ({ children, ...props }) => <div {...props} data-testid="styled-wrapper">{children}</div>,
  StyledWrapperLeft: ({ children, ...props }) => <div {...props} data-testid="styled-wrapper-left">{children}</div>,
  StyledContentLeft: ({ children, ...props }) => <div {...props} data-testid="styled-content-left">{children}</div>,
  StyledWrapperRight: ({ children, ...props }) => <div {...props} data-testid="styled-wrapper-right">{children}</div>,
  StyledContentRight: ({ children, ...props }) => <div {...props} data-testid="styled-content-right">{children}</div>,
  StyledRed: ({ children, ...props }) => <span {...props} data-testid="styled-red">{children}</span>,
  StyledBold: ({ children, ...props }) => <strong {...props} data-testid="styled-bold">{children}</strong>,
  StyledP: ({ children, ...props }) => <p {...props} data-testid="styled-p">{children}</p>,
  StyledTitle: ({ children, ...props }) => <h1 {...props} data-testid="styled-title">{children}</h1>,
  StyledTitle2: ({ children, ...props }) => <h2 {...props} data-testid="styled-title2">{children}</h2>,
  StyledDescription: ({ children, ...props }) => <div {...props} data-testid="styled-description">{children}</div>,
  StyledDiscalimer: ({ children, ...props }) => <div {...props} data-testid="styled-disclaimer">{children}</div>,
  StyledButtonWrapper: ({ children, ...props }) => <div {...props} data-testid="styled-button-wrapper">{children}</div>,
  StyledVideoOld: ({ title, src, ...props }) => <iframe {...props} title={title} src={src} data-testid="styled-video-old" />
}));

// Mock v2/constants/wistia
jest.mock('v2/constants/wistia', () => ({
  WHAT_ARE_TOKENS: {
    B: 'https://mock-wistia.com/what-are-tokens-video'
  }
}));

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
    <div 
      data-testid="token-modal" 
      tokenprices={tokenPrices} 
      subcontractor={subcontractor}
      {...props}
    >
      {openElement}
    </div>
  );
});

jest.mock('v2/apps/prosper/shared/ButtonWrapper', () => {
  return ({ children, onClick, className, ...props }) => (
    <button 
      {...props} 
      data-testid="button-wrapper"
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  );
});

// Create a mock Redux store
const createMockStore = (initialState = {}) => {
  const defaultState = {
    subcontractor: {
      token_prices: [{ id: 1, price: 10 }],
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

describe('WhatAreTokens Component', () => {
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
    renderWithStore(<WhatAreTokens />);
    
    // Check if main wrapper is rendered
    expect(screen.getByTestId('styled-wrapper')).toBeInTheDocument();
  });

  test('renders main sections', () => {
    renderWithStore(<WhatAreTokens />);
    
    // Check if left and right wrappers are rendered
    expect(screen.getByTestId('styled-wrapper-left')).toBeInTheDocument();
    expect(screen.getByTestId('styled-wrapper-right')).toBeInTheDocument();
    
    // Check if content wrappers are rendered
    expect(screen.getByTestId('styled-content-left')).toBeInTheDocument();
    expect(screen.getByTestId('styled-content-right')).toBeInTheDocument();
  });

  test('renders left side content with video', () => {
    renderWithStore(<WhatAreTokens />);
    
    // Check for title
    const titles = screen.getAllByTestId('styled-title');
    expect(titles.length).toBeGreaterThan(0);
    
    // Check for video
    expect(screen.getByTestId('styled-video-old')).toBeInTheDocument();
    
    // Check for paragraphs
    const paragraphs = screen.getAllByTestId('styled-p');
    expect(paragraphs.length).toBeGreaterThan(0);
    
    // Check for bold text
    const boldElements = screen.getAllByTestId('styled-bold');
    expect(boldElements.length).toBeGreaterThan(0);
    
    // Check for red text
    const redElements = screen.getAllByTestId('styled-red');
    expect(redElements.length).toBeGreaterThan(0);
  });

  test('renders right side FAQ content', () => {
    renderWithStore(<WhatAreTokens />);
    
    // Check for FAQ title
    const titles = screen.getAllByTestId('styled-title');
    expect(titles.length).toBeGreaterThan(0);
    
    // Check for FAQ question headers (StyledTitle2)
    const questionHeaders = screen.getAllByTestId('styled-title2');
    expect(questionHeaders.length).toBe(4); // 4 FAQ questions
    
    // Check for FAQ answers (StyledDescription)
    const answers = screen.getAllByTestId('styled-description');
    expect(answers.length).toBe(4); // 4 FAQ answers
    
    // Check for disclaimer
    expect(screen.getByTestId('styled-disclaimer')).toBeInTheDocument();
  });

  test('renders token purchase section', () => {
    renderWithStore(<WhatAreTokens />);
    
    // Check for button wrapper
    expect(screen.getByTestId('styled-button-wrapper')).toBeInTheDocument();
    
    // Check for token modal
    expect(screen.getByTestId('token-modal')).toBeInTheDocument();
    
    // Check for button
    expect(screen.getByTestId('button-wrapper')).toBeInTheDocument();
  });

  test('displays correct button text based on canClaimFreeTokens flag', () => {
    // Test with canClaimFreeTokens = false (default)
    renderWithStore(<WhatAreTokens />);
    expect(screen.getByText('buy-tokens-now')).toBeInTheDocument();
    
    // Test with canClaimFreeTokens = true
    const storeWithFreeTokens = createMockStore({
      subcontractor: {
        canClaimFreeTokens: true,
        token_prices: [{ id: 1, price: 10 }]
      }
    });
    
    const { rerender } = renderWithStore(<WhatAreTokens />, storeWithFreeTokens);
    expect(screen.getByText('claim-free-token')).toBeInTheDocument();
  });

  test('renders video with correct source', () => {
    renderWithStore(<WhatAreTokens />);
    
    const video = screen.getByTestId('styled-video-old');
    expect(video).toHaveAttribute('src', 'https://mock-wistia.com/what-are-tokens-video');
    expect(video).toHaveAttribute('title', 'prosper-enquiries');
  });

  test('uses translation keys correctly', () => {
    renderWithStore(<WhatAreTokens />);
    
    // Check for main section translation keys
    expect(screen.getByText('what-are-tokens')).toBeInTheDocument();
    expect(screen.getByText('faq')).toBeInTheDocument();
    
    // Check for token description translation keys  
    expect(screen.getByText('tokens-description-1a')).toBeInTheDocument();
    expect(screen.getByText('tokens-description-1b')).toBeInTheDocument();
    expect(screen.getByText('tokens-description-2')).toBeInTheDocument();
    
    // Check for FAQ translation keys
    expect(screen.getByText('token-faq-question-1')).toBeInTheDocument();
    expect(screen.getByText('token-faq-answer-1')).toBeInTheDocument();
  });

  test('handles missing WISTIA configuration gracefully', () => {
    // Mock WISTIA as undefined
    jest.doMock('v2/constants/wistia', () => ({}));
    
    renderWithStore(<WhatAreTokens />);
    
    // Should still render but with fallback video source
    const video = screen.getByTestId('styled-video-old');
    expect(video).toBeInTheDocument();
  });

  test('component structure matches expected layout', () => {
    renderWithStore(<WhatAreTokens />);
    
    // Check the overall structure
    const wrapper = screen.getByTestId('styled-wrapper');
    expect(wrapper).toBeInTheDocument();
    
    // Check left side structure
    const leftWrapper = screen.getByTestId('styled-wrapper-left');
    const leftContent = screen.getByTestId('styled-content-left');
    expect(leftWrapper).toContainElement(leftContent);
    
    // Check right side structure
    const rightWrapper = screen.getByTestId('styled-wrapper-right');
    const rightContent = screen.getByTestId('styled-content-right');
    expect(rightWrapper).toContainElement(rightContent);
    
    // Check that video is in left content
    const video = screen.getByTestId('styled-video-old');
    expect(leftContent).toContainElement(video);
    
    // Check that FAQ content is in right content
    const faqQuestions = screen.getAllByTestId('styled-title2');
    faqQuestions.forEach(question => {
      expect(rightContent).toContainElement(question);
    });
  });

  test('token modal receives correct props', () => {
    renderWithStore(<WhatAreTokens />);
    
    const tokenModal = screen.getByTestId('token-modal');
    expect(tokenModal).toBeInTheDocument();
    
    // Check that modal has proper attributes (props get converted to attributes in our mock)
    expect(tokenModal).toHaveAttribute('tokenprices');
    expect(tokenModal).toHaveAttribute('subcontractor');
  });

  test('button has correct CSS class', () => {
    renderWithStore(<WhatAreTokens />);
    
    const button = screen.getByTestId('button-wrapper');
    expect(button).toHaveClass('buy-more-tokens');
  });
});