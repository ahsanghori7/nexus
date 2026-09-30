import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Container from './Container';

// Mock the child components
jest.mock('./Title', () => {
  return function MockTitle({ title, ...props }) {
    return <div data-testid="mock-title" {...props}>{title}</div>;
  };
});

jest.mock('./Footer', () => {
  return function MockFooter({ resend, linkList, ...props }) {
    return (
      <div data-testid="mock-footer" data-resend={resend}>
        {linkList?.map((link, index) => (
          <div key={index} data-testid={`footer-link-${index}`}>
            {link.linkCopy}
          </div>
        ))}
      </div>
    );
  };
});

describe('Container Component', () => {
  const mockStyles = {
    mb: 5,
    img: 32,
    subtitleSize: '18px'
  };

  it('renders without crashing', () => {
    render(<Container>Test content</Container>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Container>
        <div data-testid="child-content">Child component</div>
      </Container>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  it('renders logo when logo prop is true', () => {
    render(
      <Container logo={true} styles={mockStyles}>
        Test content
      </Container>
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('does not render logo when logo prop is false', () => {
    render(
      <Container logo={false}>
        Test content
      </Container>
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders title when name prop is true', () => {
    render(
      <Container name={true} styles={mockStyles}>
        Test content
      </Container>
    );
    expect(screen.getByTestId('mock-title')).toBeInTheDocument();
  });

  it('does not render title when name prop is false', () => {
    render(
      <Container name={false}>
        Test content
      </Container>
    );
    expect(screen.queryByTestId('mock-title')).not.toBeInTheDocument();
  });

  it('renders custom title text', () => {
    render(
      <Container name={true} nameText="Custom Title" styles={mockStyles}>
        Test content
      </Container>
    );
    const titleElement = screen.getByTestId('mock-title');
    expect(titleElement).toHaveTextContent('Custom Title');
  });

  it('renders footer when footer prop is true', () => {
    render(
      <Container footer={true}>
        Test content
      </Container>
    );
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

  it('does not render footer when footer prop is false', () => {
    render(
      <Container footer={false}>
        Test content
      </Container>
    );
    expect(screen.queryByTestId('mock-footer')).not.toBeInTheDocument();
  });

  it('passes resend prop to footer', () => {
    render(
      <Container footer={true} resend={true}>
        Test content
      </Container>
    );
    const footerElement = screen.getByTestId('mock-footer');
    expect(footerElement).toHaveAttribute('data-resend', 'true');
  });

  it('passes custom linkList to footer', () => {
    const customLinks = [
      { linkCopy: 'Custom Link 1', props: { to: '/custom1' } },
      { linkCopy: 'Custom Link 2', props: { to: '/custom2' } }
    ];
    
    render(
      <Container footer={true} linkList={customLinks}>
        Test content
      </Container>
    );
    
    expect(screen.getByText('Custom Link 1')).toBeInTheDocument();
    expect(screen.getByText('Custom Link 2')).toBeInTheDocument();
  });

  it('passes useSubmitted and useLoading to footer', () => {
    const mockUseSubmitted = [false, jest.fn()];
    const mockUseLoading = [false, jest.fn()];
    
    render(
      <Container 
        footer={true} 
        useSubmitted={mockUseSubmitted}
        useLoading={mockUseLoading}
      >
        Test content
      </Container>
    );
    
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

  it('applies custom styles to components', () => {
    const customStyles = {
      mb: 10,
      img: 48,
      subtitleSize: '24px'
    };
    
    render(
      <Container logo={true} name={true} styles={customStyles}>
        Test content
      </Container>
    );
    
    const logoImage = screen.getByRole('img');
    expect(logoImage).toHaveStyle({ height: '48px' });
  });

  it('applies extra props to content grid', () => {
    const extraProps = { 'data-testid': 'content-grid' };
    
    render(
      <Container extra={extraProps}>
        Test content
      </Container>
    );
    
    expect(screen.getByTestId('content-grid')).toBeInTheDocument();
  });

  it('uses default values correctly', () => {
    render(<Container>Test content</Container>);
    
    // Should render with default props
    expect(screen.getByRole('img')).toBeInTheDocument(); // logo=true by default
    expect(screen.getByTestId('mock-title')).toBeInTheDocument(); // name=true by default
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument(); // footer=true by default
  });

  it('renders with all props disabled', () => {
    render(
      <Container logo={false} name={false} footer={false}>
        Test content
      </Container>
    );
    
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-title')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-footer')).not.toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('takes a snapshot', () => {
    const { container } = render(
      <Container styles={mockStyles}>
        <div>Snapshot content</div>
      </Container>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});