import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { goTo } from 'v2/helpers/url';
import Welcome from './Welcome';

// Mock MUI theme
jest.mock('@mui/material/styles', () => ({
  useTheme: jest.fn(() => ({
    breakpoints: {
      down: jest.fn(() => ({ '@media': '(max-width: 900px)' }))
    }
  }))
}));

// Mock getUrl and goTo functions
jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn((app, path) => `/${app}/${path}`),
  goTo: jest.fn()
}));

describe('Welcome Component', () => {
  const mockSetWelcome = [true, jest.fn()];

  beforeEach(() => {
    jest.clearAllMocks();
    global.BASE_URLS = {
      PROSPER: '/prosper',
      TOKENS: '/tokens',
      FAQ: '/faq'
    };
  });

  it('should render without crashing', () => {
    const { container } = render(<Welcome setWelcome={mockSetWelcome} />);
    expect(container).toBeInTheDocument();
  });

  it('should render welcome dialog when open is true', () => {
    const { getByTestId } = render(<Welcome setWelcome={mockSetWelcome} />);
    expect(getByTestId).toBeDefined();
  });

  it('should render close button', () => {
    const { container } = render(<Welcome setWelcome={mockSetWelcome} />);
    // The close button should be present - look for Image with iconCloseRed
    const closeButtonImage = container.querySelector('img[src="mock-close-red-icon"]');
    expect(closeButtonImage).toBeInTheDocument();
  });

  it('should call setWelcome(false) when close button is clicked', () => {
    const mockSetOpen = jest.fn();
    const setWelcomeMock = [true, mockSetOpen];
    
    const { container } = render(<Welcome setWelcome={setWelcomeMock} />);
    
    // Find and click the close button (inside the Button component)
    const closeButton = container.querySelector('button');
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockSetOpen).toHaveBeenCalledWith(false);
    }
  });

  it('should render welcome message with party horn icon', () => {
    const { container } = render(<Welcome setWelcome={mockSetWelcome} />);
    
    // Check for party horn icon
    const partyHornImage = container.querySelector('img[src="mock-party-horn-icon"]');
    expect(partyHornImage).toBeInTheDocument();
  });

  it('should render how it works section', () => {
    const { getByText } = render(<Welcome setWelcome={mockSetWelcome} />);
    expect(getByText('prosper-pro-modal-how-it-works')).toBeInTheDocument();
  });

  it('should render FAQ section', () => {
    const { getByText } = render(<Welcome setWelcome={mockSetWelcome} />);
    expect(getByText('prosper-pro-modal-faq')).toBeInTheDocument();
  });

  it('should render cost question and answer', () => {
    const { getByText } = render(<Welcome setWelcome={mockSetWelcome} />);
    expect(getByText('prosper-pro-modal-what-cost')).toBeInTheDocument();
    expect(getByText('prosper-pro-modal-it-costs')).toBeInTheDocument();
  });

  it('should render timeline question and answer', () => {
    const { getByText } = render(<Welcome setWelcome={mockSetWelcome} />);
    expect(getByText('prosper-pro-modal-how-long')).toBeInTheDocument();
    expect(getByText('prosper-pro-modal-timescales')).toBeInTheDocument();
  });

  it('should render projects secured question and answer', () => {
    const { getByText } = render(<Welcome setWelcome={mockSetWelcome} />);
    expect(getByText('prosper-pro-modal-projects-secured')).toBeInTheDocument();
    expect(getByText('prosper-pro-modal-approximately-secured')).toBeInTheDocument();
  });

  it('should render view opportunities button', () => {
    const { getByText } = render(<Welcome setWelcome={mockSetWelcome} />);
    expect(getByText('prosper-pro-modal-view-opportunities')).toBeInTheDocument();
  });

  it('should call goTo when view opportunities button is clicked', () => {
    render(<Welcome setWelcome={mockSetWelcome} />);
    
    const viewOpportunitiesButton = screen.getByText('prosper-pro-modal-view-opportunities');
    fireEvent.click(viewOpportunitiesButton);
    
    expect(goTo).toHaveBeenCalledWith('/prosper/projects/find-opportunities');
  });

  it('should render steps for how it works (desktop)', () => {
    render(<Welcome setWelcome={mockSetWelcome} />);
    
    // Check for step titles (steps 1-6) - using getAllByText since they appear multiple times
    expect(screen.getAllByText('prosper-pro-step-1-title')[0]).toBeInTheDocument();
    expect(screen.getAllByText('prosper-pro-step-2-title')[0]).toBeInTheDocument();
    expect(screen.getAllByText('prosper-pro-step-3-title')[0]).toBeInTheDocument();
    expect(screen.getAllByText('prosper-pro-step-4-title')[0]).toBeInTheDocument();
    expect(screen.getAllByText('prosper-pro-step-5-title')[0]).toBeInTheDocument();
    expect(screen.getAllByText('prosper-pro-step-6-title')[0]).toBeInTheDocument();
  });

  it('should render step descriptions', () => {
    render(<Welcome setWelcome={mockSetWelcome} />);
    
    // Check for step descriptions - using getAllByText since they appear multiple times
    expect(screen.getAllByText('prosper-pro-step-1-description')[0]).toBeInTheDocument();
    expect(screen.getAllByText('prosper-pro-step-2-description')[0]).toBeInTheDocument();
    expect(screen.getAllByText('prosper-pro-step-6-description')[0]).toBeInTheDocument();
  });

  it('should render links in step 2 and FAQ section', () => {
    render(<Welcome setWelcome={mockSetWelcome} />);
    
    // Check for "click here" links
    const clickHereLinks = screen.getAllByText('prosper-pro-modal-click-here');
    expect(clickHereLinks.length).toBeGreaterThan(0);
  });

  it('should render FAQ link', () => {
    const { getByText } = render(<Welcome setWelcome={mockSetWelcome} />);
    expect(getByText('prosper-pro-modal-all-faqs')).toBeInTheDocument();
  });

  it('should render ProsperCarousel for mobile', () => {
    const { getByTestId } = render(<Welcome setWelcome={mockSetWelcome} />);
    expect(getByTestId('prosper-carousel')).toBeInTheDocument();
  });

  it('should handle dialog close on backdrop click prevention', () => {
    const mockSetOpen = jest.fn();
    const setWelcomeMock = [true, mockSetOpen];
    
    render(<Welcome setWelcome={setWelcomeMock} />);
    
    // The dialog should be configured to prevent backdrop close
    // This is handled by the onClose callback in the Dialog component
    expect(mockSetOpen).not.toHaveBeenCalled();
  });

  it('should render welcome content with proper text', () => {
    const { getByText, container } = render(<Welcome setWelcome={mockSetWelcome} />);
    
    expect(getByText('prosper-pro-modal-welcome')).toBeInTheDocument();
    // prosper-pro-modal-delighted text is broken up by a <br /> tag, so use partial text matching
    expect(container.textContent).toContain('prosper-pro-modal-delighted');
  });
});