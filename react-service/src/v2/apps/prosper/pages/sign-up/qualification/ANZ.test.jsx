import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ANZQualification from './ANZ';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to, style }) => (
    <a href={to} style={style} data-testid="react-link">
      {children}
    </a>
  ),
}));

jest.mock('v2/helpers/region', () => ({
  NZ: { code: 'NZ', name: 'New Zealand' },
  AUS: { code: 'AU', name: 'Australia' },
}));

// Mock shared components
jest.mock('v2/apps/prosper/pages/sign-up/shared/Wrapper', () => 
  ({ Component, ...props }) => <Component styles={{ mb: 16, titleSize: '24px', noWrap: 'nowrap', bottomMt: '20px' }} {...props} />
);

jest.mock('v2/apps/prosper/pages/sign-up/shared/Container', () => 
  ({ children, styles }) => (
    <div data-testid="container">
      {children}
    </div>
  )
);

jest.mock('v2/apps/prosper/pages/sign-up/shared/Title', () => 
  ({ title, styles, marginBottom, variant }) => (
    <div data-testid="title">
      <span data-testid="title-text">{title}</span>
      <span data-testid="title-variant">{variant || 'default'}</span>
      <span data-testid="title-margin">{marginBottom}</span>
      <span data-testid="title-styles">{JSON.stringify(styles)}</span>
    </div>
  )
);

// Mock global variables
global.BASE_URLS = {
  SIGN_UP: '/sign-up',
};

