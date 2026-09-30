import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from './Footer';

// Mock react-router-dom Link
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to, style, ...props }) => (
    <a href={to} style={style} {...props}>
      {children}
    </a>
  ),
}));

describe('Footer Component', () => {
  const mockSetLoading = jest.fn();
  const mockSetSubmitted = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Footer />);
    // Footer should render even with no links
    expect(document.querySelector('[data-testid="mui-grid"]')).toBeInTheDocument();
  });

  it('renders link list correctly', () => {
    const linkList = [
      {
        linkCopy: 'Login',
        linkDesc: 'Already have an account?',
        props: { to: '/login' }
      },
      {
        linkCopy: 'Help',
        linkDesc: 'Need assistance?',
        props: { to: '/help' }
      }
    ];

    render(<Footer linkList={linkList} />);
    
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Need assistance?')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('renders resend button when linkCopy is "Resend"', () => {
    const linkList = [
      {
        linkCopy: 'Resend',
        props: { to: '/resend' }
      }
    ];

    render(<Footer linkList={linkList} />);
    
    const resendButton = screen.getByText('Resend');
    expect(resendButton).toBeInTheDocument();
    expect(resendButton.closest('a')).toHaveAttribute('href', '/resend');
  });

  it('renders regular links for non-resend items', () => {
    const linkList = [
      {
        linkCopy: 'Login',
        props: { to: '/login' }
      }
    ];

    render(<Footer linkList={linkList} />);
    
    const loginLink = screen.getByText('Login');
    expect(loginLink).toBeInTheDocument();
    
    // Find the ReactLink wrapper which should have the href
    const linkWrapper = document.querySelector('a[href="/login"]');
    expect(linkWrapper).toBeInTheDocument();
  });

  it('shows backdrop when resend is true and loading is true', () => {
    render(
      <Footer 
        resend={true}
        useLoading={[true, mockSetLoading]}
        useSubmitted={[false, mockSetSubmitted]}
      />
    );
    
    expect(screen.getByTestId('mui-backdrop')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not show backdrop when resend is false', () => {
    render(
      <Footer 
        resend={false}
        useLoading={[true, mockSetLoading]}
        useSubmitted={[false, mockSetSubmitted]}
      />
    );
    
    expect(screen.queryByTestId('mui-backdrop')).not.toBeInTheDocument();
  });

  it('hides backdrop when clicked', () => {
    render(
      <Footer 
        resend={true}
        useLoading={[true, mockSetLoading]}
        useSubmitted={[false, mockSetSubmitted]}
      />
    );
    
    const backdrop = screen.getByTestId('mui-backdrop');
    fireEvent.click(backdrop);
    
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('shows flash message when resend is true and submitted is truthy', () => {
    render(
      <Footer 
        resend={true}
        useLoading={[false, mockSetLoading]}
        useSubmitted={[1, mockSetSubmitted]}
      />
    );
    
    expect(screen.getByTestId('flash-message')).toBeInTheDocument();
    expect(screen.getByTestId('flash-message-content')).toHaveTextContent('Email resent successfully');
    expect(screen.getByTestId('flash-message')).toHaveAttribute('data-status', 'success');
  });

  it('shows warning message for submitted state 2', () => {
    render(
      <Footer 
        resend={true}
        useLoading={[false, mockSetLoading]}
        useSubmitted={[2, mockSetSubmitted]}
      />
    );
    
    expect(screen.getByTestId('flash-message-content')).toHaveTextContent('Email could not be resent');
    expect(screen.getByTestId('flash-message')).toHaveAttribute('data-status', 'warning');
  });

  it('shows error message for submitted state 3', () => {
    render(
      <Footer 
        resend={true}
        useLoading={[false, mockSetLoading]}
        useSubmitted={[3, mockSetSubmitted]}
      />
    );
    
    expect(screen.getByTestId('flash-message-content')).toHaveTextContent('There was an issue. Contact with C-Link support');
    expect(screen.getByTestId('flash-message')).toHaveAttribute('data-status', 'error');
  });

  it('closes flash message when close button is clicked', () => {
    render(
      <Footer 
        resend={true}
        useLoading={[false, mockSetLoading]}
        useSubmitted={[1, mockSetSubmitted]}
      />
    );
    
    const closeButton = screen.getByTestId('flash-message-close');
    fireEvent.click(closeButton);
    
    expect(mockSetSubmitted).toHaveBeenCalledWith(false);
  });

  it('does not show flash message when resend is false', () => {
    render(
      <Footer 
        resend={false}
        useLoading={[false, mockSetLoading]}
        useSubmitted={[1, mockSetSubmitted]}
      />
    );
    
    expect(screen.queryByTestId('flash-message')).not.toBeInTheDocument();
  });

  it('does not show flash message when submitted is falsy', () => {
    render(
      <Footer 
        resend={true}
        useLoading={[false, mockSetLoading]}
        useSubmitted={[false, mockSetSubmitted]}
      />
    );
    
    expect(screen.queryByTestId('flash-message')).not.toBeInTheDocument();
  });

  it('handles empty linkList', () => {
    render(<Footer linkList={[]} />);
    
    // Should render without errors, just the container
    expect(document.querySelector('[data-testid="mui-grid"]')).toBeInTheDocument();
  });

  it('renders links without description', () => {
    const linkList = [
      {
        linkCopy: 'No Description Link',
        props: { to: '/no-desc' }
      }
    ];

    render(<Footer linkList={linkList} />);
    
    expect(screen.getByText('No Description Link')).toBeInTheDocument();
    // Should not have any description text
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  it('takes a snapshot', () => {
    const linkList = [
      {
        linkCopy: 'Login',
        linkDesc: 'Already have an account?',
        props: { to: '/login' }
      }
    ];

    const { container } = render(
      <Footer 
        linkList={linkList}
        resend={false}
        useLoading={[false, mockSetLoading]}
        useSubmitted={[false, mockSetSubmitted]}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});