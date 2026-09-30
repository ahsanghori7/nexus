import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ResetPassword from './index';
import { goTo } from 'v2/helpers/url';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

global.BASE_URLS = {
  APP_CLINK: 'https://app.c-link.com',
  CLINK_HOST: 'https://c-link.com',
};

const theme = createTheme();

const TestWrapper = ({ children, initialEntries = ['/reset-password'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </MemoryRouter>
);

const renderResetPassword = (initialEntries = ['/reset-password']) =>
  render(
    <TestWrapper initialEntries={initialEntries}>
      <ResetPassword />
    </TestWrapper>
  );

describe('ResetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    goTo.mockClear();
  });

  it('renders the reset request form by default', () => {
    renderResetPassword();

    expect(screen.getByText('forgot-email')).toBeInTheDocument();
    expect(screen.getByText('forgot-submit')).toBeInTheDocument();
    expect(screen.getByText('forgot-login')).toBeInTheDocument();
    expect(screen.queryByText('forgot-reset-password')).not.toBeInTheDocument();
  });

  it('renders success content when the send query param is true', () => {
    renderResetPassword(['/reset-password?send=true']);

    expect(screen.getByText('forgot-reset-password')).toBeInTheDocument();
    expect(screen.getByText('forgot-reset-request')).toBeInTheDocument();
    expect(screen.getByText('forgot-receive-email')).toBeInTheDocument();
    expect(screen.getByText('forgot-return')).toBeInTheDocument();
  });

  it('updates the email field as the user types', () => {
    renderResetPassword();

    const emailInput = document.querySelector('input[name="email"]');
    expect(emailInput).not.toBeNull();
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('sets the reset form to POST when not in the success state', () => {
    renderResetPassword();

    const form = screen.getByTestId('reset-password-form');

    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('method', 'POST');
  });

  it('renders the Clink logo asset', () => {
    renderResetPassword();

    const logos = screen.getAllByTestId('mui-box');
    const logo = logos.find((el) => el.getAttribute('src') === 'https://app.c-link.com/static/images/svg/clink-logo.svg');

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute(
      'src',
      'https://app.c-link.com/static/images/svg/clink-logo.svg'
    );
  });

  it('navigates back to the login page when the link is clicked', () => {
    renderResetPassword();

    fireEvent.click(screen.getByText('forgot-login'));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('invokes goTo with the main site URL when returning from success state', () => {
    renderResetPassword(['/reset-password?send=true']);

    fireEvent.click(screen.getByText('forgot-return'));

    expect(goTo).toHaveBeenCalledWith('https://c-link.com');
  });

  it('shows the success title when the send query param is true', () => {
    renderResetPassword(['/reset-password?send=true']);

    expect(screen.getByText('forgot-reset-password')).toBeInTheDocument();
  });

  it('hides the success title when the send query param is not true', () => {
    renderResetPassword(['/reset-password']);

    expect(
      screen.queryByText('forgot-reset-password')
    ).not.toBeInTheDocument();
  });

  it('keeps the email field configured as type email', () => {
    renderResetPassword();

    const emailInput = document.querySelector('input[name="email"]');
    expect(emailInput).not.toBeNull();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  // Tests for new test IDs added for coverage
  it('should render reset password page wrapper with test ID', () => {
    renderResetPassword();

    const resetPage = screen.getByTestId('reset-password-page');
    expect(resetPage).toBeInTheDocument();
  });

  it('should render reset password page title on success state', () => {
    renderResetPassword(['/reset-password?send=true']);

    const pageTitle = screen.getByText('forgot-reset-password');
    expect(pageTitle).toBeInTheDocument();
  });

  it('should render success message container on success', () => {
    renderResetPassword(['/reset-password?send=true']);

    const successMessage = screen.getByTestId('reset-password-success-message');
    expect(successMessage).toBeInTheDocument();
  });

  it('should render reset password form with test ID', () => {
    renderResetPassword();

    const form = screen.getByTestId('reset-password-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('method', 'POST');
  });

  it('should render email input for reset form', () => {
    renderResetPassword();

    const emailInput = document.querySelector('input[name="email"]');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should render submit button for reset form', () => {
    renderResetPassword();

    const submitButton = screen.getByTestId('reset-password-submit-button');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should render return link on success state', () => {
    renderResetPassword(['/reset-password?send=true']);

    const returnLink = screen.getByTestId('reset-password-return-link');
    expect(returnLink).toBeInTheDocument();
    expect(returnLink).toHaveTextContent('forgot-return');
  });

  it('should render back to login link in form', () => {
    renderResetPassword();

    // The back to login link is rendered with testid='reset-password-back-to-login-link'
    // Check that it navigates correctly when clicked
    const backLink = screen.getByText('forgot-login');
    expect(backLink).toBeInTheDocument();
    
    fireEvent.click(backLink);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});