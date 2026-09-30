import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlreadyActive from './AlreadyActive';

// Mock the shared components
jest.mock('./shared/Wrapper', () => {
  return function MockWrapper({ Component, ...props }) {
    const mockStyles = {
      titleSize: '24px',
      noWrap: 'nowrap',
      mb: 4
    };
    return <Component styles={mockStyles} {...props} />;
  };
});

jest.mock('./shared/Title', () => {
  return function MockTitle({ title, styles, marginBottom }) {
    return (
      <div 
        data-testid="mock-title"
        data-margin-bottom={marginBottom}
        style={styles}
      >
        {title}
      </div>
    );
  };
});

jest.mock('./shared/Container', () => {
  return function MockContainer({ children, styles, nameText }) {
    return (
      <div 
        data-testid="mock-container"
        data-name-text={nameText}
      >
        {children}
      </div>
    );
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key === 'text-account-already-active' ? 'Account Already Active' : key,
  }),
}));

describe('AlreadyActive Component', () => {
  it('renders without crashing', () => {
    render(<AlreadyActive />);
    expect(screen.getByTestId('mock-container')).toBeInTheDocument();
  });

  it('renders the account already active title', () => {
    render(<AlreadyActive />);
    expect(screen.getByText('Account Already Active')).toBeInTheDocument();
  });

  it('passes empty nameText to Container', () => {
    render(<AlreadyActive />);
    const container = screen.getByTestId('mock-container');
    expect(container).toHaveAttribute('data-name-text', '');
  });

  it('passes correct styles to Title', () => {
    render(<AlreadyActive />);
    const title = screen.getByTestId('mock-title');
    expect(title).toHaveStyle({
      fontSize: '24px',
      whiteSpace: 'nowrap'
    });
    expect(title).toHaveAttribute('data-margin-bottom', '4');
  });

  it('renders with grid layout structure', () => {
    render(<AlreadyActive />);
    // Check that the Grid component is present
    expect(document.querySelector('[data-testid="mui-grid"]')).toBeInTheDocument();
  });

  it('uses Wrapper component with AlreadyActiveContent', () => {
    render(<AlreadyActive />);
    // Verify that the wrapper is working by checking for the expected content
    expect(screen.getByTestId('mock-container')).toBeInTheDocument();
    expect(screen.getByTestId('mock-title')).toBeInTheDocument();
  });

  it('takes a snapshot', () => {
    const { container } = render(<AlreadyActive />);
    expect(container.firstChild).toMatchSnapshot();
  });
});