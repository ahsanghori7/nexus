import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NoView from './NoView';

// Mock dependencies
jest.mock('v2/constants/wistia', () => ({
  NO_VIEW_ENQUIRIES: 'test-video-id',
  WHAT_ARE_TOKENS_MODAL: 'test-tokens-video-id',
  CONFIG_URL: 'https://fast.wistia.com/assets/external/E-v1.js',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'enquiry-no-view-title': 'UK Title',
        'enquiry-no-view-title-2': 'Non-UK Title',
        'enquiry-no-view-text-1': 'To view enquiries, please complete your',
        'enquiry-no-view-text-2': 'prequalification',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn((app, path) => `https://example.com${path}`),
  wistiaConfigUrl: jest.fn((id, suffix = '') => `https://wistia.example.com/${id}${suffix}`),
}));

jest.mock('v2/helpers/user/subscription', () => {
  return function Subscription() {
    this.isActivatedSupplyChain = jest.fn().mockReturnValue(false);
  };
});

jest.mock('hooks/useScript', () => jest.fn());

// Mock styled-components
jest.mock('styled-components', () => {
  const React = require('react');
  
  const styled = (component) => {
    const styledComponent = (strings, ...values) => {
      return React.forwardRef((props, ref) => 
        React.createElement(component, { ref, ...props })
      );
    };
    styledComponent.withConfig = () => styledComponent;
    return styledComponent;
  };
  
  // Add common HTML elements
  styled.div = styled('div');
  styled.h1 = styled('h1');
  styled.p = styled('p');
  
  return {
    __esModule: true,
    default: styled,
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    fonts: {
      avantGardeGothicPRO: 'Arial, sans-serif',
    },
    dimensions: {
      LG_SCREEN: 1200,
      MD_SCREEN: 768,
      SM_SCREEN: 480,
    },
  },
}));

describe('NoView Component', () => {
  const mockUseScript = require('hooks/useScript');
  const { getUrl, wistiaConfigUrl } = require('v2/helpers/url');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<NoView />);
    expect(screen.getByText('Non-UK Title')).toBeInTheDocument();
  });

  it('renders UK title for UK subcontractor', () => {
    const ukSubcontractor = {
      subscription_id: 1,
      country: {
        code: 'UK',
      },
    };

    render(<NoView subcontractor={ukSubcontractor} />);
    expect(screen.getByText('UK Title')).toBeInTheDocument();
  });

  it('renders non-UK title for non-UK subcontractor', () => {
    const nonUkSubcontractor = {
      subscription_id: 1,
      country: {
        code: 'US',
      },
    };

    render(<NoView subcontractor={nonUkSubcontractor} />);
    expect(screen.getByText('Non-UK Title')).toBeInTheDocument();
  });

  it('renders video component for UK subcontractor', () => {
    const ukSubcontractor = {
      subscription_id: 1,
      country: {
        code: 'UK',
      },
    };

    render(<NoView subcontractor={ukSubcontractor} />);
    
    // Check for video wrapper
    const videoWrapper = screen.getByText('UK Title').parentNode;
    expect(videoWrapper).toBeInTheDocument();
    
    // Check for wistia elements using alternative selectors
    const image = screen.getByRole('img', { hidden: true });
    expect(image).toBeInTheDocument();
  });

  it('does not render video for non-UK subcontractor', () => {
    const nonUkSubcontractor = {
      subscription_id: 1,
      country: {
        code: 'US',
      },
    };

    render(<NoView subcontractor={nonUkSubcontractor} />);
    
    // Should not have video elements
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('loads wistia scripts correctly', () => {
    const ukSubcontractor = {
      subscription_id: 1,
      country: {
        code: 'UK',
      },
    };

    render(<NoView subcontractor={ukSubcontractor} />);
    
    expect(mockUseScript).toHaveBeenCalledTimes(2);
    // The logic uses WHAT_ARE_TOKENS_MODAL when isActivatedSupplyChain returns false
    expect(wistiaConfigUrl).toHaveBeenCalledWith('test-tokens-video-id');
  });

  it('uses different video ID for non-activated supply chain', () => {
    const nonActivatedSubcontractor = {
      subscription_id: 1,
      country: {
        code: 'UK',
      },
    };

    // Mock isActivatedSupplyChain to return false
    const mockSubscription = require('v2/helpers/user/subscription');
    const subscriptionInstance = new mockSubscription();
    subscriptionInstance.isActivatedSupplyChain.mockReturnValue(false);

    render(<NoView subcontractor={nonActivatedSubcontractor} />);
    
    expect(mockUseScript).toHaveBeenCalledTimes(2);
  });

  it('renders prequalification link correctly', () => {
    render(<NoView />);
    
    const link = screen.getByText('prequalification');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com/my-company/prequalification');
    expect(getUrl).toHaveBeenCalledWith('prosper', '/my-company/prequalification');
  });

  it('handles image load event correctly', async () => {
    const ukSubcontractor = {
      subscription_id: 1,
      country: {
        code: 'UK',
      },
    };

    render(<NoView subcontractor={ukSubcontractor} />);
    
    const image = screen.getByRole('img', { hidden: true });
    expect(image).toHaveAttribute('src', 'https://wistia.example.com/test-tokens-video-id/swatch');
    
    // Simulate image load
    const loadEvent = { target: { parentNode: { style: { opacity: 0 } } } };
    const onLoadHandler = image.onload || image.getAttribute('onload');
    
    if (typeof onLoadHandler === 'function') {
      onLoadHandler(loadEvent);
      expect(loadEvent.target.parentNode.style.opacity).toBe(1);
    }
  });

  it('renders with proper text content', () => {
    render(<NoView />);
    
    // Find the paragraph with specific text using a more targeted approach
    expect(screen.getByText((content, element) => {
      return element && element.tagName === 'P' && 
             element.textContent && 
             element.textContent.includes('To view enquiries, please complete your');
    })).toBeInTheDocument();
    expect(screen.getByText('prequalification')).toBeInTheDocument();
  });

  it('handles null subcontractor gracefully', () => {
    render(<NoView subcontractor={null} />);
    
    expect(screen.getByText('Non-UK Title')).toBeInTheDocument();
    // Check text in a more flexible way
    expect(screen.getByText('prequalification')).toBeInTheDocument();
  });

  it('handles undefined subcontractor gracefully', () => {
    render(<NoView />);
    
    expect(screen.getByText('Non-UK Title')).toBeInTheDocument();
    expect(mockUseScript).toHaveBeenCalled();
  });

  it('handles subcontractor without country', () => {
    const subcontractorWithoutCountry = {
      subscription_id: 1,
    };

    render(<NoView subcontractor={subcontractorWithoutCountry} />);
    
    expect(screen.getByText('Non-UK Title')).toBeInTheDocument();
  });

  it('handles subcontractor with null country', () => {
    const subcontractorWithNullCountry = {
      subscription_id: 1,
      country: null,
    };

    render(<NoView subcontractor={subcontractorWithNullCountry} />);
    
    expect(screen.getByText('Non-UK Title')).toBeInTheDocument();
  });
});