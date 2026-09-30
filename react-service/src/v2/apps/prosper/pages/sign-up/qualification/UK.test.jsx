import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UKQualification from './UK';

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

// Mock shared components
jest.mock('v2/apps/prosper/pages/sign-up/shared/Wrapper', () => 
  ({ Component, ...props }) => <Component styles={{ mb: 16, titleSize: '24px', noWrap: 'nowrap' }} {...props} />
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

describe('UKQualification Component', () => {
  const defaultStyles = {
    mb: 16,
    titleSize: '24px',
    noWrap: 'nowrap',
  };

  it('renders correctly with initial state', () => {
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
      </BrowserRouter>
    );

    // Check if title is rendered
    expect(screen.getByTestId('title-text')).toHaveTextContent('qualification');
    
    // Check if domestic button is rendered
    expect(screen.getByRole('button', { name: 'domestic' })).toBeInTheDocument();
    
    // Check if continue/commercial button is rendered (should say 'commercial' initially)
    expect(screen.getByRole('button', { name: 'commercial' })).toBeInTheDocument();
    
    // Check if domestic warning is NOT rendered initially
    expect(screen.queryByText('only-commercial')).not.toBeInTheDocument();
  });

  it('applies correct styles to main title', () => {
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
      </BrowserRouter>
    );

    const titleStyles = screen.getByTestId('title-styles');
    expect(JSON.parse(titleStyles.textContent)).toEqual({
      fontSize: '24px',
      whiteSpace: 'nowrap',
    });

    const titleMargin = screen.getByTestId('title-margin');
    expect(titleMargin.textContent).toBe('8'); // mb * 0.5 = 16 * 0.5 = 8
  });

  it('shows domestic warning and hides domestic button when domestic is selected', () => {
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
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
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
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

  it('changes grid justification based on domestic state', () => {
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
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

  it('renders link to sign-up form with correct URL', () => {
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
      </BrowserRouter>
    );

    const link = screen.getByTestId('react-link');
    expect(link).toHaveAttribute('href', '/sign-up/form');
    expect(link).toHaveStyle('text-decoration: none');
  });

  it('applies correct variant to domestic warning title', () => {
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
      </BrowserRouter>
    );

    // Click domestic button to show warning
    fireEvent.click(screen.getByRole('button', { name: 'domestic' }));

    // Check that the warning title has 'normal' variant
    const titleVariants = screen.getAllByTestId('title-variant');
    expect(titleVariants.some(el => el.textContent === 'normal')).toBe(true);
  });

  it('applies correct margin to domestic warning title', () => {
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
      </BrowserRouter>
    );

    // Click domestic button to show warning
    fireEvent.click(screen.getByRole('button', { name: 'domestic' }));

    // Check that the warning title has correct margin
    const titleMargins = screen.getAllByTestId('title-margin');
    expect(titleMargins.some(el => el.textContent === '16')).toBe(true); // full mb value
  });

  it('renders buttons with correct design attribute', () => {
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
      </BrowserRouter>
    );

    const domesticButton = screen.getByRole('button', { name: 'domestic' });
    const commercialButton = screen.getByRole('button', { name: 'commercial' });

    expect(domesticButton).toHaveAttribute('design', 'reverse');
    expect(commercialButton).toHaveAttribute('design', 'reverse');
  });

  it('maintains button design after state change', () => {
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
      </BrowserRouter>
    );

    // Click domestic button
    fireEvent.click(screen.getByRole('button', { name: 'domestic' }));

    const continueButton = screen.getByRole('button', { name: 'continue' });
    expect(continueButton).toHaveAttribute('design', 'reverse');
  });

  it('sets maxWidth on button container', () => {
    render(
      <BrowserRouter>
        <UKQualification styles={defaultStyles} />
      </BrowserRouter>
    );

    const buttonContainer = screen.getByRole('button', { name: 'commercial' }).closest('[maxwidth]');
    expect(buttonContainer).toHaveAttribute('maxwidth', '350');
  });
});

describe('QualificationStep', () => {
  it('wraps UKQualification with Wrapper component', () => {
    const props = { customProp: 'test' };
    
    render(
      <BrowserRouter>
        <UKQualification {...props} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('container')).toBeInTheDocument();
    expect(screen.getByTestId('title-text')).toHaveTextContent('qualification');
  });
});