describe('ANZQualification Component', () => {
  const defaultStyles = {
    mb: 16,
    titleSize: '24px',
    noWrap: 'nowrap',
    bottomMt: '20px',
  };

  const defaultProps = {
    styles: defaultStyles,
    codeRegion: null,
    setCodeRegion: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    render(
      <BrowserRouter>
        <ANZQualification {...defaultProps} />
      </BrowserRouter>
    );

    // Check if country selection title is rendered
    const titleElements = screen.getAllByTestId('title-text');
    expect(titleElements[0]).toHaveTextContent('which-country');
    
    // Check if qualification title is rendered
    expect(titleElements[1]).toHaveTextContent('qualification');
    
    // Check if country buttons are rendered
    expect(screen.getByRole('button', { name: 'New Zealand' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Australia' })).toBeInTheDocument();
    
    // Check if domestic button is rendered
    expect(screen.getByRole('button', { name: 'domestic' })).toBeInTheDocument();
    
    // Check if continue/commercial button is rendered (should say 'commercial' initially)
    expect(screen.getByRole('button', { name: 'commercial' })).toBeInTheDocument();
    
    // Check if domestic warning is NOT rendered initially
    expect(screen.queryByText('only-commercial')).not.toBeInTheDocument();
  });

  it('applies correct styles to titles', () => {
    render(
      <BrowserRouter>
        <ANZQualification {...defaultProps} />
      </BrowserRouter>
    );

    const titleStyles = screen.getAllByTestId('title-styles');
    const titleMargins = screen.getAllByTestId('title-margin');
    
    // Both main titles should have the same styles
    expect(JSON.parse(titleStyles[0].textContent)).toEqual({
      fontSize: '24px',
      whiteSpace: 'nowrap',
    });
    expect(JSON.parse(titleStyles[1].textContent)).toEqual({
      fontSize: '24px',
      whiteSpace: 'nowrap',
    });

    // Both should have half margin
    expect(titleMargins[0].textContent).toBe('8'); // mb * 0.5 = 16 * 0.5 = 8
    expect(titleMargins[1].textContent).toBe('8');
  });

  it('handles country selection for New Zealand', () => {
    render(
      <BrowserRouter>
        <ANZQualification {...defaultProps} />
      </BrowserRouter>
    );

    const nzButton = screen.getByRole('button', { name: 'New Zealand' });
    fireEvent.click(nzButton);

    expect(defaultProps.setCodeRegion).toHaveBeenCalledWith({ code: 'NZ', name: 'New Zealand' });
  });

  it('handles country selection for Australia', () => {
    render(
      <BrowserRouter>
        <ANZQualification {...defaultProps} />
      </BrowserRouter>
    );

    const ausButton = screen.getByRole('button', { name: 'Australia' });
    fireEvent.click(ausButton);

    expect(defaultProps.setCodeRegion).toHaveBeenCalledWith({ code: 'AU', name: 'Australia' });
  });

  it('shows correct button design when NZ is selected', () => {
    const propsWithNZ = {
      ...defaultProps,
      codeRegion: { code: 'NZ', name: 'New Zealand' },
    };

    render(
      <BrowserRouter>
        <ANZQualification {...propsWithNZ} />
      </BrowserRouter>
    );

    const nzButton = screen.getByRole('button', { name: 'New Zealand' });
    const ausButton = screen.getByRole('button', { name: 'Australia' });

    expect(nzButton).toHaveAttribute('design', 'red');
    expect(ausButton).toHaveAttribute('design', 'reverse');
  });

  it('shows correct button design when Australia is selected', () => {
    const propsWithAus = {
      ...defaultProps,
      codeRegion: { code: 'AU', name: 'Australia' },
    };

    render(
      <BrowserRouter>
        <ANZQualification {...propsWithAus} />
      </BrowserRouter>
    );

    const nzButton = screen.getByRole('button', { name: 'New Zealand' });
    const ausButton = screen.getByRole('button', { name: 'Australia' });

    expect(nzButton).toHaveAttribute('design', 'reverse');
    expect(ausButton).toHaveAttribute('design', 'red');
  });

  it('shows domestic warning and hides domestic button when domestic is selected', () => {
    const propsWithRegion = {
      ...defaultProps,
      codeRegion: { code: 'AU', name: 'Australia' },
    };

    render(
      <BrowserRouter>
        <ANZQualification {...propsWithRegion} />
      </BrowserRouter>
    );

    // Click the domestic button
    fireEvent.click(screen.getByRole('button', { name: 'domestic' }));

    // Check that domestic warning appears
    const titleElements = screen.getAllByTestId('title-text');
    expect(titleElements.some(el => el.textContent === 'only-commercial')).toBe(true);
    
    // Check that domestic button is no longer visible
    expect(screen.queryByRole('button', { name: 'domestic' })).not.toBeInTheDocument();
    
    // Check that the continue button now says 'continue'
    expect(screen.getByRole('button', { name: 'continue' })).toBeInTheDocument();
  });

  it('updates button text when domestic state changes', () => {
    const propsWithRegion = {
      ...defaultProps,
      codeRegion: { code: 'AU', name: 'Australia' },
    };

    render(
      <BrowserRouter>
        <ANZQualification {...propsWithRegion} />
      </BrowserRouter>
    );

    // Initially should show 'commercial'
    expect(screen.getByRole('button', { name: 'commercial' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'continue' })).not.toBeInTheDocument();

    // Click domestic button
    fireEvent.click(screen.getByRole('button', { name: 'domestic' }));

    // Should now show 'continue'
    expect(screen.getByRole('button', { name: 'continue' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'commercial' })).not.toBeInTheDocument();
  });

  it('disables buttons when no region is selected', () => {
    render(
      <BrowserRouter>
        <ANZQualification {...defaultProps} />
      </BrowserRouter>
    );

    const domesticButton = screen.getByRole('button', { name: 'domestic' });
    const commercialButton = screen.getByRole('button', { name: 'commercial' });

    expect(domesticButton).toBeDisabled();
    expect(commercialButton).toBeDisabled();
  });

  it('enables buttons when region is selected', () => {
    const propsWithRegion = {
      ...defaultProps,
      codeRegion: { code: 'AU', name: 'Australia' },
    };

    render(
      <BrowserRouter>
        <ANZQualification {...propsWithRegion} />
      </BrowserRouter>
    );

    const domesticButton = screen.getByRole('button', { name: 'domestic' });
    expect(domesticButton).not.toBeDisabled();
  });

  it('renders link when region is selected and not disabled', () => {
    const propsWithRegion = {
      ...defaultProps,
      codeRegion: { code: 'AU', name: 'Australia' },
    };

    render(
      <BrowserRouter>
        <ANZQualification {...propsWithRegion} />
      </BrowserRouter>
    );

    const link = screen.getByTestId('react-link');
    expect(link).toHaveAttribute('href', '/sign-up/form');
    expect(link).toHaveStyle('text-decoration: none');
  });

  it('does not render link when no region is selected', () => {
    render(
      <BrowserRouter>
        <ANZQualification {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.queryByTestId('react-link')).not.toBeInTheDocument();
  });

  it('changes grid justification based on domestic state', () => {
    const propsWithRegion = {
      ...defaultProps,
      codeRegion: { code: 'AU', name: 'Australia' },
    };

    render(
      <BrowserRouter>
        <ANZQualification {...propsWithRegion} />
      </BrowserRouter>
    );

    // Find the grid container for buttons
    const buttonContainer = screen.getByRole('button', { name: 'commercial' }).closest('[justifycontent]');
    
    // Initially should have space-evenly justification
    expect(buttonContainer).toHaveAttribute('justifycontent', 'space-evenly');

    // Click domestic button
    fireEvent.click(screen.getByRole('button', { name: 'domestic' }));

    // Should now have start justification
    const newButtonContainer = screen.getByRole('button', { name: 'continue' }).closest('[justifycontent]');
    expect(newButtonContainer).toHaveAttribute('justifycontent', 'start');
  });

  it('applies correct variant to domestic warning title', () => {
    const propsWithRegion = {
      ...defaultProps,
      codeRegion: { code: 'AU', name: 'Australia' },
    };

    render(
      <BrowserRouter>
        <ANZQualification {...propsWithRegion} />
      </BrowserRouter>
    );

    // Click domestic button to show warning
    fireEvent.click(screen.getByRole('button', { name: 'domestic' }));

    // Check that the warning title has 'normal' variant
    const titleVariants = screen.getAllByTestId('title-variant');
    expect(titleVariants.some(el => el.textContent === 'normal')).toBe(true);
  });

  it('applies correct margin to domestic warning title', () => {
    const propsWithRegion = {
      ...defaultProps,
      codeRegion: { code: 'AU', name: 'Australia' },
    };

    render(
      <BrowserRouter>
        <ANZQualification {...propsWithRegion} />
      </BrowserRouter>
    );

    // Click domestic button to show warning
    fireEvent.click(screen.getByRole('button', { name: 'domestic' }));

    // Check that the warning title has correct margin
    const titleMargins = screen.getAllByTestId('title-margin');
    expect(titleMargins.some(el => el.textContent === '16')).toBe(true); // full mb value
  });

  it('sets maxWidth on button containers', () => {
    render(
      <BrowserRouter>
        <ANZQualification {...defaultProps} />
      </BrowserRouter>
    );

    const countryButtonContainer = screen.getByRole('button', { name: 'New Zealand' }).closest('[maxwidth]');
    const qualificationButtonContainer = screen.getByRole('button', { name: 'domestic' }).closest('[maxwidth]');
    
    expect(countryButtonContainer).toHaveAttribute('maxwidth', '350');
    expect(qualificationButtonContainer).toHaveAttribute('maxwidth', '350');
  });
});

describe('QualificationStep', () => {
  it('wraps ANZQualification with Wrapper component', () => {
    const props = { customProp: 'test', setCodeRegion: jest.fn() };
    
    render(
      <BrowserRouter>
        <ANZQualification {...props} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('container')).toBeInTheDocument();
    const titleElements = screen.getAllByTestId('title-text');
    expect(titleElements[0]).toHaveTextContent('which-country');
  });
});